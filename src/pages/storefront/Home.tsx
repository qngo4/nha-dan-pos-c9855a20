import { Link } from "react-router-dom";
import { Search, ShoppingCart, ChevronRight, Package, Star, Flame, Tag } from "lucide-react";
import { products, combos, categories } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

function getStockStatus(stock: number, minStock: number) {
  if (stock === 0) return 'out-of-stock' as const;
  if (stock <= minStock) return 'low-stock' as const;
  return 'in-stock' as const;
}

function ProductCard({ product }: { product: typeof products[0] }) {
  const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
  const stockStatus = getStockStatus(defaultVariant.stock, defaultVariant.minStock);
  const hasMultipleVariants = product.variants.length > 1;
  const minPrice = Math.min(...product.variants.map(v => v.sellPrice));

  return (
    <Link to={`/products/${product.id}`} className="group block bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="aspect-square bg-muted relative overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <Package className="h-10 w-10 text-muted-foreground/40" />
        </div>
        {stockStatus !== 'in-stock' && (
          <div className="absolute top-2 left-2">
            <StatusBadge status={stockStatus} />
          </div>
        )}
        <button
          className="absolute bottom-2 right-2 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          onClick={(e) => { e.preventDefault(); }}
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground">{product.categoryName}</p>
        <h3 className="font-medium text-sm mt-0.5 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <p className="font-bold text-primary text-sm">
            {hasMultipleVariants ? `Từ ${formatVND(minPrice)}` : formatVND(defaultVariant.sellPrice)}
          </p>
          {hasMultipleVariants && (
            <span className="text-[10px] text-muted-foreground">{product.variants.length} phân loại</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ComboCard({ combo }: { combo: typeof combos[0] }) {
  return (
    <Link to={`/combos/${combo.id}`} className="group block bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="aspect-[4/3] bg-gradient-to-br from-accent-soft to-primary-soft relative overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <Tag className="h-10 w-10 text-accent/40" />
        </div>
        {combo.derivedStock <= 0 && (
          <div className="absolute top-2 left-2">
            <StatusBadge status="out-of-stock" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <StatusBadge status="active" label="Combo" size="sm" />
        </div>
        <h3 className="font-medium text-sm mt-1 group-hover:text-primary transition-colors">{combo.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{combo.components.length} sản phẩm</p>
        <p className="font-bold text-primary text-sm mt-1.5">{formatVND(combo.price)}</p>
      </div>
    </Link>
  );
}

export default function StorefrontHome() {
  const activeCategories = categories.filter(c => c.active);
  const activeProducts = products.filter(p => p.active);

  return (
    <div className="storefront-relaxed">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-16">
          <div className="max-w-lg">
            <h1 className="text-2xl md:text-4xl font-bold">Chào mừng đến NhaDanShop</h1>
            <p className="mt-2 text-sm md:text-base opacity-90">
              Mua sắm nhanh chóng, tiện lợi. Hàng ngàn sản phẩm chất lượng với giá tốt nhất.
            </p>
            <div className="mt-4 flex gap-2">
              <Link to="/products" className="inline-flex items-center gap-1.5 bg-card text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-card/90 transition-colors">
                Xem sản phẩm <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-4 -mt-4 relative z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Tìm sản phẩm..."
            className="w-full h-10 pl-10 pr-4 text-sm bg-card rounded-lg border shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
            Tất cả
          </button>
          {activeCategories.map(cat => (
            <button key={cat.id} className="shrink-0 px-3 py-1.5 bg-card border text-xs font-medium rounded-full text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              {cat.name}
            </button>
          ))}
        </div>

        {/* Hot selling */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-5 w-5 text-accent" />
            <h2 className="font-bold text-lg">Bán chạy</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {activeProducts.slice(0, 5).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Combos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              <h2 className="font-bold text-lg">Combo ưu đãi</h2>
            </div>
            <Link to="/combos" className="text-sm text-primary font-medium hover:underline flex items-center gap-0.5">
              Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {combos.filter(c => c.active).map(combo => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        </section>

        {/* All products */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Tất cả sản phẩm</h2>
            <Link to="/products" className="text-sm text-primary font-medium hover:underline flex items-center gap-0.5">
              Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {activeProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
