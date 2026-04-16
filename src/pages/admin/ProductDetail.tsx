import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { products, categories } from "@/lib/mock-data";
import { formatVND } from "@/lib/format";
import {
  ArrowLeft, Save, Plus, Pencil, Trash2, Package, Upload, AlertTriangle,
  ImageIcon, Check, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminProductDetail() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const product = isNew ? null : products.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'images'>('general');
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [showAddVariant, setShowAddVariant] = useState(false);

  const tabs = [
    { id: 'general' as const, label: 'Thông tin chung' },
    { id: 'variants' as const, label: `Phân loại (${product?.variants.length || 0})` },
    { id: 'images' as const, label: 'Hình ảnh' },
  ];

  return (
    <div className="space-y-4 admin-dense">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/products" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Sản phẩm
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{isNew ? 'Tạo sản phẩm' : product?.name}</span>
      </div>

      <PageHeader
        title={isNew ? 'Tạo sản phẩm mới' : `${product?.name}`}
        description={isNew ? 'Điền thông tin sản phẩm và phân loại' : `${product?.code} · ${product?.categoryName}`}
        actions={
          <div className="flex gap-2">
            {!isNew && <StatusBadge status={product?.active ? 'active' : 'inactive'} size="md" />}
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
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
      {activeTab === 'general' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-card rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Thông tin cơ bản</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tên sản phẩm *</label>
              <input defaultValue={product?.name || ''} placeholder="VD: Mì Hảo Hảo" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Mã sản phẩm *</label>
              <input defaultValue={product?.code || ''} placeholder="VD: SP001" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Danh mục</label>
              <select defaultValue={product?.categoryId || ''} className="mt-1 w-full h-8 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Chọn danh mục</option>
                {categories.filter(c => c.active).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Loại sản phẩm</label>
              <select defaultValue={product?.type || 'single'} className="mt-1 w-full h-8 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring">
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
                <button className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  product?.active !== false ? "bg-success" : "bg-muted"
                )}>
                  <span className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-transform",
                    product?.active !== false ? "left-5" : "left-0.5"
                  )} />
                </button>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-3">Nhập từ Excel</h3>
              <p className="text-xs text-muted-foreground mb-3">Nhập danh sách phân loại từ file Excel</p>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted transition-colors">
                <Upload className="h-3.5 w-3.5" /> Chọn file Excel
              </button>
            </div>

            {!isNew && (
              <div className="bg-card rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-2">Tổng quan tồn kho</h3>
                <div className="space-y-1.5">
                  {product?.variants.map(v => (
                    <div key={v.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{v.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{v.stock} {v.sellUnit}</span>
                        <StatusBadge status={v.stock === 0 ? 'out-of-stock' : v.stock <= v.minStock ? 'low-stock' : 'in-stock'} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variants */}
      {activeTab === 'variants' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Phân loại sản phẩm</p>
              <p className="text-xs text-muted-foreground">Phân loại (variant) là đơn vị tồn kho chính</p>
            </div>
            <button onClick={() => setShowAddVariant(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
              <Plus className="h-3.5 w-3.5" /> Thêm phân loại
            </button>
          </div>

          {/* Add variant form */}
          {showAddVariant && (
            <div className="bg-card rounded-lg border p-4 animate-fade-in">
              <h3 className="font-semibold text-sm mb-3">Thêm phân loại mới</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div><label className="text-xs font-medium text-muted-foreground">Mã phân loại</label><input placeholder="VD: SP001-04" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Tên phân loại</label><input placeholder="VD: Hương bò" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Đơn vị bán</label><input placeholder="VD: Gói" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Đơn vị nhập</label><input placeholder="VD: Thùng" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Số lượng/ĐV nhập</label><input type="number" placeholder="30" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Giá bán</label><input type="number" placeholder="5000" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Giá nhập</label><input type="number" placeholder="3500" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Tồn kho tối thiểu</label><input type="number" placeholder="50" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Số ngày hết hạn</label><input type="number" placeholder="180" className="mt-1 w-full h-8 px-3 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" /></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md"><Check className="h-3 w-3" /> Lưu</button>
                <button onClick={() => setShowAddVariant(false)} className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted">Hủy</button>
              </div>
            </div>
          )}

          {/* Variants table */}
          {product && product.variants.length > 0 && (
            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-6"></th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mã</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tên</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">ĐV bán</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">ĐV nhập</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Giá bán</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Giá nhập</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Tồn kho</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">Min</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">HSD</th>
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map(v => {
                    const stockStatus = v.stock === 0 ? 'out-of-stock' : v.stock <= v.minStock ? 'low-stock' : 'in-stock';
                    return (
                      <tr key={v.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", stockStatus === 'out-of-stock' && "bg-danger-soft/30", stockStatus === 'low-stock' && "bg-warning-soft/30")}>
                        <td className="px-3 py-2.5 text-center">
                          {v.isDefault && <Star className="h-3.5 w-3.5 text-accent inline" />}
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
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{v.expiryDays > 0 ? `${v.expiryDays} ngày` : '—'}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"><Pencil className="h-3 w-3" /></button>
                            <button className="p-1 text-muted-foreground hover:text-danger rounded hover:bg-muted"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Images */}
      {activeTab === 'images' && (
        <div className="bg-card rounded-lg border p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Hình ảnh sản phẩm</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">Kéo thả hoặc chọn ảnh để tải lên. Hỗ trợ JPG, PNG. Tối đa 5MB mỗi ảnh.</p>
            <button className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors">
              <Upload className="h-4 w-4" /> Tải ảnh lên
            </button>
          </div>
        </div>
      )}

      {/* Mobile sticky save */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-card border-t lg:hidden z-30">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground">
          <Save className="h-4 w-4" /> Lưu thay đổi
        </button>
      </div>
    </div>
  );
}
