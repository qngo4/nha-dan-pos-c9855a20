import { X, Printer, Receipt, User, Calendar, CreditCard } from "lucide-react";
import { formatVND, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Invoice } from "@/lib/mock-data";
import { toast } from "sonner";

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

// Mock line items (since invoices in mock don't carry items)
function getMockLines(inv: Invoice) {
  const sample = [
    { name: 'Mì Hảo Hảo - Tôm chua cay', code: 'SP001-01', qty: 5, price: 5000 },
    { name: 'Coca-Cola - Lon 330ml', code: 'SP002-01', qty: 3, price: 10000 },
    { name: 'Sữa Vinamilk - Hộp 180ml', code: 'SP003-01', qty: 2, price: 8000 },
    { name: 'Bánh Oreo - Gói 133g', code: 'SP004-01', qty: 4, price: 22000 },
  ];
  return sample.slice(0, Math.max(1, Math.min(inv.itemCount, sample.length)));
}

export function InvoiceDetailDrawer({ invoice, onClose }: Props) {
  if (!invoice) return null;
  const lines = getMockLines(invoice);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);

  const handlePrint = () => {
    toast.success(`Đang in hóa đơn ${invoice.number}...`);
    setTimeout(() => window.print(), 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l shadow-xl flex flex-col animate-slide-in-right">
        <div className="p-4 border-b flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm font-mono">{invoice.number}</h2>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={invoice.status === 'cancelled' ? 'cancelled' : 'active'} />
              <StatusBadge status={invoice.paymentType} />
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {formatDateTime(invoice.date)}</div>
            <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /> {invoice.customerName}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="h-3.5 w-3.5" /> Người tạo: {invoice.createdBy}</div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sản phẩm ({invoice.itemCount})</h3>
            <div className="border rounded-lg divide-y">
              {lines.map((l, i) => (
                <div key={i} className="p-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.code} · {l.qty} × {formatVND(l.price)}</p>
                  </div>
                  <span className="font-medium shrink-0">{formatVND(l.qty * l.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Giảm giá</span><span>-{formatVND(Math.max(0, subtotal - invoice.total))}</span></div>
            <div className="border-t pt-1.5 flex justify-between font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatVND(invoice.total)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button onClick={onClose} className="flex-1 px-3 py-2 text-sm border rounded-md hover:bg-muted">Đóng</button>
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
            <Printer className="h-4 w-4" /> In hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
}
