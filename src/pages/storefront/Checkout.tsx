import { useEffect, useMemo, useState } from "react";
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
import { pendingOrders, promotions, shipping } from "@/services";
import type {
  CartContext,
  CartLine,
  EvaluatedPromotion,
  PaymentMethod,
  PendingOrderLine,
  PromotionSnapshot,
  ShippingAddress,
  ShippingQuote,
} from "@/services/types";
import { invoiceActions } from "@/lib/store";
import { AddressSelect, type AddressSelectValue } from "@/components/shared/AddressSelect";

const orderItems = [
  { name: "Mì Hảo Hảo - Tôm chua cay", qty: 10, price: 5000 },
  { name: "Coca-Cola - Lon 330ml", qty: 6, price: 10000 },
  { name: "Sữa Vinamilk - Hộp 1L", qty: 2, price: 32000 },
];

const paymentMethods = [
  { id: "cash", label: "Tiền mặt khi nhận", icon: Banknote, desc: "COD — hóa đơn lập ngay khi xác nhận" },
  { id: "bank_transfer", label: "Chuyển khoản ngân hàng", icon: CreditCard, desc: "Tạo đơn chờ — admin xác nhận sau khi nhận tiền" },
  { id: "momo", label: "Ví MoMo", icon: Smartphone, desc: "Quét QR — admin xác nhận thanh toán" },
  { id: "zalopay", label: "ZaloPay", icon: Smartphone, desc: "Quét QR — admin xác nhận thanh toán" },
] as const;

type PaymentId = (typeof paymentMethods)[number]["id"];

const EMPTY_ADDR: AddressSelectValue = {
  provinceCode: "",
  provinceName: "",
  districtCode: "",
  districtName: "",
  wardCode: "",
  wardName: "",
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentId>("cash");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [note, setNote] = useState("");
  const [addr, setAddr] = useState<AddressSelectValue>(EMPTY_ADDR);

  const subtotal = useMemo(
    () => orderItems.reduce((s, i) => s + i.price * i.qty, 0),
    []
  );

  const [quote, setQuote] = useState<ShippingQuote>({ status: "incomplete" });
  const [quoting, setQuoting] = useState(false);

  // Build canonical ShippingAddress (or null if incomplete) and quote on change.
  const shippingAddress: ShippingAddress | null = useMemo(() => {
    if (!addr.provinceCode || !addr.districtCode || !addr.wardCode) return null;
    return {
      receiverName: name.trim(),
      phone: phone.trim(),
      provinceCode: addr.provinceCode,
      provinceName: addr.provinceName,
      districtCode: addr.districtCode,
      districtName: addr.districtName,
      wardCode: addr.wardCode,
      wardName: addr.wardName,
      street: street.trim(),
      note: note.trim() || undefined,
    };
  }, [addr, name, phone, street, note]);

  useEffect(() => {
    let cancel = false;
    if (!shippingAddress) {
      setQuote({ status: "incomplete" });
      setQuoting(false);
      return;
    }
    setQuoting(true);
    const t = setTimeout(async () => {
      const result = await shipping.quote({ address: shippingAddress, subtotal });
      if (!cancel) {
        setQuote(result);
        setQuoting(false);
      }
    }, 350);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [shippingAddress, subtotal]);

  const shippingFee = quote.status === "quoted" ? quote.fee ?? 0 : 0;
  const total = subtotal + shippingFee;
  const isOnline = payment !== "cash";

  const phoneOk = /^[\d+]{9,12}$/.test(phone.replace(/\s/g, ""));
  const canSubmit =
    name.trim().length > 0 &&
    phoneOk &&
    quote.status === "quoted" &&
    !submitting;

  const submit = async () => {
    if (!name.trim() || !phoneOk) {
      toast.error("Vui lòng nhập đầy đủ họ tên và SĐT hợp lệ");
      return;
    }
    if (quote.status !== "quoted" || !shippingAddress) {
      toast.error("Vui lòng nhập đầy đủ địa chỉ để tính phí giao hàng");
      return;
    }
    setSubmitting(true);
    try {
      if (isOnline) {
        const lines: PendingOrderLine[] = orderItems.map((it, i) => ({
          id: `tmp-${i}`,
          productId: "",
          variantId: "",
          productName: it.name,
          qty: it.qty,
          unitPrice: it.price,
          lineSubtotal: it.qty * it.price,
        }));
        const order = await pendingOrders.create({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          shippingAddress,
          paymentMethod: payment as PaymentMethod,
          paymentReference: "",
          lines,
          shippingQuoteSnapshot: {
            source: quote.source ?? "zone_fallback",
            zoneCode: quote.zoneCode,
            fee: shippingFee,
            etaDays: quote.etaDays,
          },
          pricingBreakdownSnapshot: {
            subtotal,
            manualDiscount: 0,
            promotionDiscount: 0,
            voucherDiscount: 0,
            shippingFee,
            shippingDiscount: 0,
            vat: 0,
            total,
          },
          note: note.trim() || undefined,
        });
        toast.success("Đã tạo đơn — chuyển sang trang chờ thanh toán");
        navigate(`/pending-payment/${order.id}`);
      } else {
        // Cash / COD — create invoice immediately (legacy invoice store still in use)
        const inv = invoiceActions.create({
          number: `HD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 900 + 100)}`,
          date: new Date().toISOString(),
          customerId: "",
          customerName: name.trim(),
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
                <Field label="Họ và tên *" value={name} onChange={setName} placeholder="Nguyễn Văn A" />
                <Field label="Số điện thoại *" value={phone} onChange={setPhone} placeholder="0901234567" />
              </div>
              <AddressSelect value={addr} onChange={setAddr} className="mt-3.5" />
              <div className="mt-3.5">
                <Field label="Số nhà, đường" value={street} onChange={setStreet} placeholder="VD: 12 Lê Lợi" />
              </div>
              <div className="mt-3.5">
                <label className="text-xs font-semibold text-muted-foreground">Ghi chú đơn hàng</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú thêm (tùy chọn)"
                  rows={2}
                  className="mt-1.5 w-full px-3.5 py-2.5 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none"
                />
              </div>

              <ShippingBlock quote={quote} loading={quoting} />
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
                    quoting ? <span className="text-muted-foreground inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Đang tính…</span> :
                    quote.status === "incomplete" ? <span className="text-muted-foreground">—</span> :
                    quote.status === "unavailable" ? <span className="text-danger">Không khả dụng</span> :
                    quote.status === "quoted" && shippingFee === 0 ? <span className="text-success">Miễn phí</span> :
                    quote.status === "quoted" ? formatVND(shippingFee) : "—"
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

function ShippingBlock({ quote, loading }: { quote: ShippingQuote; loading: boolean }) {
  if (loading) {
    return (
      <div className="mt-4 p-3 rounded-xl bg-muted/50 text-xs flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tính phí giao hàng…
      </div>
    );
  }
  if (quote.status === "incomplete") {
    return (
      <div className="mt-4 p-3 rounded-xl bg-warning-soft text-xs text-warning flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>Vui lòng chọn đầy đủ Tỉnh / Quận / Phường để tính phí giao hàng.</span>
      </div>
    );
  }
  if (quote.status === "unavailable") {
    return (
      <div className="mt-4 p-3 rounded-xl bg-danger-soft text-xs text-danger flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>Không thể giao đến địa chỉ này: {quote.reasonIfUnavailable}</span>
      </div>
    );
  }
  if (quote.status === "quoted") {
    const eta = quote.etaDays;
    return (
      <div className="mt-4 p-3 rounded-xl bg-success-soft text-xs text-success flex items-start gap-2">
        <Truck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          {quote.zoneCode ? <>Khu vực <b>{quote.zoneCode}</b> · </> : null}
          {eta ? <>Dự kiến giao trong <b>{eta.min}–{eta.max} ngày</b> · </> : null}
          {quote.fee === 0 ? <b>Miễn phí giao hàng</b> : <>Phí: <b>{formatVND(quote.fee ?? 0)}</b></>}
        </span>
      </div>
    );
  }
  return null;
}
