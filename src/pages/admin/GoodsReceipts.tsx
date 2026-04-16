import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { BlockedActionBanner } from "@/components/shared/BlockedActionBanner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { goodsReceipts } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";
import { Plus, FileInput, Eye, Trash2, Printer, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminGoodsReceipts() {
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const filtered = goodsReceipts.filter(r =>
    !search || r.number.toLowerCase().includes(search.toLowerCase()) || r.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Phiếu nhập"
        description={`${goodsReceipts.length} phiếu nhập`}
        actions={
          <Link to="/admin/goods-receipts/create" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
            <Plus className="h-3.5 w-3.5" /> Tạo phiếu nhập
          </Link>
        }
      />

      <DataTableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Tìm số phiếu, NCC..." />

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
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs font-medium">{r.number}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{formatDate(r.date)}</td>
                    <td className="px-3 py-2.5">{r.supplierName}</td>
                    <td className="px-3 py-2.5 text-center">{r.itemCount}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{formatVND(r.totalCost + r.shippingFee + r.vat)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="Xem chi tiết"><Eye className="h-3.5 w-3.5" /></button>
                        <button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="In mã vạch"><Printer className="h-3.5 w-3.5" /></button>
                        {r.canDelete ? (
                          <button onClick={() => setDeleteTarget(r.id)} className="p-1 text-muted-foreground hover:text-danger rounded hover:bg-muted" title="Xóa"><Trash2 className="h-3.5 w-3.5" /></button>
                        ) : (
                          <button className="p-1 text-muted-foreground/40 cursor-not-allowed" title="Không thể xóa — hàng đã bán">
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
              <div key={r.id} className="bg-card rounded-lg border p-3">
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
        onConfirm={() => setDeleteTarget(null)}
        title="Xóa phiếu nhập?"
        description="Thao tác này không thể hoàn tác. Tồn kho sẽ được điều chỉnh lại."
        confirmLabel="Xóa phiếu nhập"
        variant="danger"
      />
    </div>
  );
}
