import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatVND } from "@/lib/format";
import {
  CreditCard,
  Banknote,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Lock,
  Package,
  ShieldCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const orderItems = [
  { name: "Mì Hảo Hảo - Tôm chua cay", qty: 10, price: 5000 },
  { name: "Coca-Cola - Lon 330ml", qty: 6, price: 10000 },
  { name: "Sữa Vinamilk - Hộp 1L", qty: 2, price: 32000 },
];

const paymentMethods = [
  {
    id: "cash",
    label: "Tiền mặt tại quầy",
    icon: Banknote,
    desc: "Thanh toán khi nhận hàng — hóa đơn lập ngay",
    accent: "success",
  },
  {
    id: "transfer",
    label: "Chuyển khoản ngân hàng",
    icon: CreditCard,
    desc: "Tạo đơn chờ — admin xác nhận sau khi nhận tiền",
    accent: "info",
  },
  {
    id: "momo",
    label: "Ví MoMo",
    icon: Smartphone,
    desc: "Quét QR — admin xác nhận thanh toán",
    accent: "accent",
  },
  {
    id: "zalopay",
    label: "ZaloPay",
    icon: Smartphone,
    desc: "Quét QR — admin xác nhận thanh toán",
    accent: "info",
  },
] as const;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [payment, setPayment] = useState<string>("cash");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 200000 ? 0 : 20000;
  const total = subtotal + shipping;
  const isOnline = payment !== "cash";

  const canSubmit = form.name.trim() && /^[\d+]{9,12}$/.test(form.phone.replace(/\s/g, ""));

  const submit = () => {
    if (!canSubmit) {
      toast.error("Vui lòng nhập đầy đủ họ tên và SĐT hợp lệ");
      return;
    }
    if (isOnline) {
      toast.success("Đã tạo đơn — chuyển sang trạng thái chờ thanh toán");
      navigate("/pending-payment");
    } else {
      toast.success("Đã tạo hóa đơn thành công");
      navigate("/account");
    }
  };

  return (
    <div className="bg-storefront-bg min-h-screen pb-24 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stepper header */}
        <div className="mb-6">
          <p className="sf-eyebrow">Thanh toán</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Hoàn tất đơn hàng</h1>
          <div className="mt-4 flex items-center gap-2 text-xs">
            {[
              { label: "Giỏ hàng", done: true },
              { label: "Thông tin", done: true, active: true },
              { label: "Hoàn tất", done: false },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px]",
                    s.done && !s.active && "bg-success text-white",
                    s.active && "bg-foreground text-background ring-4 ring-foreground/10",
                    !s.done && !s.active && "bg-muted text-muted-foreground"
                  )}
                >
                  {s.done && !s.active ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "font-semibold",
                    s.active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
                {i < arr.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-5 lg:gap-6">
          {/* Left */}
          <div className="lg:col-span-3 space-y-5">
            {/* Customer */}
            <section className="bg-storefront-surface rounded-2xl border p-5 sf-shadow">
              <h2 className="font-bold text-base mb-4">Thông tin khách hàng</h2>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Họ và tên <span className="text-danger">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="mt-1.5 w-full h-11 px-3.5 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Số điện thoại <span className="text-danger">*</span>
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0901234567"
                    className="mt-1.5 w-full h-11 px-3.5 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Địa chỉ giao hàng</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện"
                    className="mt-1.5 w-full h-11 px-3.5 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Ghi chú đơn hàng</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Ghi chú thêm (tùy chọn)"
                    rows={2}
                    className="mt-1.5 w-full px-3.5 py-2.5 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="bg-storefront-surface rounded-2xl border p-5 sf-shadow">
              <h2 className="font-bold text-base mb-4">Phương thức thanh toán</h2>
              <div className="space-y-2.5">
                {paymentMethods.map((m) => {
                  const selected = payment === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPayment(m.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                        selected
                          ? "border-foreground bg-foreground/[0.02] sf-shadow"
                          : "border-border hover:border-foreground/30"
                      )}
                    >
                      <div
                        className={cn(
                          "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                          selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <m.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{m.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                      </div>
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                          selected ? "border-foreground bg-foreground" : "border-border"
                        )}
                      >
                        {selected && <Check className="h-3 w-3 text-background" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {isOnline && (
                <div className="mt-4 p-3 bg-info-soft rounded-xl text-xs text-info flex items-start gap-2">
                  <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Đơn hàng sẽ chuyển sang trạng thái chờ xác nhận. Hóa đơn chỉ được tạo sau khi
                    admin xác nhận thanh toán thành công.
                  </span>
                </div>
              )}
            </section>
          </div>

          {/* Right — Order summary */}
          <div className="lg:col-span-2 mt-5 lg:mt-0">
            <div className="bg-storefront-surface rounded-2xl border p-5 lg:sticky lg:top-20 sf-shadow">
              <button
                className="flex items-center justify-between w-full lg:cursor-default"
                onClick={() => setSummaryOpen(!summaryOpen)}
              >
                <h2 className="font-bold text-base">Đơn hàng ({orderItems.length})</h2>
                <span className="lg:hidden">
                  {summaryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>
              <div className={cn("mt-3.5 space-y-2.5", !summaryOpen && "hidden lg:block")}>
                {orderItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 bg-gradient-to-br from-muted to-storefront-soft rounded-lg flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.qty} × {formatVND(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold shrink-0">
                      {formatVND(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="font-semibold">{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí giao hàng</span>
                  <span className="font-semibold">
                    {shipping === 0 ? <span className="text-success">Miễn phí</span> : formatVND(shipping)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-baseline">
                  <span className="font-bold">Tổng cộng</span>
                  <span className="font-bold text-foreground text-xl">{formatVND(total)}</span>
                </div>
              </div>
              <button
                onClick={submit}
                disabled={!canSubmit}
                className={cn(
                  "mt-5 w-full flex items-center justify-center gap-2 h-12 rounded-full text-sm font-semibold transition-all",
                  canSubmit
                    ? "bg-storefront-accent text-white hover:opacity-90 sf-shadow-cta"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Lock className="h-4 w-4" />
                {isOnline ? "Tạo đơn hàng" : "Hoàn tất thanh toán"}
              </button>

              <div className="mt-4 pt-4 border-t flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                Thông tin được mã hóa & bảo mật
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
