import type { Invoice } from "@/lib/mock-data";
import { formatVND, formatDateTime } from "@/lib/format";

interface Line { name: string; code: string; qty: number; price: number }

interface Props {
  invoice: Invoice;
  lines: Line[];
}

export function PrintableInvoice({ invoice, lines }: Props) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const discount = Math.max(0, subtotal - invoice.total);
  return (
    <div className="print-area" id="print-area-invoice">
      <div style={{ padding: "16px", fontFamily: "Arial, sans-serif", color: "#000", fontSize: "12pt" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <h1 style={{ fontSize: "18pt", margin: 0 }}>Nhã Đan Shop</h1>
          <p style={{ margin: "2px 0", fontSize: "10pt" }}>123 Nguyễn Văn Linh, Q7, TP.HCM · 0901 234 567</p>
          <h2 style={{ fontSize: "14pt", margin: "12px 0 4px" }}>HÓA ĐƠN BÁN HÀNG</h2>
          <p style={{ margin: 0, fontFamily: "monospace" }}>{invoice.number}</p>
        </div>

        <table style={{ width: "100%", fontSize: "10pt", marginBottom: 12 }}>
          <tbody>
            <tr><td>Thời gian:</td><td style={{ textAlign: "right" }}>{formatDateTime(invoice.date)}</td></tr>
            <tr><td>Khách hàng:</td><td style={{ textAlign: "right" }}>{invoice.customerName}</td></tr>
            <tr><td>Người tạo:</td><td style={{ textAlign: "right" }}>{invoice.createdBy}</td></tr>
            <tr><td>Thanh toán:</td><td style={{ textAlign: "right", textTransform: "uppercase" }}>{invoice.paymentType}</td></tr>
          </tbody>
        </table>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
          <thead>
            <tr style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
              <th style={{ textAlign: "left", padding: "4px 2px" }}>Sản phẩm</th>
              <th style={{ textAlign: "center", padding: "4px 2px" }}>SL</th>
              <th style={{ textAlign: "right", padding: "4px 2px" }}>Đơn giá</th>
              <th style={{ textAlign: "right", padding: "4px 2px" }}>T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} style={{ borderBottom: "1px dashed #999" }}>
                <td style={{ padding: "4px 2px" }}>
                  {l.name}
                  <div style={{ fontSize: "8pt", color: "#555" }}>{l.code}</div>
                </td>
                <td style={{ textAlign: "center", padding: "4px 2px" }}>{l.qty}</td>
                <td style={{ textAlign: "right", padding: "4px 2px" }}>{formatVND(l.price)}</td>
                <td style={{ textAlign: "right", padding: "4px 2px" }}>{formatVND(l.qty * l.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table style={{ width: "100%", marginTop: 12, fontSize: "11pt" }}>
          <tbody>
            <tr><td>Tạm tính:</td><td style={{ textAlign: "right" }}>{formatVND(subtotal)}</td></tr>
            {discount > 0 && <tr><td>Giảm giá:</td><td style={{ textAlign: "right" }}>-{formatVND(discount)}</td></tr>}
            <tr style={{ borderTop: "1px solid #000", fontWeight: "bold", fontSize: "13pt" }}>
              <td style={{ paddingTop: 6 }}>TỔNG CỘNG:</td>
              <td style={{ textAlign: "right", paddingTop: 6 }}>{formatVND(invoice.total)}</td>
            </tr>
          </tbody>
        </table>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: "10pt" }}>
          Cảm ơn quý khách. Hẹn gặp lại!
        </p>
      </div>
    </div>
  );
}
