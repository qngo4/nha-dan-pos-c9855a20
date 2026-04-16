import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Shield, Smartphone, LogOut, Check, AlertTriangle, Lock, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSecurity() {
  const [totpEnabled, setTotpEnabled] = useState(true);
  const [showDisableTotp, setShowDisableTotp] = useState(false);
  const [showLogoutAll, setShowLogoutAll] = useState(false);
  const [showEnableTotp, setShowEnableTotp] = useState(false);

  return (
    <div className="space-y-4 admin-dense max-w-2xl">
      <PageHeader title="Bảo mật" description="Quản lý bảo mật tài khoản" />

      {/* Security posture */}
      <div className={cn(
        "rounded-lg border p-4",
        totpEnabled ? "bg-success-soft border-success/20" : "bg-warning-soft border-warning/20"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn("rounded-full p-2", totpEnabled ? "bg-success/10" : "bg-warning/10")}>
            <Shield className={cn("h-5 w-5", totpEnabled ? "text-success" : "text-warning")} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{totpEnabled ? 'Bảo mật tốt' : 'Cần cải thiện bảo mật'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totpEnabled ? 'Xác thực 2 bước đã được bật. Tài khoản được bảo vệ.' : 'Bạn chưa bật xác thực 2 bước. Nên bật để bảo vệ tài khoản.'}
            </p>
          </div>
        </div>
      </div>

      {/* TOTP */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary-soft p-2 shrink-0">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Xác thực 2 bước (TOTP)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Sử dụng ứng dụng xác thực (Google Authenticator, Authy) để tạo mã OTP khi đăng nhập.</p>
              <div className="mt-2"><StatusBadge status={totpEnabled ? 'totp-enabled' : 'totp-disabled'} size="md" /></div>
            </div>
          </div>
          {totpEnabled ? (
            <button onClick={() => setShowDisableTotp(true)} className="px-3 py-1.5 text-xs font-medium border border-danger text-danger rounded-md hover:bg-danger-soft shrink-0">
              Tắt TOTP
            </button>
          ) : (
            <button onClick={() => setShowEnableTotp(true)} className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover shrink-0">
              Bật TOTP
            </button>
          )}
        </div>
      </div>

      {/* Enable TOTP dialog */}
      {showEnableTotp && (
        <div className="bg-card rounded-lg border p-4 animate-fade-in">
          <h3 className="font-semibold text-sm mb-3">Thiết lập TOTP</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center justify-center w-40 h-40 bg-muted rounded-lg border shrink-0">
              <QrCode className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-xs text-muted-foreground">1. Quét mã QR bằng ứng dụng xác thực</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Hoặc nhập mã thủ công:</label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 px-2 py-1.5 text-xs bg-muted rounded font-mono select-all">JBSWY3DPEHPK3PXP</code>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">2. Nhập mã OTP 6 số để xác nhận:</label>
                <input placeholder="000000" maxLength={6} className="mt-1 w-40 h-8 px-3 text-sm font-mono tracking-widest border rounded-md bg-background text-center focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md"><Check className="h-3 w-3 inline mr-1" /> Xác nhận</button>
                <button onClick={() => setShowEnableTotp(false)} className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session management */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-muted p-2 shrink-0">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Phiên đăng nhập</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Quản lý các phiên đăng nhập đang hoạt động</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div>
                  <p className="text-xs font-medium">Phiên hiện tại</p>
                  <p className="text-[11px] text-muted-foreground">Chrome · Windows · TP.HCM</p>
                </div>
                <StatusBadge status="active" label="Đang dùng" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted">
                <LogOut className="h-3 w-3 inline mr-1" /> Đăng xuất thiết bị này
              </button>
              <button onClick={() => setShowLogoutAll(true)} className="px-3 py-1.5 text-xs font-medium border border-danger text-danger rounded-md hover:bg-danger-soft">
                Đăng xuất tất cả
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog open={showDisableTotp} onClose={() => setShowDisableTotp(false)} onConfirm={() => { setTotpEnabled(false); setShowDisableTotp(false); }} title="Tắt xác thực 2 bước?" description="Tài khoản sẽ kém an toàn hơn nếu tắt TOTP. Bạn có chắc chắn?" confirmLabel="Tắt TOTP" variant="danger" />
      <ConfirmDialog open={showLogoutAll} onClose={() => setShowLogoutAll(false)} onConfirm={() => setShowLogoutAll(false)} title="Đăng xuất tất cả thiết bị?" description="Tất cả phiên đăng nhập sẽ bị kết thúc. Bạn sẽ phải đăng nhập lại." confirmLabel="Đăng xuất tất cả" variant="warning" />
    </div>
  );
}
