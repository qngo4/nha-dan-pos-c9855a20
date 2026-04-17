import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { pendingOrders as initialOrders, type PendingOrder } from "@/lib/mock-data";
import { formatVND, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Clock, Eye, Check, X, AlertTriangle, CreditCard, User, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

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

function timeRemaining(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Đã hết hạn';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)} ngày`;
  return `${hours}h ${minutes}p`;
}

export default function AdminPendingOrders() {
  const [orderList, setOrderList] = useState<PendingOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState('all');
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<PendingOrder | null>(null);

  const tabs = useMemo(() => ([
    { id: 'all', label: 'Tất cả', count: orderList.length },
    { id: 'pending', label: 'Chờ xác nhận', count: orderList.filter(o => o.status === 'pending').length },
    { id: 'confirmed', label: 'Đã xác nhận', count: orderList.filter(o => o.status === 'confirmed').length },
    { id: 'cancelled', label: 'Đã hủy', count: orderList.filter(o => o.status === 'cancelled').length },
    { id: 'expired', label: 'Hết hạn', count: orderList.filter(o => o.status === 'expired').length },
  ]), [orderList]);

  const filtered = activeTab === 'all' ? orderList : orderList.filter(o => o.status === activeTab);
  const pendingCount = orderList.filter(o => o.status === 'pending').length;

  const handleConfirm = () => {
    if (!confirmTarget) return;
    const o = orderList.find(x => x.id === confirmTarget);
    setOrderList(prev => prev.map(x => x.id === confirmTarget ? { ...x, status: 'confirmed' } : x));
    toast.success(`Đã xác nhận thanh toán ${o?.orderNumber ?? ''}. Hóa đơn đã được tạo.`);
    setConfirmTarget(null);
    if (detailOrder?.id === confirmTarget) setDetailOrder({ ...detailOrder, status: 'confirmed' });
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    const o = orderList.find(x => x.id === cancelTarget);
    setOrderList(prev => prev.map(x => x.id === cancelTarget ? { ...x, status: 'cancelled' } : x));
    toast.success(`Đã hủy đơn ${o?.orderNumber ?? ''}`);
    setCancelTarget(null);
    if (detailOrder?.id === cancelTarget) setDetailOrder({ ...detailOrder, status: 'cancelled' });
  };

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader title="Đơn chờ thanh toán" description={`${pendingCount} đơn đang chờ xác nhận`} />

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-warning-soft rounded-lg border border-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <p className="text-sm text-warning">Có {pendingCount} đơn hàng đang chờ xác nhận thanh toán</p>
        </div>
      )}

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
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Còn lại</th>
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
                <td className="px-3 py-2.5 font-mono text-xs font-medium">
                  <button onClick={() => setDetailOrder(order)} className="hover:text-primary hover:underline">{order.orderNumber}</button>
                </td>
                <td className="px-3 py-2.5">{order.customerName}</td>
                <td className="px-3 py-2.5 text-center">{getPaymentBadge(order.paymentMethod)}</td>
                <td className="px-3 py-2.5 text-right font-medium">{formatVND(order.total)}</td>
                <td className="px-3 py-2.5 text-center text-muted-foreground text-xs">{formatDateTime(order.createdAt)}</td>
                <td className="px-3 py-2.5 text-center">
                  {order.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-soft text-warning text-[11px] font-medium">
                      <Clock className="h-3 w-3" />
                      {timeRemaining(order.expiresAt)}
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
                        <button onClick={() => setConfirmTarget(order.id)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-success text-success-foreground rounded hover:opacity-90">
                          <Check className="h-3 w-3" /> Xác nhận
                        </button>
                        <button onClick={() => setCancelTarget(order.id)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-danger text-danger-foreground rounded hover:opacity-90">
                          <X className="h-3 w-3" /> Hủy
                        </button>
                      </>
                    )}
                    <button onClick={() => setDetailOrder(order)} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="Xem chi tiết">
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
            <button onClick={() => setDetailOrder(order)} className="w-full text-left">
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
                  {order.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-warning"><Clock className="h-3 w-3" />{timeRemaining(order.expiresAt)}</span>
                  )}
                </div>
                <span className="font-bold">{formatVND(order.total)}</span>
              </div>
            </button>
            {order.status === 'pending' && (
              <div className="flex gap-2 mt-2 pt-2 border-t">
                <button onClick={() => setConfirmTarget(order.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium bg-success text-success-foreground rounded">
                  <Check className="h-3 w-3" /> Xác nhận
                </button>
                <button onClick={() => setCancelTarget(order.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium bg-danger text-danger-foreground rounded">
                  <X className="h-3 w-3" /> Hủy
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirm}
        title="Xác nhận thanh toán?"
        description="Sau khi xác nhận, hệ thống sẽ tạo hóa đơn chính thức và trừ tồn kho. Thao tác này không thể hoàn tác."
        confirmLabel="Xác nhận thanh toán"
      />
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Hủy đơn hàng?"
        description="Đơn hàng sẽ bị hủy. Khách hàng sẽ nhận được thông báo. Thao tác này không thể hoàn tác."
        confirmLabel="Hủy đơn"
        variant="danger"
      />

      {/* Detail drawer */}
      {detailOrder && <PendingOrderDetail order={detailOrder} onClose={() => setDetailOrder(null)} onConfirm={() => setConfirmTarget(detailOrder.id)} onCancel={() => setCancelTarget(detailOrder.id)} />}
    </div>
  );
}

function PendingOrderDetail({ order, onClose, onConfirm, onCancel }: {
  order: PendingOrder;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const items = order.items ?? [{ name: 'Sản phẩm', qty: order.itemCount, price: order.total / Math.max(1, order.itemCount) }];

  const timelineSteps = [
    { id: 'created', label: 'Đã đặt đơn', icon: Calendar, done: true, time: order.createdAt },
    { id: 'pending', label: 'Chờ xác nhận thanh toán', icon: Clock, done: order.status !== 'pending', current: order.status === 'pending' },
    {
      id: 'final',
      label: order.status === 'confirmed' ? 'Đã xác nhận — Hóa đơn đã tạo' : order.status === 'cancelled' ? 'Đã hủy' : order.status === 'expired' ? 'Đã hết hạn' : 'Chờ xử lý',
      icon: order.status === 'confirmed' ? CheckCircle2 : order.status === 'cancelled' ? XCircle : order.status === 'expired' ? AlertTriangle : Clock,
      done: order.status !== 'pending',
      variant: order.status === 'confirmed' ? 'success' : order.status === 'cancelled' || order.status === 'expired' ? 'danger' : undefined,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l shadow-xl flex flex-col animate-slide-in-right">
        <div className="p-4 border-b flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
            <div className="mt-1 flex items-center gap-2">
              {getStatusBadge(order.status)}
              {getPaymentBadge(order.paymentMethod)}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /> {order.customerName}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {formatDateTime(order.createdAt)}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="h-3.5 w-3.5" /> Hết hạn: {formatDateTime(order.expiresAt)}</div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tiến trình</h3>
            <div className="space-y-3">
              {timelineSteps.map((step, i) => {
                const Icon = step.icon;
                const variant = (step as any).variant;
                return (
                  <div key={step.id} className="flex gap-3">
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                      variant === 'success' ? "bg-success-soft text-success" :
                      variant === 'danger' ? "bg-danger-soft text-danger" :
                      step.done ? "bg-primary-soft text-primary" :
                      (step as any).current ? "bg-warning-soft text-warning animate-pulse-soft" :
                      "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-medium">{step.label}</p>
                      {step.time && <p className="text-xs text-muted-foreground">{formatDateTime(step.time)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sản phẩm ({order.itemCount})</h3>
            <div className="border rounded-lg divide-y">
              {items.map((it, i) => (
                <div key={i} className="p-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{it.qty} × {formatVND(it.price)}</p>
                  </div>
                  <span className="font-medium shrink-0">{formatVND(it.qty * it.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/40 rounded-lg p-3 flex items-center justify-between">
            <span className="font-semibold">Tổng cộng</span>
            <span className="font-bold text-base text-primary">{formatVND(order.total)}</span>
          </div>
        </div>

        {order.status === 'pending' ? (
          <div className="p-4 border-t flex gap-2">
            <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-danger text-danger-foreground rounded-md hover:opacity-90">
              <X className="h-4 w-4" /> Hủy đơn
            </button>
            <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-success text-success-foreground rounded-md hover:opacity-90">
              <Check className="h-4 w-4" /> Xác nhận
            </button>
          </div>
        ) : (
          <div className="p-4 border-t">
            <button onClick={onClose} className="w-full px-3 py-2 text-sm border rounded-md hover:bg-muted">Đóng</button>
          </div>
        )}
      </div>
    </div>
  );
}
