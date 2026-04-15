import { Outlet } from "react-router-dom";
import { StorefrontNav } from "./StorefrontNav";

export function StorefrontLayout() {
  return (
    <div className="min-h-screen bg-storefront-bg">
      <StorefrontNav />
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
