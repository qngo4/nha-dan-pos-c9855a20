import type { GoodsReceipt, GoodsReceiptLine } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";
import type { ThermalPaperMode } from "@/components/shared/PrintableThermalInvoice";

interface Props {
  receipt: GoodsReceipt;
  lines: GoodsReceiptLine[];
  paper: ThermalPaperMode;
  rootId?: string;
}

export function PrintableThermalReceipt({ receipt, lines, paper, rootId }: Props) {
  const is58 = paper === "pos58";
  const paperWidth = is58 ? 58 : 80;
  const innerWidth = is58 ? "52mm" : "72mm";
  const baseFont = is58 ? 10.5 : 11.5;
  const titleFont = is58 ? 12 : 14;
  const shopFont = is58 ? 13 : 15;
  const pad = is58 ? "2.5mm" : "3.5mm";

  const subtotal = lines.reduce((s, l) => s + ((l.afterDiscount ?? l.quantity * l.unitCost * (1 - l.discount / 100))), 0);
  const total = subtotal + receipt.shippingFee + receipt.vat;

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
      id={rootId ?? `print-root-receipt-${paper}`}
      className="print-root"
      data-print-root="goods-receipt"
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
          <div style={{ fontWeight: 700, fontSize: `${titleFont}px`, marginTop: 4 }}>PHIẾU NHẬP KHO</div>
          <div style={{ fontSize: `${baseFont - 1}px`, marginTop: 2 }}>{receipt.number}</div>
        </div>

        {divider}

        <div style={{ fontSize: `${baseFont - 1}px` }}>
          {row("Ngày:", formatDate(receipt.date))}
          {row("NCC:", receipt.supplierName)}
        </div>

        {divider}

        <div>
          {lines.map((line, i) => {
            const lineTotal = line.afterDiscount ?? (line.quantity * line.unitCost * (1 - line.discount / 100));
            return (
              <div key={line.id ?? i} style={{ marginBottom: is58 ? 3 : 4 }}>
                <div style={{ wordBreak: "break-word", fontWeight: 700 }}>
                  {line.productName}{line.variantName ? ` - ${line.variantName}` : ""}
                </div>
                <div style={{ fontSize: `${baseFont - 1}px` }}>
                  {line.variantCode}{line.expiryDate ? ` · HSD ${formatDate(line.expiryDate)}` : ""}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span>
                    {line.quantity} {line.importUnit} × {formatVND(line.unitCost)}
                    {line.discount > 0 ? ` · CK ${line.discount}%` : ""}
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>{formatVND(lineTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {divider}

        <div>
          {row("Tạm tính:", formatVND(subtotal))}
          {receipt.shippingFee > 0 && row("Phí VC:", formatVND(receipt.shippingFee))}
          {receipt.vat > 0 && row("VAT:", formatVND(receipt.vat))}
        </div>

        <div style={{ borderTop: "1px solid #000", margin: "5px 0" }} />
        {row("TỔNG:", formatVND(total), { strong: true })}

        {receipt.note ? (
          <>
            {divider}
            <div style={{ fontSize: `${baseFont - 1}px`, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              Ghi chú: {receipt.note}
            </div>
          </>
        ) : null}

        <div style={{ height: is58 ? "4mm" : "5mm" }} />
      </div>
    </div>
  );
}
