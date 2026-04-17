import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { BlockedActionBanner } from "@/components/shared/BlockedActionBanner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ImportPreviewDialog } from "@/components/shared/ImportPreviewDialog";
import { GoodsReceiptDetailDrawer } from "@/components/shared/GoodsReceiptDetailDrawer";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { goodsReceipts as initialReceipts, type GoodsReceipt } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";
import { useDrafts, draftActions } from "@/lib/drafts";
import { Plus, FileInput, Eye, Trash2, Printer, ShieldAlert, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AdminGoodsReceipts() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>(initialReceipts);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteDraft, setDeleteDraft] = useState<string | null>(null);
  const [detail, setDetail] = useState<GoodsReceipt | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const drafts = useDrafts();

  const filtered = receipts.filter(r =>
    !search || r.number.toLowerCase().includes(search.toLowerCase()) || r.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDrafts = drafts.filter(d =>
    !search || d.number.toLowerCase().includes(search.toLowerCase()) || d.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleteTarget) return;
    setReceipts(prev => prev.filter(r => r.id !== deleteTarget));
    toast.success("Đã xóa phiếu nhập");
    setDeleteTarget(null);
  };

  const handleDeleteDraft = () => {
    if (!deleteDraft) return;
    draftActions.remove(deleteDraft);
    toast.success("Đã xóa phiếu nháp");
    setDeleteDraft(null);
  };

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Phiếu nhập"
        description={`${receipts.length} phiếu nhập${drafts.length ? ` · ${drafts.length} nháp` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted">
              <Upload className="h-3.5 w-3.5" /> Nhập Excel
            </button>
            <Link to="/admin/goods-receipts/create" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
              <Plus className="h-3.5 w-3.5" /> Tạo phiếu nhập
            </Link>
          </div>
        }
      />

      <DataTableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Tìm số phiếu, NCC..." />

      {/* Drafts section */}
      {filteredDrafts.length > 0 && (
        <div className="bg-info-soft/40 border border-info/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-3.5 w-3.5 text-info" />
            <h3 className="text-xs font-semibold text-info uppercase tracking-wide">Phiếu nháp ({filteredDrafts.length})</h3>
          </div>
          <div className="space-y-1.5">
            {filteredDrafts.map(d => {
              const total = d.lines.reduce((s, l) => s + l.unitCost * l.quantity * (1 - l.discount / 100), 0) + d.shippingFee + (d.lines.reduce((s, l) => s + l.unitCost * l.quantity, 0) * d.vat / 100);
              return (
                <div key={d.id} className="bg-card rounded-md border p-2.5 flex items-center gap-3 text-xs">
                  <StatusBadge status="draft" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-medium">{d.number}</p>
                    <p className="text-muted-foreground truncate">{d.supplierName} · {d.lines.length} mặt hàng</p>
                  </div>
                  <span className="font-medium">{formatVND(total)}</span>
                  <Link to={`/admin/goods-receipts/create?draft=${d.id}`} className="px-2 py-1 text-[11px] font-medium border rounded hover:bg-muted">
                    Mở nháp
                  </Link>
                  <button onClick={() => setDeleteDraft(d.id)} className="p-1 text-muted-foreground hover:text-danger" title="Xóa nháp">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={FileInput} title="Chưa có phiếu nhập" description="Tạo phiếu nhập đầu tiên" />
      ) : (
        <>
          <div className="hidden md:block bg-card rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Số phiếu</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ngày nhập</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Nhà cung cấp</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Mặt hàng</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Tổng tiền</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground w-[110px]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs font-medium">
                      <button onClick={() => setDetail(r)} className="hover:text-primary hover:underline">{r.number}</button>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{formatDate(r.date)}</td>
                    <td className="px-3 py-2.5">{r.supplierName}</td>
                    <td className="px-3 py-2.5 text-center">{r.itemCount}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{formatVND(r.totalCost + r.shippingFee + r.vat)}</td>
                    <td className="px-3 py-2.5">
                      <div className="inline-flex items-center justify-end gap-0.5 w-full">
                        <button onClick={() => setDetail(r)} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="Xem chi tiết"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDetail(r)} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="In phiếu (mở chi tiết)"><Printer className="h-3.5 w-3.5" /></button>
                        {r.canDelete ? (
                          <button onClick={() => setDeleteTarget(r.id)} className="p-1.5 text-muted-foreground hover:text-danger rounded hover:bg-muted" title="Xóa"><Trash2 className="h-3.5 w-3.5" /></button>
                        ) : (
                          <button
                            onClick={() => toast.error("Không thể xóa — hàng từ phiếu này đã được bán")}
                            className="p-1.5 text-muted-foreground/50 cursor-help"
                            title="Không thể xóa — hàng đã bán"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {filtered.map(r => (
              <div key={r.id} className="bg-card rounded-lg border p-3" onClick={() => setDetail(r)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-mono text-xs font-medium">{r.number}</p>
                    <p className="text-xs text-muted-foreground">{r.supplierName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(r.date)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs text-muted-foreground">{r.itemCount} mặt hàng</span>
                  <span className="font-bold">{formatVND(r.totalCost + r.shippingFee + r.vat)}</span>
                </div>
                {!r.canDelete && (
                  <BlockedActionBanner message="Không thể xóa — hàng từ phiếu này đã được bán" className="mt-2" />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa phiếu nhập?"
        description="Thao tác này không thể hoàn tác. Tồn kho sẽ được điều chỉnh lại."
        confirmLabel="Xóa phiếu nhập"
        variant="danger"
      />

      <ConfirmDialog
        open={!!deleteDraft}
        onClose={() => setDeleteDraft(null)}
        onConfirm={handleDeleteDraft}
        title="Xóa phiếu nháp?"
        description="Phiếu nháp sẽ bị xóa khỏi danh sách."
        confirmLabel="Xóa nháp"
        variant="danger"
      />

      <GoodsReceiptDetailDrawer receipt={detail} onClose={() => setDetail(null)} />

      <ImportPreviewDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onConfirm={(rows) => {
          const newReceipt: GoodsReceipt = {
            id: `imp-${Date.now()}`,
            number: `PN-IMPORT-${String(receipts.length + 1).padStart(3, '0')}`,
            date: new Date().toISOString().slice(0, 10),
            supplierId: '1',
            supplierName: 'Nhập từ Excel',
            itemCount: rows.length,
            totalCost: rows.reduce((s, r) => s + r.costPrice * r.stock, 0),
            shippingFee: 0,
            vat: 0,
            note: 'Phiếu được tạo từ file Excel',
            canDelete: true,
          };
          setReceipts(prev => [newReceipt, ...prev]);
        }}
      />
    </div>
  );
}
