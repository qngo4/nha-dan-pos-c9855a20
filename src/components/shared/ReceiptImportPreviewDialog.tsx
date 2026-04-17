import { useMemo, useState } from "react";
import { Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ReceiptImportRow {
  status: "ready" | "warning" | "error";
  message?: string;
  productCode: string;
  productName: string;
  variantName: string;
  importUnit: string;
  piecesPerUnit: number;
  quantity: number;
  unitCost: number;
  expiryDate: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: ReceiptImportRow[], meta: { supplierName: string; filename: string }) => void;
}

const SAMPLE_ROWS: ReceiptImportRow[] = [
  { status: "ready", productCode: "SP001-01", productName: "Mì Hảo Hảo", variantName: "Tôm chua cay", importUnit: "Thùng", piecesPerUnit: 30, quantity: 20, unitCost: 105000, expiryDate: "2025-10-15" },
  { status: "ready", productCode: "SP002-01", productName: "Coca-Cola", variantName: "Lon 330ml", importUnit: "Thùng", piecesPerUnit: 24, quantity: 10, unitCost: 172800, expiryDate: "2026-04-15" },
  { status: "warning", message: "Thiếu hạn sử dụng — vui lòng bổ sung", productCode: "SP003-01", productName: "Sữa Vinamilk 100%", variantName: "Hộp 180ml", importUnit: "Lốc", piecesPerUnit: 4, quantity: 30, unitCost: 21000, expiryDate: "" },
  { status: "ready", productCode: "SP004-01", productName: "Bánh Oreo", variantName: "Gói 133g", importUnit: "Thùng", piecesPerUnit: 24, quantity: 15, unitCost: 380000, expiryDate: "2026-01-20" },
  { status: "error", message: "Số lượng không hợp lệ (≤ 0)", productCode: "SP005-01", productName: "Nước mắm Nam Ngư", variantName: "Chai 500ml", importUnit: "Thùng", piecesPerUnit: 12, quantity: 0, unitCost: 240000, expiryDate: "2027-03-01" },
  { status: "warning", message: "Đơn giá nhập cao bất thường — vui lòng kiểm tra lại", productCode: "SP007-01", productName: "Trà Lipton", variantName: "Hộp 25 gói", importUnit: "Thùng", piecesPerUnit: 24, quantity: 8, unitCost: 950000, expiryDate: "2026-08-01" },
];

export function ReceiptImportPreviewDialog({ open, onClose, onConfirm }: Props) {
  const [rows, setRows] = useState<ReceiptImportRow[] | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("Nhập từ Excel");

  const stats = useMemo(() => {
    const r = rows ?? [];
    return {
      total: r.length,
      ready: r.filter((x) => x.status === "ready").length,
      warning: r.filter((x) => x.status === "warning").length,
      error: r.filter((x) => x.status === "error").length,
    };
  }, [rows]);

  if (!open) return null;

  const handleSelectFile = () => {
    setRows(SAMPLE_ROWS);
    setFilename("phieu-nhap-import.xlsx");
  };

  const handleConfirm = () => {
    const importable = (rows ?? []).filter((r) => r.status !== "error");
    if (importable.length === 0) return;
    onConfirm(importable, { supplierName: supplierName || "Nhập từ Excel", filename });
    toast.success(`Đã tạo phiếu nhập từ ${importable.length} dòng`);
    setRows(null);
    setFilename("");
    onClose();
  };

  const handleCancel = () => {
    setRows(null);
    setFilename("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-card rounded-lg border shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Nhập phiếu nhập từ Excel</h3>
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
              <p className="text-sm text-muted-foreground mt-1">Hỗ trợ định dạng .xlsx, .xls. Mỗi dòng tương ứng một mặt hàng nhập kho.</p>
              <p className="text-xs text-muted-foreground mt-2">Sau khi xác nhận, hệ thống sẽ tạo <strong>một phiếu nhập mới</strong> ngay tại trang này — không chuyển sang màn hình Tạo phiếu nhập.</p>
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
              <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
                <div className="text-sm">
                  <span className="font-medium">{filename}</span>
                  <span className="text-muted-foreground ml-2">· {stats.total} dòng</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Nhà cung cấp:</label>
                  <input
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="h-7 px-2 text-xs border rounded bg-background w-56"
                  />
                  <button onClick={() => { setRows(null); setFilename(""); }} className="text-xs text-muted-foreground hover:text-foreground underline">Chọn file khác</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="flex items-center gap-2 p-2 rounded-md bg-success-soft">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <div className="text-xs"><div className="font-semibold text-success">{stats.ready}</div><div className="text-success/80">Sẵn sàng</div></div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-warning-soft">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <div className="text-xs"><div className="font-semibold text-warning">{stats.warning}</div><div className="text-warning/80">Cảnh báo (vẫn nhập)</div></div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-danger-soft">
                  <AlertCircle className="h-4 w-4 text-danger" />
                  <div className="text-xs"><div className="font-semibold text-danger">{stats.error}</div><div className="text-danger/80">Lỗi (bỏ qua)</div></div>
                </div>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Trạng thái</th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Mã SP</th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Tên / Phân loại</th>
                      <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">SL</th>
                      <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">ĐV</th>
                      <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Đơn giá</th>
                      <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">HSD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={cn(
                        "border-b last:border-0",
                        r.status === "error" && "bg-danger-soft/40",
                        r.status === "warning" && "bg-warning-soft/40"
                      )}>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            {r.status === "ready" && <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" /> OK</span>}
                            {r.status === "warning" && <span className="inline-flex items-center gap-1 text-warning"><AlertTriangle className="h-3 w-3" /> Cảnh báo</span>}
                            {r.status === "error" && <span className="inline-flex items-center gap-1 text-danger"><AlertCircle className="h-3 w-3" /> Lỗi</span>}
                          </div>
                          {r.message && <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[180px]" title={r.message}>{r.message}</div>}
                        </td>
                        <td className="px-2 py-1.5 font-mono">{r.productCode}</td>
                        <td className="px-2 py-1.5">
                          <div className="font-medium">{r.productName}</div>
                          <div className="text-[10px] text-muted-foreground">{r.variantName}</div>
                        </td>
                        <td className="px-2 py-1.5 text-center">{r.quantity}</td>
                        <td className="px-2 py-1.5 text-center text-muted-foreground">{r.importUnit}</td>
                        <td className="px-2 py-1.5 text-right">{r.unitCost.toLocaleString("vi-VN")}</td>
                        <td className="px-2 py-1.5 text-center text-muted-foreground">{r.expiryDate || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t bg-muted/30 rounded-b-lg">
          <button onClick={handleCancel} className="px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-muted">Hủy</button>
          <button
            onClick={handleConfirm}
            disabled={!rows || stats.ready + stats.warning === 0}
            className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tạo phiếu nhập {stats.ready + stats.warning > 0 ? `(${stats.ready + stats.warning} dòng)` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
