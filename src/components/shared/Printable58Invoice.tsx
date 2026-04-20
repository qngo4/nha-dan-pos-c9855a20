import type { Invoice, InvoiceLine } from "@/lib/mock-data";
import { formatVND, formatDateTime } from "@/lib/format";

interface Props {
  invoice: Invoice;
  lines: InvoiceLine[];
}

/**
 * Dedicated 58mm thermal receipt template for POS58 printers.
 * - Narrow single-column layout (~48mm printable width)
 * - Monospace-friendly, compact spacing
 * - No tables with multiple columns wider than the paper
 * - No backgrounds/borders/shadows that waste paper or confuse drivers
 */
export function Printable58Invoice({ invoice, lines }: Props) {
  const billable = lines.filter((l) => !l.reward);
  const rewards = lines.filter((l) => l.reward);
  const computedSubtotal = billable.reduce((s, l) => s + l.qty * l.price, 0);

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

  const row = (label: string, value: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="print-area print-58" id="print-area-invoice-58">
      <div
        style={{
          width: "100%",
          padding: "2mm",
          color: "#000",
          background: "#fff",
          fontFamily: "'Courier New', ui-monospace, monospace",
          fontSize: "11px",
          lineHeight: 1.25,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "13px" }}>NHA DAN SHOP</div>
          <div style={{ fontSize: "10px" }}>123 Nguyen Van Linh, Q7, HCM</div>
          <div style={{ fontSize: "10px" }}>SDT: 0901 234 567</div>
          <div style={{ fontWeight: 700, fontSize: "12px", marginTop: 4 }}>HOA DON BAN HANG</div>
          <div style={{ fontSize: "10px" }}>{invoice.number}</div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

        <div style={{ fontSize: "10px" }}>
          {row("Ngay:", formatDateTime(invoice.date))}
          {row("KH:", invoice.customerName)}
          {row("NV:", invoice.createdBy)}
          {row("TT:", invoice.paymentType.toUpperCase())}
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

        {/* Items: each item across 2 lines (name) + (qty x price = total) */}
        <div>
          {billable.map((l, i) => (
            <div key={`b${i}`} style={{ marginBottom: 2 }}>
              <div style={{ wordBreak: "break-word" }}>{l.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {l.qty} x {formatVND(l.price)}
                </span>
                <span>{formatVND(l.qty * l.price)}</span>
              </div>
            </div>
          ))}
          {rewards.map((l, i) => (
            <div key={`r${i}`} style={{ marginBottom: 2 }}>
              <div style={{ wordBreak: "break-word" }}>[QUA] {l.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>SL {l.qty}</span>
                <span>Mien phi</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

        <div>
          {row("Tam tinh:", formatVND(b.subtotal))}
          {b.manualDiscount > 0 && row("CK thu cong:", "-" + formatVND(b.manualDiscount))}
          {b.promoDiscount > 0 && row("KM" + (b.promoName ? ` (${b.promoName})` : "") + ":", "-" + formatVND(b.promoDiscount))}
          {b.shippingFee > 0 && row("Phi ship:", formatVND(b.shippingFee))}
          {b.shippingDiscount > 0 && row("Uu dai ship:", "-" + formatVND(b.shippingDiscount))}
          {b.vatAmount > 0 && row(`VAT ${b.vatPercent}%:`, "+" + formatVND(b.vatAmount))}
        </div>

        <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "13px" }}>
          <span>TONG:</span>
          <span>{formatVND(b.total)}</span>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
        <div style={{ textAlign: "center", fontSize: "10px" }}>Cam on quy khach!</div>
        <div style={{ textAlign: "center", fontSize: "10px" }}>Hen gap lai.</div>
        {/* Trailing spacer keeps tear-off clean but bounded */}
        <div style={{ height: "8mm" }} />
      </div>
    </div>
  );
}
