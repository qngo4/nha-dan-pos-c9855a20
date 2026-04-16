import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar, FilterChip } from "@/components/shared/DataTableToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { promotions } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";
import { Plus, Tags, Calendar, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  percent: '% giảm giá',
  fixed: 'Giảm cố định',
  'buy-x-get-y': 'Mua X tặng Y',
  gift: 'Quà tặng',
  'free-shipping': 'Miễn phí ship',
};

export default function AdminPromotions() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filtered = promotions.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus === 'active' && !p.active) return false;
    if (filterStatus === 'inactive' && p.active) return false;
    return true;
  });

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Khuyến mãi"
        description={`${promotions.length} chương trình`}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover"><Plus className="h-3.5 w-3.5" /> Tạo khuyến mãi</button>}
      />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm khuyến mãi..."
        filters={<>
          <FilterChip label="Tất cả" active={!filterStatus} onClick={() => setFilterStatus(null)} />
          <FilterChip label="Đang chạy" active={filterStatus === 'active'} onClick={() => setFilterStatus('active')} />
          <FilterChip label="Tạm dừng" active={filterStatus === 'inactive'} onClick={() => setFilterStatus('inactive')} />
        </>}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Tags} title="Chưa có khuyến mãi" description="Tạo chương trình khuyến mãi đầu tiên" />
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="bg-card rounded-lg border p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{p.name}</h3>
                    <StatusBadge status={p.active ? 'active' : 'inactive'} />
                  </div>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-primary-soft text-primary rounded-full">{typeLabels[p.type] || p.type}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-muted-foreground bg-muted rounded-full">
                      <Calendar className="h-3 w-3" /> {formatDate(p.startDate)} — {formatDate(p.endDate)}
                    </span>
                    {p.minOrderValue > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] text-muted-foreground bg-muted rounded-full">Đơn tối thiểu: {formatVND(p.minOrderValue)}</span>
                    )}
                    {p.maxDiscount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] text-muted-foreground bg-muted rounded-full">Giảm tối đa: {formatVND(p.maxDiscount)}</span>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] text-muted-foreground bg-muted rounded-full">
                      Phạm vi: {p.scope === 'all' ? 'Toàn bộ' : p.scope === 'categories' ? 'Danh mục' : 'Sản phẩm'}
                    </span>
                  </div>
                </div>
                <button className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted shrink-0"><Pencil className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
