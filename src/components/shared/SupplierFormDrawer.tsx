import { useEffect, useState } from "react";
import { FormDrawer, Field } from "./FormDrawer";
import { supplierActions } from "@/lib/store";
import type { Supplier } from "@/lib/mock-data";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

export function SupplierFormDrawer({ open, onClose, supplier }: Props) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", taxCode: "", note: "", active: true,
  });

  useEffect(() => {
    if (supplier) setForm({ name: supplier.name, phone: supplier.phone, email: supplier.email, address: supplier.address, taxCode: supplier.taxCode, note: supplier.note ?? "", active: supplier.active });
    else setForm({ name: "", phone: "", email: "", address: "", taxCode: "", note: "", active: true });
  }, [supplier, open]);

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error("Vui lòng nhập tên và SĐT"); return; }
    if (supplier) {
      supplierActions.update(supplier.id, { ...form, note: form.note || undefined });
      toast.success("Đã cập nhật nhà cung cấp");
    } else {
      supplierActions.create({ ...form, note: form.note || undefined });
      toast.success("Đã thêm nhà cung cấp");
    }
    onClose();
  };

  return (
    <FormDrawer
      open={open} onClose={onClose}
      title={supplier ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}
      description={supplier ? `Mã: ${supplier.code}` : "Tạo nhà cung cấp mới"}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted">Hủy</button>
        <button onClick={submit} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">{supplier ? "Cập nhật" : "Thêm mới"}</button>
      </>}
    >
      <div className="space-y-4">
        <Field label="Tên NCC" required><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số điện thoại" required><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></Field>
          <Field label="Mã số thuế"><input value={form.taxCode} onChange={e => setForm({ ...form, taxCode: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></Field>
        </div>
        <Field label="Email"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></Field>
        <Field label="Địa chỉ"><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></Field>
        <Field label="Ghi chú"><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
          Đang hoạt động
        </label>
      </div>
    </FormDrawer>
  );
}
