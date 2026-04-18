// Tiny in-memory staging buffer used to pass parsed Excel rows
// from an upload modal to the dedicated "create" screen, where
// the user reviews/fixes/confirms before final save.

import type { ImportRow } from "@/components/shared/ImportPreviewDialog";
import type { ReceiptImportRow } from "@/components/shared/ReceiptImportPreviewDialog";

interface ProductStage {
  filename: string;
  rows: ImportRow[];
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
