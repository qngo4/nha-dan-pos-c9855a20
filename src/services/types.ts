// Canonical service-layer types for frontend-first implementation.
// Temporary adapter = localStorage. Future adapter = EC2 backend API.
// UI components MUST import only from "@/services" and "@/services/types".

/* ========================= CORE / SHARED ========================= */

export type ID = string;
export type ISODateString = string;
export type Money = number;

export type SortDirection = "asc" | "desc";
export interface MultiSortRule {
  field: string;
  direction: SortDirection;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OptionItem {
  label: string;
  value: string;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  query?: string;
  sort?: MultiSortRule[];
}

/* ========================= STORE SETTINGS / VIETQR ========================= */

export type VietQrTemplate = "compact" | "compact2" | "qr_only" | "print";

export interface StorePaymentSettings {
  shopName: string;
  qrEnabled: boolean;
  vietQrBankCode: string; // NAPAS / VietQR bank code (e.g. "VCB","TCB","ACB")
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  transferPrefix?: string; // e.g. "DH"
  qrTemplate?: VietQrTemplate;
}

export interface StoreSettingsService {
  getPaymentSettings(): Promise<StorePaymentSettings | null>;
  savePaymentSettings(input: StorePaymentSettings): Promise<StorePaymentSettings>;
  subscribePaymentSettings(
    cb: (settings: StorePaymentSettings | null) => void
  ): () => void;
}

export interface VietQrRequest {
  amount: Money;
  transferContent: string;
}

export interface VietQrResult {
  imageUrl: string;
  rawPayload: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: Money;
  transferContent: string;
  template: VietQrTemplate;
}

export interface VietQrService {
  generate(request: VietQrRequest): Promise<VietQrResult>;
}

/* ========================= ADDRESS / SHIPPING ========================= */

export interface Province { code: string; name: string; }
export interface District { code: string; name: string; provinceCode: string; }
export interface Ward { code: string; name: string; districtCode: string; }

export interface ShippingAddress {
  receiverName: string;
  phone: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  wardCode: string;
  wardName: string;
  street: string;
  note?: string;
}

export interface AddressService {
  listProvinces(): Promise<Province[]>;
  listDistricts(provinceCode: string): Promise<District[]>;
  listWards(districtCode: string): Promise<Ward[]>;
}

export type ShippingQuoteSource = "zone_fallback" | "carrier_api";
export type ShippingQuoteStatus = "incomplete" | "loading" | "quoted" | "unavailable";

export interface ShippingQuote {
  status: ShippingQuoteStatus;
  source?: ShippingQuoteSource;
  zoneCode?: string;
  fee?: Money;
  etaDays?: { min: number; max: number };
  reasonIfUnavailable?: string;
  freeShipApplied?: boolean;
}

export interface ShippingZoneRule {
  zoneCode: string;
  label: string;
  baseFee: Money;
  freeShipThreshold?: Money;
  etaDays: { min: number; max: number };
  /** Province codes assigned to this zone. "*" means catch-all. */
  provinceCodes: string[];
}

export interface ShippingConfig {
  zoneRules: ShippingZoneRule[];
}

export interface ShippingQuoteInput {
  address: Pick<
    ShippingAddress,
    "provinceCode" | "provinceName" | "districtCode" | "wardCode"
  > & Partial<ShippingAddress>;
  subtotal: Money;
  weightGrams?: number;
}

export interface ShippingService {
  getConfig(): Promise<ShippingConfig>;
  saveConfig(input: ShippingConfig): Promise<ShippingConfig>;
  quote(input: ShippingQuoteInput): Promise<ShippingQuote>;
}

/* ========================= PRODUCT / VARIANT ========================= */

export interface ProductImage { id: ID; url: string; alt?: string; isPrimary?: boolean; }
export interface VariantImage { id: ID; url: string; alt?: string; isPrimary?: boolean; }

export interface Product {
  id: ID;
  code: string;
  name: string;
  categoryId?: ID;
  categoryName?: string;
  images: ProductImage[];
}

export interface Variant {
  id: ID;
  productId: ID;
  code: string;
  name?: string;
  barcode?: string;
  sellUnit?: string;
  retailPrice: Money;
  images?: VariantImage[];
}

export interface ResolvedVariantDisplay {
  productId: ID;
  variantId: ID;
  productName: string;
  variantName?: string;
  imageUrl?: string;
  barcode?: string;
  retailPrice: Money;
}

/* ========================= CUSTOMER / POINTS ========================= */

export interface Customer {
  id: ID;
  code?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  points: number;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export type CustomerPointSourceType = "invoice" | "redemption" | "manual_adjustment";

export interface CustomerPointHistoryItem {
  id: ID;
  customerId: ID;
  createdAt: ISODateString;
  delta: number;
  balanceAfter: number;
  reason: string;
  sourceType: CustomerPointSourceType;
  sourceId?: ID;
}

export interface CustomerService {
  list(params?: ListQuery): Promise<PagedResult<Customer>>;
  get(id: ID): Promise<Customer | null>;
  upsert(input: Customer): Promise<Customer>;
  addPoints(
    customerId: ID,
    delta: number,
    reason: string,
    sourceType: CustomerPointSourceType,
    sourceId?: ID
  ): Promise<Customer>;
  redeemPoints(
    customerId: ID,
    delta: number,
    reason: string,
    sourceId?: ID
  ): Promise<Customer>;
  history(customerId: ID): Promise<CustomerPointHistoryItem[]>;
}

/* ========================= CART / PROMOTION / VOUCHER ========================= */

export interface CartLine {
  id: ID;
  productId: ID;
  variantId: ID;
  productCode?: string;
  variantCode?: string;
  productName: string;
  variantName?: string;
  categoryId?: ID;
  categoryName?: string;
  qty: number;
  unitPrice: Money;
  lineSubtotal: Money;
}

export interface GiftLine {
  productId: ID;
  variantId?: ID;
  productName: string;
  variantName?: string;
  qty: number;
  unitPrice: Money;
  lineTotal: Money;
  promotionId: ID;
  promotionName: string;
}

export type PromotionType =
  | "percent_discount"
  | "fixed_discount"
  | "buy_x_get_y"
  | "gift"
  | "free_shipping";

export interface VoucherSnapshot {
  code: string;
  ruleSummary: string;
  discountAmount: Money;
}

export interface PromotionAffectedLine {
  lineId: ID;
  productId: ID;
  variantId: ID;
  productName: string;
  variantName?: string;
  eligibleQty?: number;
  discountedAmount?: Money;
  rewardQty?: number;
  note?: string;
}

export interface EvaluatedPromotion {
  promotionId: ID;
  name: string;
  type: PromotionType;
  ruleSummary: string;
  eligible: boolean;
  reasonIfIneligible?: string;
  discountAmount: Money;
  shippingDiscountAmount: Money;
  voucherDiscountAmount: Money;
  affectedLines: PromotionAffectedLine[];
  giftLines: GiftLine[];
}

export interface CartPricingBreakdown {
  subtotal: Money;
  manualDiscount: Money;
  promotionDiscount: Money;
  voucherDiscount: Money;
  shippingFee: Money;
  shippingDiscount: Money;
  vat: Money;
  total: Money;
}

export interface CartContext {
  lines: CartLine[];
  subtotal: Money;
  customerId?: ID;
  voucherCode?: string;
  manualDiscount?: Money;
  shippingAddress?: ShippingAddress;
  shippingQuote?: ShippingQuote;
}

export interface PromotionEvaluationService {
  evaluateAll(ctx: CartContext): Promise<EvaluatedPromotion[]>;
  pickBest(ctx: CartContext): Promise<EvaluatedPromotion | null>;
}

/* ========================= ORDER / PENDING PAYMENT ========================= */

export type PaymentMethod = "cash" | "bank_transfer" | "momo" | "zalopay";

export type PendingOrderStatus =
  | "pending_payment"
  | "waiting_confirm"
  | "confirmed"
  | "cancelled";

export interface PromotionSnapshot {
  promotionId: ID;
  name: string;
  type: PromotionType;
  ruleSummary: string;
  discountAmount: Money;
  shippingDiscountAmount: Money;
  affectedLines: PromotionAffectedLine[];
  giftLines: GiftLine[];
}

export interface PricingBreakdownSnapshot {
  subtotal: Money;
  manualDiscount: Money;
  promotionDiscount: Money;
  voucherDiscount: Money;
  shippingFee: Money;
  shippingDiscount: Money;
  vat: Money;
  total: Money;
}

export interface ShippingQuoteSnapshot {
  source: ShippingQuoteSource;
  zoneCode?: string;
  fee: Money;
  etaDays?: { min: number; max: number };
}

export interface PendingOrderLine {
  id: ID;
  productId: ID;
  variantId: ID;
  productName: string;
  variantName?: string;
  qty: number;
  unitPrice: Money;
  lineSubtotal: Money;
}

export interface PendingOrder {
  id: ID;
  code: string;
  createdAt: ISODateString;
  expiresAt?: ISODateString;
  status: PendingOrderStatus;
  customerId?: ID;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  lines: PendingOrderLine[];
  giftLinesSnapshot: GiftLine[];
  promotionSnapshot?: PromotionSnapshot | null;
  voucherSnapshot?: VoucherSnapshot | null;
  shippingQuoteSnapshot?: ShippingQuoteSnapshot | null;
  pricingBreakdownSnapshot: PricingBreakdownSnapshot;
  note?: string;
}

export interface CreatePendingOrderInput {
  customerId?: ID;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  lines: PendingOrderLine[];
  promotionSnapshot?: PromotionSnapshot | null;
  voucherSnapshot?: VoucherSnapshot | null;
  shippingQuoteSnapshot?: ShippingQuoteSnapshot | null;
  pricingBreakdownSnapshot: PricingBreakdownSnapshot;
  note?: string;
  expiresAt?: ISODateString;
}

export interface PendingOrderListParams extends ListQuery {
  status?: PendingOrderStatus;
}

export interface PendingOrderService {
  list(params?: PendingOrderListParams): Promise<PagedResult<PendingOrder>>;
  get(id: ID): Promise<PendingOrder | null>;
  create(input: CreatePendingOrderInput): Promise<PendingOrder>;
  update(
    id: ID,
    patch: Partial<CreatePendingOrderInput> & { status?: PendingOrderStatus }
  ): Promise<PendingOrder>;
  remove(id: ID): Promise<void>;
}
