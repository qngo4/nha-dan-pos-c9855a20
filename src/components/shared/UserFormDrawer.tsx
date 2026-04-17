import { useEffect, useState } from "react";
import { FormDrawer, Field } from "./FormDrawer";
import { userActions } from "@/lib/store";
import type { UserAccount } from "@/lib/mock-data";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  user?: UserAccount | null;
}

export function UserFormDrawer({ open, onClose, user }: Props) {
  const [form, setForm] = useState({
    username: "", fullName: "", role: "staff" as UserAccount["role"], active: true, totpEnabled: false,
  });

  useEffect(() => {
    if (user) setForm({ username: user.username, fullName: user.fullName, role: user.role, active: user.active, totpEnabled: user.totpEnabled });
    else setForm({ username: "", fullName: "", role: "staff", active: true, totpEnabled: false });
  }, [user, open]);

  const submit = () => {
    if (!form.username.trim() || !form.fullName.trim()) { toast.error("Vui lòng nhập username và họ tên"); return; }
    if (user) {
      userActions.update(user.id, form);
      toast.success("Đã cập nhật người dùng");
    } else {
      userActions.create(form);
      toast.success("Đã thêm người dùng");
    }
    onClose();
  };

  return (
    <FormDrawer
      open={open} onClose={onClose}
      title={user ? "Sửa người dùng" : "Thêm người dùng"}
      description={user ? `@${user.username}` : "Tạo tài khoản mới"}
      footer={<>
        <button onClick={onClose} className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted">Hủy</button>
        <button onClick={submit} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">{user ? "Cập nhật" : "Thêm mới"}</button>
      </>}
    >
      <div className="space-y-4">
        <Field label="Họ tên" required><input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></Field>
        <Field label="Username" required hint={user ? "Không thể đổi username" : "Dùng để đăng nhập"}>
          <input value={form.username} disabled={!!user} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60" />
        </Field>
        {!user && <Field label="Mật khẩu tạm" hint="Người dùng sẽ đổi mật khẩu lần đăng nhập đầu">
          <input type="password" placeholder="••••••" className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
        </Field>}
        <Field label="Vai trò">
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserAccount["role"] })} className="w-full h-9 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="staff">Nhân viên</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
            Đang hoạt động
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.totpEnabled} onChange={e => setForm({ ...form, totpEnabled: e.target.checked })} />
            Yêu cầu xác thực 2 bước (TOTP)
          </label>
        </div>
      </div>
    </FormDrawer>
  );
}
