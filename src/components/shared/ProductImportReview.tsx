import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Plus, AlertCircle, AlertTriangle, CheckCircle2, FileSpreadsheet, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { importStaging } from "@/lib/import-staging";
import { useStore, productActions, categoryActions } from "@/lib/store";
import type { ImportRow } from "@/components/shared/ImportPreviewDialog";

interface DraftVariant {
  code: string;
  name: string;
  sellPrice: number;
  costPrice: number;
  stock: number;
}

interface DraftProduct {
  key: string;
  status: ImportRow["status"];
  message?: string;
  code: string;
  name: string;
  category: string;
  variants: DraftVariant[];
  removed?: boolean;
}

function groupRows(rows: ImportRow[]): DraftProduct[] {
  const map = new Map<string, DraftProduct>();
  rows.forEach((r, i) => {
    const key = r.code.toUpperCase();
    const existing = map.get(key);
    const variant: DraftVariant = {
      code: r.code + (existing ? `-V${existing.variants.length + 1}` : ""),
      name: r.variantName || "Mặc định",
      sellPrice: r.sellPrice,
      costPrice: r.costPrice,
      stock: r.stock,
    };
    if (existing) {
      existing.variants.push(variant);
    } else {
      map.set(key, {
        key: `${key}-${i}`,
        status: r.status,
        message: r.message,
        code: r.code,
        name: r.name,
        category: r.category,
        variants: [variant],
      });
    }
  });
  return Array.from(map.values());
}

function validate(d: DraftProduct, allCodes: Set<string>): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!d.code.trim()) errors.push("Thiếu mã SP");
  if (!d.name.trim()) errors.push("Thiếu tên SP");
  if (!d.category.trim()) warnings.push("Chưa chọn danh mục — sẽ tạo mới");
  if (d.variants.length === 0) errors.push("Chưa có phân loại");
  if (allCodes.has(d.code.trim().toUpperCase())) errors.push("Mã SP trùng với SP đã tồn tại");
  d.variants.forEach((v, i) => {
    if (!v.code.trim()) errors.push(`Phân loại #${i + 1}: thiếu mã`);
    if (!v.name.trim()) errors.push(`Phân loại #${i + 1}: thiếu tên`);
    if (v.sellPrice <= 0) errors.push(`Phân loại #${i + 1}: giá bán phải > 0`);
    if (v.costPrice > 0 && v.sellPrice < v.costPrice) warnings.push(`Phân loại #${i + 1}: giá bán < giá nhập`);
  });
  return { errors, warnings };
}

interface Props {
  filename: string;
  rows: ImportRow[];
  onCancel: () => void;
  onSaved: () => void;
}

export function ProductImportReview({ filename, rows, onCancel, onSaved }: Props) {
  const navigate = useNavigate();
  const { categories, products } = useStore();
  const [drafts, setDrafts] = useState<DraftProduct[]>(() => groupRows(rows));

  const existingCodes = useMemo(
    () => new Set(products.map((p) => p.code.toUpperCase())),
    [products]
  );

  const issues = useMemo(() => {
    const map = new Map<string, { errors: string[]; warnings: string[] }>();
    drafts.forEach((d) => {
      if (d.removed) return;
      // exclude self when checking duplicate
      const others = new Set(existingCodes);
      drafts.forEach((o) => {
        if (o !== d && !o.removed) others.add(o.code.trim().toUpperCase());
      });
      others.delete(d.code.trim().toUpperCase());
      const dupes = new Set<string>();
      drafts.forEach((o) => {
        if (o !== d && !o.removed && o.code.trim().toUpperCase() === d.code.trim().toUpperCase()) dupes.add(d.code);
      });
      const v = validate(d, others);
      if (dupes.size > 0) v.errors.push("Mã SP bị trùng trong file");
      map.set(d.key, v);
    });
    return map;
  }, [drafts, existingCodes]);

  const stats = useMemo(() => {
    const active = drafts.filter((d) => !d.removed);
    let err = 0, warn = 0, ok = 0;
    active.forEach((d) => {
      const i = issues.get(d.key);
      if (i?.errors.length) err++;
      else if (i?.warnings.length) warn++;
      else ok++;
    });
    return { total: active.length, err, warn, ok };
  }, [drafts, issues]);

  const updateDraft = (key: string, patch: Partial<DraftProduct>) => {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  };
  const updateVariant = (key: string, idx: number, patch: Partial<DraftVariant>) => {
    setDrafts((prev) => prev.map((d) => d.key === key
      ? { ...d, variants: d.variants.map((v, i) => i === idx ? { ...v, ...patch } : v) }
      : d
    ));
  };
  const addVariant = (key: string) => {
    setDrafts((prev) => prev.map((d) => d.key === key
      ? { ...d, variants: [...d.variants, { code: `${d.code}-V${d.variants.length + 1}`, name: "Phân loại mới", sellPrice: 0, costPrice: 0, stock: 0 }] }
      : d
    ));
  };
  const removeVariant = (key: string, idx: number) => {
    setDrafts((prev) => prev.map((d) => d.key === key && d.variants.length > 1
      ? { ...d, variants: d.variants.filter((_, i) => i !== idx) }
      : d
    ));
  };
  const removeDraft = (key: string) => {
    setDrafts((prev) => prev.map((d) => d.key === key ? { ...d, removed: true } : d));
  };

  const handleSaveAll = () => {
    if (stats.err > 0) {
      toast.error(`Còn ${stats.err} sản phẩm có lỗi — sửa trước khi lưu`);
      return;
    }
    if (stats.total === 0) {
      toast.error("Không còn sản phẩm nào để lưu");
      return;
    }
    let createdCats = 0, createdProds = 0, createdVariants = 0;
    drafts.filter((d) => !d.removed).forEach((d) => {
      let cat = categories.find((c) => c.name.toLowerCase() === d.category.trim().toLowerCase());
      if (!cat && d.category.trim()) {
        cat = categoryActions.create({ name: d.category.trim(), description: "Tạo từ Excel" });
        createdCats++;
      }
      const created = productActions.create({
        code: d.code.trim(),
        name: d.name.trim(),
        categoryId: cat?.id ?? "",
        categoryName: cat?.name ?? d.category.trim(),
        image: "",
        active: true,
        type: d.variants.length > 1 ? "multi" : "single",
        variants: [],
      } as any);
      createdProds++;
      d.variants.forEach((v, i) => {
        productActions.addVariant(created.id, {
          code: v.code.trim(),
          name: v.name.trim(),
          sellUnit: "Cái",
          importUnit: "Thùng",
          piecesPerImportUnit: 1,
          sellPrice: v.sellPrice,
          costPrice: v.costPrice,
          stock: v.stock,
          minStock: 10,
          expiryDays: 0,
          isDefault: i === 0,
        });
        createdVariants++;
      });
    });
    toast.success(`Đã tạo ${createdProds} sản phẩm · ${createdVariants} phân loại${createdCats ? ` · ${createdCats} danh mục mới` : ""}`);
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
        <span className="text-foreground font-medium">Xem lại nhập từ Excel</span>
        <span className="ml-2 px-2 py-0.5 rounded-full bg-info-soft text-info text-[11px] flex items-center gap-1">
          <FileSpreadsheet className="h-3 w-3" /> {filename}
        </span>
      </div>

      <PageHeader
        title="Xem lại sản phẩm nhập từ Excel"
        description="Mỗi sản phẩm phải có ít nhất 1 phân loại. Sửa trực tiếp ở bảng dưới rồi bấm Lưu tất cả."
        actions={
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted">Hủy</button>
            <button
              onClick={handleSaveAll}
              disabled={stats.err > 0 || stats.total === 0}
              title={stats.err > 0 ? `Còn ${stats.err} SP lỗi` : "Lưu tất cả vào danh sách sản phẩm"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-3.5 w-3.5" /> Lưu tất cả ({stats.total})
            </button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Chip color="success" icon={CheckCircle2} value={stats.ok} label="Sẵn sàng" />
        <Chip color="warning" icon={AlertTriangle} value={stats.warn} label="Cảnh báo" />
        <Chip color="danger" icon={AlertCircle} value={stats.err} label="Lỗi (chặn lưu)" />
      </div>

      {stats.err > 0 && (
        <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger/20 rounded-md text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Còn <strong>{stats.err} sản phẩm có lỗi</strong> — đánh dấu đỏ. Hãy sửa các ô bị thiếu/giá sai/mã trùng rồi mới có thể lưu tất cả.</span>
        </div>
      )}

      {/* Product cards */}
      <div className="space-y-3">
        {drafts.filter((d) => !d.removed).map((d) => {
          const v = issues.get(d.key) ?? { errors: [], warnings: [] };
          const isErr = v.errors.length > 0;
          const isWarn = !isErr && v.warnings.length > 0;
          return (
            <div key={d.key} className={cn(
              "bg-card rounded-lg border overflow-hidden",
              isErr && "border-danger/40 ring-1 ring-danger/20",
              isWarn && "border-warning/40 ring-1 ring-warning/20",
            )}>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border-b">
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                  <input
                    value={d.code}
                    onChange={(e) => updateDraft(d.key, { code: e.target.value })}
                    placeholder="Mã SP"
                    className={cn("h-7 px-2 text-xs font-mono border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring", !d.code.trim() && "border-danger")}
                  />
                  <input
                    value={d.name}
                    onChange={(e) => updateDraft(d.key, { name: e.target.value })}
                    placeholder="Tên SP"
                    className={cn("h-7 px-2 text-xs font-medium border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring", !d.name.trim() && "border-danger")}
                  />
                  <select
                    value={d.category}
                    onChange={(e) => updateDraft(d.key, { category: e.target.value })}
                    className={cn("h-7 px-2 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring", !d.category.trim() && "border-warning")}
                  >
                    <option value="">— Chọn danh mục —</option>
                    {categories.filter((c) => c.active).map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {d.category && !categories.some((c) => c.name === d.category) && (
                      <option value={d.category}>{d.category} (mới)</option>
                    )}
                  </select>
                </div>
                <button onClick={() => removeDraft(d.key)} title="Bỏ khỏi danh sách nhập" className="p-1.5 text-muted-foreground hover:text-danger rounded hover:bg-muted">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Issues */}
              {(v.errors.length > 0 || v.warnings.length > 0) && (
                <div className="px-4 py-2 border-b text-[11px] space-y-0.5">
                  {v.errors.map((e, i) => (
                    <div key={`e${i}`} className="flex items-center gap-1 text-danger"><AlertCircle className="h-3 w-3" /> {e}</div>
                  ))}
                  {v.warnings.map((w, i) => (
                    <div key={`w${i}`} className="flex items-center gap-1 text-warning"><AlertTriangle className="h-3 w-3" /> {w}</div>
                  ))}
                </div>
              )}

              {/* Variants */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Mã phân loại</th>
                      <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Tên phân loại</th>
                      <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Giá bán</th>
                      <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Giá nhập</th>
                      <th className="text-center px-3 py-1.5 font-medium text-muted-foreground">Tồn ban đầu</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {d.variants.map((vt, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-1.5">
                          <input value={vt.code} onChange={(e) => updateVariant(d.key, i, { code: e.target.value })} className={cn("h-6 w-full px-1.5 font-mono text-[11px] border rounded bg-background", !vt.code.trim() && "border-danger")} />
                        </td>
                        <td className="px-3 py-1.5">
                          <input value={vt.name} onChange={(e) => updateVariant(d.key, i, { name: e.target.value })} className={cn("h-6 w-full px-1.5 text-[11px] border rounded bg-background", !vt.name.trim() && "border-danger")} />
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="number" value={vt.sellPrice} onChange={(e) => updateVariant(d.key, i, { sellPrice: +e.target.value })} className={cn("h-6 w-24 px-1.5 text-right text-[11px] border rounded bg-background ml-auto block", vt.sellPrice <= 0 && "border-danger")} />
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="number" value={vt.costPrice} onChange={(e) => updateVariant(d.key, i, { costPrice: +e.target.value })} className="h-6 w-24 px-1.5 text-right text-[11px] border rounded bg-background ml-auto block" />
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="number" value={vt.stock} onChange={(e) => updateVariant(d.key, i, { stock: +e.target.value })} className="h-6 w-20 mx-auto block px-1.5 text-center text-[11px] border rounded bg-background" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {d.variants.length > 1 && (
                            <button onClick={() => removeVariant(d.key, i)} className="p-1 text-muted-foreground hover:text-danger rounded">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t bg-muted/20 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{d.variants.length} phân loại</span>
                <button onClick={() => addVariant(d.key)} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                  <Plus className="h-3 w-3" /> Thêm phân loại
                </button>
              </div>
            </div>
          );
        })}
        {stats.total === 0 && (
          <div className="bg-card border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Không còn sản phẩm nào trong danh sách nhập. Quay lại để tải file khác.
          </div>
        )}
      </div>

      {/* Mobile sticky save */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-card border-t lg:hidden z-30 flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-md text-sm font-semibold border">Hủy</button>
        <button
          onClick={handleSaveAll}
          disabled={stats.err > 0 || stats.total === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Lưu tất cả ({stats.total})
        </button>
      </div>
    </div>
  );
}

function Chip({ color, icon: Icon, value, label }: { color: "success" | "warning" | "danger"; icon: typeof CheckCircle2; value: number; label: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-md",
      color === "success" && "bg-success-soft",
      color === "warning" && "bg-warning-soft",
      color === "danger" && "bg-danger-soft",
    )}>
      <Icon className={cn(
        "h-4 w-4",
        color === "success" && "text-success",
        color === "warning" && "text-warning",
        color === "danger" && "text-danger",
      )} />
      <div className="text-xs">
        <div className={cn(
          "font-semibold",
          color === "success" && "text-success",
          color === "warning" && "text-warning",
          color === "danger" && "text-danger",
        )}>{value}</div>
        <div className={cn(
          color === "success" && "text-success/80",
          color === "warning" && "text-warning/80",
          color === "danger" && "text-danger/80",
        )}>{label}</div>
      </div>
    </div>
  );
}
