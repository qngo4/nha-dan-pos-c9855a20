import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { pendingOrders } from "@/lib/mock-data";
import { formatVND, formatDateTime } from "@/lib/format";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, Eye, Check, X, AlertTriangle } from "lucide-react";

const tabs = [
  { id: 'all', label: 'Tất cả', count: pendingOrders.length },
  { id: 'pending', label: 'Chờ xác nhận', count: pendingOrders.filter(o => o.status === 'pending').length },
  { id: 'confirmed', label: 'Đã xác nhận', count: pendingOrders.filter(o => o.status === 'confirmed').length },
  { id: 'cancelled', label: 'Đã hủy', count: pendingOrders.filter(o => o.status === 'cancelled').length },
  { id: 'expired', label: 'Hết hạn', count: pendingOrders.filter(o => o.status === 'expired').length },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending': return <StatusBadge status="pending" />;
    case 'confirmed': return <StatusBadge status="confirmed" />;
    case 'cancelled': return <StatusBadge status="cancelled" />;
    case 'expired': return <StatusBadge status="expired-order" />;
    default: return null;
  }
}

function getPaymentBadge(method: string) {
  switch (method) {
    case 'transfer': return <StatusBadge status="transfer" />;
    case 'momo': return <StatusBadge status="momo" />;
    case 'zalopay': return <StatusBadge status="zalopay" />;
    default: return null;
  }
}

export default function AdminPendingOrders() {
  const [activeTab, setActiveTab] = useState('all');
  const filtered = activeTab === 'all' ? pendingOrders : pendingOrders.filter(o => o.status === activeTab);

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader title="Đơn chờ thanh toán" description={`${pendingOrders.filter(o => o.status === 'pending').length} đơn đang chờ xác nhận`} />

      {/* Alert banner */}
      {pendingOrders.filter(o => o.status === 'pending').length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-warning-soft rounded-lg border border-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <p className="text-sm text-warning">Có {pendingOrders.filter(o => o.status === 'pending').length} đơn hàng đang chờ xác nhận thanh toán</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mã đơn</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Khách hàng</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Thanh toán</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Tổng</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Thời gian</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Hết hạn</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Trạng thái</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order.id} className={cn(
                "border-b last:border-0 hover:bg-muted/30 transition-colors",
                order.status === 'pending' && "bg-warning-soft/30"
              )}>
                <td className="px-3 py-2.5 font-mono text-xs font-medium">{order.orderNumber}</td>
                <td className="px-3 py-2.5">{order.customerName}</td>
                <td className="px-3 py-2.5 text-center">{getPaymentBadge(order.paymentMethod)}</td>
                <td className="px-3 py-2.5 text-right font-medium">{formatVND(order.total)}</td>
                <td className="px-3 py-2.5 text-center text-muted-foreground text-xs">{formatDateTime(order.createdAt)}</td>
                <td className="px-3 py-2.5 text-center">
                  {order.status === 'pending' ? (
                    <span className="text-xs font-medium text-warning flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 animate-pulse-soft" />
                      {formatDateTime(order.expiresAt)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">{getStatusBadge(order.status)}</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {order.status === 'pending' && (
                      <>
                        <button className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-success text-success-foreground rounded hover:opacity-90">
                          <Check className="h-3 w-3" /> Xác nhận
                        </button>
                        <button className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-danger text-danger-foreground rounded hover:opacity-90">
                          <X className="h-3 w-3" /> Hủy
                        </button>
                      </>
                    )}
                    <button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.map(order => (
          <div key={order.id} className={cn(
            "bg-card rounded-lg border p-3",
            order.status === 'pending' && "border-warning/30 bg-warning-soft/30"
          )}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-mono text-xs font-medium">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">{order.customerName}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getPaymentBadge(order.paymentMethod)}
                <span className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</span>
              </div>
              <span className="font-bold">{formatVND(order.total)}</span>
            </div>
            {order.status === 'pending' && (
              <div className="flex gap-2 mt-2 pt-2 border-t">
                <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium bg-success text-success-foreground rounded">
                  <Check className="h-3 w-3" /> Xác nhận
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium bg-danger text-danger-foreground rounded">
                  <X className="h-3 w-3" /> Hủy
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
