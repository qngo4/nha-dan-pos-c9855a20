// Thin adapter — wraps the legacy in-memory `invoiceActions` store so the new
// service-layer flow (Checkout COD, future POS) can snapshot promotions and
// vouchers in a uniform way without disturbing the admin Invoices UI.
//
// IMPORTANT: This is intentionally not a re-implementation. Persistence still
// lives in src/lib/store.ts (mock data for the admin app). When a real BE
// arrives, swap this adapter for a remote one — the UI contract stays the same.

import type {
  CreateInvoiceInput,
  InvoiceService,
} from "@/services/invoices/InvoiceService";
import type { Invoice, InvoiceLine, InvoiceBreakdown } from "@/lib/mock-data";
import { invoiceActions } from "@/lib/store";

function buildBreakdown(input: CreateInvoiceInput): InvoiceBreakdown {
  const p = input.pricingBreakdownSnapshot;
  const promo = input.promotionSnapshot;
  const voucher = input.voucherSnapshot;
  const promoDiscountTotal = p.promotionDiscount + p.voucherDiscount;
  const promoName = [
    promo?.name,
    voucher ? `Voucher ${voucher.code}` : null,
  ]
    .filter(Boolean)
    .join(" + ") || undefined;
  return {
    subtotal: p.subtotal,
    manualDiscount: p.manualDiscount,
    promoDiscount: promoDiscountTotal,
    promoName,
    shippingFee: p.shippingFee,
    shippingDiscount: p.shippingDiscount,
    shippingPayable: Math.max(0, p.shippingFee - p.shippingDiscount),
    vatPercent: 0,
    vatBase: p.subtotal,
    vatAmount: p.vat,
    total: p.total,
    freeItems: input.giftLines?.map((g) => ({
      productName: g.variantName ? `${g.productName} - ${g.variantName}` : g.productName,
      quantity: g.qty,
    })),
  };
}

function buildLines(input: CreateInvoiceInput): InvoiceLine[] {
  const billable: InvoiceLine[] = input.lines.map((l) => ({
    name: l.variantName ? `${l.productName} - ${l.variantName}` : l.productName,
    code: "",
    qty: l.qty,
    price: l.unitPrice,
  }));
  const rewards: InvoiceLine[] = (input.giftLines ?? []).map((g) => ({
    name: g.variantName ? `${g.productName} - ${g.variantName}` : g.productName,
    code: "",
    qty: g.qty,
    price: 0,
    reward: true,
    rewardSource: g.promotionName,
  }));
  return [...billable, ...rewards];
}

function generateNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 900 + 100);
  return `HD-${date}-${rand}`;
}

export class LocalInvoiceAdapter implements InvoiceService {
  async create(input: CreateInvoiceInput): Promise<Invoice> {
    const inv = invoiceActions.create({
      number: input.number ?? generateNumber(),
      date: input.date ?? new Date().toISOString(),
      customerId: input.customerId ?? "",
      customerName: input.customerName,
      total: input.pricingBreakdownSnapshot.total,
      paymentType: input.paymentType,
      status: "active",
      createdBy: input.createdBy ?? "online",
      itemCount: input.lines.reduce((s, l) => s + l.qty, 0),
      breakdown: buildBreakdown(input),
      lines: buildLines(input),
      note: input.note,
    });
    return inv;
  }
}
