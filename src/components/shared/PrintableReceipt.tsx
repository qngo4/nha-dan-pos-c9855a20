import type { GoodsReceipt, GoodsReceiptLine } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";

interface Props {
  receipt: GoodsReceipt;
  lines: GoodsReceiptLine[];
}

export function PrintableReceipt({ receipt, lines }: Props) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitCost * (1 - l.discount / 100), 0);
  return (
    <div className="print-area" id="print-area-receipt">
      <div style={{ padding: "16px", fontFamily: "Arial, sans-serif", color: "#000", fontSize: "11pt" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <h1 style={{ fontSize: "16pt", margin: 0 }}>PHIẾU NHẬP KHO</h1>
          <p style={{ margin: "4px 0", fontFamily: "monospace" }}>{receipt.number}</p>
        </div>

        <table style={{ width: "100%", fontSize: "10pt", marginBottom: 12 }}>
          <tbody>
            <tr><td>Ngày nhập:</td><td style={{ textAlign: "right" }}>{formatDate(receipt.date)}</td></tr>
            <tr><td>Nhà cung cấp:</td><td style={{ textAlign: "right" }}>{receipt.supplierName}</td></tr>
            {receipt.note && <tr><td>Ghi chú:</td><td style={{ textAlign: "right" }}>{receipt.note}</td></tr>}
          </tbody>
        </table>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
          <thead>
            <tr style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
              <th style={{ textAlign: "left", padding: "4px 2px" }}>#</th>
              <th style={{ textAlign: "left", padding: "4px 2px" }}>Sản phẩm</th>
              <th style={{ textAlign: "center", padding: "4px 2px" }}>SL</th>
              <th style={{ textAlign: "right", padding: "4px 2px" }}>Đơn giá</th>
              <th style={{ textAlign: "right", padding: "4px 2px" }}>T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.id} style={{ borderBottom: "1px dashed #999" }}>
                <td style={{ padding: "4px 2px" }}>{i + 1}</td>
                <td style={{ padding: "4px 2px" }}>
                  {l.productName}
                  <div style={{ fontSize: "8pt", color: "#555" }}>{l.variantName} · {l.variantCode}{l.expiryDate ? ` · HSD: ${formatDate(l.expiryDate)}` : ""}</div>
                </td>
                <td style={{ textAlign: "center", padding: "4px 2px" }}>{l.quantity} {l.importUnit}</td>
                <td style={{ textAlign: "right", padding: "4px 2px" }}>{formatVND(l.unitCost)}</td>
                <td style={{ textAlign: "right", padding: "4px 2px" }}>{formatVND(l.quantity * l.unitCost * (1 - l.discount / 100))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table style={{ width: "100%", marginTop: 12, fontSize: "11pt" }}>
          <tbody>
            <tr><td>Tạm tính:</td><td style={{ textAlign: "right" }}>{formatVND(subtotal)}</td></tr>
            <tr><td>Phí vận chuyển:</td><td style={{ textAlign: "right" }}>{formatVND(receipt.shippingFee)}</td></tr>
            <tr><td>VAT:</td><td style={{ textAlign: "right" }}>{formatVND(receipt.vat)}</td></tr>
            <tr style={{ borderTop: "1px solid #000", fontWeight: "bold", fontSize: "13pt" }}>
              <td style={{ paddingTop: 6 }}>TỔNG CỘNG:</td>
              <td style={{ textAlign: "right", paddingTop: 6 }}>{formatVND(receipt.totalCost + receipt.shippingFee + receipt.vat)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 32, fontSize: "10pt", textAlign: "center" }}>
          <div>
            <p style={{ fontWeight: "bold" }}>Người giao</p>
            <p style={{ marginTop: 48 }}>(Ký, ghi rõ họ tên)</p>
          </div>
          <div>
            <p style={{ fontWeight: "bold" }}>Người nhận</p>
            <p style={{ marginTop: 48 }}>(Ký, ghi rõ họ tên)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
