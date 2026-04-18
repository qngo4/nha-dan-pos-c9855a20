import * as XLSX from "xlsx";
import type { ProductImportRow, ReceiptImportOutcome, ReceiptImportRow } from "@/lib/import-types";
import { products as seedProducts } from "@/lib/mock-data";

type Row = Record<string, unknown> & { __rowNum?: number };
type SheetRows = unknown[][];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

const hasValue = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== "";
const toStr = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());
const toNum = (v: unknown) => {
  if (v === undefined || v === null || String(v).trim() === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const cleaned = String(v).replace(/\s+/g, "").replace(/,/g, "").replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};
const toBool = (v: unknown, fallback = true) => {
  if (!hasValue(v)) return fallback;
  const value = norm(String(v));
  if (["true", "1", "yes", "co", "active", "dang ban"].includes(value)) return true;
  if (["false", "0", "no", "khong", "an"].includes(value)) return false;
  return fallback;
};
const toDate = (v: unknown): string => {
  if (!hasValue(v)) return "";
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const raw = String(v).trim();
  const m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const fullYear = yyyy.length === 2 ? `20${yyyy}` : yyyy;
    return `${fullYear}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

function pick(row: Row, aliases: string[]): unknown {
  const entries = Object.entries(row)
    .filter(([key]) => !key.startsWith("__"))
    .map(([key, value]) => [norm(key), value] as const);

  for (const alias of aliases) {
    const needle = norm(alias);
    const exact = entries.find(([key, value]) => key === needle && hasValue(value));
    if (exact) return exact[1];
    const fuzzy = entries.find(([key, value]) => (key.includes(needle) || needle.includes(key)) && hasValue(value));
    if (fuzzy) return fuzzy[1];
  }
  return undefined;
}

async function readWorkbook(file: File) {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: "array", cellDates: true });
}

function selectWorksheet(workbook: XLSX.WorkBook, preferredNames: string[]) {
  const normalized = workbook.SheetNames.map((name) => ({ name, normalized: norm(name) }));
  for (const preferred of preferredNames) {
    const needle = norm(preferred);
    const match = normalized.find((sheet) => sheet.normalized === needle || sheet.normalized.includes(needle));
    if (match) return workbook.Sheets[match.name];
  }
  const nonGuide = normalized.find((sheet) => !sheet.normalized.includes("huong dan"));
  return nonGuide ? workbook.Sheets[nonGuide.name] : workbook.Sheets[workbook.SheetNames[0]];
}

function detectHeaderRow(rows: SheetRows, requiredAliases: string[]) {
  let bestIndex = 0;
  let bestScore = -1;

  rows.slice(0, 12).forEach((row, index) => {
    const cells = row.map((cell) => norm(toStr(cell))).filter(Boolean);
    const score = requiredAliases.reduce((sum, alias) => {
      const needle = norm(alias);
      return sum + (cells.some((cell) => cell === needle || cell.includes(needle) || needle.includes(cell)) ? 1 : 0);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function rowsToObjects(rows: SheetRows, headerRowIndex: number): Row[] {
  const headers = (rows[headerRowIndex] ?? []).map((cell, index) => toStr(cell) || `__col_${index}`);
  return rows
    .slice(headerRowIndex + 1)
    .map((row, offset) => ({
      __rowNum: headerRowIndex + offset + 2,
      ...Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
    }))
    .filter((row) => Object.entries(row).some(([key, value]) => !key.startsWith("__") && hasValue(value)));
}

async function readSheet(file: File, preferredSheetNames: string[], requiredAliases: string[]) {
  const workbook = await readWorkbook(file);
  const sheet = selectWorksheet(workbook, preferredSheetNames);
  if (!sheet) return [] as Row[];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });
  if (!rows.length) return [] as Row[];
  const headerRowIndex = detectHeaderRow(rows, requiredAliases);
  return rowsToObjects(rows, headerRowIndex);
}

export async function parseProductExcel(file: File): Promise<ProductImportRow[]> {
  const rows = await readSheet(file, ["Du lieu San pham", "San pham"], [
    "A: Ma SP", "B: Ten SP", "C: Danh muc", "D: Gia von", "E: Gia ban", "J: DV ban le",
  ]);
  const existingCodes = new Set(seedProducts.map((product) => product.code.toUpperCase()));
  const seenCodes = new Set<string>();

  return rows
    .map((row): ProductImportRow | null => {
      const code = toStr(pick(row, ["A: Ma SP", "Ma SP", "Ma san pham"])).toUpperCase();
      const name = toStr(pick(row, ["B: Ten SP", "Ten SP", "Ten san pham"]));
      const category = toStr(pick(row, ["C: Danh muc", "Danh muc"]));
      const costPrice = toNum(pick(row, ["D: Gia von", "Gia von", "Gia nhap"]));
      const sellPrice = toNum(pick(row, ["E: Gia ban", "Gia ban"]));
      const stock = toNum(pick(row, ["F: Ton kho ban dau", "Ton kho", "Ton kho ban dau"]));
      const expiryDays = toNum(pick(row, ["G: Han su dung", "Han su dung", "So ngay HSD"]));
      const active = toBool(pick(row, ["H: Hoat dong", "Hoat dong"]), true);
      const importUnit = toStr(pick(row, ["I: DV nhap kho", "DV nhap kho", "Don vi nhap kho"]));
      const sellUnit = toStr(pick(row, ["J: DV ban le", "DV ban le", "Don vi ban le"]));
      const piecesPerImportUnit = Math.max(1, toNum(pick(row, ["K: So le/DV nhap", "So le/DV nhap", "So le DV nhap"])) || 1);
      const note = toStr(pick(row, ["L: Ghi chu quy doi", "Ghi chu quy doi", "Ghi chu"]));
      const minStock = toNum(pick(row, ["M: Ton kho toi thieu", "Ton kho toi thieu"])) || 5;

      if (!code && !name && !category) return null;

      const errors: string[] = [];
      const warnings: string[] = [];
      if (!name) errors.push("Thiếu tên sản phẩm.");
      if (!category) errors.push("Thiếu danh mục.");
      if (costPrice <= 0) errors.push("Thiếu hoặc sai giá vốn.");
      if (sellPrice <= 0) errors.push("Thiếu hoặc sai giá bán.");
      if (!sellUnit) errors.push("Thiếu đơn vị bán lẻ.");
      if (stock < 0) errors.push("Tồn kho ban đầu không hợp lệ.");
      if (minStock < 0) errors.push("Tồn tối thiểu không hợp lệ.");
      if (code && existingCodes.has(code)) errors.push(`Mã SP ${code} đã tồn tại.`);
      if (code && seenCodes.has(code)) errors.push(`Mã SP ${code} bị trùng trong file.`);
      if (!code) warnings.push("Để trống mã SP — hệ thống sẽ sinh mã khi lưu.");
      if (sellPrice > 0 && costPrice > 0 && sellPrice < costPrice) warnings.push("Giá bán thấp hơn giá vốn.");
      if (!importUnit) warnings.push("Thiếu đơn vị nhập — sẽ dùng đơn vị bán lẻ.");
      if (piecesPerImportUnit <= 0) errors.push("Số lẻ/đơn vị nhập phải lớn hơn 0.");
      seenCodes.add(code);

      return {
        status: errors.length ? "error" : warnings.length ? "warning" : "ready",
        message: errors[0] ?? warnings[0],
        sourceRow: row.__rowNum ?? 0,
        code,
        name,
        category,
        variantCode: code ? `${code}-01` : "",
        variantName: "Mặc định",
        sellPrice,
        costPrice,
        stock,
        importUnit: importUnit || sellUnit,
        sellUnit,
        piecesPerImportUnit,
        expiryDays,
        minStock,
        active,
        note,
      };
    })
    .filter((row): row is ProductImportRow => row !== null);
}

function inferReceiptOutcome(row: ReceiptImportRow): { status: ReceiptImportRow["status"]; message?: string; outcome: ReceiptImportOutcome } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!row.productCode) errors.push("Thiếu mã sản phẩm.");
  if (row.quantity <= 0) errors.push("Số lượng phải lớn hơn 0.");
  if (row.unitCost <= 0) errors.push("Giá nhập phải lớn hơn 0.");
  if (!row.importUnit) errors.push("Thiếu đơn vị nhập kho.");
  if (!row.sellUnit) errors.push("Thiếu đơn vị bán lẻ.");
  if (row.piecesPerUnit <= 0) errors.push("Số lẻ/đơn vị phải lớn hơn 0.");
  if (!row.expiryDate && !row.expiryDays) warnings.push("Chưa có HSD thực tế hoặc số ngày HSD.");

  const product = seedProducts.find((item) => item.code.toUpperCase() === row.productCode.toUpperCase());
  if (!product) {
    if (!row.productName) errors.push("SP mới phải có tên sản phẩm.");
    if (!row.category) errors.push("SP mới phải có danh mục.");
    return {
      status: errors.length ? "error" : warnings.length ? "warning" : "ready",
      message: errors[0] ?? warnings[0] ?? `Tạo mới SP ${row.productCode} + phân loại ${row.variantCode || row.productCode}.`,
      outcome: "create-product-and-variant",
    };
  }

  if (!row.variantCode) {
    const def = product.variants.find((variant) => variant.isDefault) ?? product.variants[0];
    if (!def) {
      errors.push("Sản phẩm chưa có phân loại mặc định.");
    } else if (def.importUnit && norm(def.importUnit) !== norm(row.importUnit)) {
      errors.push(`Đơn vị nhập không khớp với phân loại mặc định (${def.importUnit}/${def.piecesPerImportUnit}).`);
    }
    return {
      status: errors.length ? "error" : warnings.length ? "warning" : "ready",
      message: errors[0] ?? warnings[0] ?? `Dùng phân loại mặc định ${def?.name ?? ""}.`,
      outcome: def?.importUnit ? "use-default-variant" : "update-legacy-unit",
    };
  }

  const variant = product.variants.find((item) => item.code.toUpperCase() === row.variantCode.toUpperCase());
  if (!variant) {
    return {
      status: errors.length ? "error" : warnings.length ? "warning" : "ready",
      message: errors[0] ?? warnings[0] ?? `Tạo mới phân loại ${row.variantCode} cho ${product.name}.`,
      outcome: "create-variant",
    };
  }

  if (variant.importUnit && norm(variant.importUnit) !== norm(row.importUnit)) {
    errors.push(`Variant ${row.variantCode} đang dùng ${variant.importUnit}/${variant.piecesPerImportUnit}, Excel lại là ${row.importUnit}/${row.piecesPerUnit}.`);
  }

  return {
    status: errors.length ? "error" : warnings.length ? "warning" : "ready",
    message: errors[0] ?? warnings[0] ?? "Cập nhật giá/đơn vị cho phân loại đã có.",
    outcome: variant.importUnit ? "update-pricing" : "update-legacy-unit",
  };
}

export async function parseReceiptExcel(file: File): Promise<ReceiptImportRow[]> {
  const rows = await readSheet(file, ["SP Don", "Phieu nhap", "Nhap hang"], [
    "A: Ma SP", "B: Ma Variant", "C: Ten SP", "D: So luong", "E: Gia nhap", "K: DV Nhap kho",
  ]);

  return rows
    .map((row): ReceiptImportRow | null => {
      const productCode = toStr(pick(row, ["A: Ma SP", "Ma SP", "Ma san pham"])).toUpperCase();
      const variantCode = toStr(pick(row, ["B: Ma Variant", "Ma Variant"])).toUpperCase();
      const productName = toStr(pick(row, ["C: Ten SP", "Ten SP", "Ten san pham"]));
      const quantity = toNum(pick(row, ["D: So luong", "So luong"]));
      const unitCost = toNum(pick(row, ["E: Gia nhap", "Gia nhap"]));
      const sellPrice = toNum(pick(row, ["F: Gia ban", "Gia ban"]));
      const discountPercent = toNum(pick(row, ["G: Chiet khau %", "Chiet khau %", "Chiet khau"]));
      const note = toStr(pick(row, ["H: Ghi chu dong", "Ghi chu dong", "Ghi chu"]));
      const category = toStr(pick(row, ["I: Danh muc (SP moi)", "Danh muc (SP moi)", "Danh muc"]));
      const newProductUnit = toStr(pick(row, ["J: Don vi (SP moi)", "Don vi (SP moi)", "Don vi SP moi"]));
      const importUnit = toStr(pick(row, ["K: DV Nhap kho", "DV Nhap kho", "Don vi nhap kho"])) || newProductUnit;
      const sellUnit = toStr(pick(row, ["L: DV Ban le", "DV Ban le", "Don vi ban le"])) || newProductUnit || importUnit;
      const piecesPerUnit = Math.max(1, toNum(pick(row, ["M: So le/DV", "So le/DV", "So le DV"])) || 1);
      const expiryDate = toDate(pick(row, ["N: Ngay HSD (ghi de)", "Ngay HSD (ghi de)", "Ngay HSD"]));
      const expiryDaysRaw = toNum(pick(row, ["O: So ngay HSD", "So ngay HSD"]));
      const expiryDays = expiryDaysRaw > 0 ? expiryDaysRaw : undefined;

      if (!productCode && !productName && !variantCode) return null;

      const baseRow: ReceiptImportRow = {
        status: "ready",
        message: undefined,
        outcome: "ok",
        sourceRow: row.__rowNum ?? 0,
        productCode,
        variantCode,
        productName,
        variantName: variantCode || productName || "Mặc định",
        category,
        newProductUnit,
        importUnit,
        sellUnit,
        piecesPerUnit,
        quantity,
        unitCost,
        sellPrice,
        discountPercent,
        expiryDate,
        expiryDays,
        note,
      };

      const inferred = inferReceiptOutcome(baseRow);
      return { ...baseRow, ...inferred };
    })
    .filter((row): row is ReceiptImportRow => row !== null);
}
