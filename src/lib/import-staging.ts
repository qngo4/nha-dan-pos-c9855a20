import type { ProductImportRow, ReceiptImportRow } from "@/lib/import-types";

interface ProductStage {
  filename: string;
  rows: ProductImportRow[];
  createdAt: number;
}

interface ReceiptStage {
  filename: string;
  rows: ReceiptImportRow[];
  meta: { supplierName: string; receiptDate: string };
  createdAt: number;
}

let productStage: ProductStage | null = null;
let receiptStage: ReceiptStage | null = null;

export const importStaging = {
  setProducts(s: ProductStage) { productStage = s; },
  takeProducts(): ProductStage | null { const s = productStage; productStage = null; return s; },
  peekProducts(): ProductStage | null { return productStage; },

  setReceipt(s: ReceiptStage) { receiptStage = s; },
  takeReceipt(): ReceiptStage | null { const s = receiptStage; receiptStage = null; return s; },
  peekReceipt(): ReceiptStage | null { return receiptStage; },
};
