import { useParams, Link } from "react-router-dom";
import { formatVND, formatDateTime } from "@/lib/format";
import { Clock, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Package, Copy } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import type { PendingOrder } from "@/lib/mock-data";

const BANK_INFO = {
  bank: "Vietcombank",
  account: "0123456789",
  name: "NHADAN SHOP",
};

const PAYMENT_LABEL: Record<PendingOrder["paymentMethod"], string> = {
  transfer: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
  zalopay: "ZaloPay",
};

export default function PendingPaymentPage() {
  const { id } = useParams();
  const { pendingOrders } = useStore();
  // Lookup by store id; fall back to first order so the route also works without an id (legacy entry).
  const order = (id && pendingOrders.find((o) => o.id === id)) || pendingOrders[0];

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mx-auto mb-3" />
        <h1 className="text-lg font-bold">Không tìm thấy đơn chờ thanh toán</h1>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-primary text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const transferContent = order.orderNumber.replace(/-/g, "");
  const items = order.items ?? [];

  const steps = [
    { label: "Tạo đơn", done: true },
    { label: "Chờ thanh toán", done: false, active: order.status === "pending" },
    { label: "Xác nhận", done: order.status === "confirmed" },
    { label: "Hoàn tất", done: order.status === "confirmed" },
  ];

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`Đã sao chép ${label}`));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        {order.status === "pending" && <Clock className="h-12 w-12 text-warning mx-auto mb-3" />}
        {order.status === "confirmed" && <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />}
        {order.status === "cancelled" && <XCircle className="h-12 w-12 text-danger mx-auto mb-3" />}
        {order.status === "expired" && <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />}
        <h1 className="text-xl font-bold">
          {order.status === "pending" && "Đang chờ xác nhận thanh toán"}
          {order.status === "confirmed" && "Thanh toán đã được xác nhận"}
          {order.status === "cancelled" && "Đơn hàng đã bị hủy"}
          {order.status === "expired" && "Đơn hàng đã hết hạn"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mã đơn: <span className="font-medium text-foreground">{order.orderNumber}</span> · {PAYMENT_LABEL[order.paymentMethod]}
        </p>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between mb-8 px-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-1 relative">
            <div className={`h-3 w-3 rounded-full border-2 ${step.done ? "bg-success border-success" : step.active ? "bg-warning border-warning animate-pulse-soft" : "bg-muted border-border"}`} />
            <span className={`text-[10px] font-medium ${step.done ? "text-success" : step.active ? "text-warning" : "text-muted-foreground"}`}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`absolute top-1.5 left-full w-[calc(100%-6px)] h-0.5 -translate-x-1/2 ${step.done ? "bg-success" : "bg-border"}`} style={{ width: "60px", left: "14px" }} />
            )}
          </div>
        ))}
      </div>

      {/* Payment instructions */}
      {order.status === "pending" && (
        <div className="bg-card rounded-lg border p-4 mb-4">
          <h2 className="font-semibold text-sm mb-3">Thông tin thanh toán</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: "Ngân hàng", value: BANK_INFO.bank },
              { label: "Số tài khoản", value: BANK_INFO.account },
              { label: "Chủ tài khoản", value: BANK_INFO.name },
              { label: "Nội dung CK", value: transferContent },
              { label: "Số tiền", value: formatVND(order.total) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{row.value}</span>
                  <button onClick={() => copy(String(row.value), row.label)} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-2.5 bg-warning-soft rounded-md text-xs text-warning flex items-start gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Đơn hàng sẽ hết hạn lúc {formatDateTime(order.expiresAt)}. Vui lòng thanh toán trước thời hạn.</span>
          </div>
        </div>
      )}

      {/* Order summary */}
      <div className="bg-card rounded-lg border p-4 mb-4">
        <h2 className="font-semibold text-sm mb-3">Chi tiết đơn hàng</h2>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-muted rounded flex items-center justify-center shrink-0">
                    <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">x{item.qty}</p>
                  </div>
                </div>
                <span className="text-xs font-medium">{formatVND(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Tổng {order.itemCount} sản phẩm.</p>
        )}

        {(order.subtotal !== undefined || order.shippingFee !== undefined) && (
          <div className="mt-3 pt-3 border-t space-y-1.5 text-sm">
            {order.subtotal !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatVND(order.subtotal)}</span>
              </div>
            )}
            {order.shippingFee !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Phí giao hàng</span>
                <span>{order.shippingFee === 0 ? <span className="text-success">Miễn phí</span> : formatVND(order.shippingFee)}</span>
              </div>
            )}
          </div>
        )}

        <div className="border-t mt-3 pt-2 flex justify-between font-bold">
          <span>Tổng cộng</span>
          <span className="text-primary">{formatVND(order.total)}</span>
        </div>
      </div>

      {order.shippingAddress && (
        <div className="bg-card rounded-lg border p-4 mb-4 text-sm">
          <h2 className="font-semibold text-sm mb-2">Giao đến</h2>
          <p className="font-medium">{order.customerName} · {order.customerPhone}</p>
          <p className="text-muted-foreground text-xs mt-1">
            {[order.shippingAddress.street, order.shippingAddress.ward, order.shippingAddress.district, order.shippingAddress.province].filter(Boolean).join(", ")}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Link to="/" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" /> Quay lại mua sắm
        </Link>
        <Link to="/account" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors">
          Xem đơn hàng
        </Link>
      </div>
    </div>
  );
}
