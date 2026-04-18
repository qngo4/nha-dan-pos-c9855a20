import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, FileSpreadsheet, Package, Plus, RefreshCw, Save, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStore, productActions, categoryActions } from "@/lib/store";
import type { ProductImportRow } from "@/lib/import-types";

interface DraftVariant {
  code: string;
  name: string;
  sellPrice: number;
  costPrice: number;
  stock: number;
  sellUnit: string;
  importUnit: string;
  piecesPerImportUnit: number;
  expiryDays: number;
  minStock: number;
  active: boolean;
  note: string;
}

interface DraftProduct {
  key: string;
  sourceRow: number;
  originalMessage?: string;
  code: string;
  name: string;
  category: string;
  variants: DraftVariant[];
  removed?: boolean;
}

interface VariantIssue {
  errors: string[];
  warnings: string[];
}

interface DraftIssue {
  errors: string[];
  warnings: string[];
  variants: VariantIssue[];
}

interface Props {
  filename: string;
  rows: ProductImportRow[];
  onCancel: () => void;
  onSaved: () => void;
}

function createDrafts(rows: ProductImportRow[]): DraftProduct[] {
  return rows.map((row, index) => ({
    key: `${row.code || "NEW"}-${row.sourceRow}-${index}`,
    sourceRow: row.sourceRow,
    originalMessage: row.message,
    code: row.code,
    name: row.name,
    category: row.category,
    variants: [
      {
        code: row.variantCode,
        name: row.variantName || "Mặc định",
        sellPrice: row.sellPrice,
        costPrice: row.costPrice,
        stock: row.stock,
        sellUnit: row.sellUnit,
        importUnit: row.importUnit || row.sellUnit,
        piecesPerImportUnit: row.piecesPerImportUnit || 1,
        expiryDays: row.expiryDays || 0,
        minStock: row.minStock || 5,
        active: row.active,
        note: row.note,
      },
    ],
  }));
}

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

function generateProductCode(name: string, category: string, usedCodes: Set<string>) {
  const base = (normalizeToken(category).slice(0, 3) + normalizeToken(name).slice(0, 5) || "SP").slice(0, 8) || "SP";
  let attempt = base;
  let counter = 1;
  while (!attempt || usedCodes.has(attempt)) {
    attempt = `${base.slice(0, 6)}${String(counter).padStart(2, "0")}`;
    counter += 1;
  }
  usedCodes.add(attempt);
  return attempt;
}

function validateDraft(draft: DraftProduct, existingCodes: Set<string>, duplicateCodes: Set<string>): DraftIssue {
  const errors: string[] = [];
  const warnings: string[] = [];
  const variants = draft.variants.map<VariantIssue>((variant, index) => {
    const variantErrors: string[] = [];
    const variantWarnings: string[] = [];
    if (!variant.name.trim()) variantErrors.push("Thiếu tên phân loại.");
    if (variant.sellPrice <= 0) variantErrors.push("Giá bán phải lớn hơn 0.");
    if (variant.costPrice <= 0) variantErrors.push("Giá vốn phải lớn hơn 0.");
    if (!variant.sellUnit.trim()) variantErrors.push("Thiếu đơn vị bán lẻ.");
    if (!variant.importUnit.trim()) variantWarnings.push("Thiếu đơn vị nhập — sẽ dùng đơn vị bán.");
    if (variant.piecesPerImportUnit <= 0) variantErrors.push("Số lẻ/đơn vị nhập phải lớn hơn 0.");
    if (variant.minStock < 0) variantErrors.push("Tồn tối thiểu không hợp lệ.");
    if (variant.stock < 0) variantErrors.push("Tồn ban đầu không hợp lệ.");
    if (variant.costPrice > 0 && variant.sellPrice > 0 && variant.sellPrice < variant.costPrice) variantWarnings.push("Giá bán thấp hơn giá vốn.");
    if (!variant.code.trim()) variantWarnings.push(`Phân loại #${index + 1} sẽ được sinh mã khi lưu.`);
    return { errors: variantErrors, warnings: variantWarnings };
  });

  if (!draft.name.trim()) errors.push("Thiếu tên sản phẩm.");
  if (!draft.category.trim()) errors.push("Thiếu danh mục.");
  if (draft.code && existingCodes.has(draft.code.trim().toUpperCase())) errors.push(`Mã SP ${draft.code} đã tồn tại.`);
  if (draft.code && duplicateCodes.has(draft.code.trim().toUpperCase())) errors.push(`Mã SP ${draft.code} bị trùng trong file import.`);
  if (!draft.code.trim()) warnings.push("Để trống mã SP — hệ thống sẽ tự sinh mã khi lưu.");
  if (draft.variants.length === 0) errors.push("Sản phẩm phải có ít nhất 1 phân loại.");
  if (draft.originalMessage) warnings.push(`Từ parser: ${draft.originalMessage}`);
  return { errors, warnings, variants };
}

export function ProductImportReview({ filename, rows, onCancel, onSaved }: Props) {
  const navigate = useNavigate();
  const { categories, products } = useStore();
  const [drafts, setDrafts] = useState<DraftProduct[]>(() => createDrafts(rows));
  const [validationTick, setValidationTick] = useState(0);

  const activeDrafts = useMemo(() => drafts.filter((draft) => !draft.removed), [drafts]);
  const existingCodes = useMemo(() => new Set(products.map((product) => product.code.toUpperCase())), [products]);
  const duplicateCodes = useMemo(() => {
    const counts = new Map<string, number>();
    activeDrafts.forEach((draft) => {
      const code = draft.code.trim().toUpperCase();
      if (!code) return;
      counts.set(code, (counts.get(code) ?? 0) + 1);
    });
    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([code]) => code));
  }, [activeDrafts, validationTick]);

  const issues = useMemo(() => {
    const map = new Map<string, DraftIssue>();
    activeDrafts.forEach((draft) => {
      map.set(draft.key, validateDraft(draft, existingCodes, duplicateCodes));
    });
    return map;
  }, [activeDrafts, duplicateCodes, existingCodes, validationTick]);

  const stats = useMemo(() => {
    let err = 0;
    let warn = 0;
    let ok = 0;
    activeDrafts.forEach((draft) => {
      const issue = issues.get(draft.key);
      const variantErrors = issue?.variants.reduce((sum, variant) => sum + variant.errors.length, 0) ?? 0;
      const variantWarnings = issue?.variants.reduce((sum, variant) => sum + variant.warnings.length, 0) ?? 0;
      if ((issue?.errors.length ?? 0) + variantErrors > 0) err += 1;
      else if ((issue?.warnings.length ?? 0) + variantWarnings > 0) warn += 1;
      else ok += 1;
    });
    return { total: activeDrafts.length, err, warn, ok };
  }, [activeDrafts, issues]);

  const updateDraft = (key: string, patch: Partial<DraftProduct>) => {
    setDrafts((prev) => prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  };

  const updateVariant = (key: string, index: number, patch: Partial<DraftVariant>) => {
    setDrafts((prev) => prev.map((draft) => (
      draft.key === key
        ? { ...draft, variants: draft.variants.map((variant, variantIndex) => (variantIndex === index ? { ...variant, ...patch } : variant)) }
        : draft
    )));
  };

  const addVariant = (key: string) => {
    setDrafts((prev) => prev.map((draft) => (
      draft.key === key
        ? {
            ...draft,
            variants: [
              ...draft.variants,
              {
                code: draft.code ? `${draft.code}-${String(draft.variants.length + 1).padStart(2, "0")}` : "",
                name: "",
                sellPrice: 0,
                costPrice: 0,
                stock: 0,
                sellUnit: draft.variants[0]?.sellUnit || "Cái",
                importUnit: draft.variants[0]?.importUnit || draft.variants[0]?.sellUnit || "Cái",
                piecesPerImportUnit: draft.variants[0]?.piecesPerImportUnit || 1,
                expiryDays: draft.variants[0]?.expiryDays || 0,
                minStock: draft.variants[0]?.minStock || 5,
                active: true,
                note: "",
              },
            ],
          }
        : draft
    )));
  };

  const removeVariant = (key: string, index: number) => {
    setDrafts((prev) => prev.map((draft) => (
      draft.key === key && draft.variants.length > 1
        ? { ...draft, variants: draft.variants.filter((_, variantIndex) => variantIndex !== index) }
        : draft
    )));
  };

  const handleRevalidate = () => {
    setValidationTick((value) => value + 1);
    toast.info(`Đã revalidate ${activeDrafts.length} sản phẩm import.`);
  };

  const handleSaveAll = () => {
    if (stats.err > 0) {
      toast.error(`Còn ${stats.err} sản phẩm có lỗi.`);
      return;
    }
    if (stats.total === 0) {
      toast.error("Không còn sản phẩm nào để lưu.");
      return;
    }

    const usedCodes = new Set<string>([...existingCodes]);
    let createdProducts = 0;
    let createdVariants = 0;
    let createdCategories = 0;

    activeDrafts.forEach((draft) => {
      let category = categories.find((item) => item.name.trim().toLowerCase() === draft.category.trim().toLowerCase());
      if (!category) {
        category = categoryActions.create({ name: draft.category.trim(), description: "Tạo từ import Excel" });
        createdCategories += 1;
      }

      const productCode = draft.code.trim() || generateProductCode(draft.name, draft.category, usedCodes);
      usedCodes.add(productCode);
      const createdProduct = productActions.create({
        code: productCode,
        name: draft.name.trim(),
        categoryId: category.id,
        categoryName: category.name,
        image: "",
        active: draft.variants.some((variant) => variant.active),
        type: draft.variants.length > 1 ? "multi" : "single",
        variants: [],
      });
      createdProducts += 1;

      draft.variants.forEach((variant, index) => {
        const variantCode = variant.code.trim() || `${productCode}-${String(index + 1).padStart(2, "0")}`;
        productActions.addVariant(createdProduct.id, {
          code: variantCode,
          name: variant.name.trim(),
          sellUnit: variant.sellUnit.trim(),
          importUnit: (variant.importUnit || variant.sellUnit).trim(),
          piecesPerImportUnit: variant.piecesPerImportUnit || 1,
          sellPrice: variant.sellPrice,
          costPrice: variant.costPrice,
          stock: variant.stock,
          minStock: variant.minStock,
          expiryDays: variant.expiryDays,
          isDefault: index === 0,
        });
        createdVariants += 1;
      });
    });

    toast.success(`Đã tạo ${createdProducts} sản phẩm · ${createdVariants} phân loại${createdCategories ? ` · ${createdCategories} danh mục mới` : ""}.`);
    onSaved();
    navigate("/admin/products", { replace: true });
  };

  return (
    <div className="space-y-4 admin-dense pb-20 lg:pb-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/products" className="flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Sản phẩm
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">/admin/products/new · Import mode</span>
      </div>

      <PageHeader
        title="Review sản phẩm từ Excel"
        description="Create screen này là workspace duy nhất để sửa lỗi, revalidate và lưu import."
        actions={
          <div className="flex gap-2">
            <button onClick={handleRevalidate} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
              <RefreshCw className="h-3.5 w-3.5" /> Revalidate
            </button>
            <button onClick={onCancel} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">Hủy</button>
            <button
              onClick={handleSaveAll}
              disabled={stats.err > 0 || stats.total === 0}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> Lưu import ({stats.total})
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2 py-1 text-info"><FileSpreadsheet className="h-3 w-3" /> {filename}</span>
        <span className="rounded-full bg-success-soft px-2 py-1 text-success">{stats.ok} sẵn sàng</span>
        <span className="rounded-full bg-warning-soft px-2 py-1 text-warning">{stats.warn} cảnh báo</span>
        <span className="rounded-full bg-danger-soft px-2 py-1 text-danger">{stats.err} lỗi chặn lưu</span>
      </div>

      {stats.err > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Còn lỗi blocking trong file import, nên nút lưu đang bị khóa cho tới khi sửa xong.</span>
        </div>
      )}

      <div className="space-y-3">
        {activeDrafts.map((draft) => {
          const issue = issues.get(draft.key) ?? { errors: [], warnings: [], variants: [] };
          const hasError = issue.errors.length > 0 || issue.variants.some((variant) => variant.errors.length > 0);
          const hasWarning = !hasError && (issue.warnings.length > 0 || issue.variants.some((variant) => variant.warnings.length > 0));
          return (
            <div
              key={draft.key}
              className={cn(
                "overflow-hidden rounded-lg border bg-card",
                hasError && "border-danger/40 ring-1 ring-danger/20",
                hasWarning && "border-warning/40 ring-1 ring-warning/20"
              )}
            >
              <div className="border-b bg-muted/30 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <Package className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Dòng Excel #{draft.sourceRow}</div>
                      <div className="mt-1 grid gap-2 md:grid-cols-3">
                        <input
                          value={draft.code}
                          onChange={(event) => updateDraft(draft.key, { code: event.target.value.toUpperCase() })}
                          placeholder="Mã SP (có thể để trống)"
                          className={cn("h-8 rounded-md border bg-background px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring", hasError && !draft.code.trim() && "border-warning")}
                        />
                        <input
                          value={draft.name}
                          onChange={(event) => updateDraft(draft.key, { name: event.target.value })}
                          placeholder="Tên sản phẩm"
                          className={cn("h-8 rounded-md border bg-background px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring", !draft.name.trim() && "border-danger")}
                        />
                        <select
                          value={draft.category}
                          onChange={(event) => updateDraft(draft.key, { category: event.target.value })}
                          className={cn("h-8 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring", !draft.category.trim() && "border-danger")}
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.filter((category) => category.active).map((category) => (
                            <option key={category.id} value={category.name}>{category.name}</option>
                          ))}
                          {draft.category && !categories.some((category) => category.name === draft.category) && <option value={draft.category}>{draft.category} (mới)</option>}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => updateDraft(draft.key, { removed: true })} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-danger" title="Bỏ khỏi import">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {(issue.errors.length > 0 || issue.warnings.length > 0) && (
                  <div className="mt-2 space-y-1 text-[11px]">
                    {issue.errors.map((message, index) => (
                      <div key={`error-${index}`} className="flex items-center gap-1 text-danger"><AlertCircle className="h-3 w-3" /> {message}</div>
                    ))}
                    {issue.warnings.map((message, index) => (
                      <div key={`warning-${index}`} className="flex items-center gap-1 text-warning"><AlertTriangle className="h-3 w-3" /> {message}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Mã variant</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tên variant</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">ĐV nhập / bán</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Quy đổi</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Giá vốn</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Giá bán</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Tồn đầu</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">HSD / min tồn</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {draft.variants.map((variant, index) => {
                      const variantIssue = issue.variants[index] ?? { errors: [], warnings: [] };
                      return (
                        <>
                          <tr key={`${draft.key}-${index}`} className="border-b last:border-0 align-top">
                            <td className="px-3 py-2"><input value={variant.code} onChange={(event) => updateVariant(draft.key, index, { code: event.target.value.toUpperCase() })} className={cn("h-7 w-full rounded border bg-background px-2 font-mono text-[11px]", variantIssue.errors.some((message) => message.includes("mã")) && "border-danger")} placeholder="Sinh tự động nếu để trống" /></td>
                            <td className="px-3 py-2"><input value={variant.name} onChange={(event) => updateVariant(draft.key, index, { name: event.target.value })} className={cn("h-7 w-full rounded border bg-background px-2 text-[11px]", !variant.name.trim() && "border-danger")} /></td>
                            <td className="px-3 py-2">
                              <div className="grid grid-cols-2 gap-1">
                                <input value={variant.importUnit} onChange={(event) => updateVariant(draft.key, index, { importUnit: event.target.value })} className="h-7 rounded border bg-background px-2 text-[11px]" placeholder="ĐV nhập" />
                                <input value={variant.sellUnit} onChange={(event) => updateVariant(draft.key, index, { sellUnit: event.target.value })} className={cn("h-7 rounded border bg-background px-2 text-[11px]", !variant.sellUnit.trim() && "border-danger")} placeholder="ĐV bán" />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center"><input type="number" value={variant.piecesPerImportUnit} onChange={(event) => updateVariant(draft.key, index, { piecesPerImportUnit: Number(event.target.value) })} className={cn("h-7 w-20 rounded border bg-background px-2 text-center text-[11px]", variant.piecesPerImportUnit <= 0 && "border-danger")} /></td>
                            <td className="px-3 py-2 text-right"><input type="number" value={variant.costPrice} onChange={(event) => updateVariant(draft.key, index, { costPrice: Number(event.target.value) })} className={cn("h-7 w-24 rounded border bg-background px-2 text-right text-[11px]", variant.costPrice <= 0 && "border-danger")} /></td>
                            <td className="px-3 py-2 text-right"><input type="number" value={variant.sellPrice} onChange={(event) => updateVariant(draft.key, index, { sellPrice: Number(event.target.value) })} className={cn("h-7 w-24 rounded border bg-background px-2 text-right text-[11px]", variant.sellPrice <= 0 && "border-danger")} /></td>
                            <td className="px-3 py-2 text-center"><input type="number" value={variant.stock} onChange={(event) => updateVariant(draft.key, index, { stock: Number(event.target.value) })} className={cn("h-7 w-20 rounded border bg-background px-2 text-center text-[11px]", variant.stock < 0 && "border-danger")} /></td>
                            <td className="px-3 py-2">
                              <div className="grid grid-cols-2 gap-1">
                                <input type="number" value={variant.expiryDays} onChange={(event) => updateVariant(draft.key, index, { expiryDays: Number(event.target.value) })} className="h-7 rounded border bg-background px-2 text-center text-[11px]" placeholder="HSD ngày" />
                                <input type="number" value={variant.minStock} onChange={(event) => updateVariant(draft.key, index, { minStock: Number(event.target.value) })} className={cn("h-7 rounded border bg-background px-2 text-center text-[11px]", variant.minStock < 0 && "border-danger")} placeholder="Tồn min" />
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              {draft.variants.length > 1 && (
                                <button onClick={() => removeVariant(draft.key, index)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-danger">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                          {(variantIssue.errors.length > 0 || variantIssue.warnings.length > 0) && (
                            <tr key={`${draft.key}-${index}-issues`} className="border-b last:border-0">
                              <td colSpan={9} className="px-3 py-2 text-[11px]">
                                <div className="space-y-1">
                                  {variantIssue.errors.map((message, issueIndex) => (
                                    <div key={`variant-error-${issueIndex}`} className="flex items-center gap-1 text-danger"><AlertCircle className="h-3 w-3" /> {message}</div>
                                  ))}
                                  {variantIssue.warnings.map((message, issueIndex) => (
                                    <div key={`variant-warning-${issueIndex}`} className="flex items-center gap-1 text-warning"><AlertTriangle className="h-3 w-3" /> {message}</div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2">
                <span className="text-[11px] text-muted-foreground">{draft.variants.length} phân loại</span>
                <button onClick={() => addVariant(draft.key)} className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                  <Plus className="h-3 w-3" /> Thêm phân loại
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {stats.total === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Không còn sản phẩm nào trong import.
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 flex gap-2 border-t bg-card p-3 lg:hidden">
        <button onClick={handleRevalidate} className="flex-1 rounded-md border py-2.5 text-sm font-semibold">Revalidate</button>
        <button onClick={handleSaveAll} disabled={stats.err > 0 || stats.total === 0} className="flex-1 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          Lưu import
        </button>
      </div>
    </div>
  );
}
