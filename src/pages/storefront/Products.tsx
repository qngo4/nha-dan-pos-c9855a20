import { Link } from "react-router-dom";
import { products, categories } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Package, ShoppingCart, SlidersHorizontal, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function getStockStatus(stock: number, minStock: number) {
  if (stock === 0) return 'out-of-stock' as const;
  if (stock <= minStock) return 'low-stock' as const;
  return 'in-stock' as const;
}

export default function StorefrontProducts() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const activeCategories = categories.filter(c => c.active);
  const activeProducts = products.filter(p => p.active).filter(p => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1">
          <h1 className="text-xl font-bold">Sản phẩm</h1>
          <p className="text-sm text-muted-foreground">{activeProducts.length} sản phẩm</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên..."
            className="w-full h-9 pl-9 pr-3 text-sm bg-card rounded-md border focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
            !selectedCategory ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground hover:border-primary hover:text-primary"
          )}
        >
          Tất cả
        </button>
        {activeCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground hover:border-primary hover:text-primary"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {activeProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium">Không tìm thấy sản phẩm</p>
          <p className="text-sm text-muted-foreground mt-1">Thử thay đổi bộ lọc hoặc từ khóa</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {activeProducts.map(product => {
            const dv = product.variants.find(v => v.isDefault) || product.variants[0];
            const stockStatus = getStockStatus(dv.stock, dv.minStock);
            const minPrice = Math.min(...product.variants.map(v => v.sellPrice));
            return (
              <Link key={product.id} to={`/products/${product.id}`} className="group bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-all">
                <div className="aspect-square bg-muted relative">
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  {stockStatus !== 'in-stock' && (
                    <div className="absolute top-2 left-2"><StatusBadge status={stockStatus} /></div>
                  )}
                  <button className="absolute bottom-2 right-2 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" onClick={e => e.preventDefault()}>
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                  <h3 className="font-medium text-sm mt-0.5 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="font-bold text-primary text-sm mt-1.5">
                    {product.variants.length > 1 ? `Từ ${formatVND(minPrice)}` : formatVND(dv.sellPrice)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
