import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar, FilterChip } from "@/components/shared/DataTableToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { promotions as initialPromotions, type Promotion } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";
import { Plus, Tags, Calendar, Pencil, X, Trash2, Power } from "lucide-react";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  percent: '% giảm giá',
  fixed: 'Giảm cố định',
  'buy-x-get-y': 'Mua X tặng Y',
  gift: 'Quà tặng',
  'free-shipping': 'Miễn phí ship',
};

const emptyForm: Promotion = {
  id: '',
  name: '',
  description: '',
  type: 'percent',
  active: true,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  minOrderValue: 0,
  maxDiscount: 0,
  discountValue: 10,
  scope: 'all',
  scopeIds: [],
};

export default function AdminPromotions() {
  const [promoList, setPromoList] = useState<Promotion[]>(initialPromotions);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = promoList.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus === 'active' && !p.active) return false;
    if (filterStatus === 'inactive' && p.active) return false;
    return true;
  });

  const handleSave = (promo: Promotion) => {
    if (!promo.name.trim()) {
      toast.error('Vui lòng nhập tên khuyến mãi');
      return;
    }
    if (promo.id) {
      setPromoList(prev => prev.map(p => p.id === promo.id ? promo : p));
      toast.success(`Đã cập nhật "${promo.name}"`);
    } else {
      const newPromo = { ...promo, id: `promo-${Date.now()}` };
      setPromoList(prev => [newPromo, ...prev]);
      toast.success(`Đã tạo "${promo.name}"`);
    }
    setEditing(null);
  };

  const toggleActive = (id: string) => {
    setPromoList(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    const p = promoList.find(x => x.id === id);
    toast.success(`Đã ${p?.active ? 'tạm dừng' : 'kích hoạt'} "${p?.name}"`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const p = promoList.find(x => x.id === deleteTarget);
    setPromoList(prev => prev.filter(x => x.id !== deleteTarget));
    toast.success(`Đã xóa "${p?.name}"`);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Khuyến mãi"
        description={`${promoList.length} chương trình`}
        actions={
          <button onClick={() => setEditing({ ...emptyForm })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
            <Plus className="h-3.5 w-3.5" /> Tạo khuyến mãi
          </button>
        }
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
        <EmptyState
          icon={Tags}
          title="Chưa có khuyến mãi"
          description="Tạo chương trình khuyến mãi đầu tiên"
          action={<button onClick={() => setEditing({ ...emptyForm })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover"><Plus className="h-3.5 w-3.5" /> Tạo khuyến mãi</button>}
        />
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
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(p.id)} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title={p.active ? 'Tạm dừng' : 'Kích hoạt'}>
                    <Power className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditing({ ...p })} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="Sửa">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(p.id)} className="p-1.5 text-muted-foreground hover:text-danger rounded hover:bg-muted" title="Xóa">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <PromotionForm promo={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa khuyến mãi?"
        description="Khuyến mãi sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác."
        confirmLabel="Xóa"
        variant="danger"
      />
    </div>
  );
}

function PromotionForm({ promo, onClose, onSave }: { promo: Promotion; onClose: () => void; onSave: (p: Promotion) => void }) {
  const [form, setForm] = useState<Promotion>(promo);
  const isEdit = !!promo.id;

  const update = <K extends keyof Promotion>(key: K, val: Promotion[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l shadow-xl flex flex-col animate-slide-in-right">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-base">{isEdit ? 'Sửa khuyến mãi' : 'Tạo khuyến mãi'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Field label="Tên khuyến mãi *">
            <input value={form.name} onChange={e => update('name', e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="VD: Khuyến mãi cuối tuần" />
          </Field>

          <Field label="Mô tả">
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Mô tả ngắn gọn..." />
          </Field>

          <Field label="Loại khuyến mãi">
            <select value={form.type} onChange={e => update('type', e.target.value as Promotion['type'])} className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background">
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>

          {(form.type === 'percent' || form.type === 'fixed') && (
            <Field label={form.type === 'percent' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VND)'}>
              <input type="number" value={form.discountValue} onChange={e => update('discountValue', Number(e.target.value))} className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bắt đầu">
              <input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
            </Field>
            <Field label="Kết thúc">
              <input type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Đơn tối thiểu (VND)">
              <input type="number" value={form.minOrderValue} onChange={e => update('minOrderValue', Number(e.target.value))} className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
            </Field>
            <Field label="Giảm tối đa (VND)">
              <input type="number" value={form.maxDiscount} onChange={e => update('maxDiscount', Number(e.target.value))} className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
            </Field>
          </div>

          <Field label="Phạm vi áp dụng">
            <div className="flex gap-2">
              {([
                { v: 'all', l: 'Toàn bộ' },
                { v: 'categories', l: 'Danh mục' },
                { v: 'products', l: 'Sản phẩm' },
              ] as const).map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => update('scope', opt.v)}
                  className={`flex-1 h-9 text-xs font-medium rounded-md border transition-colors ${form.scope === opt.v ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </Field>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => update('active', e.target.checked)} className="h-4 w-4 rounded border-input" />
            <span className="text-sm">Kích hoạt ngay</span>
          </label>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button onClick={onClose} className="flex-1 px-3 py-2 text-sm border rounded-md hover:bg-muted">Hủy</button>
          <button onClick={() => onSave(form)} className="flex-1 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
            {isEdit ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
