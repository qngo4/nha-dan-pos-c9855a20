import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar, FilterChip } from "@/components/shared/DataTableToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { customers } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";
import { Plus, Users, Phone, Mail, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  const filtered = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterGroup && c.group !== filterGroup) return false;
    return true;
  });

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Khách hàng"
        description={`${customers.length} khách hàng`}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover"><Plus className="h-3.5 w-3.5" /> Thêm khách hàng</button>}
      />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm tên, SĐT, mã KH..."
        filters={<>
          <FilterChip label="Tất cả" active={!filterGroup} onClick={() => setFilterGroup(null)} />
          <FilterChip label="VIP" active={filterGroup === 'vip'} onClick={() => setFilterGroup('vip')} />
          <FilterChip label="Sỉ" active={filterGroup === 'wholesale'} onClick={() => setFilterGroup('wholesale')} />
          <FilterChip label="Lẻ" active={filterGroup === 'retail'} onClick={() => setFilterGroup('retail')} />
        </>}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Không tìm thấy khách hàng" description="Thử thay đổi bộ lọc hoặc từ khóa" />
      ) : (
        <>
          <div className="hidden md:block bg-card rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Khách hàng</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mã</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">SĐT</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Nhóm</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Tổng mua</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Đơn hàng</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Trạng thái</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary-soft rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          {c.email && <p className="text-[11px] text-muted-foreground">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{c.code}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.phone}</td>
                    <td className="px-3 py-2.5 text-center"><StatusBadge status={c.group} /></td>
                    <td className="px-3 py-2.5 text-right font-medium">{formatVND(c.totalPurchases)}</td>
                    <td className="px-3 py-2.5 text-center">{c.orderCount}</td>
                    <td className="px-3 py-2.5 text-center"><StatusBadge status={c.active ? 'active' : 'inactive'} /></td>
                    <td className="px-3 py-2.5"><button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="bg-card rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 bg-primary-soft rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0">{c.name.charAt(0)}</div>
                    <div>
                      <h3 className="font-medium text-sm">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.code} · {c.phone}</p>
                    </div>
                  </div>
                  <StatusBadge status={c.group} />
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t text-sm">
                  <span className="text-xs text-muted-foreground">{c.orderCount} đơn hàng</span>
                  <span className="font-bold text-primary">{formatVND(c.totalPurchases)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
