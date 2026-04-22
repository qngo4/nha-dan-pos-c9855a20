// Admin worklist of bank transactions that the Casso webhook could not
// auto-link to a pending order. Admin links them manually to fire the
// confirmation flow on the corresponding order.
import { useEffect, useMemo, useState } from "react";
import { paymentEvents, pendingOrders } from "@/services";
import type { PaymentEvent } from "@/services";
import type { PendingOrder } from "@/services/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatVND, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { RefreshCw, Link2, X, Inbox, Search } from "lucide-react";

export default function UnmatchedPaymentsPage() {
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<PaymentEvent | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await paymentEvents.listUnmatched(200);
      setEvents(list);
    } catch (e: any) {
      toast.error(e?.message ?? "Không tải được danh sách giao dịch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Giao dịch chưa khớp"
        description="Các giao dịch ngân hàng nhận từ webhook nhưng chưa gắn được vào đơn."
        actions={
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        }
      />

      <div className="bg-card border rounded-lg overflow-hidden">
        {events.length === 0 && !loading ? (
          <EmptyState
            icon={Inbox}
            title="Không có giao dịch chờ xử lý"
            description="Mọi giao dịch đến từ webhook đã được gắn vào đơn hoặc bị bỏ qua."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Thời gian</th>
                  <th className="text-right px-3 py-2 font-medium">Số tiền</th>
                  <th className="text-left px-3 py-2 font-medium">Nội dung</th>
                  <th className="text-left px-3 py-2 font-medium">Mã đơn (gợi ý)</th>
                  <th className="text-left px-3 py-2 font-medium">Tài khoản</th>
                  <th className="text-right px-3 py-2 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {formatDateTime(e.txTime ?? e.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatVND(e.amount)}
                    </td>
                    <td className="px-3 py-2 max-w-[280px] truncate" title={e.transferContent}>
                      {e.transferContent || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {e.matchedCode ? (
                        <span className="inline-block rounded bg-primary/10 text-primary text-xs px-2 py-0.5 font-mono">
                          {e.matchedCode}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {e.bankSubAcc || e.bankAccount || "—"}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLinking(e)}
                        className="text-primary"
                      >
                        <Link2 className="h-3.5 w-3.5 mr-1" /> Gắn vào đơn
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await paymentEvents.markIgnored(e.id);
                            toast.success("Đã bỏ qua giao dịch");
                            refresh();
                          } catch (err: any) {
                            toast.error(err?.message ?? "Không bỏ qua được");
                          }
                        }}
                        className="text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Bỏ qua
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LinkDialog
        event={linking}
        onClose={() => setLinking(null)}
        onLinked={() => {
          setLinking(null);
          refresh();
        }}
      />
    </div>
  );
}

/** Search pending orders and link the chosen event to the selected order. */
function LinkDialog({
  event,
  onClose,
  onLinked,
}: {
  event: PaymentEvent | null;
  onClose: () => void;
  onLinked: () => void;
}) {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!event) return;
    setQuery(event.matchedCode ?? "");
  }, [event]);

  useEffect(() => {
    if (!event) return;
    let alive = true;
    (async () => {
      const res = await pendingOrders.list({
        query: query.trim() || undefined,
        pageSize: 20,
      });
      if (alive) setOrders(res.items);
    })();
    return () => {
      alive = false;
    };
  }, [event, query]);

  const handleLink = async (order: PendingOrder) => {
    if (!event) return;
    setBusyId(order.id);
    try {
      await paymentEvents.linkToOrder(event.id, order.code, "admin");
      // Auto-confirm the order if the linked transfer covers the total.
      if (event.amount >= order.pricingBreakdownSnapshot.total) {
        await pendingOrders.update(order.id, { status: "confirmed" });
        toast.success(`Đã gắn giao dịch vào ${order.code} và xác nhận thanh toán`);
      } else {
        toast.success(
          `Đã gắn giao dịch vào ${order.code} (số tiền chưa đủ — chưa auto-confirm)`,
        );
      }
      onLinked();
    } catch (err: any) {
      toast.error(err?.message ?? "Không gắn được giao dịch");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gắn giao dịch vào đơn</DialogTitle>
        </DialogHeader>
        {event && (
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số tiền</span>
                <strong>{formatVND(event.amount)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Nội dung</span>
                <span className="text-right break-all">{event.transferContent || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian</span>
                <span>{formatDateTime(event.txTime ?? event.createdAt)}</span>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo mã đơn / tên / số điện thoại…"
                className="pl-8"
              />
            </div>

            <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
              {orders.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Không tìm thấy đơn phù hợp.
                </div>
              ) : (
                orders.map((o) => {
                  const enough = event.amount >= o.pricingBreakdownSnapshot.total;
                  return (
                    <button
                      key={o.id}
                      onClick={() => handleLink(o)}
                      disabled={busyId === o.id}
                      className="w-full flex items-center justify-between gap-3 p-3 text-left text-sm hover:bg-muted/50 transition disabled:opacity-50"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-medium">{o.code}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {o.customerName ?? "—"} · {o.customerPhone ?? "—"} · {o.status}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold">
                          {formatVND(o.pricingBreakdownSnapshot.total)}
                        </div>
                        <div className={`text-[11px] ${enough ? "text-success" : "text-warning"}`}>
                          {enough ? "Đủ tiền — sẽ auto-confirm" : "Thiếu tiền"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
