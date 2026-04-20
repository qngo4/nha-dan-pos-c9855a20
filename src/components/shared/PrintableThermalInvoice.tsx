import type { Invoice, InvoiceLine } from "@/lib/mock-data";
import { formatVND, formatDateTime } from "@/lib/format";

export type ThermalPaperMode = "pos58" | "pos80";

interface Props {
  invoice: Invoice;
  lines: InvoiceLine[];
  paper: ThermalPaperMode;
  rootId?: string;
}

export function PrintableThermalInvoice({ invoice, lines, paper, rootId }: Props) {
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

  const is58 = paper === "pos58";
  const paperWidth = is58 ? 58 : 80;
  const innerWidth = is58 ? "52mm" : "72mm";
  const baseFont = is58 ? 10.5 : 11.5;
  const titleFont = is58 ? 12 : 14;
  const shopFont = is58 ? 13 : 15;
  const pad = is58 ? "2.5mm" : "3.5mm";

  const row = (label: string, value: string, opts?: { strong?: boolean }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
        fontWeight: opts?.strong ? 700 : 400,
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );

  const divider = <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />;

  return (
    <div
      id={rootId ?? `print-root-invoice-${paper}`}
      className="print-root"
      data-print-root="invoice"
      data-print-mode={paper}
      data-paper-width-mm={paperWidth}
    >
      <div
        data-thermal-root
        style={{
          width: innerWidth,
          maxWidth: innerWidth,
          padding: pad,
          margin: 0,
          background: "#fff",
          color: "#000",
          fontFamily: "'Courier New', ui-monospace, monospace",
          fontSize: `${baseFont}px`,
          lineHeight: 1.28,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: `${shopFont}px`, textTransform: "uppercase" }}>Nhã Đan Shop</div>
          <div style={{ fontSize: `${baseFont - 1}px` }}>123 Nguyễn Văn Linh, Q7, TP.HCM</div>
          <div style={{ fontSize: `${baseFont - 1}px` }}>0901 234 567</div>
          <div style={{ fontWeight: 700, fontSize: `${titleFont}px`, marginTop: 4 }}>HÓA ĐƠN BÁN HÀNG</div>
          <div style={{ fontSize: `${baseFont - 1}px`, marginTop: 2 }}>{invoice.number}</div>
        </div>

        {divider}

        <div style={{ fontSize: `${baseFont - 1}px` }}>
          {row("Ngày:", formatDateTime(invoice.date))}
          {row("KH:", invoice.customerName)}
          {row("NV:", invoice.createdBy)}
          {row("TT:", invoice.paymentType.toUpperCase())}
        </div>

        {divider}

        <div>
          {billable.map((line, i) => (
            <div key={`billable-${i}`} style={{ marginBottom: is58 ? 3 : 4 }}>
              <div style={{ wordBreak: "break-word", fontWeight: 700 }}>{line.name}</div>
              <div style={{ fontSize: `${baseFont - 1}px`, color: "#111" }}>{line.code}</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>{line.qty} × {formatVND(line.price)}</span>
                <span style={{ whiteSpace: "nowrap" }}>{formatVND(line.qty * line.price)}</span>
              </div>
            </div>
          ))}

          {rewards.map((line, i) => (
            <div key={`reward-${i}`} style={{ marginBottom: is58 ? 3 : 4 }}>
              <div style={{ wordBreak: "break-word", fontWeight: 700 }}>[QUÀ TẶNG] {line.name}</div>
              <div style={{ fontSize: `${baseFont - 1}px` }}>
                {line.rewardSource ? `Tặng từ khuyến mãi ${line.rewardSource}` : "Tặng từ khuyến mãi"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>SL {line.qty}</span>
                <span>Miễn phí</span>
              </div>
            </div>
          ))}
        </div>

        {divider}

        <div>
          {row("Tạm tính:", formatVND(b.subtotal))}
          {b.manualDiscount > 0 && row("CK thủ công:", `-${formatVND(b.manualDiscount)}`)}
          {b.promoDiscount > 0 && row(`Khuyến mãi${b.promoName ? ` (${b.promoName})` : ""}:`, `-${formatVND(b.promoDiscount)}`)}
          {b.shippingFee > 0 && row("Phí ship:", formatVND(b.shippingFee))}
          {b.shippingDiscount > 0 && row("Ưu đãi ship:", `-${formatVND(b.shippingDiscount)}`)}
          {b.vatAmount > 0 && row(`VAT (${b.vatPercent}%):`, `+${formatVND(b.vatAmount)}`)}
        </div>

        <div style={{ borderTop: "1px solid #000", margin: "5px 0" }} />
        {row("TỔNG:", formatVND(b.total), { strong: true })}

        {invoice.note ? (
          <>
            {divider}
            <div style={{ fontSize: `${baseFont - 1}px`, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              Ghi chú: {invoice.note}
            </div>
          </>
        ) : null}

        {divider}
        <div style={{ textAlign: "center", fontSize: `${baseFont - 1}px` }}>Cảm ơn quý khách. Hẹn gặp lại!</div>
        <div style={{ height: is58 ? "4mm" : "5mm" }} />
      </div>
    </div>
  );
}
