import { useState, useRef, useEffect } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { SearchableCombobox } from "@/components/shared/SearchableCombobox";
import { CustomerFormDrawer } from "@/components/shared/CustomerFormDrawer";
import { formatVND } from "@/lib/format";
import { products } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import {
  Search, Barcode, Camera, Keyboard, ShoppingCart, Receipt,
  AlertTriangle, Printer, X, Check, CheckCircle2, ScanLine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PrintableInvoice } from "@/components/shared/PrintableInvoice";
import { triggerPrint } from "@/lib/print";
import type { Invoice } from "@/lib/mock-data";
import { resolveScannedCode, normalizeScanCode } from "@/lib/pos-scan";
import { CameraScanner } from "@/components/pos/CameraScanner";

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

type ScanMode = 'hid' | 'camera' | 'manual';

export default function AdminPOS() {
  const { customers } = useStore();
  const [lines, setLines] = useState<POSLine[]>([]);
  const [scanMode, setScanMode] = useState<ScanMode>('hid');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [note, setNote] = useState('');
  const [scanFlash, setScanFlash] = useState<'ok' | 'err' | null>(null);
  const [lastInvoice, setLastInvoice] = useState<{ number: string; total: number } | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('amount');
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const customerCountRef = useState({ n: customers.length })[0];
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Auto-select newly created customer (newest is at the head of array)
  useEffect(() => {
    if (customers.length > customerCountRef.n) {
      setSelectedCustomer(customers[0].id);
      customerCountRef.n = customers.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers.length]);

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity * (1 - l.discount / 100), 0);
  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);
  const orderDiscount = Math.max(
    0,
    Math.min(subtotal, discountMode === 'percent' ? Math.round(subtotal * (discountValue || 0) / 100) : (discountValue || 0))
  );
  const total = Math.max(0, subtotal - orderDiscount);

  // HID mode: keep barcode input focused. Re-focus when window/tab regains focus,
  // and when user clicks anywhere outside an editable field.
  useEffect(() => {
    if (scanMode !== 'hid') return;
    const refocus = () => {
      const ae = document.activeElement as HTMLElement | null;
      const tag = ae?.tagName;
      const isEditable =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae?.isContentEditable;
      if (!isEditable) barcodeRef.current?.focus();
    };
    refocus();
    const onWinFocus = () => barcodeRef.current?.focus();
    const onClick = () => setTimeout(refocus, 0);
    window.addEventListener('focus', onWinFocus);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('focus', onWinFocus);
      document.removeEventListener('click', onClick);
    };
  }, [scanMode]);

  const addProductByVariant = (productName: string, variant: typeof products[0]['variants'][0]) => {
    if (variant.stock === 0) {
      toast.error(`${productName} đã hết hàng`);
      return;
    }
    setLines(prev => {
      const existing = prev.find(l => l.variantCode === variant.code);
      if (existing) {
        return prev.map(l => l.variantCode === variant.code ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, {
        id: `${Date.now()}-${variant.code}`,
        productName,
        variantName: variant.name,
        variantCode: variant.code,
        price: variant.sellPrice,
        quantity: 1,
        discount: 0,
        stock: variant.stock,
      }];
    });
  };

  /**
   * Shared scan result handler used by HID, Camera and Manual modes.
   * Keeps a single resolution + feedback pipeline so future BE integration
   * only needs swapping `resolveScannedCode` with an API call.
   */
  const handleScannedCode = (rawCode: string) => {
    const code = normalizeScanCode(rawCode);
    if (!code) return;
    const found = resolveScannedCode(code);
    if (found) {
      addProductByVariant(found.product.name, found.variant);
      toast.success(`Đã thêm ${found.product.name} — ${found.variant.name}`);
      setScanFlash('ok');
      setTimeout(() => setScanFlash(null), 500);
    } else {
      toast.error(`Không tìm thấy mã sản phẩm: ${code}`);
      setScanFlash('err');
      setTimeout(() => setScanFlash(null), 700);
    }
  };

  const handleBarcodeSubmit = () => {
    handleScannedCode(barcodeInput);
    setBarcodeInput('');
  };

  const updateLine = (id: string, qty: number) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, quantity: qty } : l));
  };
  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));

  const handleCheckout = () => {
    if (lines.length === 0) return;
    const overStock = lines.find(l => l.quantity > l.stock);
    if (overStock) {
      toast.error(`Sản phẩm "${overStock.productName}" vượt tồn kho`);
      return;
    }
    const number = `HD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random()*999)+1).padStart(3,'0')}`;
    setLastInvoice({ number, total });
    toast.success(`Đã tạo hóa đơn ${number}`);
  };

  const handleNewInvoice = () => {
    setLines([]);
    setNote('');
    setSelectedCustomer('');
    setLastInvoice(null);
    setDiscountValue(0);
    setDiscountMode('amount');
    barcodeRef.current?.focus();
  };

  const handlePrint = () => {
    if (!lastInvoice && lines.length === 0) {
      toast.error('Chưa có hóa đơn để in');
      return;
    }
    triggerPrint(lastInvoice?.number ?? 'hóa đơn nháp');
  };

  // Build a synthetic Invoice object for the printable layout (current cart or last invoice)
  const printableInvoice: Invoice = {
    id: 'pos-current',
    number: lastInvoice?.number ?? 'HD-NHAP',
    date: new Date().toISOString(),
    customerId: selectedCustomer || '',
    customerName: customers.find(c => c.id === selectedCustomer)?.name || 'Khách lẻ',
    total: lastInvoice?.total ?? total,
    paymentType: 'cash',
    status: 'active',
    createdBy: 'admin',
    itemCount: totalItems,
  };
  const printableLines = lines.map(l => ({
    name: `${l.productName} - ${l.variantName}`,
    code: l.variantCode,
    qty: l.quantity,
    price: l.price,
  }));

  const filteredProducts = products.filter(p =>
    p.active && (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
    <div className="admin-dense -m-4 lg:-m-6 h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden no-print">
      {/* Left panel — product picker */}
      <div className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r bg-card flex flex-col shrink-0 max-h-[40vh] lg:max-h-none">
        <div className="p-3 border-b space-y-2">
          {/* Barcode input */}
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "relative flex-1 transition-all rounded-md",
              scanFlash === 'ok' && "ring-2 ring-success",
              scanFlash === 'err' && "ring-2 ring-danger animate-pulse"
            )}>
              <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBarcodeSubmit(); } }}
                placeholder={
                  scanMode === 'hid'
                    ? 'Sẵn sàng quét bằng máy quét HID...'
                    : scanMode === 'camera'
                    ? 'Dùng camera bên dưới hoặc gõ tay...'
                    : 'Nhập mã vạch + Enter'
                }
                inputMode={scanMode === 'camera' ? 'none' : 'text'}
                className="w-full h-9 pl-9 pr-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                autoComplete="off"
                aria-label="Ô nhập mã vạch"
              />
            </div>
            <div className="flex border rounded-md overflow-hidden">
              {[
                { mode: 'hid' as const, icon: Barcode, title: 'Máy quét HID' },
                { mode: 'camera' as const, icon: Camera, title: 'Camera' },
                { mode: 'manual' as const, icon: Keyboard, title: 'Thủ công' },
              ].map(m => (
                <button
                  key={m.mode}
                  onClick={() => setScanMode(m.mode)}
                  title={m.title}
                  className={cn("p-1.5 transition-colors", scanMode === m.mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                >
                  <m.icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Mode hint / controls */}
          {scanMode === 'hid' && (
            <div className="flex items-start gap-2 p-2 bg-muted/60 rounded-md text-[11px] text-muted-foreground">
              <ScanLine className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
              <span>
                Máy quét HID hoạt động như bàn phím. Giữ con trỏ ở ô mã vạch — mã sẽ tự nhập và Enter để hoàn tất.
              </span>
            </div>
          )}
          {scanMode === 'camera' && (
            <CameraScanner
              active
              onDetected={handleScannedCode}
              onClose={() => setScanMode('hid')}
            />
          )}
          {scanMode === 'manual' && (
            <button onClick={handleBarcodeSubmit} className="w-full h-7 text-[11px] bg-secondary hover:bg-secondary/80 rounded-md font-medium">
              Thêm mã vạch
            </button>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên sản phẩm..."
              className="w-full h-8 pl-9 pr-3 text-sm bg-muted rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {filteredProducts.map(product => {
              const dv = product.variants.find(v => v.isDefault) || product.variants[0];
              const isOutOfStock = dv.stock === 0;
              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => addProductByVariant(product.name, dv)}
                  className={cn(
                    "text-left p-2 rounded-md border text-xs transition-all",
                    isOutOfStock ? "opacity-50 cursor-not-allowed bg-muted" : "hover:border-primary hover:shadow-sm bg-background active:scale-[0.98]"
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
            {lastInvoice ? lastInvoice.number : 'Hóa đơn mới'}
            <span className="text-muted-foreground font-normal">({totalItems} sản phẩm)</span>
          </h2>
          {lines.length > 0 && !lastInvoice && (
            <button onClick={() => { setLines([]); toast('Đã xóa hóa đơn nháp'); }} className="text-xs text-muted-foreground hover:text-danger">
              Xóa tất cả
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {lastInvoice ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="rounded-full bg-success-soft p-4 mb-4">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
              <h3 className="font-semibold text-lg">Tạo hóa đơn thành công</h3>
              <p className="font-mono text-sm text-muted-foreground mt-1">{lastInvoice.number}</p>
              <p className="text-2xl font-bold text-primary mt-3">{formatVND(lastInvoice.total)}</p>
              <div className="flex gap-2 mt-6">
                <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted">
                  <Printer className="h-4 w-4" /> In hóa đơn
                </button>
                <button onClick={handleNewInvoice} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
                  <Receipt className="h-4 w-4" /> Hóa đơn mới
                </button>
              </div>
            </div>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="rounded-full bg-muted p-4 mb-3">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-muted-foreground">Chưa có sản phẩm</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Quét mã vạch ({scanMode === 'hid' ? 'máy quét' : scanMode === 'camera' ? 'camera' : 'thủ công'}) hoặc bấm vào sản phẩm bên trái để thêm
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {lines.map((line, i) => {
                const overStock = line.quantity > line.stock;
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
                        <button onClick={() => removeLine(line.id)} className="text-muted-foreground hover:text-danger shrink-0 p-0.5" title="Xóa dòng">
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
                          <QuantityStepper value={line.quantity} onChange={(v) => updateLine(line.id, v)} size="sm" max={line.stock} />
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
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Khách hàng</label>
            <SearchableCombobox
              className="mt-1"
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              disabled={!!lastInvoice}
              showEmptyOption
              emptyOptionLabel="Khách lẻ"
              placeholder="Tìm SĐT, tên khách..."
              options={customers.filter(c => c.active).map(c => ({ id: c.id, label: c.name, sub: `${c.code} · ${c.phone}` }))}
              onCreateNew={() => setCustomerDrawerOpen(true)}
              createLabel="Tạo khách hàng mới"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Ghi chú</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={!!lastInvoice}
              placeholder="Ghi chú hóa đơn..."
              className="mt-1 w-full h-8 px-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sản phẩm</span><span>{totalItems}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(subtotal)}</span></div>

            {/* Order-level discount */}
            <div className="pt-1">
              <label className="text-[11px] font-medium text-muted-foreground">Chiết khấu</label>
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={discountValue || ''}
                  onChange={e => setDiscountValue(Math.max(0, +e.target.value || 0))}
                  disabled={!!lastInvoice || lines.length === 0}
                  placeholder="0"
                  className="flex-1 h-8 px-2 text-sm text-right bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
                />
                <div className="flex border rounded-md overflow-hidden h-8">
                  <button
                    type="button"
                    onClick={() => setDiscountMode('amount')}
                    disabled={!!lastInvoice}
                    className={cn("px-2 text-xs font-medium transition-colors", discountMode === 'amount' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted")}
                  >₫</button>
                  <button
                    type="button"
                    onClick={() => setDiscountMode('percent')}
                    disabled={!!lastInvoice}
                    className={cn("px-2 text-xs font-medium transition-colors border-l", discountMode === 'percent' ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted")}
                  >%</button>
                </div>
              </div>
              {orderDiscount > 0 && discountMode === 'percent' && (
                <p className="text-[10px] text-muted-foreground mt-1">≈ -{formatVND(orderDiscount)}</p>
              )}
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">Giảm giá</span>
              <span className={orderDiscount > 0 ? "text-danger font-medium" : ""}>-{formatVND(orderDiscount)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatVND(total)}</span>
            </div>
          </div>
        </div>

        <div className="p-3 border-t space-y-2">
          {lastInvoice ? (
            <>
              <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover">
                <Printer className="h-4 w-4" /> In hóa đơn
              </button>
              <button onClick={handleNewInvoice} className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium border hover:bg-muted">
                <Receipt className="h-4 w-4" /> Hóa đơn mới
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCheckout}
                disabled={lines.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                Thanh toán — {formatVND(total)}
              </button>
              <button onClick={handlePrint} disabled={lines.length === 0} className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium border hover:bg-muted transition-colors disabled:opacity-50">
                <Printer className="h-4 w-4" />
                In tạm
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    {/* Print-only layout (sibling so it's not nested inside .no-print) */}
    {(lines.length > 0 || lastInvoice) && (
      <PrintableInvoice invoice={printableInvoice} lines={printableLines.length ? printableLines : [{ name: 'Hóa đơn trống', code: '-', qty: 0, price: 0 }]} />
    )}
    <CustomerFormDrawer open={customerDrawerOpen} onClose={() => setCustomerDrawerOpen(false)} />
    </>
  );
}
