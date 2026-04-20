import { useEffect, useState } from "react";
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
  Truck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { quoteShipping, type ShippingState } from "@/lib/shipping";
import { pendingOrderActions, invoiceActions } from "@/lib/store";

const orderItems = [
  { name: "Mì Hảo Hảo - Tôm chua cay", qty: 10, price: 5000 },
  { name: "Coca-Cola - Lon 330ml", qty: 6, price: 10000 },
  { name: "Sữa Vinamilk - Hộp 1L", qty: 2, price: 32000 },
];

const paymentMethods = [
  { id: "cash", label: "Tiền mặt khi nhận", icon: Banknote, desc: "COD — hóa đơn lập ngay khi xác nhận" },
  { id: "transfer", label: "Chuyển khoản ngân hàng", icon: CreditCard, desc: "Tạo đơn chờ — admin xác nhận sau khi nhận tiền" },
  { id: "momo", label: "Ví MoMo", icon: Smartphone, desc: "Quét QR — admin xác nhận thanh toán" },
  { id: "zalopay", label: "ZaloPay", icon: Smartphone, desc: "Quét QR — admin xác nhận thanh toán" },
] as const;

type PaymentId = (typeof paymentMethods)[number]["id"];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentId>("cash");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    street: "",
    note: "",
  });

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const [ship, setShip] = useState<ShippingState>({ state: "idle" });

  // Auto-quote whenever address fields change (debounced)
  useEffect(() => {
    let cancel = false;
    setShip({ state: "loading" });
    const t = setTimeout(async () => {
      const result = await quoteShipping({
        address: {
          province: form.province,
          district: form.district,
          ward: form.ward,
          street: form.street,
        },
        subtotal,
      });
      if (!cancel) setShip(result);
    }, 350);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [form.province, form.district, form.ward, form.street, subtotal]);

  const shippingFee = ship.state === "ok" ? ship.fee : 0;
  const total = subtotal + shippingFee;
  const isOnline = payment !== "cash";

  const phoneOk = /^[\d+]{9,12}$/.test(form.phone.replace(/\s/g, ""));
  const canSubmit =
    form.name.trim() &&
    phoneOk &&
    ship.state === "ok" &&
    !submitting;

  const submit = async () => {
    if (!form.name.trim() || !phoneOk) {
      toast.error("Vui lòng nhập đầy đủ họ tên và SĐT hợp lệ");
      return;
    }
    if (ship.state !== "ok") {
      toast.error("Vui lòng nhập đầy đủ địa chỉ để tính phí giao hàng");
      return;
    }
    setSubmitting(true);
    try {
      if (isOnline) {
        const order = pendingOrderActions.create({
          customerId: "",
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          shippingAddress: {
            province: form.province.trim(),
            district: form.district.trim(),
            ward: form.ward.trim(),
            street: form.street.trim(),
          },
          paymentMethod: payment as Exclude<PaymentId, "cash">,
          subtotal,
          shippingFee,
          total,
          itemCount: orderItems.length,
          items: orderItems,
          note: form.note.trim() || undefined,
          expiresInHours: 12,
        });
        toast.success("Đã tạo đơn — chuyển sang trang chờ thanh toán");
        navigate(`/pending-payment/${order.id}`);
      } else {
        // Cash / COD — create invoice immediately
        const inv = invoiceActions.create({
          number: `HD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 900 + 100)}`,
          date: new Date().toISOString(),
          customerId: "",
          customerName: form.name.trim(),
          total,
          paymentType: "cash",
          status: "active",
          createdBy: "online",
          itemCount: orderItems.length,
          breakdown: {
            subtotal,
            manualDiscount: 0,
            promoDiscount: 0,
            shippingFee,
            shippingDiscount: 0,
            shippingPayable: shippingFee,
            vatPercent: 0,
            vatBase: subtotal,
            vatAmount: 0,
            total,
          },
          lines: orderItems.map((i) => ({ name: i.name, code: "", qty: i.qty, price: i.price })),
        });
        toast.success(`Đã tạo hóa đơn ${inv.number}`);
        navigate("/account");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-storefront-bg min-h-screen pb-24 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="sf-eyebrow">Thanh toán</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Hoàn tất đơn hàng</h1>
        </div>

        <div className="lg:grid lg:grid-cols-5 lg:gap-6">
          <div className="lg:col-span-3 space-y-5">
            {/* Customer + address */}
            <section className="bg-storefront-surface rounded-2xl border p-5 sf-shadow">
              <h2 className="font-bold text-base mb-4">Thông tin giao hàng</h2>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Họ và tên *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nguyễn Văn A" />
                <Field label="Số điện thoại *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0901234567" />
                <Field label="Tỉnh / Thành phố *" value={form.province} onChange={(v) => setForm({ ...form, province: v })} placeholder="VD: TP.HCM" />
                <Field label="Quận / Huyện *" value={form.district} onChange={(v) => setForm({ ...form, district: v })} placeholder="VD: Quận 1" />
                <Field label="Phường / Xã *" value={form.ward} onChange={(v) => setForm({ ...form, ward: v })} placeholder="VD: Phường Bến Nghé" />
                <Field label="Số nhà, đường" value={form.street} onChange={(v) => setForm({ ...form, street: v })} placeholder="VD: 12 Lê Lợi" />
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

              {/* Shipping quote state */}
              <ShippingBlock ship={ship} />
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
                        selected ? "border-foreground bg-foreground/[0.02] sf-shadow" : "border-border hover:border-foreground/30"
                      )}
                    >
                      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                        <m.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{m.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                      </div>
                      <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0", selected ? "border-foreground bg-foreground" : "border-border")}>
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
                    Đơn hàng sẽ chuyển sang trạng thái <b>chờ xác nhận</b>. Hóa đơn chỉ được tạo sau khi admin xác nhận thanh toán thành công.
                  </span>
                </div>
              )}
            </section>
          </div>

          {/* Right — Order summary */}
          <div className="lg:col-span-2 mt-5 lg:mt-0">
            <div className="bg-storefront-surface rounded-2xl border p-5 lg:sticky lg:top-20 sf-shadow">
              <button className="flex items-center justify-between w-full lg:cursor-default" onClick={() => setSummaryOpen(!summaryOpen)}>
                <h2 className="font-bold text-base">Đơn hàng ({orderItems.length})</h2>
                <span className="lg:hidden">{summaryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
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
                        <p className="text-[11px] text-muted-foreground">{item.qty} × {formatVND(item.price)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold shrink-0">{formatVND(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                <Row label="Tạm tính" value={formatVND(subtotal)} />
                <Row
                  label="Phí giao hàng"
                  value={
                    ship.state === "loading" ? <span className="text-muted-foreground inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Đang tính…</span> :
                    ship.state === "incomplete" ? <span className="text-muted-foreground">—</span> :
                    ship.state === "unavailable" ? <span className="text-danger">Không khả dụng</span> :
                    ship.state === "ok" && ship.freeShipApplied ? <span className="text-success">Miễn phí</span> :
                    ship.state === "ok" ? formatVND(ship.fee) : "—"
                  }
                />
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
                  canSubmit ? "bg-storefront-accent text-white hover:opacity-90 sf-shadow-cta" : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {isOnline ? "Tạo đơn chờ thanh toán" : "Đặt hàng (COD)"}
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

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full h-11 px-3.5 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function ShippingBlock({ ship }: { ship: ShippingState }) {
  if (ship.state === "idle") return null;

  if (ship.state === "loading") {
    return (
      <div className="mt-4 p-3 rounded-xl bg-muted/50 text-xs flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tính phí giao hàng…
      </div>
    );
  }
  if (ship.state === "incomplete") {
    return (
      <div className="mt-4 p-3 rounded-xl bg-warning-soft text-xs text-warning flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>Vui lòng nhập đầy đủ: <b>{ship.missing.join(", ")}</b> để tính phí giao hàng.</span>
      </div>
    );
  }
  if (ship.state === "unavailable") {
    return (
      <div className="mt-4 p-3 rounded-xl bg-danger-soft text-xs text-danger flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>Không thể giao đến địa chỉ này: {ship.reason}</span>
      </div>
    );
  }
  return (
    <div className="mt-4 p-3 rounded-xl bg-success-soft text-xs text-success flex items-start gap-2">
      <Truck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <span>
        Khu vực <b>{ship.zone}</b> · Dự kiến giao trong <b>{ship.etaDays[0]}–{ship.etaDays[1]} ngày</b>
        {" · "}
        {ship.freeShipApplied ? <b>Miễn phí giao hàng</b> : <>Phí: <b>{formatVND(ship.fee)}</b></>}
      </span>
    </div>
  );
}

