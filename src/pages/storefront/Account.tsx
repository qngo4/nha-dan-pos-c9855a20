import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatVND, formatDateTime } from "@/lib/format";
import { User, ShoppingCart, Clock, ChevronRight, LogOut } from "lucide-react";

const mockOrders = [
  { id: '1', number: 'DH-20250415-001', date: '2025-04-15T10:30:00+07:00', total: 320000, status: 'pending' as const, paymentMethod: 'transfer' as const, itemCount: 4 },
  { id: '2', number: 'DH-20250414-001', date: '2025-04-14T09:00:00+07:00', total: 450000, status: 'confirmed' as const, paymentMethod: 'zalopay' as const, itemCount: 6 },
  { id: '3', number: 'DH-20250413-001', date: '2025-04-13T15:00:00+07:00', total: 890000, status: 'expired' as const, paymentMethod: 'transfer' as const, itemCount: 5 },
  { id: '4', number: 'HD-20250412-001', date: '2025-04-12T09:00:00+07:00', total: 567000, status: 'confirmed' as const, paymentMethod: 'cash' as const, itemCount: 6 },
];

function getOrderStatus(status: string) {
  switch (status) {
    case 'pending': return <StatusBadge status="pending" />;
    case 'confirmed': return <StatusBadge status="confirmed" />;
    case 'cancelled': return <StatusBadge status="cancelled" />;
    case 'expired': return <StatusBadge status="expired-order" />;
    default: return null;
  }
}

export default function AccountPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile */}
      <div className="bg-card rounded-lg border p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 bg-primary-soft rounded-full flex items-center justify-center text-lg font-bold text-primary shrink-0">N</div>
          <div>
            <h1 className="text-lg font-bold">Nguyễn Văn An</h1>
            <p className="text-sm text-muted-foreground">0901234567 · VIP</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-muted rounded-md p-3 text-center">
            <p className="text-xs text-muted-foreground">Tổng đơn hàng</p>
            <p className="text-lg font-bold">87</p>
          </div>
          <div className="bg-muted rounded-md p-3 text-center">
            <p className="text-xs text-muted-foreground">Tổng chi tiêu</p>
            <p className="text-lg font-bold text-primary">{formatVND(45200000)}</p>
          </div>
        </div>
      </div>

      {/* Pending orders alert */}
      <div className="flex items-center gap-2 p-3 bg-warning-soft rounded-lg border border-warning/20 mb-4">
        <Clock className="h-4 w-4 text-warning shrink-0" />
        <p className="text-sm text-warning">Bạn có 1 đơn hàng đang chờ thanh toán</p>
        <Link to="/pending-payment" className="ml-auto text-xs font-medium text-warning hover:underline">Xem</Link>
      </div>

      {/* Order history */}
      <div className="bg-card rounded-lg border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Lịch sử đơn hàng</h2>
        </div>
        <div className="divide-y">
          {mockOrders.map(order => (
            <div key={order.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs font-medium">{order.number}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(order.date)} · {order.itemCount} sản phẩm</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatVND(order.total)}</p>
                  <div className="mt-0.5">{getOrderStatus(order.status)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium border text-danger hover:bg-danger-soft transition-colors">
          <LogOut className="h-4 w-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
