import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { StorefrontLayout } from "@/components/layout/StorefrontLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

import StorefrontHome from "@/pages/storefront/Home";
import StorefrontProducts from "@/pages/storefront/Products";
import CartPage from "@/pages/storefront/Cart";
import CheckoutPage from "@/pages/storefront/Checkout";
import PendingPaymentPage from "@/pages/storefront/PendingPayment";
import LoginPage from "@/pages/storefront/Login";
import SignupPage from "@/pages/storefront/Signup";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminPOS from "@/pages/admin/POS";
import AdminPendingOrders from "@/pages/admin/PendingOrders";

import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Storefront */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<StorefrontHome />} />
            <Route path="/products" element={<StorefrontProducts />} />
            <Route path="/products/:id" element={<PlaceholderPage title="Chi tiết sản phẩm" />} />
            <Route path="/combos" element={<PlaceholderPage title="Combo" description="Danh sách combo ưu đãi" />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/pending-payment" element={<PendingPaymentPage />} />
            <Route path="/account" element={<PlaceholderPage title="Tài khoản" description="Thông tin tài khoản và lịch sử đơn hàng" />} />
          </Route>

          {/* Auth (no layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="categories" element={<PlaceholderPage title="Danh mục" description="Quản lý danh mục sản phẩm" />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/:id" element={<PlaceholderPage title="Chi tiết sản phẩm" />} />
            <Route path="combos" element={<PlaceholderPage title="Combo" description="Quản lý combo sản phẩm" />} />
            <Route path="pos" element={<AdminPOS />} />
            <Route path="invoices" element={<PlaceholderPage title="Hóa đơn" description="Danh sách hóa đơn bán hàng" />} />
            <Route path="pending-orders" element={<AdminPendingOrders />} />
            <Route path="promotions" element={<PlaceholderPage title="Khuyến mãi" description="Quản lý chương trình khuyến mãi" />} />
            <Route path="goods-receipts" element={<PlaceholderPage title="Phiếu nhập" description="Danh sách phiếu nhập hàng" />} />
            <Route path="goods-receipts/create" element={<PlaceholderPage title="Tạo phiếu nhập" />} />
            <Route path="stock-adjustments" element={<PlaceholderPage title="Kiểm kho / Điều chỉnh" description="Quản lý phiếu điều chỉnh tồn kho" />} />
            <Route path="inventory-report" element={<PlaceholderPage title="Báo cáo tồn kho" />} />
            <Route path="revenue" element={<PlaceholderPage title="Doanh thu" description="Báo cáo doanh thu" />} />
            <Route path="profit" element={<PlaceholderPage title="Lợi nhuận" description="Báo cáo lợi nhuận" />} />
            <Route path="customers" element={<PlaceholderPage title="Khách hàng" description="Quản lý khách hàng" />} />
            <Route path="suppliers" element={<PlaceholderPage title="Nhà cung cấp" description="Quản lý nhà cung cấp" />} />
            <Route path="users" element={<PlaceholderPage title="Người dùng" description="Quản lý tài khoản người dùng" />} />
            <Route path="security" element={<PlaceholderPage title="Bảo mật" description="Cài đặt bảo mật hệ thống" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
