import { useMemo, useState } from "react";
import { Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ImportRow {
  status: "ready" | "warning" | "error";
  message?: string;
  code: string;
  name: string;
  category: string;
  variantName: string;
  sellPrice: number;
  costPrice: number;
  stock: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: ImportRow[]) => void;
}

const SAMPLE_ROWS: ImportRow[] = [
  { status: "ready", code: "SP101", name: "Bánh mì sandwich", category: "Bánh kẹo", variantName: "Gói 200g", sellPrice: 18000, costPrice: 12000, stock: 50 },
  { status: "ready", code: "SP102", name: "Cà phê G7 hòa tan", category: "Đồ uống", variantName: "Hộp 21 gói", sellPrice: 52000, costPrice: 38000, stock: 30 },
  { status: "warning", message: "Thiếu mã danh mục — sẽ tạo danh mục mới", code: "SP103", name: "Xúc xích Đức Việt", category: "(mới)", variantName: "Gói 500g", sellPrice: 65000, costPrice: 48000, stock: 20 },
  { status: "ready", code: "SP104", name: "Nước suối Aquafina", category: "Đồ uống", variantName: "Chai 500ml", sellPrice: 5000, costPrice: 3500, stock: 200 },
  { status: "error", message: "Trùng mã sản phẩm với SP001", code: "SP001", name: "Mì Hảo Hảo", category: "Thực phẩm khô", variantName: "Tôm chua cay", sellPrice: 5000, costPrice: 3500, stock: 100 },
  { status: "warning", message: "Giá bán thấp hơn giá nhập", code: "SP105", name: "Kẹo dẻo Haribo", category: "Bánh kẹo", variantName: "Gói 80g", sellPrice: 25000, costPrice: 28000, stock: 40 },
];

export function ImportPreviewDialog({ open, onClose, onConfirm }: Props) {
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [filename, setFilename] = useState<string>("");

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
    // Simulate parsing an Excel file
    setRows(SAMPLE_ROWS);
    setFilename("san-pham-import.xlsx");
  };

  const handleConfirm = () => {
    if (stats.error > 0) {
      toast.error(`Còn ${stats.error} dòng lỗi — vui lòng sửa file Excel hoặc bỏ qua các dòng đỏ trước khi nhập`);
      return;
    }
    const importable = (rows ?? []).filter((r) => r.status !== "error");
    onConfirm(importable);
    toast.success(`Đã nhập ${importable.length} sản phẩm — mỗi sản phẩm tự tạo phân loại mặc định`);
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
            <h3 className="font-semibold">Nhập sản phẩm từ Excel</h3>
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
              <p className="text-sm text-muted-foreground mt-1">Hỗ trợ định dạng .xlsx, .xls. Tải mẫu để chuẩn bị dữ liệu đúng cấu trúc.</p>
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
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm">
                  <span className="font-medium">{filename}</span>
                  <span className="text-muted-foreground ml-2">· {stats.total} dòng</span>
                </div>
                <button onClick={() => { setRows(null); setFilename(""); }} className="text-xs text-muted-foreground hover:text-foreground underline">Chọn file khác</button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="flex items-center gap-2 p-2 rounded-md bg-success-soft">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <div className="text-xs"><div className="font-semibold text-success">{stats.ready}</div><div className="text-success/80">Sẵn sàng</div></div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-warning-soft">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <div className="text-xs"><div className="font-semibold text-warning">{stats.warning}</div><div className="text-warning/80">Cảnh báo</div></div>
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
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Mã</th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Tên SP</th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Danh mục</th>
                      <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Phân loại</th>
                      <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Giá bán</th>
                      <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Giá nhập</th>
                      <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">Tồn</th>
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
                            {r.status === "warning" && <span className="inline-flex items-center gap-1 text-warning" title={r.message}><AlertTriangle className="h-3 w-3" /> Cảnh báo</span>}
                            {r.status === "error" && <span className="inline-flex items-center gap-1 text-danger" title={r.message}><AlertCircle className="h-3 w-3" /> Lỗi</span>}
                          </div>
                          {r.message && <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[180px] truncate" title={r.message}>{r.message}</div>}
                        </td>
                        <td className="px-2 py-1.5 font-mono">{r.code}</td>
                        <td className="px-2 py-1.5 font-medium">{r.name}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{r.category}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{r.variantName}</td>
                        <td className="px-2 py-1.5 text-right">{r.sellPrice.toLocaleString("vi-VN")}</td>
                        <td className="px-2 py-1.5 text-right text-muted-foreground">{r.costPrice.toLocaleString("vi-VN")}</td>
                        <td className="px-2 py-1.5 text-center">{r.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t bg-muted/30 rounded-b-lg">
          <p className="text-[11px] text-muted-foreground">
            {rows && stats.error > 0 ? (
              <span className="text-danger font-medium">⚠ Còn {stats.error} dòng lỗi — không thể nhập đến khi sửa xong.</span>
            ) : rows ? (
              <>Mỗi sản phẩm sẽ tạo kèm <strong>phân loại mặc định</strong> tự động.</>
            ) : ""}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className="px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-muted">Hủy</button>
            <button
              onClick={handleConfirm}
              disabled={!rows || stats.error > 0 || stats.ready + stats.warning === 0}
              title={stats.error > 0 ? "Còn dòng lỗi — vui lòng sửa trước" : ""}
              className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nhập {stats.ready + stats.warning > 0 ? `${stats.ready + stats.warning} dòng (+ phân loại mặc định)` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
