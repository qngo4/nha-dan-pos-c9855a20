import { useState } from "react";
import { formatVND } from "@/lib/format";
import { CreditCard, Banknote, Smartphone, ChevronDown, ChevronUp, Lock, ShoppingCart, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const orderItems = [
  { name: 'Mì Hảo Hảo - Tôm chua cay', qty: 10, price: 5000 },
  { name: 'Coca-Cola - Lon 330ml', qty: 6, price: 10000 },
  { name: 'Sữa Vinamilk - Hộp 1L', qty: 2, price: 32000 },
];

const paymentMethods = [
  { id: 'cash', label: 'Tiền mặt', icon: Banknote, desc: 'Thanh toán tại quầy — hóa đơn tạo ngay', color: 'border-success text-success' },
  { id: 'transfer', label: 'Chuyển khoản', icon: CreditCard, desc: 'Tạo đơn chờ — admin xác nhận sau', color: 'border-info text-info' },
  { id: 'momo', label: 'MoMo', icon: Smartphone, desc: 'Tạo đơn chờ — admin xác nhận sau', color: 'border-[hsl(330,70%,50%)] text-[hsl(330,70%,50%)]' },
  { id: 'zalopay', label: 'ZaloPay', icon: Smartphone, desc: 'Tạo đơn chờ — admin xác nhận sau', color: 'border-info text-info' },
];

export default function CheckoutPage() {
  const [payment, setPayment] = useState('cash');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const isOnline = payment !== 'cash';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-5">Thanh toán</h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-6">
        {/* Left */}
        <div className="lg:col-span-3 space-y-5">
          {/* Customer */}
          <section className="bg-card rounded-lg border p-4">
            <h2 className="font-semibold text-sm mb-3">Thông tin khách hàng</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Họ tên</label>
                <input placeholder="Nhập họ tên" className="mt-1 w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Số điện thoại</label>
                <input placeholder="0901234567" className="mt-1 w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">Ghi chú</label>
              <textarea placeholder="Ghi chú đơn hàng (tùy chọn)" rows={2} className="mt-1 w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </div>
          </section>

          {/* Payment */}
          <section className="bg-card rounded-lg border p-4">
            <h2 className="font-semibold text-sm mb-3">Phương thức thanh toán</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {paymentMethods.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPayment(m.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all",
                    payment === m.id ? m.color + ' bg-card shadow-sm' : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <m.icon className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {isOnline && (
              <div className="mt-3 p-2.5 bg-info-soft rounded-md text-xs text-info flex items-start gap-2">
                <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Đơn hàng sẽ ở trạng thái chờ xác nhận. Hóa đơn chỉ được tạo sau khi admin xác nhận thanh toán.</span>
              </div>
            )}
          </section>
        </div>

        {/* Right — Order summary */}
        <div className="lg:col-span-2 mt-5 lg:mt-0">
          <div className="bg-card rounded-lg border p-4 lg:sticky lg:top-20">
            <button className="flex items-center justify-between w-full lg:cursor-default" onClick={() => setSummaryOpen(!summaryOpen)}>
              <h2 className="font-semibold text-sm">Đơn hàng ({orderItems.length})</h2>
              <span className="lg:hidden">{summaryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
            </button>
            <div className={cn("mt-3 space-y-2", !summaryOpen && "hidden lg:block")}>
              {orderItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 bg-muted rounded flex items-center justify-center shrink-0">
                      <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">x{item.qty}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium shrink-0">{formatVND(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(subtotal)}</span></div>
              <div className="flex justify-between font-bold text-base"><span>Tổng cộng</span><span className="text-primary">{formatVND(subtotal)}</span></div>
            </div>
            <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors">
              <ShoppingCart className="h-4 w-4" />
              {isOnline ? 'Tạo đơn hàng' : 'Thanh toán'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
