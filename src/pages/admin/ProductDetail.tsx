import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useStore, productActions } from "@/lib/store";
import type { ProductVariant } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";
import {
  ArrowLeft, Save, Plus, Pencil, Trash2, Upload, ImageIcon, Check, Star, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VariantForm {
  id?: string;
  code: string; name: string;
  sellUnit: string; importUnit: string; piecesPerImportUnit: number;
  sellPrice: number; costPrice: number;
  stock: number; minStock: number; expiryDays: number;
  isDefault: boolean;
}

const emptyVariant: VariantForm = {
  code: "", name: "",
  sellUnit: "Cái", importUnit: "Thùng", piecesPerImportUnit: 1,
  sellPrice: 0, costPrice: 0,
  stock: 0, minStock: 10, expiryDays: 0,
  isDefault: false,
};

export default function AdminProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, categories } = useStore();
  const isNew = !id || id === "new";
  const product = isNew ? null : products.find(p => p.id === id);

  const [activeTab, setActiveTab] = useState<"general" | "variants" | "images">("general");
  const [variantForm, setVariantForm] = useState<VariantForm | null>(null);
  const [confirmDeleteVariant, setConfirmDeleteVariant] = useState<ProductVariant | null>(null);

  // Product-level form state
  const [name, setName] = useState(product?.name ?? "");
  const [code, setCode] = useState(product?.code ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [type, setType] = useState<"single" | "multi">(product?.type ?? "single");
  const [active, setActive] = useState(product?.active ?? true);

  useEffect(() => {
    if (!isNew && !product) {
      // product was deleted from another tab — bounce back
      navigate("/admin/products");
    }
  }, [isNew, product, navigate]);

  const tabs = [
    { id: "general" as const, label: "Thông tin chung" },
    { id: "variants" as const, label: `Phân loại (${product?.variants.length || 0})` },
    { id: "images" as const, label: "Hình ảnh" },
  ];

  const handleSaveProduct = () => {
    if (!name.trim() || !code.trim()) { toast.error("Vui lòng nhập tên và mã sản phẩm"); return; }
    if (!categoryId) { toast.error("Vui lòng chọn danh mục"); return; }
    const cat = categories.find(c => c.id === categoryId);
    if (isNew) {
      const created = productActions.create({
        code: code.trim(), name: name.trim(),
        categoryId, categoryName: cat?.name ?? "",
        image: "", active, type,
        variants: [],
      } as any);
      toast.success("Đã tạo sản phẩm mới");
      navigate(`/admin/products/${created.id}`, { replace: true });
    } else if (product) {
      productActions.update(product.id, {
        name: name.trim(), code: code.trim(),
        categoryId, categoryName: cat?.name ?? product.categoryName,
        type, active,
      });
      toast.success("Đã lưu thay đổi");
    }
  };

  const openAddVariant = () => setVariantForm({ ...emptyVariant, isDefault: !product || product.variants.length === 0 });
  const openEditVariant = (v: ProductVariant) => setVariantForm({ ...v });

  const handleSaveVariant = () => {
    if (!product || !variantForm) return;
    if (!variantForm.code.trim() || !variantForm.name.trim()) { toast.error("Nhập mã và tên phân loại"); return; }
    if (variantForm.sellPrice <= 0) { toast.error("Giá bán phải lớn hơn 0"); return; }
    if (variantForm.id) {
      productActions.updateVariant(product.id, variantForm.id, variantForm);
      toast.success("Đã cập nhật phân loại");
    } else {
      productActions.addVariant(product.id, variantForm);
      toast.success("Đã thêm phân loại mới");
    }
    setVariantForm(null);
  };

  const handleDeleteVariant = () => {
    if (!product || !confirmDeleteVariant) return;
    if (product.variants.length === 1) {
      toast.error("Phải có ít nhất 1 phân loại");
      return;
    }
    productActions.removeVariant(product.id, confirmDeleteVariant.id);
    toast.success(`Đã xóa phân loại "${confirmDeleteVariant.name}"`);
  };

  const handleSetDefault = (v: ProductVariant) => {
    if (!product || v.isDefault) return;
    productActions.setDefaultVariant(product.id, v.id);
    toast.success(`Đặt "${v.name}" làm phân loại mặc định`);
  };

  return (
    <div className="space-y-4 admin-dense pb-20 lg:pb-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/products" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Sản phẩm
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{isNew ? "Tạo sản phẩm" : product?.name}</span>
      </div>

      <PageHeader
        title={isNew ? "Tạo sản phẩm mới" : `${product?.name}`}
        description={isNew ? "Điền thông tin sản phẩm và phân loại" : `${product?.code} · ${product?.categoryName}`}
        actions={
          <div className="flex gap-2">
            {!isNew && <StatusBadge status={active ? "active" : "inactive"} size="md" />}
            <button onClick={handleSaveProduct} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
              <Save className="h-3.5 w-3.5" /> Lưu thay đổi
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
            "px-3 py-2 text-xs font-medium border-b-2 transition-colors",
            activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Info */}
      {activeTab === "general" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-card rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Thông tin cơ bản</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tên sản phẩm *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Mì Hảo Hảo" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Mã sản phẩm *</label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="VD: SP001" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Danh mục *</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1 w-full h-8 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Chọn danh mục</option>
                {categories.filter(c => c.active).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Loại sản phẩm</label>
              <select value={type} onChange={e => setType(e.target.value as any)} className="mt-1 w-full h-8 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="single">Đơn giản (1 phân loại)</option>
                <option value="multi">Nhiều phân loại</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-3">Trạng thái</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Kích hoạt sản phẩm</p>
                  <p className="text-xs text-muted-foreground">Sản phẩm sẽ hiển thị trên cửa hàng</p>
                </div>
                <button onClick={() => setActive(!active)} className={cn("w-10 h-5 rounded-full transition-colors relative", active ? "bg-success" : "bg-muted")}>
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-transform", active ? "left-5" : "left-0.5")} />
                </button>
              </div>
            </div>

            {!isNew && product && (
              <div className="bg-card rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-2">Tổng quan tồn kho</h3>
                {product.variants.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Chưa có phân loại nào.</p>
                ) : (
                  <div className="space-y-1.5">
                    {product.variants.map(v => (
                      <div key={v.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <span className="text-muted-foreground">{v.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{v.stock} {v.sellUnit}</span>
                          <StatusBadge status={v.stock === 0 ? "out-of-stock" : v.stock <= v.minStock ? "low-stock" : "in-stock"} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variants */}
      {activeTab === "variants" && (
        <div className="space-y-3">
          {isNew && (
            <div className="p-3 rounded-md bg-warning-soft text-xs text-warning">
              Hãy lưu sản phẩm trước, sau đó quay lại tab này để thêm phân loại.
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Phân loại sản phẩm</p>
              <p className="text-xs text-muted-foreground">Phân loại (variant) là đơn vị tồn kho chính. Chỉ 1 phân loại được đặt mặc định.</p>
            </div>
            <button
              onClick={openAddVariant}
              disabled={isNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm phân loại
            </button>
          </div>

          {variantForm && (
            <div className="bg-card rounded-lg border p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{variantForm.id ? "Sửa phân loại" : "Thêm phân loại mới"}</h3>
                <button onClick={() => setVariantForm(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Mã phân loại *", "code", "text", "VD: SP001-04"],
                  ["Tên phân loại *", "name", "text", "VD: Hương bò"],
                  ["Đơn vị bán", "sellUnit", "text", "VD: Gói"],
                  ["Đơn vị nhập", "importUnit", "text", "VD: Thùng"],
                  ["Số lượng/ĐV nhập", "piecesPerImportUnit", "number", "30"],
                  ["Giá bán *", "sellPrice", "number", "5000"],
                  ["Giá nhập", "costPrice", "number", "3500"],
                  ["Tồn kho hiện tại", "stock", "number", "0"],
                  ["Tồn kho tối thiểu", "minStock", "number", "50"],
                  ["Số ngày hết hạn", "expiryDays", "number", "180"],
                ].map(([label, key, t, ph]) => (
                  <div key={key as string}>
                    <label className="text-xs font-medium text-muted-foreground">{label}</label>
                    <input
                      type={t as string}
                      value={(variantForm as any)[key as string] as any}
                      onChange={e => setVariantForm({ ...variantForm, [key as string]: t === "number" ? Number(e.target.value) : e.target.value })}
                      placeholder={ph as string}
                      className={cn("mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring", key === "code" && "font-mono")}
                    />
                  </div>
                ))}
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input type="checkbox" checked={variantForm.isDefault} onChange={e => setVariantForm({ ...variantForm, isDefault: e.target.checked })} className="h-3.5 w-3.5" />
                    Đặt làm phân loại mặc định
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleSaveVariant} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md"><Check className="h-3 w-3" /> Lưu</button>
                <button onClick={() => setVariantForm(null)} className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted">Hủy</button>
              </div>
            </div>
          )}

          {product && product.variants.length > 0 && (
            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-10">Mặc định</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mã</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tên</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">ĐV bán</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">ĐV nhập</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Giá bán</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Giá nhập</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Tồn</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Min</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">HSD</th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map(v => {
                    const stockStatus = v.stock === 0 ? "out-of-stock" : v.stock <= v.minStock ? "low-stock" : "in-stock";
                    return (
                      <tr key={v.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", stockStatus === "out-of-stock" && "bg-danger-soft/30", stockStatus === "low-stock" && "bg-warning-soft/30")}>
                        <td className="px-3 py-2.5 text-center">
                          <button onClick={() => handleSetDefault(v)} title={v.isDefault ? "Phân loại mặc định" : "Đặt làm mặc định"} className={cn("inline-flex p-1 rounded hover:bg-muted", v.isDefault ? "text-accent" : "text-muted-foreground/30 hover:text-muted-foreground")}>
                            <Star className={cn("h-3.5 w-3.5", v.isDefault && "fill-accent")} />
                          </button>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">{v.code}</td>
                        <td className="px-3 py-2.5 font-medium">{v.name}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{v.sellUnit}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{v.importUnit} ({v.piecesPerImportUnit})</td>
                        <td className="px-3 py-2.5 text-right font-medium">{formatVND(v.sellPrice)}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">{formatVND(v.costPrice)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-medium">{v.stock}</span>
                            <StatusBadge status={stockStatus} />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{v.minStock}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{v.expiryDays > 0 ? `${v.expiryDays} ngày` : "—"}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditVariant(v)} title="Sửa" className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => setConfirmDeleteVariant(v)} title="Xóa" className="p-1 text-muted-foreground hover:text-danger rounded hover:bg-muted"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {product && product.variants.length === 0 && !variantForm && (
            <div className="bg-card border rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">Chưa có phân loại nào. Hãy thêm ít nhất 1 phân loại để bán sản phẩm này.</p>
            </div>
          )}
        </div>
      )}

      {/* Images */}
      {activeTab === "images" && (
        <div className="bg-card rounded-lg border p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Hình ảnh sản phẩm</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">Kéo thả hoặc chọn ảnh để tải lên. Hỗ trợ JPG, PNG. Tối đa 5MB mỗi ảnh.</p>
            <button onClick={() => toast.info("Chức năng tải ảnh sẽ sớm có")} className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted">
              <Upload className="h-4 w-4" /> Tải ảnh lên
            </button>
          </div>
        </div>
      )}

      {/* Mobile sticky save */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-card border-t lg:hidden z-30">
        <button onClick={handleSaveProduct} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground">
          <Save className="h-4 w-4" /> Lưu thay đổi
        </button>
      </div>

      <ConfirmDialog
        open={!!confirmDeleteVariant}
        onClose={() => setConfirmDeleteVariant(null)}
        onConfirm={handleDeleteVariant}
        variant="danger"
        title="Xóa phân loại"
        description={`Xóa phân loại "${confirmDeleteVariant?.name}" (${confirmDeleteVariant?.code})? Tồn kho hiện tại sẽ bị mất.`}
        confirmLabel="Xóa"
      />
    </div>
  );
}
