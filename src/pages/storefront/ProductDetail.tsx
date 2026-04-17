import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { products } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { EmptyState } from "@/components/shared/EmptyState";
import { ChevronLeft, Package, ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function getStockStatus(stock: number, minStock: number) {
  if (stock === 0) return "out-of-stock" as const;
  if (stock <= minStock) return "low-stock" as const;
  return "in-stock" as const;
}

export default function StorefrontProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = useMemo(() => products.find((p) => p.id === id), [id]);
  const [variantId, setVariantId] = useState<string | undefined>(
    product?.variants.find((v) => v.isDefault)?.id ?? product?.variants[0]?.id
  );
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          icon={Package}
          title="Không tìm thấy sản phẩm"
          description="Sản phẩm có thể đã bị gỡ hoặc đường dẫn không hợp lệ."
          action={
            <Link to="/products" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
              Quay lại danh sách
            </Link>
          }
        />
      </div>
    );
  }

  const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
  const stockStatus = getStockStatus(variant.stock, variant.minStock);
  const related = products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId && p.active)
    .slice(0, 5);

  const addToCart = () => {
    if (variant.stock === 0) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }
    if (qty > variant.stock) {
      toast.error(`Chỉ còn ${variant.stock} ${variant.sellUnit} trong kho`);
      return;
    }
    toast.success(`Đã thêm ${qty} ${variant.sellUnit} ${product.name} vào giỏ`);
  };

  const buyNow = () => {
    addToCart();
    navigate("/cart");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-4 w-4" /> Quay lại
      </button>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
        {/* Image */}
        <div className="aspect-square bg-card rounded-xl border flex items-center justify-center relative overflow-hidden">
          <Package className="h-24 w-24 text-muted-foreground/30" />
          {stockStatus !== "in-stock" && (
            <div className="absolute top-3 left-3">
              <StatusBadge status={stockStatus} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.categoryName}</p>
          <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">Mã: {product.code}</p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{formatVND(variant.sellPrice)}</span>
            <span className="text-sm text-muted-foreground">/ {variant.sellUnit}</span>
          </div>

          {product.variants.length > 1 && (
            <div className="mt-5">
              <p className="text-sm font-medium mb-2">Phân loại</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md border transition-colors",
                      v.id === variant.id
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {v.name}
                    {v.id === variant.id && <Check className="inline h-3.5 w-3.5 ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <p className="text-sm font-medium mb-2">Số lượng</p>
            <div className="flex items-center gap-3">
              <QuantityStepper value={qty} onChange={setQty} min={1} max={Math.max(1, variant.stock)} />
              <span className="text-sm text-muted-foreground">
                {variant.stock > 0 ? `Còn ${variant.stock} ${variant.sellUnit}` : "Hết hàng"}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={addToCart}
              disabled={variant.stock === 0}
              className="inline-flex items-center justify-center gap-2 h-11 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-4 w-4" /> Thêm vào giỏ
            </button>
            <button
              onClick={buyNow}
              disabled={variant.stock === 0}
              className="inline-flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mua ngay
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t pt-4">
            <div>
              <p className="text-foreground font-medium">Đơn vị bán</p>
              <p>{variant.sellUnit}</p>
            </div>
            <div>
              <p className="text-foreground font-medium">Đơn vị nhập</p>
              <p>
                {variant.importUnit} ({variant.piecesPerImportUnit} {variant.sellUnit})
              </p>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold mb-4">Sản phẩm cùng danh mục</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {related.map((p) => {
              const dv = p.variants.find((v) => v.isDefault) || p.variants[0];
              return (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  className="group bg-card rounded-lg border overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{p.name}</h3>
                    <p className="font-bold text-primary text-sm mt-1.5">{formatVND(dv.sellPrice)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
