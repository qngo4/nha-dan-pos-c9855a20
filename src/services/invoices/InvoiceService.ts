import type {
  GiftLine,
  PendingOrderLine,
  PricingBreakdownSnapshot,
  PromotionSnapshot,
  ShippingAddress,
  ShippingQuoteSnapshot,
  VoucherSnapshot,
} from "@/services/types";
import type { Invoice } from "@/lib/mock-data";

export type InvoicePaymentType = "cash" | "transfer" | "momo" | "zalopay";

export interface CreateInvoiceInput {
  /** Optional override; auto-generated if missing */
  number?: string;
  date?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress?: ShippingAddress;
  paymentType: InvoicePaymentType;
  createdBy?: string;
  note?: string;

  lines: PendingOrderLine[];
  giftLines?: GiftLine[];

  promotionSnapshot?: PromotionSnapshot | null;
  voucherSnapshot?: VoucherSnapshot | null;
  shippingQuoteSnapshot?: ShippingQuoteSnapshot | null;
  pricingBreakdownSnapshot: PricingBreakdownSnapshot;
}

export interface InvoiceService {
  /**
   * Create an invoice with full snapshot of lines, promotion and voucher.
   * Currently delegates persistence to the legacy `invoiceActions` store so
   * the admin Invoices page keeps working unchanged.
   */
  create(input: CreateInvoiceInput): Promise<Invoice>;
}
