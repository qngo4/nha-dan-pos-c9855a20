// Stub adapter — Batch 1 will fully implement against the existing in-memory store.
// Provides a minimal localStorage-backed implementation so UI can wire today.
import type {
  Customer,
  CustomerPointHistoryItem,
  CustomerPointSourceType,
  CustomerService,
  ListQuery,
  PagedResult,
} from "@/services/types";
import { readJson, uid, writeJson } from "./storage";

const KEY_CUSTOMERS = "customers";
const KEY_HISTORY = "customer_points_history";

export class LocalCustomerAdapter implements CustomerService {
  async list(params?: ListQuery): Promise<PagedResult<Customer>> {
    const all = readJson<Customer[]>(KEY_CUSTOMERS, []);
    const q = params?.query?.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            (c.email ?? "").toLowerCase().includes(q)
        )
      : all;
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? filtered.length;
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  async get(id: string): Promise<Customer | null> {
    return readJson<Customer[]>(KEY_CUSTOMERS, []).find((c) => c.id === id) ?? null;
  }

  async upsert(input: Customer): Promise<Customer> {
    const list = readJson<Customer[]>(KEY_CUSTOMERS, []);
    const now = new Date().toISOString();
    const next: Customer = { ...input, updatedAt: now };
    const idx = list.findIndex((c) => c.id === input.id);
    if (idx === -1) {
      next.id = next.id || uid("cust_");
      next.createdAt = now;
      writeJson(KEY_CUSTOMERS, [next, ...list]);
    } else {
      list[idx] = next;
      writeJson(KEY_CUSTOMERS, list);
    }
    return next;
  }

  async addPoints(
    customerId: string,
    delta: number,
    reason: string,
    sourceType: CustomerPointSourceType,
    sourceId?: string
  ): Promise<Customer> {
    return this.recordPoints(customerId, Math.abs(delta), reason, sourceType, sourceId);
  }

  async redeemPoints(
    customerId: string,
    delta: number,
    reason: string,
    sourceId?: string
  ): Promise<Customer> {
    return this.recordPoints(customerId, -Math.abs(delta), reason, "redemption", sourceId);
  }

  async history(customerId: string): Promise<CustomerPointHistoryItem[]> {
    return readJson<CustomerPointHistoryItem[]>(KEY_HISTORY, []).filter(
      (h) => h.customerId === customerId
    );
  }

  private recordPoints(
    customerId: string,
    delta: number,
    reason: string,
    sourceType: CustomerPointSourceType,
    sourceId?: string
  ): Customer {
    const list = readJson<Customer[]>(KEY_CUSTOMERS, []);
    const idx = list.findIndex((c) => c.id === customerId);
    if (idx === -1) throw new Error("Customer not found");
    const updated: Customer = {
      ...list[idx],
      points: (list[idx].points ?? 0) + delta,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    writeJson(KEY_CUSTOMERS, list);

    const history = readJson<CustomerPointHistoryItem[]>(KEY_HISTORY, []);
    history.unshift({
      id: uid("ph_"),
      customerId,
      createdAt: new Date().toISOString(),
      delta,
      balanceAfter: updated.points,
      reason,
      sourceType,
      sourceId,
    });
    writeJson(KEY_HISTORY, history);
    return updated;
  }
}
