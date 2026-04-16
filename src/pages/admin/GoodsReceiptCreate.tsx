import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { suppliers, products } from "@/lib/mock-data";
import { formatVND, formatDate } from "@/lib/format";
import {
  ArrowLeft, Save, Plus, Trash2, Upload, Printer, Search,
  AlertTriangle, Package
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReceiptLine {
  id: string;
  productName: string;
  variantName: string;
  variantCode: string;
  quantity: number;
  unitCost: number;
  discount: number;
  importUnit: string;
  piecesPerUnit: number;
  expiryDate: string;
}

const initialLines: ReceiptLine[] = [
  { id: '1', productName: 'Mì Hảo Hảo', variantName: 'Tôm chua cay', variantCode: 'SP001-01', quantity: 10, unitCost: 105000, discount: 0, importUnit: 'Thùng', piecesPerUnit: 30, expiryDate: '2025-10-15' },
  { id: '2', productName: 'Coca-Cola', variantName: 'Lon 330ml', variantCode: 'SP002-01', quantity: 8, unitCost: 172800, discount: 0, importUnit: 'Thùng', piecesPerUnit: 24, expiryDate: '2026-04-15' },
];

export default function AdminGoodsReceiptCreate() {
  const [lines, setLines] = useState<ReceiptLine[]>(initialLines);
  const [supplier, setSupplier] = useState('');
  const [shippingFee, setShippingFee] = useState(50000);
  const [vat, setVat] = useState(10);
  const [note, setNote] = useState('');

  const subtotal = lines.reduce((s, l) => s + l.unitCost * l.quantity * (1 - l.discount / 100), 0);
  const vatAmount = subtotal * vat / 100;
  const total = subtotal + shippingFee + vatAmount;

  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));

  return (
    <div className="admin-dense">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Link to="/admin/goods-receipts" className="flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Phiếu nhập</Link>
        <span>/</span><span className="text-foreground font-medium">Tạo phiếu nhập</span>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-4">
        {/* Left — Lines */}
        <div className="lg:col-span-2 space-y-3">
          {/* Metadata */}
          <div className="bg-card rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Ngày nhập *</label>
                <input type="date" defaultValue="2025-04-15" className="mt-1 w-full h-8 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nhà cung cấp *</label>
                <select value={supplier} onChange={e => setSupplier(e.target.value)} className="mt-1 w-full h-8 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Chọn NCC</option>
                  {suppliers.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phí vận chuyển</label>
                <input type="number" value={shippingFee} onChange={e => setShippingFee(+e.target.value)} className="mt-1 w-full h-8 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">VAT (%)</label>
                <input type="number" value={vat} onChange={e => setVat(+e.target.value)} className="mt-1 w-full h-8 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">Ghi chú</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú phiếu nhập" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          {/* Add line */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="Tìm sản phẩm / mã vạch để thêm..." className="w-full h-8 pl-9 pr-3 text-sm bg-card border rounded-md focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted"><Upload className="h-3.5 w-3.5" /> Nhập Excel</button>
          </div>

          {/* Lines table */}
          <div className="bg-card rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Sản phẩm</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">SL</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">ĐV nhập</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Đơn giá</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">CK %</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">HSD</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Thành tiền</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const lineTotal = l.unitCost * l.quantity * (1 - l.discount / 100);
                  const missingExpiry = !l.expiryDate;
                  return (
                    <tr key={l.id} className={cn("border-b last:border-0 hover:bg-muted/30", missingExpiry && "bg-warning-soft/30")}>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-xs">{l.productName}</p>
                        <p className="text-[11px] text-muted-foreground">{l.variantName} · {l.variantCode}</p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="number" value={l.quantity} onChange={e => setLines(prev => prev.map(x => x.id === l.id ? { ...x, quantity: +e.target.value } : x))} className="w-16 h-7 text-center text-xs border rounded bg-background" />
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground">{l.importUnit} ({l.piecesPerUnit})</td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" value={l.unitCost} onChange={e => setLines(prev => prev.map(x => x.id === l.id ? { ...x, unitCost: +e.target.value } : x))} className="w-24 h-7 text-right text-xs border rounded bg-background" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="number" value={l.discount} onChange={e => setLines(prev => prev.map(x => x.id === l.id ? { ...x, discount: +e.target.value } : x))} className="w-14 h-7 text-center text-xs border rounded bg-background" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="date" value={l.expiryDate} onChange={e => setLines(prev => prev.map(x => x.id === l.id ? { ...x, expiryDate: e.target.value } : x))} className="h-7 text-xs border rounded bg-background px-1" />
                        {missingExpiry && <AlertTriangle className="h-3 w-3 text-warning inline ml-1" />}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-xs">{formatVND(lineTotal)}</td>
                      <td className="px-3 py-2"><button onClick={() => removeLine(l.id)} className="p-0.5 text-muted-foreground hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {lines.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                Chưa có mặt hàng. Tìm sản phẩm để thêm vào phiếu nhập.
              </div>
            )}
          </div>
        </div>

        {/* Right — Summary */}
        <div className="mt-3 lg:mt-0">
          <div className="bg-card rounded-lg border p-4 lg:sticky lg:top-20 space-y-3">
            <h3 className="font-semibold text-sm">Tổng kết phiếu nhập</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Mặt hàng</span><span>{lines.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phí vận chuyển</span><span>{formatVND(shippingFee)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT ({vat}%)</span><span>{formatVND(vatAmount)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Tổng cộng</span><span className="text-primary">{formatVND(total)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button disabled={lines.length === 0} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="h-4 w-4" /> Lưu phiếu nhập
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium border hover:bg-muted">
                <Printer className="h-4 w-4" /> In mã vạch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
