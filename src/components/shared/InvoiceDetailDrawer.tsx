import { X, Printer, Receipt, User, Calendar, CreditCard, Gift, Tag, Truck, Percent, Sparkles } from "lucide-react";
import { formatVND, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import type { Invoice, InvoiceLine } from "@/lib/mock-data";
import { PrintableInvoice } from "@/components/shared/PrintableInvoice";
import { Printable58Invoice } from "@/components/shared/Printable58Invoice";
import { triggerPrint } from "@/lib/print";
import { useStore } from "@/lib/store";
import { PROMOTION_TYPE_LABELS, formatPromotionSummary, formatScope, type Promotion } from "@/lib/promotions";

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

// Fallback mock lines for legacy invoices (without snapshot lines)
function getMockLines(inv: Invoice): InvoiceLine[] {
  const sample: InvoiceLine[] = [
    { name: 'Mì Hảo Hảo - Tôm chua cay', code: 'SP001-01', qty: 5, price: 5000 },
    { name: 'Coca-Cola - Lon 330ml', code: 'SP002-01', qty: 3, price: 10000 },
    { name: 'Sữa Vinamilk - Hộp 180ml', code: 'SP003-01', qty: 2, price: 8000 },
    { name: 'Bánh Oreo - Gói 133g', code: 'SP004-01', qty: 4, price: 22000 },
  ];
  return sample.slice(0, Math.max(1, Math.min(inv.itemCount, sample.length)));
}

export function InvoiceDetailDrawer({ invoice, onClose }: Props) {
  const { promotions, categories, products } = useStore();

  if (!invoice) return null;

  // Use snapshot when present (POS-generated). Fallback to mock for legacy.
  const lines: InvoiceLine[] = invoice.lines && invoice.lines.length > 0 ? invoice.lines : getMockLines(invoice);
  const billable = lines.filter((l) => !l.reward);
  const rewards = lines.filter((l) => l.reward);
  const computedSubtotal = billable.reduce((s, l) => s + l.qty * l.price, 0);

  // Source-of-truth: stored breakdown from POS. Fallback derives a minimal one from totals.
  const b = invoice.breakdown ?? {
    subtotal: computedSubtotal,
    manualDiscount: 0,
    promoDiscount: Math.max(0, computedSubtotal - invoice.total),
    promoName: undefined,
    shippingFee: 0,
    shippingDiscount: 0,
    shippingPayable: 0,
    vatPercent: 0,
    vatBase: invoice.total,
    vatAmount: 0,
    total: invoice.total,
    freeItems: [],
  };

  // Resolve full promotion record by name (best-effort) for richer detail panel.
  const promo: Promotion | undefined = b.promoName
    ? promotions.find((p) => p.name === b.promoName)
    : undefined;

  const hasManual = b.manualDiscount > 0;
  const hasPromoDiscount = b.promoDiscount > 0;
  const hasShipDiscount = b.shippingDiscount > 0;
  const hasFreeItems = (b.freeItems?.length ?? 0) > 0 || rewards.length > 0;
  const hasAnyPromotion = !!b.promoName || hasManual || hasPromoDiscount || hasShipDiscount || hasFreeItems;

  const totalPromoImpact = b.manualDiscount + b.promoDiscount + b.shippingDiscount;

  // Build per-item impact rows (eligible qty + gift qty), keyed by display name.
  const eligibleByName = new Map<string, { qty: number; price: number }>();
  for (const l of billable) {
    const cur = eligibleByName.get(l.name);
    if (cur) { cur.qty += l.qty; } else { eligibleByName.set(l.name, { qty: l.qty, price: l.price }); }
  }
  const giftByName = new Map<string, number>();
  for (const r of rewards) giftByName.set(r.name, (giftByName.get(r.name) ?? 0) + r.qty);
  for (const fi of b.freeItems ?? []) {
    const key = fi.productName;
    if (!giftByName.has(key)) giftByName.set(key, fi.quantity);
  }

  // Promotion rule text + scope text
  const ruleText = promo ? formatPromotionSummary(promo) : (b.promoName ? "Khuyến mãi áp dụng từ POS" : "");
  const scopeText = promo
    ? formatScope(promo, {
        categoryNames: Object.fromEntries(categories.map((c) => [c.id, c.name])),
        productNames: Object.fromEntries(products.map((p) => [p.id, p.name])),
      })
    : "";

  const handlePrint = () => triggerPrint(`hóa đơn ${invoice.number}`, "a4");
  const handlePrint58 = () => triggerPrint(`hóa đơn ${invoice.number} (POS58)`, "pos58");

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end no-print">
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-card border-l shadow-xl flex flex-col animate-slide-in-right">
          <div className="p-4 border-b flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm font-mono">{invoice.number}</h2>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={invoice.status === 'cancelled' ? 'cancelled' : 'active'} />
                <StatusBadge status={invoice.paymentType} />
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {formatDateTime(invoice.date)}</div>
              <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /> {invoice.customerName}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="h-3.5 w-3.5" /> Người tạo: {invoice.createdBy}</div>
              {invoice.note && <div className="text-xs text-muted-foreground italic">Ghi chú: {invoice.note}</div>}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sản phẩm ({billable.length})</h3>
              <div className="border rounded-lg divide-y">
                {billable.map((l, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.code} · {l.qty} × {formatVND(l.price)}</p>
                    </div>
                    <span className="font-medium shrink-0">{formatVND(l.qty * l.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {rewards.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-warning uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Gift className="h-3 w-3" /> Quà tặng / Khuyến mãi ({rewards.length})
                </h3>
                <div className="border border-warning/30 bg-warning-soft/30 rounded-lg divide-y divide-warning/20">
                  {rewards.map((l, i) => (
                    <div key={i} className="p-3 flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{l.name}</p>
                        <p className="text-xs text-muted-foreground">{l.code} · SL {l.qty}{l.rewardSource ? ` · từ "${l.rewardSource}"` : ""}</p>
                      </div>
                      <span className="text-xs font-medium text-warning shrink-0">Miễn phí</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(b.subtotal)}</span></div>
              {b.manualDiscount > 0 && (
                <div className="flex justify-between text-danger">
                  <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> Chiết khấu thủ công</span>
                  <span>-{formatVND(b.manualDiscount)}</span>
                </div>
              )}
              {b.promoDiscount > 0 && (
                <div className="flex justify-between text-danger">
                  <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Khuyến mãi{b.promoName ? ` (${b.promoName})` : ""}</span>
                  <span>-{formatVND(b.promoDiscount)}</span>
                </div>
              )}
              {(b.shippingFee > 0 || b.shippingDiscount > 0) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> Phí ship</span>
                    <span>{formatVND(b.shippingFee)}</span>
                  </div>
                  {b.shippingDiscount > 0 && (
                    <div className="flex justify-between text-success">
                      <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Ưu đãi ship</span>
                      <span>-{formatVND(b.shippingDiscount)}</span>
                    </div>
                  )}
                </>
              )}
              {b.vatAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({b.vatPercent}%)</span>
                  <span>+{formatVND(b.vatAmount)}</span>
                </div>
              )}
              <div className="border-t pt-1.5 flex justify-between font-bold text-base">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatVND(b.total)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t flex flex-wrap gap-2">
            <button onClick={onClose} className="flex-1 min-w-[80px] px-3 py-2 text-sm border rounded-md hover:bg-muted">Đóng</button>
            <button onClick={handlePrint58} className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-md hover:bg-muted">
              <Printer className="h-4 w-4" /> POS58
            </button>
            <button onClick={handlePrint} className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
              <Printer className="h-4 w-4" /> In A4
            </button>
          </div>
        </div>
      </div>

      {/* Print-only content — both variants mounted; CSS reveals the active one */}
      <PrintableInvoice invoice={invoice} lines={lines} />
      <Printable58Invoice invoice={invoice} lines={lines} />
    </>
  );
}
