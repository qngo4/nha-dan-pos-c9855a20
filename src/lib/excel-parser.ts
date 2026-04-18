// Real .xlsx parser for the two project templates using SheetJS.
// - Product template:  "Copy of template_import_san_pham (5).xlsx"
// - Receipt template:  "template_import_phieu_nhap_kho - Bánh tráng Tìn Tìn.xlsx"
//
// We accept multiple Vietnamese header aliases per field and gracefully fall
// back to empty values. Numeric cells coerce safely; dates accept Excel
// serials, ISO strings, or dd/mm/yyyy.

import * as XLSX from "xlsx";
import type { ImportRow } from "@/components/shared/ImportPreviewDialog";
import type { ReceiptImportRow, ReceiptImportOutcome } from "@/components/shared/ReceiptImportPreviewDialog";
import { products as seedProducts } from "@/lib/mock-data";

type Row = Record<string, unknown>;

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

function pick(row: Row, aliases: string[]): unknown {
  const map: Record<string, unknown> = {};
  Object.keys(row).forEach((k) => { map[norm(k)] = row[k]; });
  for (const a of aliases) {
    const key = norm(a);
    if (key in map && map[key] !== undefined && map[key] !== null && String(map[key]).trim() !== "") {
      return map[key];
    }
  }
  return undefined;
}

const toStr = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());
const toNum = (v: unknown) => {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[,\s]/g, "").replace(/[^\d.\-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
const toDate = (v: unknown): string => {
  if (v === undefined || v === null || v === "") return "";
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Excel serial date -> JS Date
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const y = yyyy.length === 2 ? `20${yyyy}` : yyyy;
    return `${y}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  // ISO already
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

async function readSheet(file: File): Promise<Row[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Row>(ws, { defval: "", raw: true });
}

// =============== PRODUCT TEMPLATE ===============
// Headers commonly seen: Mã SP, Tên SP, Danh mục, Tên phân loại / Variant,
// Giá bán, Giá nhập, Tồn kho.
export async function parseProductExcel(file: File): Promise<ImportRow[]> {
  const rows = await readSheet(file);
  const seen = new Set<string>();
  const existingCodes = new Set(seedProducts.map((p) => p.code.toUpperCase()));

  return rows
    .map((row): ImportRow | null => {
      const code = toStr(pick(row, ["ma sp", "ma san pham", "product code", "ma"]));
      if (!code) return null;
      const name = toStr(pick(row, ["ten sp", "ten san pham", "product name", "ten"]));
      const category = toStr(pick(row, ["danh muc", "category", "nhom"]));
      const variantName = toStr(pick(row, [
        "ten phan loai", "phan loai", "variant", "ten variant", "variant name",
      ])) || "Mặc định";
      const sellPrice = toNum(pick(row, ["gia ban", "sell price", "price", "e gia ban"]));
      const costPrice = toNum(pick(row, ["gia von", "gia nhap", "cost price", "d gia von"]));
      const stock = toNum(pick(row, ["ton kho", "ton", "stock", "so luong", "f ton kho"]));
      // Cột G: số ngày HSD (product template) — chỉ giữ làm metadata, không validate
      void toNum(pick(row, ["han su dung", "so ngay hsd", "shelf life", "g han su dung"]));

      let status: ImportRow["status"] = "ready";
      let message: string | undefined;

      if (!name) {
        status = "error";
        message = "Thiếu tên sản phẩm.";
      } else if (sellPrice <= 0) {
        status = "error";
        message = "Giá bán phải > 0.";
      } else if (existingCodes.has(code.toUpperCase()) || seen.has(code.toUpperCase())) {
        status = "error";
        message = `Trùng mã sản phẩm với ${code} đã có.`;
      } else if (!category) {
        status = "warning";
        message = "Thiếu danh mục — sẽ tạo danh mục mới khi lưu.";
      } else if (sellPrice < costPrice && costPrice > 0) {
        status = "warning";
        message = "Giá bán thấp hơn giá nhập — kiểm tra lại.";
      }
      seen.add(code.toUpperCase());

      return { status, message, code, name, category, variantName, sellPrice, costPrice, stock };
    })
    .filter((r): r is ImportRow => r !== null);
}

// =============== RECEIPT TEMPLATE ===============
// Headers commonly seen: Mã SP, Mã variant, Tên SP, Tên variant, Danh mục,
// Đơn vị nhập, Đơn vị bán, Quy đổi (số lẻ/đơn vị nhập), Số lượng, Đơn giá,
// Giá bán, % Chiết khấu, HSD, Số ngày sử dụng, Ghi chú.
export async function parseReceiptExcel(file: File): Promise<ReceiptImportRow[]> {
  const rows = await readSheet(file);
  const allVariants = seedProducts.flatMap((p) => p.variants.map((v) => ({ p, v })));

  return rows
    .map((row): ReceiptImportRow | null => {
      const productCode = toStr(pick(row, ["ma sp", "ma san pham", "product code"]));
      if (!productCode) return null;

      const variantCode = toStr(pick(row, ["ma variant", "ma phan loai", "variant code"]));
      const productName = toStr(pick(row, ["ten sp", "ten san pham", "product name"]));
      const variantName = toStr(pick(row, ["ten variant", "ten phan loai", "variant name", "phan loai"]));
      const category = toStr(pick(row, ["danh muc", "category", "nhom"]));
      const importUnit = toStr(pick(row, ["don vi nhap", "dvt nhap", "import unit", "dv nhap"])) || "Cái";
      const sellUnit = toStr(pick(row, ["don vi ban", "dvt ban", "sell unit", "dv ban"])) || importUnit;
      const piecesPerUnit = toNum(pick(row, [
        "quy doi", "so le", "so le tren don vi nhap", "pieces per unit", "quy doi don vi", "so luong tren thung",
      ])) || 1;
      const quantity = toNum(pick(row, ["so luong", "sl", "quantity", "qty"]));
      const unitCost = toNum(pick(row, ["don gia nhap", "don gia", "unit cost", "gia nhap"]));
      const sellPrice = toNum(pick(row, ["gia ban", "sell price"]));
      const discountPercent = toNum(pick(row, ["chiet khau", "ck", "discount", "discount percent", "phan tram chiet khau"]));
      const expiryDate = toDate(pick(row, ["hsd", "han su dung", "expiry", "expiry date", "ngay het han"]));
      const expiryDays = toNum(pick(row, ["so ngay su dung", "shelf life", "expiry days", "han su dung ngay"]));
      const note = toStr(pick(row, ["ghi chu", "note"]));

      // Pass-1 simulated business logic (mirrors ReceiptImportPreviewDialog)
      let status: ReceiptImportRow["status"] = "ready";
      let outcome: ReceiptImportOutcome = "ok";
      let message: string | undefined;

      if (!quantity || quantity <= 0) {
        return baseReceipt({ productCode, variantCode, productName, variantName, category, importUnit, sellUnit, piecesPerUnit, quantity, unitCost, sellPrice, discountPercent, expiryDate, expiryDays, note, status: "error", outcome: "ok", message: "Số lượng phải > 0." });
      }
      if (!unitCost || unitCost <= 0) {
        return baseReceipt({ productCode, variantCode, productName, variantName, category, importUnit, sellUnit, piecesPerUnit, quantity, unitCost, sellPrice, discountPercent, expiryDate, expiryDays, note, status: "error", outcome: "ok", message: "Đơn giá nhập phải > 0." });
      }
      if (!expiryDate && !expiryDays) {
        status = "warning";
        message = "Chưa có HSD hoặc số ngày sử dụng — bạn nên bổ sung.";
      }

      const product = seedProducts.find((p) => p.code.toUpperCase() === productCode.toUpperCase());
      if (!product) {
        if (!category) {
          return baseReceipt({ productCode, variantCode, productName, variantName, category, importUnit, sellUnit, piecesPerUnit, quantity, unitCost, sellPrice, discountPercent, expiryDate, expiryDays, note, status: "error", outcome: "ok", message: "Mã SP chưa tồn tại và thiếu Danh mục — không thể tạo SP mới." });
        }
        outcome = "create-product-and-variant";
        message = message ?? `Tạo mới SP "${productName}" + phân loại "${variantName || productCode}".`;
        return baseReceipt({ productCode, variantCode: variantCode || productCode, productName, variantName: variantName || "Mặc định", category, importUnit, sellUnit, piecesPerUnit, quantity, unitCost, sellPrice, discountPercent, expiryDate, expiryDays, note, status, outcome, message });
      }

      if (!variantCode) {
        const def = product.variants.find((v) => v.isDefault) ?? product.variants[0];
        outcome = def?.importUnit ? "use-default-variant" : "update-legacy-unit";
        message = message ?? `Dùng phân loại mặc định "${def?.name ?? "—"}".`;
        return baseReceipt({ productCode, variantCode: def?.code ?? "", productName, variantName: def?.name ?? variantName, category, importUnit, sellUnit, piecesPerUnit, quantity, unitCost, sellPrice, discountPercent, expiryDate, expiryDays, note, status, outcome, message });
      }

      const found = allVariants.find((x) => x.p.id === product.id && x.v.code.toUpperCase() === variantCode.toUpperCase());
      if (found) {
        if (!found.v.importUnit) {
          outcome = "update-legacy-unit";
          message = message ?? "Cập nhật đơn vị nhập + đơn vị bán + giá (legacy).";
        } else if (found.v.importUnit !== importUnit) {
          return baseReceipt({ productCode, variantCode, productName, variantName: found.v.name, category, importUnit, sellUnit, piecesPerUnit, quantity, unitCost, sellPrice, discountPercent, expiryDate, expiryDays, note, status: "error", outcome: "ok", message: `Variant ${variantCode} có đơn vị nhập "${found.v.importUnit}/${found.v.piecesPerImportUnit}", Excel "${importUnit}/${piecesPerUnit}" — sai đơn vị.` });
        } else {
          outcome = "update-pricing";
          message = message ?? "Cập nhật giá nhập / giá bán cho phân loại đã có.";
        }
        return baseReceipt({ productCode, variantCode, productName, variantName: found.v.name, category, importUnit, sellUnit, piecesPerUnit, quantity, unitCost, sellPrice, discountPercent, expiryDate, expiryDays, note, status, outcome, message });
      }

      outcome = "create-variant";
      message = message ?? `Tạo phân loại mới "${variantName || variantCode}" cho "${product.name}".`;
      return baseReceipt({ productCode, variantCode, productName: product.name, variantName: variantName || variantCode, category, importUnit, sellUnit, piecesPerUnit, quantity, unitCost, sellPrice, discountPercent, expiryDate, expiryDays, note, status, outcome, message });
    })
    .filter((r): r is ReceiptImportRow => r !== null);
}

function baseReceipt(r: ReceiptImportRow): ReceiptImportRow { return r; }
