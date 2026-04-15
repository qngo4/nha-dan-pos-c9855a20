// Realistic Vietnamese retail mock data

export interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  productCount: number;
}

export interface ProductVariant {
  id: string;
  code: string;
  name: string;
  sellUnit: string;
  importUnit: string;
  piecesPerImportUnit: number;
  sellPrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  expiryDays: number;
  isDefault: boolean;
  expiryDate?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  image: string;
  active: boolean;
  variants: ProductVariant[];
  type: 'single' | 'multi';
}

export interface ComboItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  stock: number;
}

export interface Combo {
  id: string;
  code: string;
  name: string;
  image: string;
  price: number;
  active: boolean;
  components: ComboItem[];
  derivedStock: number;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  group: 'retail' | 'wholesale' | 'vip';
  active: boolean;
  totalPurchases: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  taxCode: string;
  email: string;
  active: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  customerId: string;
  customerName: string;
  total: number;
  paymentType: 'cash' | 'transfer' | 'momo' | 'zalopay';
  status: 'active' | 'cancelled';
  createdBy: string;
  itemCount: number;
}

export interface PendingOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  paymentMethod: 'transfer' | 'momo' | 'zalopay';
  total: number;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  itemCount: number;
}

export interface GoodsReceipt {
  id: string;
  number: string;
  date: string;
  supplierId: string;
  supplierName: string;
  itemCount: number;
  totalCost: number;
  shippingFee: number;
  vat: number;
}

export interface StockAdjustment {
  id: string;
  code: string;
  createdDate: string;
  reason: string;
  note: string;
  itemCount: number;
  status: 'draft' | 'confirmed';
}

// === MOCK DATA ===

export const categories: Category[] = [
  { id: '1', name: 'Thực phẩm khô', description: 'Mì, bún, phở, gia vị', active: true, productCount: 24 },
  { id: '2', name: 'Đồ uống', description: 'Nước ngọt, trà, cà phê', active: true, productCount: 18 },
  { id: '3', name: 'Bánh kẹo', description: 'Bánh quy, kẹo, snack', active: true, productCount: 32 },
  { id: '4', name: 'Sữa & Chế phẩm', description: 'Sữa tươi, sữa chua, phô mai', active: true, productCount: 15 },
  { id: '5', name: 'Đồ dùng gia đình', description: 'Giấy, xà phòng, chất tẩy', active: true, productCount: 20 },
  { id: '6', name: 'Rau củ quả', description: 'Rau xanh, trái cây tươi', active: false, productCount: 0 },
];

export const products: Product[] = [
  {
    id: '1', code: 'SP001', name: 'Mì Hảo Hảo', categoryId: '1', categoryName: 'Thực phẩm khô',
    image: '', active: true, type: 'multi',
    variants: [
      { id: 'v1', code: 'SP001-01', name: 'Tôm chua cay', sellUnit: 'Gói', importUnit: 'Thùng', piecesPerImportUnit: 30, sellPrice: 5000, costPrice: 3500, stock: 245, minStock: 50, expiryDays: 180, isDefault: true },
      { id: 'v2', code: 'SP001-02', name: 'Lẩu Thái', sellUnit: 'Gói', importUnit: 'Thùng', piecesPerImportUnit: 30, sellPrice: 5500, costPrice: 3800, stock: 12, minStock: 50, expiryDays: 180, isDefault: false },
      { id: 'v3', code: 'SP001-03', name: 'Sa tế', sellUnit: 'Gói', importUnit: 'Thùng', piecesPerImportUnit: 30, sellPrice: 5000, costPrice: 3500, stock: 0, minStock: 50, expiryDays: 180, isDefault: false },
    ],
  },
  {
    id: '2', code: 'SP002', name: 'Coca-Cola', categoryId: '2', categoryName: 'Đồ uống',
    image: '', active: true, type: 'multi',
    variants: [
      { id: 'v4', code: 'SP002-01', name: 'Lon 330ml', sellUnit: 'Lon', importUnit: 'Thùng', piecesPerImportUnit: 24, sellPrice: 10000, costPrice: 7200, stock: 180, minStock: 30, expiryDays: 365, isDefault: true },
      { id: 'v5', code: 'SP002-02', name: 'Chai 1.5L', sellUnit: 'Chai', importUnit: 'Thùng', piecesPerImportUnit: 12, sellPrice: 18000, costPrice: 13500, stock: 45, minStock: 20, expiryDays: 365, isDefault: false },
    ],
  },
  {
    id: '3', code: 'SP003', name: 'Sữa Vinamilk 100%', categoryId: '4', categoryName: 'Sữa & Chế phẩm',
    image: '', active: true, type: 'multi',
    variants: [
      { id: 'v6', code: 'SP003-01', name: 'Hộp 180ml', sellUnit: 'Hộp', importUnit: 'Lốc', piecesPerImportUnit: 4, sellPrice: 8000, costPrice: 6000, stock: 96, minStock: 24, expiryDays: 90, isDefault: true, expiryDate: '2025-05-10' },
      { id: 'v7', code: 'SP003-02', name: 'Hộp 1L', sellUnit: 'Hộp', importUnit: 'Thùng', piecesPerImportUnit: 12, sellPrice: 32000, costPrice: 25000, stock: 8, minStock: 10, expiryDays: 90, isDefault: false, expiryDate: '2025-04-20' },
    ],
  },
  {
    id: '4', code: 'SP004', name: 'Bánh Oreo', categoryId: '3', categoryName: 'Bánh kẹo',
    image: '', active: true, type: 'multi',
    variants: [
      { id: 'v8', code: 'SP004-01', name: 'Gói 133g', sellUnit: 'Gói', importUnit: 'Thùng', piecesPerImportUnit: 24, sellPrice: 22000, costPrice: 16000, stock: 67, minStock: 20, expiryDays: 270, isDefault: true },
      { id: 'v9', code: 'SP004-02', name: 'Hộp 266g', sellUnit: 'Hộp', importUnit: 'Thùng', piecesPerImportUnit: 12, sellPrice: 42000, costPrice: 32000, stock: 23, minStock: 10, expiryDays: 270, isDefault: false },
    ],
  },
  {
    id: '5', code: 'SP005', name: 'Nước mắm Nam Ngư', categoryId: '1', categoryName: 'Thực phẩm khô',
    image: '', active: true, type: 'single',
    variants: [
      { id: 'v10', code: 'SP005-01', name: 'Chai 500ml', sellUnit: 'Chai', importUnit: 'Thùng', piecesPerImportUnit: 12, sellPrice: 28000, costPrice: 20000, stock: 54, minStock: 15, expiryDays: 540, isDefault: true },
    ],
  },
  {
    id: '6', code: 'SP006', name: 'Giấy vệ sinh Pulppy', categoryId: '5', categoryName: 'Đồ dùng gia đình',
    image: '', active: true, type: 'single',
    variants: [
      { id: 'v11', code: 'SP006-01', name: 'Gói 6 cuộn', sellUnit: 'Gói', importUnit: 'Bịch', piecesPerImportUnit: 10, sellPrice: 55000, costPrice: 40000, stock: 3, minStock: 10, expiryDays: 0, isDefault: true },
    ],
  },
  {
    id: '7', code: 'SP007', name: 'Trà Lipton', categoryId: '2', categoryName: 'Đồ uống',
    image: '', active: true, type: 'multi',
    variants: [
      { id: 'v12', code: 'SP007-01', name: 'Hộp 25 gói', sellUnit: 'Hộp', importUnit: 'Thùng', piecesPerImportUnit: 24, sellPrice: 45000, costPrice: 32000, stock: 38, minStock: 10, expiryDays: 365, isDefault: true },
      { id: 'v13', code: 'SP007-02', name: 'Chai 455ml', sellUnit: 'Chai', importUnit: 'Thùng', piecesPerImportUnit: 24, sellPrice: 10000, costPrice: 7000, stock: 0, minStock: 20, expiryDays: 180, isDefault: false },
    ],
  },
  {
    id: '8', code: 'SP008', name: 'Kem đánh răng P/S', categoryId: '5', categoryName: 'Đồ dùng gia đình',
    image: '', active: true, type: 'single',
    variants: [
      { id: 'v14', code: 'SP008-01', name: 'Tuýp 180g', sellUnit: 'Tuýp', importUnit: 'Hộp', piecesPerImportUnit: 36, sellPrice: 35000, costPrice: 25000, stock: 42, minStock: 12, expiryDays: 720, isDefault: true },
    ],
  },
];

export const combos: Combo[] = [
  {
    id: 'c1', code: 'CB001', name: 'Combo Gia Đình', image: '', price: 120000, active: true, derivedStock: 3,
    components: [
      { productId: '1', variantId: 'v1', productName: 'Mì Hảo Hảo', variantName: 'Tôm chua cay', quantity: 5, stock: 245 },
      { productId: '2', variantId: 'v4', productName: 'Coca-Cola', variantName: 'Lon 330ml', quantity: 6, stock: 180 },
      { productId: '3', variantId: 'v6', productName: 'Sữa Vinamilk', variantName: 'Hộp 180ml', quantity: 4, stock: 96 },
    ],
  },
  {
    id: 'c2', code: 'CB002', name: 'Combo Tiết Kiệm', image: '', price: 65000, active: true, derivedStock: 12,
    components: [
      { productId: '1', variantId: 'v1', productName: 'Mì Hảo Hảo', variantName: 'Tôm chua cay', quantity: 10, stock: 245 },
      { productId: '7', variantId: 'v12', productName: 'Trà Lipton', variantName: 'Hộp 25 gói', quantity: 1, stock: 38 },
    ],
  },
  {
    id: 'c3', code: 'CB003', name: 'Combo Sinh Nhật', image: '', price: 180000, active: false, derivedStock: 0,
    components: [
      { productId: '4', variantId: 'v9', productName: 'Bánh Oreo', variantName: 'Hộp 266g', quantity: 2, stock: 23 },
      { productId: '2', variantId: 'v5', productName: 'Coca-Cola', variantName: 'Chai 1.5L', quantity: 2, stock: 45 },
    ],
  },
];

export const customers: Customer[] = [
  { id: '1', code: 'KH001', name: 'Nguyễn Văn An', phone: '0901234567', group: 'vip', active: true, totalPurchases: 45200000 },
  { id: '2', code: 'KH002', name: 'Trần Thị Bình', phone: '0912345678', group: 'retail', active: true, totalPurchases: 8500000 },
  { id: '3', code: 'KH003', name: 'Lê Hoàng Cường', phone: '0923456789', group: 'wholesale', active: true, totalPurchases: 125000000 },
  { id: '4', code: 'KH004', name: 'Phạm Minh Đức', phone: '0934567890', group: 'retail', active: false, totalPurchases: 2100000 },
  { id: '5', code: 'KH005', name: 'Võ Thị Em', phone: '0945678901', group: 'retail', active: true, totalPurchases: 15300000 },
];

export const suppliers: Supplier[] = [
  { id: '1', code: 'NCC001', name: 'Công ty TNHH Thực Phẩm Á Châu', phone: '02812345678', address: '123 Nguyễn Văn Linh, Q7, TP.HCM', taxCode: '0301234567', email: 'contact@acfood.vn', active: true },
  { id: '2', code: 'NCC002', name: 'Đại lý Phát Đạt', phone: '02887654321', address: '456 Lê Văn Việt, Q9, TP.HCM', taxCode: '0307654321', email: 'phatdat@gmail.com', active: true },
  { id: '3', code: 'NCC003', name: 'Công ty CP Vinamilk', phone: '02838155555', address: '10 Tân Trào, Q7, TP.HCM', taxCode: '0300588569', email: 'vinamilk@vinamilk.com.vn', active: true },
];

export const invoices: Invoice[] = [
  { id: '1', number: 'HD-20250415-001', date: '2025-04-15T08:30:00+07:00', customerId: '1', customerName: 'Nguyễn Văn An', total: 285000, paymentType: 'cash', status: 'active', createdBy: 'admin', itemCount: 5 },
  { id: '2', number: 'HD-20250415-002', date: '2025-04-15T09:15:00+07:00', customerId: '2', customerName: 'Trần Thị Bình', total: 152000, paymentType: 'transfer', status: 'active', createdBy: 'admin', itemCount: 3 },
  { id: '3', number: 'HD-20250414-001', date: '2025-04-14T14:20:00+07:00', customerId: '', customerName: 'Khách lẻ', total: 45000, paymentType: 'cash', status: 'active', createdBy: 'nhanvien1', itemCount: 2 },
  { id: '4', number: 'HD-20250414-002', date: '2025-04-14T16:45:00+07:00', customerId: '3', customerName: 'Lê Hoàng Cường', total: 1250000, paymentType: 'transfer', status: 'cancelled', createdBy: 'admin', itemCount: 8 },
  { id: '5', number: 'HD-20250413-001', date: '2025-04-13T10:00:00+07:00', customerId: '5', customerName: 'Võ Thị Em', total: 98000, paymentType: 'momo', status: 'active', createdBy: 'admin', itemCount: 4 },
];

export const pendingOrders: PendingOrder[] = [
  { id: '1', orderNumber: 'DH-20250415-001', customerId: '2', customerName: 'Trần Thị Bình', paymentMethod: 'transfer', total: 320000, createdAt: '2025-04-15T10:30:00+07:00', expiresAt: '2025-04-15T22:30:00+07:00', status: 'pending', itemCount: 4 },
  { id: '2', orderNumber: 'DH-20250415-002', customerId: '5', customerName: 'Võ Thị Em', paymentMethod: 'momo', total: 185000, createdAt: '2025-04-15T11:00:00+07:00', expiresAt: '2025-04-15T23:00:00+07:00', status: 'pending', itemCount: 2 },
  { id: '3', orderNumber: 'DH-20250414-001', customerId: '1', customerName: 'Nguyễn Văn An', paymentMethod: 'zalopay', total: 450000, createdAt: '2025-04-14T09:00:00+07:00', expiresAt: '2025-04-14T21:00:00+07:00', status: 'confirmed', itemCount: 6 },
  { id: '4', orderNumber: 'DH-20250413-001', customerId: '3', customerName: 'Lê Hoàng Cường', paymentMethod: 'transfer', total: 890000, createdAt: '2025-04-13T15:00:00+07:00', expiresAt: '2025-04-14T03:00:00+07:00', status: 'expired', itemCount: 5 },
];

export const goodsReceipts: GoodsReceipt[] = [
  { id: '1', number: 'PN-20250415-001', date: '2025-04-15', supplierId: '1', supplierName: 'Công ty TNHH Thực Phẩm Á Châu', itemCount: 5, totalCost: 3500000, shippingFee: 50000, vat: 350000 },
  { id: '2', number: 'PN-20250412-001', date: '2025-04-12', supplierId: '3', supplierName: 'Công ty CP Vinamilk', itemCount: 3, totalCost: 8200000, shippingFee: 0, vat: 820000 },
  { id: '3', number: 'PN-20250410-001', date: '2025-04-10', supplierId: '2', supplierName: 'Đại lý Phát Đạt', itemCount: 8, totalCost: 12500000, shippingFee: 100000, vat: 1250000 },
];

export const stockAdjustments: StockAdjustment[] = [
  { id: '1', code: 'DC-20250415-001', createdDate: '2025-04-15', reason: 'Kiểm kho định kỳ', note: 'Kiểm kho tháng 4/2025', itemCount: 12, status: 'draft' },
  { id: '2', code: 'DC-20250410-001', createdDate: '2025-04-10', reason: 'Hàng hỏng', note: 'Phát hiện hàng hỏng kho 2', itemCount: 3, status: 'confirmed' },
  { id: '3', code: 'DC-20250405-001', createdDate: '2025-04-05', reason: 'Kiểm kho định kỳ', note: 'Kiểm kho đầu tháng 4', itemCount: 25, status: 'confirmed' },
];

// Dashboard stats
export const dashboardStats = {
  revenueThisWeek: 12500000,
  revenueThisMonth: 48200000,
  profitThisWeek: 3750000,
  profitThisMonth: 14460000,
  pendingOrdersCount: 2,
  invoiceCountToday: 8,
  lowStockVariants: [
    { productName: 'Mì Hảo Hảo', variantName: 'Lẩu Thái', stock: 12, minStock: 50 },
    { productName: 'Giấy vệ sinh Pulppy', variantName: 'Gói 6 cuộn', stock: 3, minStock: 10 },
    { productName: 'Sữa Vinamilk', variantName: 'Hộp 1L', stock: 8, minStock: 10 },
  ],
  nearExpiryLots: [
    { productName: 'Sữa Vinamilk', variantName: 'Hộp 1L', expiryDate: '2025-04-20', stock: 8 },
  ],
  expiredLots: [],
  outOfStockVariants: [
    { productName: 'Mì Hảo Hảo', variantName: 'Sa tế', stock: 0 },
    { productName: 'Trà Lipton', variantName: 'Chai 455ml', stock: 0 },
  ],
};
