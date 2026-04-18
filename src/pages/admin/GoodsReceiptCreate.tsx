import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, AlertTriangle, ArrowLeft, Check, FileSpreadsheet, FileText, Package, Plus, Printer, RefreshCw, Save, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { DateInput } from "@/components/shared/DateInput";
import { BarcodePrintDialog } from "@/components/shared/BarcodePrintDialog";
import { SearchableCombobox } from "@/components/shared/SearchableCombobox";
import { SupplierFormDrawer } from "@/components/shared/SupplierFormDrawer";
import { ReceiptImportPreviewDialog } from "@/components/shared/ReceiptImportPreviewDialog";
import { importStaging } from "@/lib/import-staging";
import { draftActions } from "@/lib/drafts";
import { formatVND } from "@/lib/format";
import type { ReceiptImportOutcome, ReceiptImportRow } from "@/lib/import-types";
import { supplierActions, useStore } from "@/lib/store";
import { products as seedProducts } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ReceiptLineDraft {
  id: string;
  sourceRow: number;
  status: ReceiptImportRow["status"];
  outcome: ReceiptImportOutcome;
  message?: string;
  productCode: string;
  variantCode: string;
  productName: string;
  variantName: string;
  category: string;
  newProductUnit: string;
  importUnit: string;
  sellUnit: string;
  piecesPerUnit: number;
  quantity: number;
  unitCost: number;
  sellPrice: number;
  discountPercent: number;
  expiryDate: string;
  expiryDays: number;
  expiryMode: "date" | "days";
  note: string;
  fromImport: boolean;
}

interface LineIssue {
  errors: string[];
  warnings: string[];
}

const initialLines: ReceiptLineDraft[] = [];

function createLineId(prefix = "line") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function convertImportedRow(row: ReceiptImportRow, receiptDate: string, index: number): ReceiptLineDraft {
  const expiryMode: "date" | "days" = row.expiryDate ? "date" : row.expiryDays ? "days" : "date";
  const expiryDate = row.expiryDate || (row.expiryDays ? new Date(new Date(receiptDate).getTime() + row.expiryDays * 86400000).toISOString().slice(0, 10) : "");
  return {
    id: createLineId(`imp-${index}`),
    sourceRow: row.sourceRow,
    status: row.status,
    outcome: row.outcome,
    message: row.message,
    productCode: row.productCode,
    variantCode: row.variantCode,
    productName: row.productName,
    variantName: row.variantName,
    category: row.category || "",
    newProductUnit: row.newProductUnit || "",
    importUnit: row.importUnit,
    sellUnit: row.sellUnit,
    piecesPerUnit: row.piecesPerUnit,
    quantity: row.quantity,
    unitCost: row.unitCost,
    sellPrice: row.sellPrice,
    discountPercent: row.discountPercent,
    expiryDate,
    expiryDays: row.expiryDays || 0,
    expiryMode,
    note: row.note || "",
    fromImport: true,
  };
}

function inferOutcome(line: ReceiptLineDraft): { outcome: ReceiptImportOutcome; message?: string } {
  const product = seedProducts.find((item) => item.code.toUpperCase() === line.productCode.trim().toUpperCase());
  if (!product) {
    return {
      outcome: "create-product-and-variant",
      message: `Tạo mới sản phẩm ${line.productCode || "(chưa có mã)"} và phân loại ${line.variantCode || line.variantName || "mặc định"}.`,
    };
  }
  if (!line.variantCode.trim()) {
    const variant = product.variants.find((item) => item.isDefault) ?? product.variants[0];
    return {
      outcome: variant?.importUnit ? "use-default-variant" : "update-legacy-unit",
      message: `Dùng phân loại mặc định ${variant?.name ?? ""}.`,
    };
  }
  const variant = product.variants.find((item) => item.code.toUpperCase() === line.variantCode.trim().toUpperCase());
  if (!variant) {
    return {
      outcome: "create-variant",
      message: `Tạo phân loại mới ${line.variantCode} cho ${product.name}.`,
    };
  }
  return {
    outcome: variant.importUnit ? "update-pricing" : "update-legacy-unit",
    message: variant.importUnit ? "Cập nhật giá / tồn cho phân loại đã có." : "Bổ sung đơn vị cho phân loại cũ.",
  };
}

function validateImportedLine(line: ReceiptLineDraft): LineIssue {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!line.productCode.trim()) errors.push("Thiếu mã sản phẩm.");
  if (!line.productName.trim()) warnings.push("Thiếu tên sản phẩm hiển thị.");
  if (line.quantity <= 0) errors.push("Số lượng phải lớn hơn 0.");
  if (line.unitCost <= 0) errors.push("Giá nhập phải lớn hơn 0.");
  if (!line.importUnit.trim()) errors.push("Thiếu đơn vị nhập kho.");
  if (!line.sellUnit.trim()) errors.push("Thiếu đơn vị bán lẻ.");
  if (line.piecesPerUnit <= 0) errors.push("Số lẻ/đơn vị phải lớn hơn 0.");
  if (line.discountPercent < 0 || line.discountPercent > 100) errors.push("Chiết khấu phải từ 0-100%.");
  if (line.expiryMode === "date" && !line.expiryDate) warnings.push("Chưa có ngày HSD thực tế.");
  if (line.expiryMode === "days" && line.expiryDays <= 0) errors.push("Số ngày HSD phải lớn hơn 0.");

  const product = seedProducts.find((item) => item.code.toUpperCase() === line.productCode.trim().toUpperCase());
  if (!product) {
    if (!line.category.trim()) errors.push("SP mới phải có danh mục.");
    if (!line.productName.trim()) errors.push("SP mới phải có tên sản phẩm.");
  } else if (line.variantCode.trim()) {
    const variant = product.variants.find((item) => item.code.toUpperCase() === line.variantCode.trim().toUpperCase());
    if (variant && variant.importUnit && variant.importUnit.trim().toUpperCase() !== line.importUnit.trim().toUpperCase()) {
      errors.push(`Variant ${line.variantCode} đang dùng ${variant.importUnit}/${variant.piecesPerImportUnit}, Excel lại là ${line.importUnit}/${line.piecesPerUnit}.`);
    }
  }

  if (line.sellPrice > 0 && line.unitCost > 0 && line.sellPrice < line.unitCost) warnings.push("Giá bán đang thấp hơn giá nhập.");
  const knownVariant = seedProducts.flatMap((productItem) => productItem.variants).find((variant) => variant.code === line.variantCode);
  if (knownVariant && line.unitCost > knownVariant.costPrice * 2) warnings.push(`Giá nhập cao bất thường so với giá gần nhất ${formatVND(knownVariant.costPrice)}.`);
  if (!line.variantCode.trim()) warnings.push("Để trống mã variant — hệ thống sẽ dùng default variant nếu SP đã có.");
  return { errors, warnings };
}

function revalidateLines(lines: ReceiptLineDraft[]) {
  return lines.map((line) => {
    const issue = validateImportedLine(line);
    const inferred = inferOutcome(line);
    return {
      ...line,
      status: issue.errors.length ? "error" : issue.warnings.length ? "warning" : "ready",
      outcome: inferred.outcome,
      message: issue.errors[0] ?? issue.warnings[0] ?? inferred.message,
    };
  });
}

export default function AdminGoodsReceiptCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const draftId = params.get("draft");
  const isImportMode = params.get("mode") === "import";
  const { suppliers } = useStore();
  const [lines, setLines] = useState<ReceiptLineDraft[]>(initialLines);
  const [supplier, setSupplier] = useState("");
  const [shippingFee, setShippingFee] = useState(50000);
  const [vat, setVat] = useState(10);
  const [note, setNote] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [draftNumber, setDraftNumber] = useState<string | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [supplierDrawerOpen, setSupplierDrawerOpen] = useState(false);
  const [supplierSeedName, setSupplierSeedName] = useState("");
  const [importedFilename, setImportedFilename] = useState<string | null>(null);
  const [validationTick, setValidationTick] = useState(0);

  useEffect(() => {
    if (!isImportMode) return;
    const stage = importStaging.takeReceipt();
    if (!stage) return;
    const nextReceiptDate = stage.meta?.receiptDate || new Date().toISOString().slice(0, 10);
    setReceiptDate(nextReceiptDate);
    setImportedFilename(stage.filename);
    setSupplier("");
    setLines(revalidateLines(stage.rows.map((row, index) => convertImportedRow(row, nextReceiptDate, index))));
    toast.success(`Đã nạp ${stage.rows.length} dòng từ ${stage.filename} vào màn review phiếu nhập.`);
  }, [isImportMode]);

  useEffect(() => {
    if (!draftId) return;
    const draft = draftActions.get(draftId);
    if (!draft) return;
    setLines(revalidateLines(draft.lines.map((line: any, index: number) => ({
      id: line.id || createLineId(`draft-${index}`),
      sourceRow: 0,
      status: "ready",
      outcome: "ok",
      message: undefined,
      productCode: line.variantCode,
      variantCode: line.variantCode,
      productName: line.productName,
      variantName: line.variantName,
      category: "",
      newProductUnit: "",
      importUnit: line.importUnit,
      sellUnit: line.sellUnit || line.importUnit,
      piecesPerUnit: line.piecesPerUnit,
      quantity: line.quantity,
      unitCost: line.unitCost,
      sellPrice: 0,
      discountPercent: line.discount,
      expiryDate: line.expiryDate || "",
      expiryDays: line.expiryDays || 0,
      expiryMode: line.expiryDays ? "days" : "date",
      note: "",
      fromImport: false,
    }))));
    setSupplier(draft.supplierId);
    setShippingFee(draft.shippingFee);
    setVat(draft.vat);
    setNote(draft.note);
    setReceiptDate(draft.receiptDate);
    setDraftNumber(draft.number);
    setCurrentDraftId(draft.id);
    toast.info(`Đã mở phiếu nháp ${draft.number}.`);
  }, [draftId]);

  const supplierOptions = useMemo(
    () => suppliers.filter((item) => item.active).map((item) => ({ id: item.id, label: item.name, sub: `${item.code} · ${item.phone}` })),
    [suppliers]
  );

  const lineIssues = useMemo(() => {
    const map = new Map<string, LineIssue>();
    lines.forEach((line) => map.set(line.id, validateImportedLine(line)));
    return map;
  }, [lines, validationTick]);

  const totalLineErrors = useMemo(() => Array.from(lineIssues.values()).reduce((sum, issue) => sum + issue.errors.length, 0), [lineIssues]);
  const totalLineWarnings = useMemo(() => Array.from(lineIssues.values()).reduce((sum, issue) => sum + issue.warnings.length, 0), [lineIssues]);
  const importedLineCount = lines.filter((line) => line.fromImport).length;
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.unitCost * line.quantity * (1 - line.discountPercent / 100), 0), [lines]);
  const vatAmount = subtotal * vat / 100;
  const total = subtotal + shippingFee + vatAmount;
  const today = new Date().toISOString().slice(0, 10);
  const futureDateError = receiptDate > today;
  const missingSupplier = !supplier;
  const canSave = lines.length > 0 && !missingSupplier && !futureDateError && totalLineErrors === 0;

  const syncLine = (id: string, patch: Partial<ReceiptLineDraft>) => {
    setLines((prev) => revalidateLines(prev.map((line) => {
      if (line.id !== id) return line;
      const merged = { ...line, ...patch };
      if (patch.expiryMode === "date") merged.expiryDays = 0;
      if (patch.expiryMode === "days" && merged.expiryDays > 0) {
        merged.expiryDate = new Date(new Date(receiptDate).getTime() + merged.expiryDays * 86400000).toISOString().slice(0, 10);
      }
      return merged;
    })));
  };

  const handleRevalidate = () => {
    setLines((prev) => revalidateLines(prev));
    setValidationTick((value) => value + 1);
    toast.info("Đã revalidate toàn bộ dòng phiếu nhập.");
  };

  const removeLine = (id: string) => setLines((prev) => prev.filter((line) => line.id !== id));

  const addManualLine = () => {
    if (!search.trim()) return;
    const nextLine: ReceiptLineDraft = {
      id: createLineId("manual"),
      sourceRow: 0,
      status: "warning",
      outcome: "create-product-and-variant",
      message: "Dòng thêm tay cần điền đủ metadata trước khi lưu.",
      productCode: search.trim().toUpperCase().replace(/\s+/g, "-"),
      variantCode: "",
      productName: search.trim(),
      variantName: "Mặc định",
      category: "",
      newProductUnit: "",
      importUnit: "Cái",
      sellUnit: "Cái",
      piecesPerUnit: 1,
      quantity: 1,
      unitCost: 0,
      sellPrice: 0,
      discountPercent: 0,
      expiryDate: "",
      expiryDays: 0,
      expiryMode: "date",
      note: "",
      fromImport: false,
    };
    setLines((prev) => revalidateLines([...prev, nextLine]));
    setSearch("");
  };

  const handleSaveDraft = () => {
    if (lines.length === 0) {
      toast.error("Chưa có dòng nào để lưu nháp.");
      return;
    }
    const supplierName = suppliers.find((item) => item.id === supplier)?.name ?? "— Chưa chọn NCC —";
    const number = draftNumber ?? `DRAFT-${receiptDate.replace(/-/g, "")}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const saved = draftActions.save({
      id: currentDraftId ?? undefined,
      number,
      supplierId: supplier,
      supplierName,
      receiptDate,
      shippingFee,
      vat,
      note,
      lines: lines.map((line) => ({
        id: line.id,
        productName: line.productName,
        variantName: line.variantName,
        variantCode: line.variantCode || line.productCode,
        quantity: line.quantity,
        unitCost: line.unitCost,
        discount: line.discountPercent,
        importUnit: line.importUnit,
        sellUnit: line.sellUnit,
        piecesPerUnit: line.piecesPerUnit,
        expiryDate: line.expiryDate,
        expiryDays: line.expiryDays,
      })),
    });
    setDraftNumber(saved.number);
    setCurrentDraftId(saved.id);
    toast.success(`Đã lưu nháp ${saved.number}.`);
  };

  const handleSave = () => {
    if (!canSave) {
      if (futureDateError) toast.error("Ngày nhập không thể ở tương lai.");
      else if (missingSupplier) toast.error("Vui lòng chọn nhà cung cấp.");
      else toast.error("Còn lỗi blocking trong danh sách hàng.");
      return;
    }
    const number = `PN-${receiptDate.replace(/-/g, "")}-${String(Math.floor(Math.random() * 900) + 100)}`;
    setSavedNumber(number);
    if (currentDraftId) {
      draftActions.remove(currentDraftId);
      setCurrentDraftId(null);
      setDraftNumber(null);
    }
    toast.success(`Đã lưu phiếu nhập ${number}.`);
  };

  const supplierName = suppliers.find((item) => item.id === supplier)?.name ?? "";

  return (
    <div className="admin-dense space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/goods-receipts" className="flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Phiếu nhập</Link>
        <span>/</span>
        <span className="font-medium text-foreground">/admin/goods-receipts/create</span>
        {isImportMode && <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2 py-0.5 text-[11px] text-info"><FileSpreadsheet className="h-3 w-3" /> Import mode</span>}
      </div>

      {isImportMode && (
        <div className="flex items-start gap-2 rounded-lg border border-info/20 bg-info-soft p-3 text-sm text-info">
          <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>Màn create này là workspace review/fix duy nhất cho import phiếu nhập.</strong>
            <span className="ml-1">{importedFilename ? `Nguồn: ${importedFilename}.` : ""} Sửa metadata, sửa từng dòng, revalidate rồi mới lưu phiếu.</span>
          </div>
        </div>
      )}

      {savedNumber && (
        <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success-soft p-3 text-sm text-success">
          <Check className="h-4 w-4 shrink-0" /> Đã lưu phiếu nhập <strong>{savedNumber}</strong>.
        </div>
      )}

      {futureDateError && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" /> Ngày nhập không thể ở tương lai.
        </div>
      )}

      {totalLineErrors > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Còn <strong>{totalLineErrors} lỗi blocking</strong> trong dữ liệu import, nên nút lưu phiếu đang bị khóa.</span>
        </div>
      )}

      {totalLineWarnings > 0 && totalLineErrors === 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning-soft p-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Có <strong>{totalLineWarnings} cảnh báo</strong>; bạn vẫn có thể lưu sau khi kiểm tra.</span>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-3 lg:gap-4">
        <div className="space-y-3 lg:col-span-2">
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">Metadata phiếu nhập</h3>
                <p className="text-xs text-muted-foreground">Nhà cung cấp và ngày nhập là điều kiện bắt buộc trước khi lưu.</p>
              </div>
              <button onClick={handleRevalidate} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                <RefreshCw className="h-3.5 w-3.5" /> Revalidate
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Ngày nhập *</label>
                <DateInput value={receiptDate} onChange={(value) => { setReceiptDate(value); setLines((prev) => revalidateLines(prev)); }} className={cn("mt-1 w-full h-8", futureDateError && "border-danger")} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nhà cung cấp *</label>
                <SearchableCombobox
                  className="mt-1"
                  value={supplier}
                  onChange={setSupplier}
                  invalid={missingSupplier}
                  placeholder="Tìm hoặc tạo NCC"
                  options={supplierOptions}
                  onCreateNew={(query) => {
                    setSupplierSeedName(query);
                    setSupplierDrawerOpen(true);
                  }}
                  createLabel="Tạo NCC mới"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phí vận chuyển</label>
                <input type="number" value={shippingFee} onChange={(event) => setShippingFee(Number(event.target.value))} className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">VAT (%)</label>
                <input type="number" value={vat} onChange={(event) => setVat(Number(event.target.value))} className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">Ghi chú phiếu</label>
              <input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 h-8 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Ghi chú chung cho phiếu nhập" />
            </div>

            {missingSupplier && <p className="mt-2 text-[11px] text-danger">Chưa chọn nhà cung cấp.</p>}
            {!!supplierName && <p className="mt-2 text-[11px] text-muted-foreground">Đang chọn: <strong>{supplierName}</strong></p>}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addManualLine()} placeholder="Thêm dòng thủ công bằng mã/tên" className="h-8 w-full rounded-md border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <button onClick={addManualLine} disabled={!search.trim()} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50">Thêm</button>
            <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"><Upload className="h-3.5 w-3.5" /> Nhập Excel</button>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="min-w-[1450px] w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Mã / tên SP</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Variant</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Danh mục / ĐV SP mới</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">SL</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">ĐV nhập / bán / quy đổi</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Giá nhập / bán</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">CK%</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">HSD</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Validation</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const issue = lineIssues.get(line.id) ?? { errors: [], warnings: [] };
                  const hasError = issue.errors.length > 0;
                  const hasWarning = !hasError && issue.warnings.length > 0;
                  return (
                    <tr key={line.id} className={cn("border-b last:border-0 align-top", hasError && "bg-danger-soft/30", hasWarning && "bg-warning-soft/20")}>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {index + 1}
                        {line.sourceRow > 0 && <div className="text-[10px]">Excel #{line.sourceRow}</div>}
                      </td>
                      <td className="px-3 py-2">
                        <input value={line.productCode} onChange={(event) => syncLine(line.id, { productCode: event.target.value.toUpperCase() })} className={cn("mb-1 h-7 w-full rounded border bg-background px-2 text-[11px] font-mono", !line.productCode.trim() && "border-danger")} placeholder="Mã SP" />
                        <input value={line.productName} onChange={(event) => syncLine(line.id, { productName: event.target.value })} className="h-7 w-full rounded border bg-background px-2 text-[11px]" placeholder="Tên SP" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={line.variantCode} onChange={(event) => syncLine(line.id, { variantCode: event.target.value.toUpperCase() })} className="mb-1 h-7 w-full rounded border bg-background px-2 text-[11px] font-mono" placeholder="Mã variant" />
                        <input value={line.variantName} onChange={(event) => syncLine(line.id, { variantName: event.target.value })} className="h-7 w-full rounded border bg-background px-2 text-[11px]" placeholder="Tên variant" />
                      </td>
                      <td className="px-3 py-2">
                        <input value={line.category} onChange={(event) => syncLine(line.id, { category: event.target.value })} className={cn("mb-1 h-7 w-full rounded border bg-background px-2 text-[11px]", !line.category.trim() && !seedProducts.some((item) => item.code.toUpperCase() === line.productCode.toUpperCase()) && "border-danger")} placeholder="Danh mục (SP mới)" />
                        <input value={line.newProductUnit} onChange={(event) => syncLine(line.id, { newProductUnit: event.target.value })} className="h-7 w-full rounded border bg-background px-2 text-[11px]" placeholder="Đơn vị SP mới" />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="number" value={line.quantity} onChange={(event) => syncLine(line.id, { quantity: Number(event.target.value) })} className={cn("h-7 w-20 rounded border bg-background px-2 text-center text-[11px]", line.quantity <= 0 && "border-danger")} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="grid grid-cols-3 gap-1">
                          <input value={line.importUnit} onChange={(event) => syncLine(line.id, { importUnit: event.target.value })} className={cn("h-7 rounded border bg-background px-2 text-[11px]", !line.importUnit.trim() && "border-danger")} placeholder="ĐV nhập" />
                          <input value={line.sellUnit} onChange={(event) => syncLine(line.id, { sellUnit: event.target.value })} className={cn("h-7 rounded border bg-background px-2 text-[11px]", !line.sellUnit.trim() && "border-danger")} placeholder="ĐV bán" />
                          <input type="number" value={line.piecesPerUnit} onChange={(event) => syncLine(line.id, { piecesPerUnit: Number(event.target.value) })} className={cn("h-7 rounded border bg-background px-2 text-center text-[11px]", line.piecesPerUnit <= 0 && "border-danger")} placeholder="Quy đổi" />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="grid grid-cols-2 gap-1">
                          <input type="number" value={line.unitCost} onChange={(event) => syncLine(line.id, { unitCost: Number(event.target.value) })} className={cn("h-7 rounded border bg-background px-2 text-right text-[11px]", line.unitCost <= 0 && "border-danger")} placeholder="Giá nhập" />
                          <input type="number" value={line.sellPrice} onChange={(event) => syncLine(line.id, { sellPrice: Number(event.target.value) })} className="h-7 rounded border bg-background px-2 text-right text-[11px]" placeholder="Giá bán" />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="number" value={line.discountPercent} onChange={(event) => syncLine(line.id, { discountPercent: Number(event.target.value) })} className={cn("h-7 w-16 rounded border bg-background px-2 text-center text-[11px]", (line.discountPercent < 0 || line.discountPercent > 100) && "border-danger")} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <select value={line.expiryMode} onChange={(event) => syncLine(line.id, { expiryMode: event.target.value as "date" | "days" })} className="h-7 rounded border bg-background px-2 text-[11px]">
                            <option value="date">Ngày</option>
                            <option value="days">Số ngày</option>
                          </select>
                          {line.expiryMode === "date" ? (
                            <DateInput allowFuture value={line.expiryDate} onChange={(value) => syncLine(line.id, { expiryDate: value })} className="h-7" />
                          ) : (
                            <input type="number" value={line.expiryDays} onChange={(event) => syncLine(line.id, { expiryDays: Number(event.target.value) })} className={cn("h-7 w-20 rounded border bg-background px-2 text-center text-[11px]", line.expiryDays <= 0 && "border-danger")} placeholder="Ngày" />
                          )}
                        </div>
                        <input value={line.note} onChange={(event) => syncLine(line.id, { note: event.target.value })} className="mt-1 h-7 w-full rounded border bg-background px-2 text-[11px]" placeholder="Ghi chú dòng" />
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        <div className="space-y-1">
                          <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", line.status === "error" && "bg-danger-soft text-danger", line.status === "warning" && "bg-warning-soft text-warning", line.status === "ready" && "bg-success-soft text-success")}>
                            {line.status === "error" ? <AlertCircle className="h-3 w-3" /> : line.status === "warning" ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />} {line.outcome}
                          </div>
                          {issue.errors.map((message, issueIndex) => <div key={`e-${issueIndex}`} className="flex items-start gap-1 text-danger"><AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> <span>{message}</span></div>)}
                          {issue.warnings.map((message, issueIndex) => <div key={`w-${issueIndex}`} className="flex items-start gap-1 text-warning"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> <span>{message}</span></div>)}
                          {line.message && <div className="text-muted-foreground">{line.message}</div>}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => removeLine(line.id)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-danger" title="Xóa dòng"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {lines.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" /> Chưa có dòng nhập nào.
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 lg:mt-0">
          <div className="space-y-3 rounded-lg border bg-card p-4 lg:sticky lg:top-20">
            <h3 className="text-sm font-semibold">Tổng kết & hành động</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Dòng hàng</span><span>{lines.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dòng import</span><span>{importedLineCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phí ship</span><span>{formatVND(shippingFee)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT ({vat}%)</span><span>{formatVND(vatAmount)}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Tổng cộng</span><span className="text-primary">{formatVND(total)}</span></div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-md bg-success-soft p-2 text-success">OK: {lines.filter((line) => (lineIssues.get(line.id)?.errors.length ?? 0) === 0 && (lineIssues.get(line.id)?.warnings.length ?? 0) === 0).length}</div>
              <div className="rounded-md bg-warning-soft p-2 text-warning">Warning: {lines.filter((line) => (lineIssues.get(line.id)?.errors.length ?? 0) === 0 && (lineIssues.get(line.id)?.warnings.length ?? 0) > 0).length}</div>
              <div className="rounded-md bg-danger-soft p-2 text-danger">Error: {lines.filter((line) => (lineIssues.get(line.id)?.errors.length ?? 0) > 0).length}</div>
            </div>

            {!savedNumber ? (
              <div className="space-y-2 pt-2">
                <button onClick={handleSave} disabled={!canSave} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" /> Lưu phiếu nhập</button>
                <button onClick={handleSaveDraft} className="flex w-full items-center justify-center gap-2 rounded-md border py-2 text-sm font-medium hover:bg-muted"><FileText className="h-4 w-4" /> {currentDraftId ? "Cập nhật nháp" : "Lưu nháp"}</button>
                <button onClick={handleRevalidate} className="flex w-full items-center justify-center gap-2 rounded-md border py-2 text-sm font-medium hover:bg-muted"><RefreshCw className="h-4 w-4" /> Revalidate</button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <button onClick={() => setBarcodeOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"><Printer className="h-4 w-4" /> In mã vạch</button>
                <button onClick={() => navigate("/admin/goods-receipts")} className="w-full rounded-md border py-2 text-sm font-medium hover:bg-muted">Về danh sách</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReceiptImportPreviewDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <SupplierFormDrawer open={supplierDrawerOpen} onClose={() => setSupplierDrawerOpen(false)} supplier={undefined} />
      <BarcodePrintDialog
        open={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
        title={`In mã vạch — ${savedNumber ?? draftNumber ?? "phiếu nhập"}`}
        items={lines.map((line) => ({
          productName: line.productName,
          variantName: line.variantName,
          code: line.variantCode || line.productCode,
          price: line.sellPrice,
          lot: savedNumber ?? draftNumber ?? receiptDate,
          defaultQty: line.quantity * line.piecesPerUnit,
        }))}
      />
    </div>
  );
}
