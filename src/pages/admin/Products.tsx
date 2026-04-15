import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { products, categories } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";
import { useState } from "react";
import { Search, Plus, Filter, Package, MoreHorizontal, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

function getStockSignal(product: typeof products[0]) {
  const hasOutOfStock = product.variants.some(v => v.stock === 0);
  const hasLowStock = product.variants.some(v => v.stock > 0 && v.stock <= v.minStock);
  if (hasOutOfStock) return 'out-of-stock' as const;
  if (hasLowStock) return 'low-stock' as const;
  return 'in-stock' as const;
}

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && p.categoryId !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Sản phẩm"
        description={`${products.length} sản phẩm`}
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted transition-colors">
              <Upload className="h-3.5 w-3.5" /> Nhập Excel
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors">
              <Plus className="h-3.5 w-3.5" /> Thêm sản phẩm
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, mã sản phẩm..."
            className="w-full h-8 pl-9 pr-3 text-sm bg-card rounded-md border focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setFilterCategory(null)} className={cn("shrink-0 px-2.5 py-1 text-xs font-medium rounded-md border", !filterCategory ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>
            Tất cả
          </button>
          {categories.filter(c => c.active).map(cat => (
            <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={cn("shrink-0 px-2.5 py-1 text-xs font-medium rounded-md border", filterCategory === cat.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Sản phẩm</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mã</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Danh mục</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Phân loại</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Tồn kho</th>
              <th className="text-center px-3 py-2 font-medium text-muted-foreground">Trạng thái</th>
              <th className="text-right px-3 py-2 font-medium text-muted-foreground">Giá bán</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => {
              const stockSignal = getStockSignal(product);
              const dv = product.variants.find(v => v.isDefault) || product.variants[0];
              const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 bg-muted rounded-md flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs">{product.code}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{product.categoryName}</td>
                  <td className="px-3 py-2.5 text-center">{product.variants.length}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-medium">{totalStock}</span>
                      <StatusBadge status={stockSignal} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <StatusBadge status={product.active ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium">{formatVND(dv.sellPrice)}</td>
                  <td className="px-3 py-2.5">
                    <button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.map(product => {
          const stockSignal = getStockSignal(product);
          const dv = product.variants.find(v => v.isDefault) || product.variants[0];
          const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
          return (
            <div key={product.id} className="bg-card rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.code} · {product.categoryName}</p>
                  </div>
                </div>
                <StatusBadge status={product.active ? 'active' : 'inactive'} />
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <StatusBadge status={stockSignal} label={`Tồn: ${totalStock}`} />
                  <span className="text-xs text-muted-foreground">{product.variants.length} phân loại</span>
                </div>
                <span className="font-bold text-sm text-primary">{formatVND(dv.sellPrice)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
