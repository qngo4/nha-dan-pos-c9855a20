import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { combos } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";
import { Plus, Layers, Package, Pencil, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminCombos() {
  const [search, setSearch] = useState('');
  const filtered = combos.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Combo"
        description={`${combos.length} combo`}
        actions={
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
            <Plus className="h-3.5 w-3.5" /> Tạo combo
          </button>
        }
      />

      <div className="flex items-center gap-2 p-2.5 bg-info-soft rounded-lg text-xs text-info">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>Combo không có tồn kho riêng. Tồn kho combo được tính từ sản phẩm thành phần.</span>
      </div>

      <DataTableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Tìm combo..." />

      {filtered.length === 0 ? (
        <EmptyState icon={Layers} title="Chưa có combo" description="Tạo combo để bán gộp nhiều sản phẩm" />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Combo</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mã</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Thành phần</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Tồn kho</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Giá combo</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Trạng thái</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(combo => {
                  const hasLowComponent = combo.components.some(c => c.stock < 10);
                  return (
                    <tr key={combo.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", combo.derivedStock === 0 && "bg-danger-soft/30")}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-accent-soft rounded-md flex items-center justify-center shrink-0"><Layers className="h-4 w-4 text-accent" /></div>
                          <span className="font-medium">{combo.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{combo.code}</td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>{combo.components.length} SP</span>
                          {hasLowComponent && <AlertTriangle className="h-3 w-3 text-warning" />}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge status={combo.derivedStock === 0 ? 'out-of-stock' : combo.derivedStock <= 5 ? 'low-stock' : 'in-stock'} label={`${combo.derivedStock}`} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium">{formatVND(combo.price)}</td>
                      <td className="px-3 py-2.5 text-center"><StatusBadge status={combo.active ? 'active' : 'inactive'} /></td>
                      <td className="px-3 py-2.5"><button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map(combo => (
              <div key={combo.id} className="bg-card rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-sm">{combo.name}</h3>
                    <p className="text-xs text-muted-foreground">{combo.code} · {combo.components.length} sản phẩm</p>
                  </div>
                  <StatusBadge status={combo.active ? 'active' : 'inactive'} />
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={combo.derivedStock === 0 ? 'out-of-stock' : combo.derivedStock <= 5 ? 'low-stock' : 'in-stock'} label={`Tồn: ${combo.derivedStock}`} />
                    <span className="font-bold text-sm text-primary">{formatVND(combo.price)}</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {combo.components.map((c, i) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" /> {c.productName} - {c.variantName} × {c.quantity}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
