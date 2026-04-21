import type { PendingOrderService } from "@/services/pendingOrders/PendingOrderService";
import type {
  CreatePendingOrderInput,
  MultiSortRule,
  PagedResult,
  PendingOrder,
  PendingOrderListParams,
  PendingOrderStatus,
} from "@/services/types";
import { readJson, writeJson } from "./storage";
import { generateOrderCode, uid } from "@/services/utils/ids";
import { addHoursIso, nowIso } from "@/services/utils/date";

const KEY = "pending_orders:v1";

function load(): PendingOrder[] {
  return readJson<PendingOrder[]>(KEY, []);
}
function save(list: PendingOrder[]) {
  writeJson(KEY, list);
}

export class LocalPendingOrderAdapter implements PendingOrderService {
  async list(params?: PendingOrderListParams): Promise<PagedResult<PendingOrder>> {
    const all = load();
    const filtered = params?.status ? all.filter((o) => o.status === params.status) : all;
    const q = params?.query?.trim().toLowerCase();
    const matched = q
      ? filtered.filter(
          (o) =>
            o.code.toLowerCase().includes(q) ||
            (o.customerName ?? "").toLowerCase().includes(q) ||
            (o.customerPhone ?? "").toLowerCase().includes(q)
        )
      : filtered;
    const sorted = applySort(matched, params?.sort);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? sorted.length;
    const start = (page - 1) * pageSize;
    return {
      items: sorted.slice(start, start + pageSize),
      total: sorted.length,
      page,
      pageSize,
    };
  }

  async get(id: string): Promise<PendingOrder | null> {
    return load().find((o) => o.id === id) ?? null;
  }

  async create(input: CreatePendingOrderInput): Promise<PendingOrder> {
    const id = uid("po_");
    const code = generateOrderCode("DH");
    const order: PendingOrder = {
      id,
      code,
      createdAt: nowIso(),
      expiresAt: input.expiresAt ?? addHoursIso(12),
      status: "pending_payment",
      paymentReference: input.paymentReference || code,
      giftLinesSnapshot: input.promotionSnapshot?.giftLines ?? [],
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      lines: input.lines,
      promotionSnapshot: input.promotionSnapshot ?? null,
      voucherSnapshot: input.voucherSnapshot ?? null,
      shippingQuoteSnapshot: input.shippingQuoteSnapshot ?? null,
      pricingBreakdownSnapshot: input.pricingBreakdownSnapshot,
      note: input.note,
    };
    save([order, ...load()]);
    return order;
  }

  async update(
    id: string,
    patch: Partial<CreatePendingOrderInput> & { status?: PendingOrderStatus }
  ): Promise<PendingOrder> {
    const list = load();
    const idx = list.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("Pending order not found");
    const next: PendingOrder = { ...list[idx], ...patch } as PendingOrder;
    list[idx] = next;
    save(list);
    return next;
  }

  async remove(id: string): Promise<void> {
    save(load().filter((o) => o.id !== id));
  }
}

function applySort<T>(items: T[], sort?: MultiSortRule[]): T[] {
  if (!sort?.length) return items;
  const arr = [...items];
  arr.sort((a: any, b: any) => {
    for (const rule of sort) {
      const av = a[rule.field];
      const bv = b[rule.field];
      if (av === bv) continue;
      const cmp = av > bv ? 1 : -1;
      return rule.direction === "asc" ? cmp : -cmp;
    }
    return 0;
  });
  return arr;
}
