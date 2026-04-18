import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ReceiptImportPreviewDialog } from "@/components/shared/ReceiptImportPreviewDialog";
import { DateInput } from "@/components/shared/DateInput";
import { BarcodePrintDialog } from "@/components/shared/BarcodePrintDialog";
import { SearchableCombobox } from "@/components/shared/SearchableCombobox";
import { SupplierFormDrawer } from "@/components/shared/SupplierFormDrawer";
import { products } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { formatVND } from "@/lib/format";
import { draftActions } from "@/lib/drafts";
import { importStaging } from "@/lib/import-staging";
import {
  ArrowLeft, Save, Trash2, Upload, Printer, Search,
  AlertTriangle, AlertCircle, Package, FileText, Check, FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReceiptLine {
  id: string;
  productName: string;
  variantName: string;
  variantCode: string;
  quantity: number;
  unitCost: number;
  discount: number;
  importUnit: string;
  sellUnit?: string;
  piecesPerUnit: number;
  expiryDate: string;
  expiryDays?: number;
  expiryMode?: "date" | "days";
  fromImport?: boolean;
}

interface LineIssue {
  errors: string[];
  warnings: string[];
}

function validateLine(l: ReceiptLine): LineIssue {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!l.quantity || l.quantity <= 0) errors.push("Số lượng phải lớn hơn 0 — chỉnh trực tiếp ở cột SL.");
  if (!l.unitCost || l.unitCost <= 0) errors.push("Đơn giá nhập phải lớn hơn 0 — nhập lại ở cột Đơn giá.");
  if (!l.variantCode) errors.push("Thiếu mã sản phẩm — không thể lưu.");
  // Warnings (non-blocking)
  if (!l.expiryDate) warnings.push("Chưa có hạn sử dụng — bổ sung ngày HSD nếu sản phẩm cần.");
  if (l.unitCost > 0 && l.quantity > 0) {
    const known = products.flatMap(p => p.variants).find(v => v.code === l.variantCode);
    if (known && known.costPrice > 0 && l.unitCost > known.costPrice * 2) {
      warnings.push(`Đơn giá cao bất thường (gấp >2 lần giá nhập gần nhất ${formatVND(known.costPrice)}).`);
    }
  }
  return { errors, warnings };
}

const initialLines: ReceiptLine[] = [
  { id: '1', productName: 'Mì Hảo Hảo', variantName: 'Tôm chua cay', variantCode: 'SP001-01', quantity: 10, unitCost: 105000, discount: 0, importUnit: 'Thùng', sellUnit: 'Gói', piecesPerUnit: 30, expiryDate: '2025-10-15', expiryMode: 'date' },
  { id: '2', productName: 'Coca-Cola', variantName: 'Lon 330ml', variantCode: 'SP002-01', quantity: 8, unitCost: 172800, discount: 0, importUnit: 'Thùng', sellUnit: 'Lon', piecesPerUnit: 24, expiryDate: '2026-04-15', expiryMode: 'date' },
];

export default function AdminGoodsReceiptCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const draftId = params.get("draft");

  const [lines, setLines] = useState<ReceiptLine[]>(initialLines);
  const [supplier, setSupplier] = useState('');
  const [shippingFee, setShippingFee] = useState(50000);
  const [vat, setVat] = useState(10);
  const [note, setNote] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [draftNumber, setDraftNumber] = useState<string | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [barcodeOpen, setBarcodeOpen] = useState(false);

  // Load existing draft (if any)
  useEffect(() => {
    if (!draftId) return;
    const d = draftActions.get(draftId);
    if (d) {
      setLines(d.lines);
      setSupplier(d.supplierId);
      setShippingFee(d.shippingFee);
      setVat(d.vat);
      setNote(d.note);
      setReceiptDate(d.receiptDate);
      setDraftNumber(d.number);
      setCurrentDraftId(d.id);
      toast.info(`Đã mở phiếu nháp ${d.number}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const subtotal = lines.reduce((s, l) => s + l.unitCost * l.quantity * (1 - l.discount / 100), 0);
  const vatAmount = subtotal * vat / 100;
  const total = subtotal + shippingFee + vatAmount;

  const today = new Date().toISOString().slice(0, 10);
  const futureDateError = receiptDate > today;
  const missingExpiryCount = lines.filter(l => !l.expiryDate).length;

  const lineIssues = useMemo(() => {
    const map = new Map<string, LineIssue>();
    lines.forEach(l => map.set(l.id, validateLine(l)));
    return map;
  }, [lines]);
  const totalLineErrors = Array.from(lineIssues.values()).reduce((n, i) => n + i.errors.length, 0);
  const totalLineWarnings = Array.from(lineIssues.values()).reduce((n, i) => n + i.warnings.length, 0);
  const importedWithIssues = lines.filter(l => l.fromImport && (lineIssues.get(l.id)?.errors.length ?? 0) > 0).length;

  const canSave = lines.length > 0 && !!supplier && !futureDateError && totalLineErrors === 0;

  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));

  const addManualLine = () => {
    if (!search.trim()) return;
    const newLine: ReceiptLine = {
      id: `m-${Date.now()}`,
      productName: search,
      variantName: 'Mặc định',
      variantCode: search.toUpperCase().replace(/\s+/g, '-'),
      quantity: 1,
      unitCost: 0,
      discount: 0,
      importUnit: 'Cái',
      sellUnit: 'Cái',
      piecesPerUnit: 1,
      expiryDate: '',
      expiryMode: 'date',
    };
    setLines(prev => [...prev, newLine]);
    setSearch('');
    toast.success(`Đã thêm "${newLine.productName}" vào phiếu`);
  };

  const handleSaveDraft = () => {
    if (lines.length === 0) {
      toast.error("Chưa có mặt hàng nào");
      return;
    }
    const number = draftNumber ?? `DRAFT-${receiptDate.replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const supplierName = suppliers.find(s => s.id === supplier)?.name ?? '— Chưa chọn NCC —';
    const saved = draftActions.save({
      id: currentDraftId ?? undefined,
      number,
      supplierId: supplier,
      supplierName,
      receiptDate,
      shippingFee,
      vat,
      note,
      lines,
    });
    setDraftNumber(saved.number);
    setCurrentDraftId(saved.id);
    toast.success(`Đã lưu nháp ${saved.number}`);
  };

  const handleSave = () => {
    if (!canSave) {
      if (futureDateError) toast.error("Ngày nhập không thể ở tương lai");
      else if (!supplier) toast.error("Vui lòng chọn nhà cung cấp");
      else toast.error("Chưa có mặt hàng nào");
      return;
    }
    const number = `PN-${receiptDate.replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100)}`;
    setSavedNumber(number);
    // Remove from drafts if it was a draft
    if (currentDraftId) {
      draftActions.remove(currentDraftId);
      setCurrentDraftId(null);
      setDraftNumber(null);
    }
    toast.success(`Đã lưu phiếu nhập ${number}`);
  };

  return (
    <div className="admin-dense">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <Link to="/admin/goods-receipts" className="flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Phiếu nhập</Link>
        <span>/</span><span className="text-foreground font-medium">Tạo phiếu nhập</span>
        {savedNumber && <span className="ml-2 px-2 py-0.5 rounded-full bg-success-soft text-success text-xs font-mono">{savedNumber}</span>}
        {!savedNumber && draftNumber && <span className="ml-2 px-2 py-0.5 rounded-full bg-info-soft text-info text-xs font-mono">Nháp: {draftNumber}</span>}
      </div>

      {savedNumber && (
        <div className="flex items-center gap-2 p-3 mb-3 bg-success-soft rounded-lg border border-success/20 text-sm text-success">
          <Check className="h-4 w-4 shrink-0" />
          <span>Đã lưu phiếu nhập <strong>{savedNumber}</strong>. Bạn có thể in mã vạch ngay.</span>
        </div>
      )}

      {!savedNumber && draftNumber && (
        <div className="flex items-center gap-2 p-3 mb-3 bg-info-soft rounded-lg border border-info/20 text-sm text-info">
          <FileText className="h-4 w-4 shrink-0" />
          <span>Phiếu này đang ở trạng thái <strong>nháp</strong>. Bấm "Lưu phiếu nhập" để xác nhận và cập nhật tồn kho.</span>
        </div>
      )}

      {futureDateError && (
        <div className="flex items-center gap-2 p-3 mb-3 bg-danger-soft rounded-lg border border-danger/20 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Ngày nhập không thể là ngày tương lai.</span>
        </div>
      )}

      {totalLineErrors > 0 && (
        <div className="flex items-start gap-2 p-3 mb-3 bg-danger-soft rounded-lg border border-danger/20 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Có <strong>{totalLineErrors} lỗi</strong> ở danh sách mặt hàng{importedWithIssues > 0 ? ` (trong đó ${importedWithIssues} dòng từ Excel)` : ''}. Vui lòng sửa các dòng đánh dấu đỏ trước khi lưu phiếu nhập.
          </span>
        </div>
      )}

      {totalLineWarnings > 0 && totalLineErrors === 0 && (
        <div className="flex items-start gap-2 p-3 mb-3 bg-warning-soft rounded-lg border border-warning/20 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Có <strong>{totalLineWarnings} cảnh báo</strong> ở danh sách mặt hàng. Bạn vẫn có thể lưu phiếu nhưng nên kiểm tra lại.
          </span>
        </div>
      )}

      {missingExpiryCount > 0 && totalLineErrors === 0 && totalLineWarnings === 0 && (
        <div className="flex items-center gap-2 p-3 mb-3 bg-warning-soft rounded-lg border border-warning/20 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{missingExpiryCount} mặt hàng chưa có hạn sử dụng. Hàng cần HSD nên được điền đầy đủ.</span>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-3 lg:gap-4">
        {/* Left — Lines */}
        <div className="lg:col-span-2 space-y-3">
          {/* Metadata */}
          <div className="bg-card rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Ngày nhập *</label>
                <DateInput
                  value={receiptDate}
                  onChange={setReceiptDate}
                  className={cn("mt-1 w-full h-8", futureDateError && "border-danger")}
                />
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
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addManualLine()}
                placeholder="Tìm sản phẩm / mã vạch để thêm... (Enter)"
                className="w-full h-8 pl-9 pr-3 text-sm bg-card border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button onClick={addManualLine} disabled={!search.trim()} className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted disabled:opacity-50">Thêm</button>
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted"><Upload className="h-3.5 w-3.5" /> Nhập Excel</button>
          </div>

          {/* Lines table */}
          <div className="bg-card rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Sản phẩm</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">SL</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">ĐV nhập / bán / quy đổi</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Đơn giá</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">CK %</th>
                  <th className="text-center px-3 py-2 font-medium text-muted-foreground">HSD / Số ngày</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Thành tiền</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const lineTotal = l.unitCost * l.quantity * (1 - l.discount / 100);
                  const issues = lineIssues.get(l.id) ?? { errors: [], warnings: [] };
                  const hasError = issues.errors.length > 0;
                  const hasWarn = issues.warnings.length > 0;
                  return (
                    <>
                    <tr
                      key={l.id}
                      className={cn(
                        "border-b last:border-0 hover:bg-muted/30",
                        hasError ? "bg-danger-soft/40" : hasWarn ? "bg-warning-soft/30" : "",
                        l.fromImport && "border-l-2 border-l-info/60"
                      )}
                    >
                      <td className="px-3 py-2 text-muted-foreground text-xs align-top">
                        {i + 1}
                        {l.fromImport && <div className="text-[9px] text-info font-semibold mt-0.5">XLS</div>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <p className="font-medium text-xs">{l.productName}</p>
                        <p className="text-[11px] text-muted-foreground">{l.variantName} · {l.variantCode}</p>
                      </td>
                      <td className="px-3 py-2 text-center align-top">
                        <input type="number" value={l.quantity} onChange={e => setLines(prev => prev.map(x => x.id === l.id ? { ...x, quantity: +e.target.value } : x))} className={cn("w-16 h-7 text-center text-xs border rounded bg-background", (!l.quantity || l.quantity <= 0) && "border-danger")} />
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground align-top">
                        <div className="font-medium text-foreground">{l.importUnit} → {l.sellUnit || '—'}</div>
                        <div className="text-[10px]">x{l.piecesPerUnit}</div>
                        {l.fromImport && !l.sellUnit && (
                          <div className="text-[10px] text-info mt-0.5">Bổ sung ĐV bán</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right align-top">
                        <input type="number" value={l.unitCost} onChange={e => setLines(prev => prev.map(x => x.id === l.id ? { ...x, unitCost: +e.target.value } : x))} className={cn("w-24 h-7 text-right text-xs border rounded bg-background", (!l.unitCost || l.unitCost <= 0) && "border-danger")} />
                      </td>
                      <td className="px-3 py-2 text-center align-top">
                        <input type="number" value={l.discount} onChange={e => setLines(prev => prev.map(x => x.id === l.id ? { ...x, discount: +e.target.value } : x))} className="w-14 h-7 text-center text-xs border rounded bg-background" />
                      </td>
                      <td className="px-3 py-2 text-center align-top">
                        <div className="flex items-center gap-1">
                          <select
                            value={l.expiryMode ?? "date"}
                            onChange={(e) => setLines(prev => prev.map(x => x.id === l.id ? { ...x, expiryMode: e.target.value as "date" | "days" } : x))}
                            className="h-7 px-1 text-[11px] border rounded bg-background"
                            title="Chế độ HSD"
                          >
                            <option value="date">Ngày</option>
                            <option value="days">Số ngày</option>
                          </select>
                          {(l.expiryMode ?? "date") === "date" ? (
                            <DateInput allowFuture value={l.expiryDate} onChange={(v) => setLines(prev => prev.map(x => x.id === l.id ? { ...x, expiryDate: v } : x))} className="h-7" />
                          ) : (
                            <input
                              type="number"
                              value={l.expiryDays ?? ""}
                              placeholder="ngày"
                              onChange={(e) => {
                                const days = +e.target.value;
                                const computed = days > 0 ? new Date(new Date(receiptDate).getTime() + days * 86400000).toISOString().slice(0, 10) : "";
                                setLines(prev => prev.map(x => x.id === l.id ? { ...x, expiryDays: days, expiryDate: computed } : x));
                              }}
                              className="w-16 h-7 text-center text-xs border rounded bg-background"
                            />
                          )}
                        </div>
                        {l.expiryMode === "days" && l.expiryDate && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">→ {l.expiryDate}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-xs align-top">{formatVND(lineTotal)}</td>
                      <td className="px-3 py-2 text-center align-top">
                        <button onClick={() => removeLine(l.id)} className="p-1 text-muted-foreground hover:text-danger rounded hover:bg-muted inline-flex" title="Xóa dòng"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                    {(hasError || hasWarn) && (
                      <tr key={`${l.id}-issues`} className={cn("border-b last:border-0", hasError ? "bg-danger-soft/30" : "bg-warning-soft/20")}>
                        <td colSpan={9} className="px-3 py-2">
                          <ul className="space-y-1 text-[11px]">
                            {issues.errors.map((msg, k) => (
                              <li key={`e-${k}`} className="flex items-start gap-1.5 text-danger">
                                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                <span><strong>Lỗi:</strong> {msg}</span>
                              </li>
                            ))}
                            {issues.warnings.map((msg, k) => (
                              <li key={`w-${k}`} className="flex items-start gap-1.5 text-warning">
                                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                                <span><strong>Cảnh báo:</strong> {msg}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                    </>
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
              {!savedNumber ? (
                <>
                  <button onClick={handleSave} disabled={!canSave} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed">
                    <Save className="h-4 w-4" /> Lưu phiếu nhập
                  </button>
                  <button onClick={handleSaveDraft} className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium border hover:bg-muted">
                    <FileText className="h-4 w-4" /> {currentDraftId ? 'Cập nhật nháp' : 'Lưu nháp'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setBarcodeOpen(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover">
                    <Printer className="h-4 w-4" /> In mã vạch
                  </button>
                  <button onClick={() => navigate('/admin/goods-receipts')} className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium border hover:bg-muted">
                    Về danh sách
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReceiptImportPreviewDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onConfirm={(rows) => {
          const newLines: ReceiptLine[] = rows.map((r, i) => ({
            id: `imp-${Date.now()}-${i}`,
            productName: r.productName,
            variantName: r.variantName || 'Mặc định',
            variantCode: r.variantCode || r.productCode,
            quantity: r.quantity,
            unitCost: r.unitCost,
            discount: r.discountPercent || 0,
            importUnit: r.importUnit,
            sellUnit: r.sellUnit,
            piecesPerUnit: r.piecesPerUnit,
            expiryDate: r.expiryDate || (r.expiryDays ? new Date(Date.now() + r.expiryDays * 86400000).toISOString().slice(0, 10) : ''),
            expiryDays: r.expiryDays,
            expiryMode: r.expiryDate ? 'date' : (r.expiryDays ? 'days' : 'date'),
            fromImport: true,
          }));
          setLines(prev => [...prev, ...newLines]);
          toast.success(`Đã thêm ${newLines.length} dòng từ Excel — kiểm tra lỗi/cảnh báo bên dưới`);
        }}
      />

      <BarcodePrintDialog
        open={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
        title={`In mã vạch — ${savedNumber ?? 'phiếu nhập'}`}
        items={lines.map(l => {
          const known = products.flatMap(p => p.variants).find(v => v.code === l.variantCode);
          return {
            productName: l.productName,
            variantName: l.variantName,
            code: l.variantCode,
            price: known?.sellPrice,
            lot: savedNumber ?? draftNumber ?? receiptDate,
            defaultQty: l.quantity * l.piecesPerUnit,
          };
        })}
      />
    </div>
  );
}
