import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import { formatVND } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Gift, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function StorefrontCombos() {
  const { combos } = useStore();
  const active = combos.filter((c) => c.active);

  if (active.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          icon={Gift}
          title="Chưa có combo khuyến mãi"
          description="Các combo ưu đãi sẽ được cập nhật sớm."
          action={
            <Link to="/products" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
              Xem sản phẩm
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" /> Combo ưu đãi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{active.length} combo đang khuyến mãi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((combo) => {
          const componentTotal = combo.components.reduce(
            (sum, c) => sum + (c.quantity || 0) * 0,
            0
          );
          const stockStatus = combo.derivedStock === 0 ? "out-of-stock" : combo.derivedStock <= 5 ? "low-stock" : "in-stock";
          return (
            <div key={combo.id} className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-all">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative">
                <Gift className="h-16 w-16 text-primary/40" />
                {stockStatus !== "in-stock" && (
                  <div className="absolute top-2 left-2">
                    <StatusBadge status={stockStatus} />
                  </div>
                )}
                <span className="absolute top-2 right-2 text-[10px] font-mono bg-background/80 backdrop-blur px-2 py-0.5 rounded">
                  {combo.code}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-base line-clamp-1">{combo.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {combo.components.length} sản phẩm · Còn {combo.derivedStock} combo
                </p>

                <ul className="mt-3 space-y-1 max-h-24 overflow-y-auto">
                  {combo.components.slice(0, 4).map((c, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Package className="h-3 w-3 shrink-0" />
                      <span className="line-clamp-1">
                        {c.productName} {c.variantName ? `· ${c.variantName}` : ""}
                      </span>
                      <span className="ml-auto font-medium text-foreground">×{c.quantity}</span>
                    </li>
                  ))}
                  {combo.components.length > 4 && (
                    <li className="text-xs text-muted-foreground italic">
                      +{combo.components.length - 4} sản phẩm khác
                    </li>
                  )}
                </ul>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-primary">{formatVND(combo.price)}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (combo.derivedStock === 0) {
                        toast.error("Combo đã hết hàng");
                        return;
                      }
                      toast.success(`Đã thêm combo "${combo.name}" vào giỏ`);
                    }}
                    disabled={combo.derivedStock === 0}
                    className="inline-flex items-center gap-1.5 h-9 px-3 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Thêm vào giỏ
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
