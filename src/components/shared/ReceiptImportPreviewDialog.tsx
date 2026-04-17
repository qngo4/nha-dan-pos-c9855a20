import { useMemo, useState } from "react";
import { Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle2, AlertCircle, Sparkles, RefreshCw, PackagePlus, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { products } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";

export type ReceiptImportOutcome =
  | "create-product-and-variant"
  | "create-variant"
  | "use-default-variant"
  | "update-legacy-unit"
  | "update-pricing"
  | "ok";

export interface ReceiptImportRow {
  status: "ready" | "warning" | "error";
  message?: string;
  outcome: ReceiptImportOutcome;
  productCode: string;
  variantCode: string;
  productName: string;
  variantName: string;
  category?: string;
  importUnit: string;
  sellUnit: string;
  piecesPerUnit: number;
  quantity: number;
  unitCost: number;
  sellPrice: number;
  discountPercent: number;
  expiryDate: string;
  expiryDays?: number;
  note?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: ReceiptImportRow[], meta: { supplierName: string; filename: string; receiptDate: string }) => void;
}

// Pass-1 simulated rules using existing in-memory products as the "database"
function pass1Validate(rows: Omit<ReceiptImportRow, "status" | "outcome" | "message">[]): ReceiptImportRow[] {
  const allVariants = products.flatMap(p => p.variants.map(v => ({ p, v })));
  return rows.map((r) => {
    const product = products.find(p => p.code === r.productCode);
    let outcome: ReceiptImportOutcome = "ok";
    let status: "ready" | "warning" | "error" = "ready";
    let message: string | undefined;

    // Hard validations
    if (!r.quantity || r.quantity <= 0) {
      return { ...r, status: "error", outcome, message: "Số lượng phải lớn hơn 0." };
    }
    if (!r.unitCost || r.unitCost <= 0) {
      return { ...r, status: "error", outcome, message: "Đơn giá nhập phải lớn hơn 0." };
    }
    if (!r.expiryDate && !r.expiryDays) {
      status = "warning";
      message = "Chưa có HSD hoặc số ngày sử dụng — bạn nên bổ sung.";
    }

    if (!product) {
      // Product doesn't exist
      if (!r.category || !r.category.trim()) {
        return { ...r, status: "error", outcome, message: "Mã SP chưa tồn tại và thiếu Danh mục — không thể tạo sản phẩm mới." };
      }
      outcome = "create-product-and-variant";
      message = message ?? `Tạo mới sản phẩm "${r.productName}" + phân loại "${r.variantName || r.productCode}".`;
      return { ...r, status, outcome, message, variantCode: r.variantCode || r.productCode };
    }

    // Product exists
    if (!r.variantCode) {
      // Use default variant
      const def = product.variants.find(v => v.isDefault) ?? product.variants[0];
      outcome = "use-default-variant";
      // Legacy importUnit unknown => update from Excel
      if (!def.importUnit) {
        outcome = "update-legacy-unit";
        message = message ?? `Dùng phân loại mặc định "${def.name}", cập nhật đơn vị nhập từ Excel.`;
      } else {
        message = message ?? `Dùng phân loại mặc định "${def.name}".`;
      }
      return { ...r, status, outcome, message, variantCode: def.code, variantName: def.name };
    }

    // variant_code provided
    const found = allVariants.find(x => x.v.code === r.variantCode && x.p.id === product.id);
    if (found) {
      // Variant exists
      if (!found.v.importUnit) {
        outcome = "update-legacy-unit";
        message = message ?? "Cập nhật đơn vị nhập + đơn vị bán + giá (legacy).";
      } else if (found.v.importUnit !== r.importUnit) {
        return {
          ...r,
          status: "error",
          outcome: "ok",
          message: `Variant ${r.variantCode} có đơn vị nhập là "${found.v.importUnit}/${found.v.piecesPerImportUnit}", Excel lại nhập "${r.importUnit}/${r.piecesPerUnit}" — sai đơn vị. Vui lòng dùng variant_code khác.`,
        };
      } else {
        outcome = "update-pricing";
        message = message ?? "Cập nhật giá nhập / giá bán cho phân loại đã có.";
      }
      return { ...r, status, outcome, message, variantName: found.v.name };
    } else {
      // New variant for existing product
      outcome = "create-variant";
      message = message ?? `Tạo phân loại mới "${r.variantName || r.variantCode}" cho sản phẩm "${product.name}".`;
      return { ...r, status, outcome, message };
    }
  });
}

const SAMPLE_INPUT = [
  // Existing product + existing variant — update pricing
  { productCode: "SP001", variantCode: "SP001-01", productName: "Mì Hảo Hảo", variantName: "Tôm chua cay", importUnit: "Thùng", piecesPerUnit: 30, sellUnit: "Gói", quantity: 20, unitCost: 105000, sellPrice: 5000, discountPercent: 0, expiryDate: "2025-10-15", expiryDays: 0, category: "" },
  // Existing product + no variant_code — use default
  { productCode: "SP002", variantCode: "", productName: "Coca-Cola", variantName: "", importUnit: "Thùng", piecesPerUnit: 24, sellUnit: "Lon", quantity: 10, unitCost: 172800, sellPrice: 10000, discountPercent: 0, expiryDate: "2026-04-15", expiryDays: 0, category: "" },
  // Existing product + new variant_code — create variant
  { productCode: "SP003", variantCode: "SP003-99", productName: "Sữa Vinamilk 100%", variantName: "Hộp 250ml (mới)", importUnit: "Thùng", piecesPerUnit: 24, sellUnit: "Hộp", quantity: 30, unitCost: 21000, sellPrice: 9000, discountPercent: 0, expiryDate: "", expiryDays: 90, category: "" },
  // New product + category — create both
  { productCode: "SP201", variantCode: "SP201-01", productName: "Bột Giặt Ariel", variantName: "Túi 4kg", importUnit: "Thùng", piecesPerUnit: 6, sellUnit: "Túi", quantity: 12, unitCost: 180000, sellPrice: 215000, discountPercent: 0, expiryDate: "", expiryDays: 720, category: "Đồ dùng gia đình" },
  // New product + no category — ERROR
  { productCode: "SP202", variantCode: "", productName: "Snack Lay's BBQ", variantName: "", importUnit: "Thùng", piecesPerUnit: 36, sellUnit: "Gói", quantity: 24, unitCost: 6500, sellPrice: 9000, discountPercent: 0, expiryDate: "2026-01-01", expiryDays: 0, category: "" },
  // Existing variant but wrong import unit — ERROR
  { productCode: "SP004", variantCode: "SP004-01", productName: "Bánh Oreo", variantName: "Gói 133g", importUnit: "Lốc", piecesPerUnit: 5, sellUnit: "Gói", quantity: 8, unitCost: 110000, sellPrice: 22000, discountPercent: 0, expiryDate: "2026-01-20", expiryDays: 0, category: "" },
  // Quantity invalid — ERROR
  { productCode: "SP005", variantCode: "SP005-01", productName: "Nước mắm Nam Ngư", variantName: "Chai 500ml", importUnit: "Thùng", piecesPerUnit: 12, sellUnit: "Chai", quantity: 0, unitCost: 240000, sellPrice: 28000, discountPercent: 0, expiryDate: "2027-03-01", expiryDays: 0, category: "" },
];

const outcomeLabels: Record<ReceiptImportOutcome, { label: string; icon: typeof Sparkles; cls: string }> = {
  "create-product-and-variant": { label: "Tạo SP + phân loại", icon: PackagePlus, cls: "bg-info-soft text-info" },
  "create-variant": { label: "Tạo phân loại mới", icon: Layers, cls: "bg-info-soft text-info" },
  "use-default-variant": { label: "Dùng phân loại mặc định", icon: Sparkles, cls: "bg-muted text-muted-foreground" },
  "update-legacy-unit": { label: "Cập nhật đơn vị (legacy)", icon: RefreshCw, cls: "bg-warning-soft text-warning" },
  "update-pricing": { label: "Cập nhật giá", icon: RefreshCw, cls: "bg-success-soft text-success" },
  "ok": { label: "Sẵn sàng nhập", icon: CheckCircle2, cls: "bg-success-soft text-success" },
};

export function ReceiptImportPreviewDialog({ open, onClose, onConfirm }: Props) {
  const [rows, setRows] = useState<ReceiptImportRow[] | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("Nhập từ Excel");
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const stats = useMemo(() => {
    const r = rows ?? [];
    const total = r.reduce((s, x) => s + x.quantity * x.unitCost, 0);
    return {
      total: r.length,
      ready: r.filter((x) => x.status === "ready").length,
      warning: r.filter((x) => x.status === "warning").length,
      error: r.filter((x) => x.status === "error").length,
      cost: total,
    };
  }, [rows]);

  if (!open) return null;

  const handleSelectFile = () => {
    const validated = pass1Validate(SAMPLE_INPUT);
    setRows(validated);
    setFilename("phieu-nhap-import.xlsx");
  };

  const updateRow = (i: number, patch: Partial<ReceiptImportRow>) => {
    setRows((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const merged = { ...next[i], ...patch };
      // Re-validate this row
      const re = pass1Validate([{
        productCode: merged.productCode, variantCode: merged.variantCode,
        productName: merged.productName, variantName: merged.variantName,
        importUnit: merged.importUnit, sellUnit: merged.sellUnit,
        piecesPerUnit: merged.piecesPerUnit, quantity: merged.quantity,
        unitCost: merged.unitCost, sellPrice: merged.sellPrice,
        discountPercent: merged.discountPercent, expiryDate: merged.expiryDate,
        expiryDays: merged.expiryDays, category: merged.category, note: merged.note,
      }])[0];
      next[i] = { ...merged, status: re.status, outcome: re.outcome, message: re.message };
      return next;
    });
  };

  const handleConfirm = () => {
    if (!rows || stats.error > 0) return;
    onConfirm(rows, { supplierName: supplierName || "Nhập từ Excel", filename, receiptDate });
    toast.success(`Đã tạo phiếu nhập từ ${rows.length} dòng`);
    setRows(null); setFilename(""); onClose();
  };

  const handleCancel = () => { setRows(null); setFilename(""); onClose(); };

  const blocked = stats.error > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-card rounded-lg border shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Nhập phiếu nhập từ Excel — Xem lại trước khi tạo</h3>
          </div>
          <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {!rows ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <div className="rounded-full bg-muted p-3 inline-flex mb-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="font-semibold">Chọn file Excel để xem trước</h4>
              <p className="text-sm text-muted-foreground mt-1">Mỗi dòng = một phân loại (variant). Hệ thống sẽ chạy kiểm tra (pass-1) trước khi tạo phiếu.</p>
              <p className="text-xs text-muted-foreground mt-2">Sau khi xác nhận, hệ thống tạo <strong>một phiếu nhập</strong> ngay tại đây — không chuyển trang.</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={handleSelectFile} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
                  <Upload className="h-4 w-4" /> Chọn file Excel
                </button>
                <button onClick={() => toast.info("Đang tải file mẫu...")} className="px-3 py-2 text-sm font-medium border rounded-md hover:bg-muted">
                  Tải file mẫu
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Metadata */}
              <div className="grid sm:grid-cols-3 gap-3 mb-4 p-3 bg-muted/40 rounded-lg border">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">File</label>
                  <p className="text-sm font-medium truncate">{filename}</p>
                  <button onClick={() => { setRows(null); setFilename(""); }} className="text-[11px] text-primary hover:underline">Chọn file khác</button>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">Nhà cung cấp</label>
                  <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="mt-1 w-full h-7 px-2 text-xs border rounded bg-background" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">Ngày nhập</label>
                  <input type="date" value={receiptDate} max={new Date().toISOString().slice(0,10)} onChange={(e) => setReceiptDate(e.target.value)} className="mt-1 w-full h-7 px-2 text-xs border rounded bg-background" />
                </div>
              </div>

              {/* Validation summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <SummaryChip color="success" icon={CheckCircle2} value={stats.ready} label="Sẵn sàng" />
                <SummaryChip color="warning" icon={AlertTriangle} value={stats.warning} label="Cảnh báo (vẫn nhập)" />
                <SummaryChip color="danger" icon={AlertCircle} value={stats.error} label="Lỗi (chặn tạo)" />
                <div className="flex items-center gap-2 p-2 rounded-md bg-primary-soft border border-primary/20">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <div className="text-xs"><div className="font-semibold text-primary">{formatVND(stats.cost)}</div><div className="text-primary/80">Ước tính tổng tiền</div></div>
                </div>
              </div>

              {blocked && (
                <div className="flex items-start gap-2 p-3 mb-3 bg-danger-soft border border-danger/20 rounded-md text-xs text-danger">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Không thể tạo phiếu nhập</strong> — còn <strong>{stats.error} dòng lỗi</strong> ở danh sách bên dưới (đánh dấu đỏ). Hãy chỉnh sửa trực tiếp các ô SL / Đơn giá / Đơn vị, hoặc chọn file khác.
                  </div>
                </div>
              )}

              {/* Rows table */}
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-xs min-w-[1000px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-44">Trạng thái / Hành động</th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Mã SP / Variant</th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Tên / Phân loại</th>
                      <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">SL</th>
                      <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">ĐV nhập / quy đổi</th>
                      <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Giá nhập</th>
                      <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Giá bán</th>
                      <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">HSD / Số ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const oc = outcomeLabels[r.outcome];
                      return (
                        <tr key={i} className={cn(
                          "border-b last:border-0 align-top",
                          r.status === "error" && "bg-danger-soft/40",
                          r.status === "warning" && "bg-warning-soft/30",
                          r.status === "ready" && "bg-success-soft/20"
                        )}>
                          <td className="px-2 py-2">
                            <div className="flex flex-col gap-1">
                              {r.status === "error" && <span className="inline-flex items-center gap-1 text-danger font-semibold"><AlertCircle className="h-3 w-3" /> LỖI · chặn</span>}
                              {r.status === "warning" && <span className="inline-flex items-center gap-1 text-warning font-semibold"><AlertTriangle className="h-3 w-3" /> Cảnh báo</span>}
                              {r.status === "ready" && <span className="inline-flex items-center gap-1 text-success font-semibold"><CheckCircle2 className="h-3 w-3" /> Sẵn sàng</span>}
                              <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium w-fit", oc.cls)}>
                                <oc.icon className="h-2.5 w-2.5" /> {oc.label}
                              </span>
                              {r.message && <p className="text-[10px] text-muted-foreground leading-snug">{r.message}</p>}
                            </div>
                          </td>
                          <td className="px-2 py-2 font-mono text-[11px]">
                            <div>{r.productCode}</div>
                            <div className="text-muted-foreground">{r.variantCode || <em>—</em>}</div>
                            {r.category && <div className="text-[10px] text-info mt-0.5">DM: {r.category}</div>}
                          </td>
                          <td className="px-2 py-2">
                            <div className="font-medium">{r.productName}</div>
                            <div className="text-[10px] text-muted-foreground">{r.variantName || <em>(mặc định)</em>}</div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input type="number" value={r.quantity} onChange={(e) => updateRow(i, { quantity: +e.target.value })} className={cn("w-14 h-6 text-center text-xs border rounded bg-background", r.quantity <= 0 && "border-danger")} />
                          </td>
                          <td className="px-2 py-2 text-center text-[11px]">
                            <div className="font-medium">{r.importUnit} / {r.piecesPerUnit}</div>
                            <div className="text-muted-foreground">→ {r.sellUnit}</div>
                          </td>
                          <td className="px-2 py-2 text-right">
                            <input type="number" value={r.unitCost} onChange={(e) => updateRow(i, { unitCost: +e.target.value })} className={cn("w-20 h-6 text-right text-xs border rounded bg-background", r.unitCost <= 0 && "border-danger")} />
                          </td>
                          <td className="px-2 py-2 text-right text-muted-foreground">{r.sellPrice.toLocaleString("vi-VN")}</td>
                          <td className="px-2 py-2 text-center text-[11px]">
                            {r.expiryDate ? r.expiryDate : (r.expiryDays ? `${r.expiryDays} ngày` : <span className="text-warning">—</span>)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t bg-muted/30 rounded-b-lg">
          <p className="text-[11px] text-muted-foreground">
            {rows && (blocked
              ? "Sửa hết lỗi để tiếp tục."
              : `${stats.ready + stats.warning} dòng sẽ được nhập · Tổng ước tính ${formatVND(stats.cost)}`)}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className="px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-muted">Hủy</button>
            <button
              onClick={handleConfirm}
              disabled={!rows || blocked || rows.length === 0}
              title={blocked ? `Còn ${stats.error} lỗi cần sửa` : undefined}
              className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tạo phiếu nhập {rows && !blocked ? `(${rows.length} dòng)` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryChip({ color, icon: Icon, value, label }: { color: "success" | "warning" | "danger"; icon: typeof CheckCircle2; value: number; label: string }) {
  const map = {
    success: "bg-success-soft text-success border-success/20",
    warning: "bg-warning-soft text-warning border-warning/20",
    danger: "bg-danger-soft text-danger border-danger/20",
  } as const;
  return (
    <div className={cn("flex items-center gap-2 p-2 rounded-md border", map[color])}>
      <Icon className="h-4 w-4" />
      <div className="text-xs"><div className="font-semibold">{value}</div><div className="opacity-80">{label}</div></div>
    </div>
  );
}
