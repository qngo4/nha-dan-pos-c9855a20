import type { GoodsReceipt, GoodsReceiptLine } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";

interface Props {
  receipt: GoodsReceipt;
  lines: GoodsReceiptLine[];
}

/** 58mm thermal template for goods receipt (phieu nhap kho). */
export function Printable58Receipt({ receipt, lines }: Props) {
  const subtotal = lines.reduce(
    (s, l) => s + l.quantity * l.unitCost * (1 - l.discount / 100),
    0
  );
  const total = subtotal + receipt.shippingFee + receipt.vat;

  const row = (label: string, value: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="print-area print-58" id="print-area-receipt-58">
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
          <div style={{ fontWeight: 700, fontSize: "13px" }}>PHIEU NHAP KHO</div>
          <div style={{ fontSize: "10px" }}>{receipt.number}</div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

        <div style={{ fontSize: "10px" }}>
          {row("Ngay:", formatDate(receipt.date))}
          {row("NCC:", receipt.supplierName)}
          {receipt.note ? row("Ghi chu:", receipt.note) : null}
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

        <div>
          {lines.map((l, i) => {
            const lineTotal = l.quantity * l.unitCost * (1 - l.discount / 100);
            return (
              <div key={l.id ?? i} style={{ marginBottom: 2 }}>
                <div style={{ wordBreak: "break-word" }}>
                  {l.productName}
                  {l.variantName ? ` - ${l.variantName}` : ""}
                </div>
                <div style={{ fontSize: "10px", color: "#000" }}>
                  {l.variantCode}
                  {l.expiryDate ? ` HSD ${formatDate(l.expiryDate)}` : ""}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>
                    {l.quantity} {l.importUnit} x {formatVND(l.unitCost)}
                    {l.discount > 0 ? ` -${l.discount}%` : ""}
                  </span>
                  <span>{formatVND(lineTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

        <div>
          {row("Tam tinh:", formatVND(subtotal))}
          {receipt.shippingFee > 0 && row("Phi VC:", formatVND(receipt.shippingFee))}
          {receipt.vat > 0 && row("VAT:", formatVND(receipt.vat))}
        </div>

        <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "13px" }}>
          <span>TONG:</span>
          <span>{formatVND(total)}</span>
        </div>

        <div style={{ height: "8mm" }} />
      </div>
    </div>
  );
}
