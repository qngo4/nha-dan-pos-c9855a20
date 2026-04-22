// Cloud-backed adapter for PendingOrderService.
// Persists pending orders in Supabase so the Casso webhook trigger can auto-update
// payment status, and any device can resume viewing the order via its code.
//
// IMPORTANT: invoices remain in localStorage (LocalInvoiceAdapter). Only the
// pending-order flow is on Cloud in Phase 2.

import { supabase } from "@/integrations/supabase/client";
import type { PendingOrderService } from "@/services/pendingOrders/PendingOrderService";
import type {
  CreatePendingOrderInput,
  PagedResult,
  PaymentMethod,
  PendingOrder,
  PendingOrderListParams,
  PendingOrderStatus,
} from "@/services/types";
import { generateOrderCode } from "@/services/utils/ids";
import { addHoursIso, nowIso } from "@/services/utils/date";

// ---- Status mapping (UI <-> DB) ----
// DB stores compact status names tied to the auto-apply trigger:
//   pending | partial | paid | over | cancelled
// UI uses richer names (waiting_confirm, paid_auto, ...). We map between them.
function dbToUiStatus(dbStatus: string, paymentMethod: PaymentMethod): PendingOrderStatus {
  switch (dbStatus) {
    case "paid":
      // Bank transfer/wallet that gets webhook-matched -> paid_auto.
      // COD/cash flips to "confirmed" via explicit admin action (still 'paid' in DB).
      return paymentMethod === "cash" ? "confirmed" : "paid_auto";
    case "over":
      return paymentMethod === "cash" ? "confirmed" : "paid_auto";
    case "partial":
      return "pending_payment";
    case "cancelled":
      return "cancelled";
    case "waiting_confirm":
      return "waiting_confirm";
    case "confirmed":
      return "confirmed";
    case "pending":
    default:
      return "pending_payment";
  }
}

function uiToDbStatus(ui: PendingOrderStatus): string {
  switch (ui) {
    case "pending_payment":
      return "pending";
    case "waiting_confirm":
      return "waiting_confirm";
    case "confirmed":
      return "confirmed";
    case "paid_auto":
      return "paid";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

// ---- Row <-> domain mapping ----
type Row = {
  id: string;
  code: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  shipping_address: any;
  items: any;
  gift_lines: any;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  paid_amount: number;
  status: string;
  payment_type: string;
  promotion_snapshot: any;
  voucher_snapshot: any;
  shipping_quote_snapshot: any;
  pricing_breakdown_snapshot: any;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function rowToOrder(r: Row): PendingOrder {
  const paymentMethod = (r.payment_type || "bank_transfer") as PaymentMethod;
  return {
    id: r.id,
    code: r.code,
    createdAt: r.created_at,
    expiresAt: undefined, // expiry handled by UI default; cloud row stores no separate expiresAt
    status: dbToUiStatus(r.status, paymentMethod),
    customerId: r.customer_id ?? undefined,
    customerName: r.customer_name,
    customerPhone: r.customer_phone ?? undefined,
    shippingAddress: r.shipping_address ?? undefined,
    paymentMethod,
    paymentReference: r.code, // we standardize on code as transfer reference
    lines: Array.isArray(r.items) ? r.items : [],
    giftLinesSnapshot: Array.isArray(r.gift_lines) ? r.gift_lines : [],
    promotionSnapshot: r.promotion_snapshot ?? null,
    voucherSnapshot: r.voucher_snapshot ?? null,
    shippingQuoteSnapshot: r.shipping_quote_snapshot ?? null,
    pricingBreakdownSnapshot: r.pricing_breakdown_snapshot ?? {
      subtotal: r.subtotal,
      manualDiscount: 0,
      promotionDiscount: 0,
      voucherDiscount: 0,
      shippingFee: r.shipping_fee,
      shippingDiscount: 0,
      vat: 0,
      total: r.total,
    },
    note: r.note ?? undefined,
  };
}

export class CloudPendingOrderAdapter implements PendingOrderService {
  async list(params?: PendingOrderListParams): Promise<PagedResult<PendingOrder>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("pending_orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params?.status) {
      // Map UI status filter to DB status names.
      const dbStatus = uiToDbStatus(params.status);
      query = query.eq("status", dbStatus);
    }

    if (params?.query?.trim()) {
      const q = params.query.trim();
      query = query.or(
        `code.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`
      );
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw new Error(error.message);

    return {
      items: (data as Row[] | null ?? []).map(rowToOrder),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async get(id: string): Promise<PendingOrder | null> {
    // Try by id first; if not a uuid, fall back to lookup by code.
    const looksLikeUuid = /^[0-9a-f]{8}-/i.test(id);
    const query = looksLikeUuid
      ? supabase.from("pending_orders").select("*").eq("id", id).maybeSingle()
      : supabase.from("pending_orders").select("*").eq("code", id).maybeSingle();
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ? rowToOrder(data as Row) : null;
  }

  async create(input: CreatePendingOrderInput): Promise<PendingOrder> {
    const code = generateOrderCode("DH");
    const p = input.pricingBreakdownSnapshot;

    const insertRow = {
      code,
      customer_id: input.customerId ?? null,
      customer_name: input.customerName ?? "Khách lẻ",
      customer_phone: input.customerPhone ?? null,
      shipping_address: input.shippingAddress ?? null,
      items: input.lines,
      gift_lines: input.promotionSnapshot?.giftLines ?? [],
      subtotal: Math.round(p.subtotal),
      discount: Math.round(p.manualDiscount + p.promotionDiscount + p.voucherDiscount),
      shipping_fee: Math.round(Math.max(0, p.shippingFee - p.shippingDiscount)),
      total: Math.round(p.total),
      paid_amount: 0,
      status: "pending",
      payment_type: input.paymentMethod,
      promotion_snapshot: input.promotionSnapshot ?? null,
      voucher_snapshot: input.voucherSnapshot ?? null,
      shipping_quote_snapshot: input.shippingQuoteSnapshot ?? null,
      pricing_breakdown_snapshot: p,
      note: input.note ?? null,
    };

    const { data, error } = await supabase
      .from("pending_orders")
      .insert(insertRow as any)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToOrder(data as Row);
  }

  async update(
    id: string,
    patch: Partial<CreatePendingOrderInput> & { status?: PendingOrderStatus }
  ): Promise<PendingOrder> {
    const update: Record<string, any> = {};
    if (patch.status) update.status = uiToDbStatus(patch.status);
    if (patch.paymentMethod) update.payment_type = patch.paymentMethod;
    if (patch.customerName !== undefined) update.customer_name = patch.customerName;
    if (patch.customerPhone !== undefined) update.customer_phone = patch.customerPhone;
    if (patch.shippingAddress !== undefined) update.shipping_address = patch.shippingAddress;
    if (patch.note !== undefined) update.note = patch.note;
    if (patch.lines) update.items = patch.lines;
    if (patch.pricingBreakdownSnapshot) {
      update.pricing_breakdown_snapshot = patch.pricingBreakdownSnapshot;
      update.subtotal = Math.round(patch.pricingBreakdownSnapshot.subtotal);
      update.total = Math.round(patch.pricingBreakdownSnapshot.total);
    }

    const { data, error } = await supabase
      .from("pending_orders")
      .update(update as any)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToOrder(data as Row);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("pending_orders").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

// Re-export helpers for hooks/UI that want to subscribe to changes directly.
export { rowToOrder as cloudRowToPendingOrder };
export type CloudPendingOrderRow = Row;

// Suppress unused import warnings (kept for parity with local adapter)
void addHoursIso;
void nowIso;
