import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SupplierFormDrawer } from "@/components/shared/SupplierFormDrawer";
import { useStore, supplierActions } from "@/lib/store";
import { Plus, Truck, Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Supplier } from "@/lib/mock-data";

export default function AdminSuppliers() {
  const { suppliers } = useStore();
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const filtered = useMemo(() => suppliers.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
  ), [suppliers, search]);

  const openAdd = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setDrawerOpen(true); setOpenMenu(null); };

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Nhà cung cấp"
        description={`${suppliers.length} nhà cung cấp`}
        actions={<button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover"><Plus className="h-3.5 w-3.5" /> Thêm NCC</button>}
      />

      <DataTableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Tìm tên, mã, SĐT..." />

      {filtered.length === 0 ? (
        <EmptyState icon={Truck} title="Không tìm thấy nhà cung cấp" />
      ) : (
        <>
          <div className="hidden md:block bg-card rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nhà cung cấp</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mã</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">SĐT</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Mã số thuế</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden xl:table-cell">Địa chỉ</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Trạng thái</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">{s.email}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{s.code}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.phone}</td>
                    <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell">{s.taxCode}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs hidden xl:table-cell max-w-[200px] truncate">{s.address}</td>
                    <td className="px-3 py-2.5 text-center"><StatusBadge status={s.active ? 'active' : 'inactive'} /></td>
                    <td className="px-3 py-2.5 relative">
                      <button onClick={() => setOpenMenu(openMenu === s.id ? null : s.id)} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                      {openMenu === s.id && (
                        <div className="absolute right-2 top-full mt-1 w-40 bg-popover border rounded-md shadow-lg z-20">
                          <button onClick={() => openEdit(s)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted text-left"><Pencil className="h-3 w-3" /> Sửa</button>
                          <button onClick={() => { supplierActions.update(s.id, { active: !s.active }); setOpenMenu(null); toast.success(s.active ? "Đã ngưng hoạt động" : "Đã kích hoạt lại"); }} className="w-full px-3 py-1.5 text-xs hover:bg-muted text-left">{s.active ? "Ngưng hoạt động" : "Kích hoạt"}</button>
                          <button onClick={() => { setDeleting(s); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-danger-soft text-danger text-left"><Trash2 className="h-3 w-3" /> Xóa</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {filtered.map(s => (
              <div key={s.id} className="bg-card rounded-lg border p-3" onClick={() => openEdit(s)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-sm">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.code} · {s.phone}</p>
                    {s.note && <p className="text-xs text-muted-foreground mt-0.5">{s.note}</p>}
                  </div>
                  <StatusBadge status={s.active ? 'active' : 'inactive'} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{s.address}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <SupplierFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} supplier={editing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { supplierActions.remove(deleting.id); toast.success("Đã xóa nhà cung cấp"); } }}
        title="Xóa nhà cung cấp?"
        description={`Bạn chắc chắn muốn xóa "${deleting?.name}"?`}
        variant="danger"
        confirmLabel="Xóa"
      />
    </div>
  );
}
