export type ImportSeverity = "ready" | "warning" | "error";

export interface ProductImportRow {
  status: ImportSeverity;
  message?: string;
  sourceRow: number;
  code: string;
  name: string;
  category: string;
  variantCode: string;
  variantName: string;
  sellPrice: number;
  costPrice: number;
  stock: number;
  importUnit: string;
  sellUnit: string;
  piecesPerImportUnit: number;
  expiryDays: number;
  minStock: number;
  active: boolean;
  note: string;
}

export type ReceiptImportOutcome =
  | "create-product-and-variant"
  | "create-variant"
  | "use-default-variant"
  | "update-legacy-unit"
  | "update-pricing"
  | "ok";

export interface ReceiptImportRow {
  status: ImportSeverity;
  message?: string;
  outcome: ReceiptImportOutcome;
  sourceRow: number;
  productCode: string;
  variantCode: string;
  productName: string;
  variantName: string;
  category?: string;
  newProductUnit?: string;
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
