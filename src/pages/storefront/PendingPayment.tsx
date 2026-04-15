import { formatVND, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Clock, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Package, Copy } from "lucide-react";
import { Link } from "react-router-dom";

export default function PendingPaymentPage() {
  // Mock pending order
  const order = {
    id: 'DH-20250415-001',
    paymentMethod: 'transfer' as const,
    total: 174000,
    createdAt: '2025-04-15T10:30:00+07:00',
    expiresAt: '2025-04-15T22:30:00+07:00',
    status: 'pending' as const,
    items: [
      { name: 'Mì Hảo Hảo - Tôm chua cay', qty: 10, price: 5000 },
      { name: 'Coca-Cola - Lon 330ml', qty: 6, price: 10000 },
      { name: 'Sữa Vinamilk - Hộp 1L', qty: 2, price: 32000 },
    ],
    bankInfo: {
      bank: 'Vietcombank',
      account: '0123456789',
      name: 'NHADAN SHOP',
      content: 'DH20250415001',
    }
  };

  const steps = [
    { label: 'Tạo đơn', done: true },
    { label: 'Chờ thanh toán', done: false, active: order.status === 'pending' },
    { label: 'Xác nhận', done: order.status === 'confirmed' },
    { label: 'Hoàn tất', done: order.status === 'confirmed' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Status header */}
      <div className="text-center mb-6">
        {order.status === 'pending' && <Clock className="h-12 w-12 text-warning mx-auto mb-3" />}
        {order.status === 'confirmed' && <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />}
        {order.status === 'cancelled' && <XCircle className="h-12 w-12 text-danger mx-auto mb-3" />}
        {order.status === 'expired' && <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />}
        <h1 className="text-xl font-bold">
          {order.status === 'pending' && 'Đang chờ xác nhận thanh toán'}
          {order.status === 'confirmed' && 'Thanh toán đã được xác nhận'}
          {order.status === 'cancelled' && 'Đơn hàng đã bị hủy'}
          {order.status === 'expired' && 'Đơn hàng đã hết hạn'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Mã đơn: <span className="font-medium text-foreground">{order.id}</span></p>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between mb-8 px-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-1 relative">
            <div className={`h-3 w-3 rounded-full border-2 ${step.done ? 'bg-success border-success' : step.active ? 'bg-warning border-warning animate-pulse-soft' : 'bg-muted border-border'}`} />
            <span className={`text-[10px] font-medium ${step.done ? 'text-success' : step.active ? 'text-warning' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`absolute top-1.5 left-full w-[calc(100%-6px)] h-0.5 -translate-x-1/2 ${step.done ? 'bg-success' : 'bg-border'}`} style={{ width: '60px', left: '14px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Payment instructions */}
      {order.status === 'pending' && (
        <div className="bg-card rounded-lg border p-4 mb-4">
          <h2 className="font-semibold text-sm mb-3">Thông tin chuyển khoản</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Ngân hàng', value: order.bankInfo.bank },
              { label: 'Số tài khoản', value: order.bankInfo.account },
              { label: 'Chủ tài khoản', value: order.bankInfo.name },
              { label: 'Nội dung CK', value: order.bankInfo.content },
              { label: 'Số tiền', value: formatVND(order.total) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{row.value}</span>
                  <button className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
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
        <div className="space-y-2">
          {order.items.map((item, i) => (
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
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Tổng cộng</span>
            <span className="text-primary">{formatVND(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
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
