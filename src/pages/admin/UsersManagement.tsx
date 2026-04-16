import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTableToolbar } from "@/components/shared/DataTableToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { userAccounts } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/format";
import { Plus, UserCog, Pencil, Shield, MoreHorizontal } from "lucide-react";

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const filtered = userAccounts.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 admin-dense">
      <PageHeader
        title="Người dùng"
        description={`${userAccounts.length} tài khoản`}
        actions={<button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover"><Plus className="h-3.5 w-3.5" /> Thêm người dùng</button>}
      />

      <DataTableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Tìm username, họ tên..." />

      {filtered.length === 0 ? (
        <EmptyState icon={UserCog} title="Không tìm thấy người dùng" />
      ) : (
        <>
          <div className="hidden md:block bg-card rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Người dùng</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Username</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Vai trò</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">TOTP</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">Trạng thái</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Đăng nhập cuối</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary-soft rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0">{u.fullName.charAt(0)}</div>
                        <span className="font-medium">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{u.username}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${u.role === 'admin' ? 'bg-accent-soft text-accent' : 'bg-muted text-muted-foreground'}`}>
                        {u.role === 'admin' && <Shield className="h-3 w-3" />}
                        {u.role === 'admin' ? 'Admin' : 'Nhân viên'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center"><StatusBadge status={u.totpEnabled ? 'totp-enabled' : 'totp-disabled'} /></td>
                    <td className="px-3 py-2.5 text-center"><StatusBadge status={u.active ? 'active' : 'inactive'} /></td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{u.lastLogin ? formatDateTime(u.lastLogin) : '—'}</td>
                    <td className="px-3 py-2.5"><button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {filtered.map(u => (
              <div key={u.id} className="bg-card rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 bg-primary-soft rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0">{u.fullName.charAt(0)}</div>
                    <div>
                      <h3 className="font-medium text-sm">{u.fullName}</h3>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                  <StatusBadge status={u.active ? 'active' : 'inactive'} />
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full ${u.role === 'admin' ? 'bg-accent-soft text-accent' : 'bg-muted text-muted-foreground'}`}>
                    {u.role === 'admin' ? 'Admin' : 'Nhân viên'}
                  </span>
                  <StatusBadge status={u.totpEnabled ? 'totp-enabled' : 'totp-disabled'} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
