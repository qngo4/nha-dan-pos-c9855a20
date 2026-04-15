import { Bell, Menu, Search, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  return (
    <header className="flex items-center h-14 px-4 border-b bg-card shrink-0 gap-3">
      <button onClick={onMenuClick} className="lg:hidden text-muted-foreground hover:text-foreground">
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
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
        {/* Storefront link */}
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
        >
          Cửa hàng
        </Link>

        {/* Notifications */}
        <button className="relative p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-danger text-danger-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 pl-2 border-l">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium leading-tight">Admin</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Quản trị viên</p>
          </div>
        </div>
      </div>
    </header>
  );
}
