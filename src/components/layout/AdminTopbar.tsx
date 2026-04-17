import { Bell, Menu, Search, LogOut, User, Shield, UserCircle, Store, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { dashboardStats } from "@/lib/mock-data";

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const notifications = [
    ...dashboardStats.lowStockVariants.slice(0, 2).map(v => ({
      id: `low-${v.variantName}`,
      type: "warning" as const,
      title: "Sắp hết hàng",
      desc: `${v.productName} - ${v.variantName} còn ${v.stock}`,
    })),
    ...dashboardStats.nearExpiryLots.slice(0, 1).map(v => ({
      id: `exp-${v.variantName}`,
      type: "warning" as const,
      title: "Sắp hết hạn",
      desc: `${v.productName} - HSD ${v.expiryDate}`,
    })),
    { id: "po", type: "info" as const, title: "Đơn chờ thanh toán", desc: `${dashboardStats.pendingOrdersCount} đơn đang chờ` },
  ];

  const handleLogout = () => {
    toast.success("Đã đăng xuất");
    setUserOpen(false);
    navigate("/login");
  };

  return (
    <header className="flex items-center h-14 px-4 border-b bg-card shrink-0 gap-3">
      <button onClick={onMenuClick} className="lg:hidden text-muted-foreground hover:text-foreground">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm, hóa đơn, khách hàng..."
            className="w-full h-8 pl-9 pr-3 text-sm bg-muted rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors">
          <Store className="h-3.5 w-3.5" /> Cửa hàng
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
            className="relative p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
            aria-label="Thông báo"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-danger text-danger-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-md shadow-lg z-50 animate-fade-in">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <h3 className="font-semibold text-sm">Thông báo</h3>
                <button onClick={() => { toast.success("Đã đánh dấu đã đọc"); setNotifOpen(false); }} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                  <Check className="h-3 w-3" /> Đã đọc tất cả
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">Không có thông báo mới</div>
                ) : notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { setNotifOpen(false); navigate("/admin"); }}
                    className="w-full text-left px-3 py-2.5 border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${n.type === "warning" ? "bg-warning" : "bg-primary"}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{n.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Link to="/admin" onClick={() => setNotifOpen(false)} className="block text-center px-3 py-2 text-xs text-primary hover:bg-muted/50 border-t">
                Xem tất cả
              </Link>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative pl-2 border-l" ref={userRef}>
          <button
            onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 hover:bg-muted rounded-md p-1 transition-colors"
            aria-label="Tài khoản"
          >
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium leading-tight">Admin</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Quản trị viên</p>
            </div>
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-popover border rounded-md shadow-lg z-50 animate-fade-in">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">Nguyễn Nhà Đan</p>
                <p className="text-[11px] text-muted-foreground">admin · Quản trị viên</p>
              </div>
              <div className="py-1">
                <button onClick={() => { setUserOpen(false); navigate("/admin/users"); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted text-left">
                  <UserCircle className="h-3.5 w-3.5" /> Hồ sơ
                </button>
                <button onClick={() => { setUserOpen(false); navigate("/admin/security"); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted text-left">
                  <Shield className="h-3.5 w-3.5" /> Bảo mật
                </button>
                <Link to="/" onClick={() => setUserOpen(false)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted text-left">
                  <Store className="h-3.5 w-3.5" /> Mở cửa hàng
                </Link>
              </div>
              <div className="border-t py-1">
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-danger-soft text-danger text-left">
                  <LogOut className="h-3.5 w-3.5" /> Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
