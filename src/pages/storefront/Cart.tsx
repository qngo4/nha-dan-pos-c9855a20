import { useState } from "react";
import { Link } from "react-router-dom";
import { formatVND } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShoppingCart, Trash2, ArrowRight, Package, AlertTriangle } from "lucide-react";

interface CartItemData {
  id: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
}

const mockCart: CartItemData[] = [
  { id: '1', productName: 'Mì Hảo Hảo', variantName: 'Tôm chua cay', price: 5000, quantity: 10, stock: 245 },
  { id: '2', productName: 'Coca-Cola', variantName: 'Lon 330ml', price: 10000, quantity: 6, stock: 180 },
  { id: '3', productName: 'Sữa Vinamilk 100%', variantName: 'Hộp 1L', price: 32000, quantity: 2, stock: 8 },
  { id: '4', productName: 'Giấy vệ sinh Pulppy', variantName: 'Gói 6 cuộn', price: 55000, quantity: 2, stock: 3 },
];

export default function CartPage() {
  const [items, setItems] = useState(mockCart);

  const updateQty = (id: string, qty: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };
  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasStockIssue = items.some(i => i.quantity > i.stock);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          icon={ShoppingCart}
          title="Giỏ hàng trống"
          description="Chưa có sản phẩm nào trong giỏ hàng"
          action={<Link to="/products" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">Mua sắm ngay</Link>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">Giỏ hàng ({items.length})</h1>

      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => {
            const overStock = item.quantity > item.stock;
            const lowStock = item.stock <= 5;
            return (
              <div key={item.id} className={`bg-card rounded-lg border p-3 flex gap-3 ${overStock ? 'border-danger/50' : ''}`}>
                <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center shrink-0">
                  <Package className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-medium">{item.productName}</h3>
                      <p className="text-xs text-muted-foreground">{item.variantName}</p>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-danger shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {overStock && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-danger">
                      <AlertTriangle className="h-3 w-3" />
                      Chỉ còn {item.stock} sản phẩm
                    </div>
                  )}
                  {!overStock && lowStock && (
                    <div className="mt-1"><StatusBadge status="low-stock" label={`Còn ${item.stock}`} /></div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <QuantityStepper value={item.quantity} onChange={(v) => updateQty(item.id, v)} max={item.stock} size="sm" />
                    <p className="font-bold text-sm text-primary">{formatVND(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 lg:mt-0">
          <div className="bg-card rounded-lg border p-4 lg:sticky lg:top-20">
            <h2 className="font-semibold text-sm mb-3">Tóm tắt đơn hàng</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính ({items.length} sản phẩm)</span>
                <span className="font-medium">{formatVND(subtotal)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Tổng cộng</span>
                <span className="font-bold text-primary text-base">{formatVND(subtotal)}</span>
              </div>
            </div>
            {hasStockIssue && (
              <div className="mt-3 p-2 bg-danger-soft rounded-md text-xs text-danger flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Một số sản phẩm vượt quá tồn kho
              </div>
            )}
            <Link
              to={hasStockIssue ? "#" : "/checkout"}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${hasStockIssue ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary-hover'}`}
            >
              Thanh toán <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
