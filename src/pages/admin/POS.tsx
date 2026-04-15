import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { formatVND } from "@/lib/format";
import { products, customers } from "@/lib/mock-data";
import {
  Search, Barcode, Camera, Keyboard, ShoppingCart, Trash2, User, Receipt,
  Package, AlertTriangle, Plus, Minus, Printer, X, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface POSLine {
  id: string;
  productName: string;
  variantName: string;
  variantCode: string;
  price: number;
  quantity: number;
  discount: number;
  stock: number;
}

const initialLines: POSLine[] = [
  { id: '1', productName: 'Mì Hảo Hảo', variantName: 'Tôm chua cay', variantCode: 'SP001-01', price: 5000, quantity: 5, discount: 0, stock: 245 },
  { id: '2', productName: 'Coca-Cola', variantName: 'Lon 330ml', variantCode: 'SP002-01', price: 10000, quantity: 3, discount: 0, stock: 180 },
];

export default function AdminPOS() {
  const [lines, setLines] = useState<POSLine[]>(initialLines);
  const [scanMode, setScanMode] = useState<'hid' | 'camera' | 'manual'>('hid');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity * (1 - l.discount / 100), 0);
  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);

  const updateLine = (id: string, qty: number) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, quantity: qty } : l));
  };
  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));

  return (
    <div className="admin-dense -m-4 lg:-m-6 h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden">
      {/* Left panel — product picker */}
      <div className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r bg-card flex flex-col shrink-0">
        <div className="p-3 border-b space-y-2">
          {/* Barcode input */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="Quét hoặc nhập mã vạch..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                autoFocus
              />
            </div>
            <div className="flex border rounded-md overflow-hidden">
              {[
                { mode: 'hid' as const, icon: Barcode, title: 'Máy quét' },
                { mode: 'camera' as const, icon: Camera, title: 'Camera' },
                { mode: 'manual' as const, icon: Keyboard, title: 'Thủ công' },
              ].map(m => (
                <button
                  key={m.mode}
                  onClick={() => setScanMode(m.mode)}
                  title={m.title}
                  className={cn("p-1.5", scanMode === m.mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                >
                  <m.icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Tìm tên sản phẩm..." className="w-full h-8 pl-9 pr-3 text-sm bg-muted rounded-md focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {products.filter(p => p.active).map(product => {
              const dv = product.variants.find(v => v.isDefault) || product.variants[0];
              const isOutOfStock = dv.stock === 0;
              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  className={cn(
                    "text-left p-2 rounded-md border text-xs transition-all",
                    isOutOfStock ? "opacity-50 cursor-not-allowed bg-muted" : "hover:border-primary hover:shadow-sm bg-background"
                  )}
                >
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-muted-foreground truncate">{dv.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-primary">{formatVND(dv.sellPrice)}</span>
                    {isOutOfStock ? (
                      <StatusBadge status="out-of-stock" size="sm" />
                    ) : dv.stock <= dv.minStock ? (
                      <StatusBadge status="low-stock" label={`${dv.stock}`} size="sm" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center — Invoice lines */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Hóa đơn mới
            <span className="text-muted-foreground font-normal">({totalItems} sản phẩm)</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="font-medium text-muted-foreground">Chưa có sản phẩm</p>
              <p className="text-xs text-muted-foreground mt-1">Quét mã vạch hoặc chọn sản phẩm bên trái</p>
            </div>
          ) : (
            <div className="divide-y">
              {lines.map((line, i) => {
                const overStock = line.quantity > line.stock;
                const lowStock = line.stock <= 10;
                return (
                  <div key={line.id} className={cn("p-3 flex gap-3 hover:bg-muted/30 transition-colors", overStock && "bg-danger-soft/50")}>
                    <div className="flex items-center justify-center h-8 w-8 bg-muted rounded text-xs font-bold text-muted-foreground shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{line.productName}</p>
                          <p className="text-xs text-muted-foreground">{line.variantName} · {line.variantCode}</p>
                        </div>
                        <button onClick={() => removeLine(line.id)} className="text-muted-foreground hover:text-danger shrink-0 p-0.5">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {overStock && (
                        <p className="text-[11px] text-danger flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="h-3 w-3" /> Vượt tồn kho (còn {line.stock})
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                          <QuantityStepper value={line.quantity} onChange={(v) => updateLine(line.id, v)} size="sm" />
                          <span className="text-xs text-muted-foreground">× {formatVND(line.price)}</span>
                        </div>
                        <span className="font-bold text-sm">{formatVND(line.price * line.quantity)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — Summary */}
      <div className="lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l bg-card flex flex-col shrink-0">
        <div className="p-3 border-b space-y-2">
          {/* Customer */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Khách hàng</label>
            <select className="mt-1 w-full h-8 px-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Khách lẻ</option>
              {customers.filter(c => c.active).map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Ghi chú</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú hóa đơn..."
              className="mt-1 w-full h-8 px-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {/* Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sản phẩm</span><span>{totalItems}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Giảm giá</span><span>-{formatVND(0)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatVND(subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-t space-y-2">
          <button
            disabled={lines.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            Thanh toán — {formatVND(subtotal)}
          </button>
          <button className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium border hover:bg-muted transition-colors">
            <Printer className="h-4 w-4" />
            In hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
}
