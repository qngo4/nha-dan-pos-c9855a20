import { useEffect, useState } from "react";
import { FormDrawer, Field } from "./FormDrawer";
import { customerActions } from "@/lib/store";
import type { Customer } from "@/lib/mock-data";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export function CustomerFormDrawer({ open, onClose, customer }: Props) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", group: "retail" as Customer["group"], active: true,
  });

  useEffect(() => {
    if (customer) setForm({ name: customer.name, phone: customer.phone, email: customer.email ?? "", group: customer.group, active: customer.active });
    else setForm({ name: "", phone: "", email: "", group: "retail", active: true });
  }, [customer, open]);

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error("Vui lòng nhập tên và SĐT"); return; }
    if (customer) {
      customerActions.update(customer.id, { ...form, email: form.email || undefined });
      toast.success("Đã cập nhật khách hàng");
    } else {
      customerActions.create({ ...form, email: form.email || undefined });
      toast.success("Đã thêm khách hàng");
    }
    onClose();
  };

  return (
    <FormDrawer
      open={open} onClose={onClose}
      title={customer ? "Sửa khách hàng" : "Thêm khách hàng"}
      description={customer ? `Mã: ${customer.code}` : "Tạo khách hàng mới"}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted">Hủy</button>
        <button onClick={submit} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">{customer ? "Cập nhật" : "Thêm mới"}</button>
      </>}
    >
      <div className="space-y-4">
        <Field label="Họ tên" required><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Nguyễn Văn A" /></Field>
        <Field label="Số điện thoại" required><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="0901234567" /></Field>
        <Field label="Email"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" placeholder="email@example.com" /></Field>
        <Field label="Nhóm khách hàng">
          <select value={form.group} onChange={e => setForm({ ...form, group: e.target.value as Customer["group"] })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="retail">Lẻ</option>
            <option value="wholesale">Sỉ</option>
            <option value="vip">VIP</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
          Đang hoạt động
        </label>
      </div>
    </FormDrawer>
  );
}
