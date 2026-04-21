import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, Power } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatVND } from "@/lib/format";
import { toast } from "sonner";
import { useVouchers, voucherActions, type VoucherDef } from "@/lib/vouchers-store";

const empty: Omit<VoucherDef, "id"> = {
  code: "",
  ruleSummary: "",
  minSubtotal: 0,
  percent: 0,
  cap: 0,
  fixedAmount: 0,
  active: true,
};

export default function VouchersPage() {
  const vouchers = useVouchers();
  const [editing, setEditing] = useState<VoucherDef | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<VoucherDef, "id">>(empty);
  const [confirmDelete, setConfirmDelete] = useState<VoucherDef | null>(null);

  const startCreate = () => {
    setEditing(null);
    setDraft(empty);
    setOpen(true);
  };
  const startEdit = (v: VoucherDef) => {
    setEditing(v);
    const { id: _id, ...rest } = v;
    setDraft(rest);
    setOpen(true);
  };
  const save = () => {
    if (!draft.code.trim()) {
      toast.error("Vui lòng nhập mã voucher");
      return;
    }
    if (draft.percent === 0 && draft.fixedAmount === 0) {
      toast.error("Cần nhập % giảm hoặc số tiền giảm cố định");
      return;
    }
    if (editing) {
      voucherActions.update(editing.id, draft);
      toast.success(`Đã cập nhật ${draft.code.toUpperCase()}`);
    } else {
      voucherActions.create(draft);
      toast.success(`Đã thêm voucher ${draft.code.toUpperCase()}`);
    }
    setOpen(false);
  };
  const doDelete = () => {
    if (!confirmDelete) return;
    voucherActions.remove(confirmDelete.id);
    toast.success(`Đã xóa ${confirmDelete.code}`);
    setConfirmDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="Voucher / Mã giảm giá"
        description="Quản lý mã giảm giá khách nhập trong trang thanh toán"
        actions={
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" /> Thêm voucher
          </button>
        }
      />

      {vouchers.length === 0 ? (
        <EmptyState icon={Tag} title="Chưa có voucher nào" description="Thêm voucher đầu tiên để khách áp dụng khi thanh toán." />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Mã</th>
                <th className="text-left px-3 py-2 font-semibold">Mô tả</th>
                <th className="text-right px-3 py-2 font-semibold">Đơn tối thiểu</th>
                <th className="text-right px-3 py-2 font-semibold">Giảm</th>
                <th className="text-center px-3 py-2 font-semibold">Trạng thái</th>
                <th className="text-right px-3 py-2 font-semibold w-1">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="px-3 py-2 font-mono font-semibold">{v.code}</td>
                  <td className="px-3 py-2 text-muted-foreground">{v.ruleSummary || "—"}</td>
                  <td className="px-3 py-2 text-right">{v.minSubtotal > 0 ? formatVND(v.minSubtotal) : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {v.percent > 0
                      ? `${v.percent}%${v.cap > 0 ? ` (tối đa ${formatVND(v.cap)})` : ""}`
                      : formatVND(v.fixedAmount)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge status={v.active ? "active" : "inactive"} label={v.active ? "Đang dùng" : "Tắt"} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => voucherActions.toggleActive(v.id)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title={v.active ? "Tạm tắt" : "Kích hoạt"}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => startEdit(v)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Sửa"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(v)}
                        className="p-1.5 rounded hover:bg-danger-soft text-muted-foreground hover:text-danger"
                        title="Xóa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Sửa voucher ${editing.code}` : "Thêm voucher mới"}
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="h-9 px-3 rounded-md border text-sm">Hủy</button>
            <button onClick={save} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium">Lưu</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Mã voucher *</Label>
            <Input
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              placeholder="VD: NHADAN10"
              className="font-mono"
            />
          </div>
          <div>
            <Label>Mô tả hiển thị</Label>
            <Input
              value={draft.ruleSummary}
              onChange={(e) => setDraft({ ...draft, ruleSummary: e.target.value })}
              placeholder="VD: Giảm 10% đơn hàng (tối đa 50.000đ)"
            />
          </div>
          <div>
            <Label>Đơn tối thiểu (VND)</Label>
            <Input
              type="number"
              min={0}
              value={draft.minSubtotal}
              onChange={(e) => setDraft({ ...draft, minSubtotal: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>% giảm</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.percent}
                onChange={(e) =>
                  setDraft({ ...draft, percent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })
                }
              />
            </div>
            <div>
              <Label>Cap % (VND)</Label>
              <Input
                type="number"
                min={0}
                value={draft.cap}
                onChange={(e) => setDraft({ ...draft, cap: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
          </div>
          <div>
            <Label>Hoặc giảm cố định (VND)</Label>
            <Input
              type="number"
              min={0}
              value={draft.fixedAmount}
              onChange={(e) => setDraft({ ...draft, fixedAmount: Math.max(0, Number(e.target.value) || 0) })}
              disabled={draft.percent > 0}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Chỉ dùng khi % giảm = 0.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Kích hoạt</p>
              <p className="text-xs text-muted-foreground">Tắt để tạm dừng nhưng giữ lại định nghĩa.</p>
            </div>
            <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
          </div>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        title="Xóa voucher?"
        description={confirmDelete ? `Mã ${confirmDelete.code} sẽ bị xóa. Hành động không thể hoàn tác.` : ""}
        confirmLabel="Xóa"
        variant="danger"
      />
    </div>
  );
}
