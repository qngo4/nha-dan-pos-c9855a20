import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { categories } from "@/lib/mock-data";
import { Plus, Pencil, X, FolderTree, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminCategories() {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Danh mục"
        description={`${categories.length} danh mục`}
        actions={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors">
            <Plus className="h-3.5 w-3.5" /> Thêm danh mục
          </button>
        }
      />

      <DataTableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Tìm danh mục..." />

      {/* Create form */}
      {showCreate && (
        <div className="bg-card rounded-lg border p-4 animate-fade-in">
          <h3 className="font-semibold text-sm mb-3">Tạo danh mục mới</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tên danh mục</label>
              <input placeholder="VD: Thực phẩm khô" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Mô tả</label>
              <input placeholder="Mô tả ngắn gọn" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md"><Check className="h-3 w-3" /> Lưu</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted">Hủy</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={FolderTree} title="Chưa có danh mục" description="Tạo danh mục đầu tiên để phân loại sản phẩm" />
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tên danh mục</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">Mô tả</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Sản phẩm</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground">Trạng thái</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(cat => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-medium">{cat.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{cat.description}</td>
                  <td className="px-3 py-2.5 text-center">{cat.productCount}</td>
                  <td className="px-3 py-2.5 text-center">
                    <StatusBadge status={cat.active ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
