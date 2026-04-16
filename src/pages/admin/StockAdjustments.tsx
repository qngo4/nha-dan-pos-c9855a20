import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar, FilterChip } from "@/components/shared/DataTableToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { stockAdjustments } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { Plus, ClipboardCheck, Eye, Pencil, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminStockAdjustments() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filtered = stockAdjustments.filter(a => {
    if (search && !a.code.toLowerCase().includes(search.toLowerCase()) && !a.reason.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Kiểm kho / Điều chỉnh"
        description={`${stockAdjustments.length} phiếu`}
        actions={
          <Link to="/admin/stock-adjustments/create" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
            <Plus className="h-3.5 w-3.5" /> Tạo phiếu điều chỉnh
          </Link>
        }
      />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm mã phiếu, lý do..."
        filters={<>
          <FilterChip label="Tất cả" active={!filterStatus} onClick={() => setFilterStatus(null)} />
          <FilterChip label="Nháp" active={filterStatus === 'draft'} onClick={() => setFilterStatus('draft')} />
          <FilterChip label="Đã xác nhận" active={filterStatus === 'confirmed'} onClick={() => setFilterStatus('confirmed')} />
        </>}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Chưa có phiếu điều chỉnh" description="Tạo phiếu kiểm kho đầu tiên" />
      ) : (
        <>
          <div className="hidden md:block bg-card rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mã phiếu</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ngày tạo</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Lý do</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Ghi chú</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Mặt hàng</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Trạng thái</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", a.status === 'draft' && "bg-info-soft/30")}>
                    <td className="px-3 py-2.5 font-mono text-xs font-medium">{a.code}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{formatDate(a.createdDate)}</td>
                    <td className="px-3 py-2.5">{a.reason}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs max-w-[200px] truncate hidden lg:table-cell">{a.note}</td>
                    <td className="px-3 py-2.5 text-center">{a.itemCount}</td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusBadge status={a.status === 'draft' ? 'draft' : 'confirmed'} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === 'draft' ? (
                          <Link to={`/admin/stock-adjustments/create`} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></Link>
                        ) : (
                          <button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"><Eye className="h-3.5 w-3.5" /></button>
                        )}
                        {a.status === 'confirmed' && <Lock className="h-3 w-3 text-muted-foreground/50" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {filtered.map(a => (
              <div key={a.id} className={cn("bg-card rounded-lg border p-3", a.status === 'draft' && "border-info/30")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-medium">{a.code}</p>
                    <p className="text-xs text-muted-foreground">{a.reason} · {formatDate(a.createdDate)}</p>
                  </div>
                  <StatusBadge status={a.status === 'draft' ? 'draft' : 'confirmed'} />
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
                  <span>{a.itemCount} mặt hàng</span>
                  <span className="truncate max-w-[150px]">{a.note}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
