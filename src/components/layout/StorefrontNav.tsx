import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingCart, User, Layers, Menu, X, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { path: "/", icon: Home, label: "Trang chủ" },
  { path: "/products", icon: Search, label: "Sản phẩm" },
  { path: "/combos", icon: Layers, label: "Combo" },
  { path: "/cart", icon: ShoppingCart, label: "Giỏ hàng", badge: 3 },
  { path: "/account", icon: User, label: "Tài khoản" },
];

export function StorefrontNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* Desktop top nav */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Store className="h-6 w-6 text-primary" />
            <span className="font-bold text-base tracking-tight hidden sm:inline">NhaDanShop</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navItems.filter(i => i.path !== '/cart' && i.path !== '/account').map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  isActive(item.path) ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden sm:block max-w-xs flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                className="w-full h-8 pl-9 pr-3 text-sm bg-muted rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Cart */}
          <Link to="/cart" className="relative p-1.5 text-muted-foreground hover:text-foreground">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
          </Link>

          {/* Account */}
          <Link to="/login" className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors">
            Đăng nhập
          </Link>

          {/* Mobile menu */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-1.5 text-muted-foreground hover:text-foreground">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t bg-card p-2 animate-fade-in">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md",
                  isActive(item.path) ? "bg-primary-soft text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground">
              Đăng nhập
            </Link>
          </div>
        )}
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card border-t safe-area-pb">
        <div className="flex items-center justify-around h-14">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 relative",
                isActive(item.path) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-0.5 right-1 h-4 w-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
