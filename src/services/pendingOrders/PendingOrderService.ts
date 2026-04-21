import type {
  CreatePendingOrderInput,
  PagedResult,
  PendingOrder,
  PendingOrderListParams,
  PendingOrderStatus,
} from "@/services/types";

export interface PendingOrderService {
  list(params?: PendingOrderListParams): Promise<PagedResult<PendingOrder>>;
  get(id: string): Promise<PendingOrder | null>;
  create(input: CreatePendingOrderInput): Promise<PendingOrder>;
  update(
    id: string,
    patch: Partial<CreatePendingOrderInput> & { status?: PendingOrderStatus }
  ): Promise<PendingOrder>;
  remove(id: string): Promise<void>;
}
