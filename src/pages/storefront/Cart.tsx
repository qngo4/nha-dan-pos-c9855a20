import { useState } from "react";
import { Link } from "react-router-dom";
import { formatVND } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  Package,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

interface CartItemData {
  id: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  stock: number;
}

const mockCart: CartItemData[] = [
  { id: "1", productName: "Mì Hảo Hảo", variantName: "Tôm chua cay", price: 5000, quantity: 10, stock: 245 },
  { id: "2", productName: "Coca-Cola", variantName: "Lon 330ml", price: 10000, quantity: 6, stock: 180 },
  { id: "3", productName: "Sữa Vinamilk 100%", variantName: "Hộp 1L", price: 32000, quantity: 2, stock: 8 },
  { id: "4", productName: "Giấy vệ sinh Pulppy", variantName: "Gói 6 cuộn", price: 55000, quantity: 2, stock: 3 },
];

export default function CartPage() {
  const [items, setItems] = useState(mockCart);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  const updateQty = (id: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Đã xóa sản phẩm");
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = appliedCoupon?.discount ?? 0;
  const shipping = subtotal >= 200000 ? 0 : 20000;
  const total = Math.max(0, subtotal - discount + shipping);
  const hasStockIssue = items.some((i) => i.quantity > i.stock);
  const freeShippingGap = Math.max(0, 200000 - subtotal);

  const applyCoupon = () => {
    if (!coupon.trim()) return toast.error("Nhập mã giảm giá");
    if (coupon.toUpperCase() === "NHADAN10") {
      const d = Math.floor(subtotal * 0.1);
      setAppliedCoupon({ code: "NHADAN10", discount: d });
      toast.success(`Áp dụng giảm ${formatVND(d)}`);
    } else {
      toast.error("Mã giảm giá không hợp lệ");
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Giỏ hàng đang trống"
          description="Hãy khám phá hàng nghìn sản phẩm chất lượng tại NhaDanShop"
          action={
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary transition-colors"
            >
              Mua sắm ngay <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-storefront-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-5">
          <p className="sf-eyebrow">Giỏ hàng</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
            Giỏ của bạn ({items.length})
          </h1>
        </div>

        {/* Free shipping progress */}
        {freeShippingGap > 0 && (
          <div className="mb-5 p-3 rounded-xl bg-primary-soft border border-primary/20 flex items-center gap-3">
            <Truck className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs">
                Mua thêm <span className="font-bold text-primary">{formatVND(freeShippingGap)}</span> để được{" "}
                <span className="font-bold">miễn phí giao hàng</span>
              </p>
              <div className="mt-1.5 h-1.5 bg-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, (subtotal / 200000) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const overStock = item.quantity > item.stock;
              const lowStock = item.stock <= 5;
              return (
                <div
                  key={item.id}
                  className={`bg-storefront-surface rounded-2xl border p-4 flex gap-3.5 sf-shadow ${
                    overStock ? "border-danger/50" : ""
                  }`}
                >
                  <div className="h-20 w-20 bg-gradient-to-br from-muted to-storefront-soft rounded-xl flex items-center justify-center shrink-0">
                    <Package className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-tight">{item.productName}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>
                        <p className="text-sm font-bold text-foreground mt-1">{formatVND(item.price)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-danger shrink-0 p-1 -m-1"
                        aria-label="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {overStock && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-danger">
                        <AlertTriangle className="h-3 w-3" />
                        Chỉ còn {item.stock} sản phẩm trong kho
                      </div>
                    )}
                    {!overStock && lowStock && (
                      <div className="mt-1.5">
                        <StatusBadge status="low-stock" label={`Còn ${item.stock}`} />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(v) => updateQty(item.id, v)}
                        max={item.stock}
                        size="sm"
                      />
                      <p className="font-bold text-base text-foreground">
                        {formatVND(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Coupon */}
            <div className="bg-storefront-surface rounded-2xl border p-4 sf-shadow">
              <div className="flex items-center gap-2 mb-2.5">
                <Tag className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Mã giảm giá</p>
              </div>
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Nhập mã (vd: NHADAN10)"
                  className="flex-1 h-10 px-3.5 text-sm bg-background rounded-full border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
                <button
                  onClick={applyCoupon}
                  className="px-5 h-10 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-primary transition-colors"
                >
                  Áp dụng
                </button>
              </div>
              {appliedCoupon && (
                <p className="mt-2 text-xs text-success font-medium">
                  ✓ Đã áp dụng <span className="font-mono">{appliedCoupon.code}</span> — giảm{" "}
                  {formatVND(appliedCoupon.discount)}
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-5 lg:mt-0">
            <div className="bg-storefront-surface rounded-2xl border p-5 lg:sticky lg:top-20 sf-shadow">
              <h2 className="font-bold text-base mb-4">Tóm tắt đơn hàng</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính ({items.length} sản phẩm)</span>
                  <span className="font-semibold">{formatVND(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Giảm giá</span>
                    <span className="font-semibold">−{formatVND(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí giao hàng</span>
                  <span className="font-semibold">
                    {shipping === 0 ? <span className="text-success">Miễn phí</span> : formatVND(shipping)}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between items-baseline">
                  <span className="font-semibold">Tổng cộng</span>
                  <span className="font-bold text-foreground text-xl">{formatVND(total)}</span>
                </div>
              </div>

              {hasStockIssue && (
                <div className="mt-4 p-3 bg-danger-soft rounded-xl text-xs text-danger flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>Một số sản phẩm vượt quá tồn kho. Vui lòng điều chỉnh để tiếp tục.</span>
                </div>
              )}

              <Link
                to={hasStockIssue ? "#" : "/checkout"}
                onClick={(e) => hasStockIssue && e.preventDefault()}
                className={`mt-5 w-full flex items-center justify-center gap-2 h-12 rounded-full text-sm font-semibold transition-all ${
                  hasStockIssue
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-storefront-accent text-white hover:opacity-90 sf-shadow-cta"
                }`}
              >
                Tiến hành thanh toán <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/products"
                className="mt-2 w-full flex items-center justify-center text-xs text-muted-foreground hover:text-foreground py-2"
              >
                ← Tiếp tục mua sắm
              </Link>

              <div className="mt-4 pt-4 border-t flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                Thanh toán bảo mật · Đổi trả 7 ngày
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
