import { useState } from "react";
import { X, Printer, FileInput, Calendar, Truck, Barcode } from "lucide-react";
import { formatVND, formatDate } from "@/lib/format";
import { BlockedActionBanner } from "@/components/shared/BlockedActionBanner";
import type { GoodsReceipt } from "@/lib/mock-data";
import { mockReceiptLines } from "@/lib/mock-data";
import { PrintableReceipt } from "@/components/shared/PrintableReceipt";
import { BarcodePrintDialog } from "@/components/shared/BarcodePrintDialog";
import { triggerPrint } from "@/lib/print";

interface Props {
  receipt: GoodsReceipt | null;
  onClose: () => void;
}

export function GoodsReceiptDetailDrawer({ receipt, onClose }: Props) {
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  if (!receipt) return null;
  const lines = mockReceiptLines.slice(0, Math.max(1, Math.min(receipt.itemCount, mockReceiptLines.length)));
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitCost * (1 - l.discount / 100), 0);

  const handlePrint = () => triggerPrint(`phiếu nhập ${receipt.number}`);

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end no-print">
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-card border-l shadow-xl flex flex-col animate-slide-in-right">
          <div className="p-4 border-b flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <FileInput className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm font-mono">{receipt.number}</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{receipt.supplierName}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Ngày nhập: {formatDate(receipt.date)}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Truck className="h-3.5 w-3.5" /> NCC: {receipt.supplierName}</div>
              {receipt.note && <div className="text-xs text-muted-foreground italic">"{receipt.note}"</div>}
            </div>

            {!receipt.canDelete && (
              <BlockedActionBanner message="Không thể xóa phiếu — một phần hàng nhập đã được bán ra" />
            )}

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mặt hàng ({receipt.itemCount})</h3>
              <div className="border rounded-lg divide-y">
                {lines.map((l, i) => (
                  <div key={i} className="p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{l.productName}</p>
                        <p className="text-xs text-muted-foreground">{l.variantName} · {l.variantCode}</p>
                      </div>
                      <span className="font-medium shrink-0">{formatVND(l.quantity * l.unitCost * (1 - l.discount / 100))}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>SL: {l.quantity} {l.importUnit}</span>
                      <span>Giá: {formatVND(l.unitCost)}</span>
                      {l.discount > 0 && <span>CK {l.discount}%</span>}
                      {l.expiryDate && <span>HSD: {formatDate(l.expiryDate)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phí vận chuyển</span><span>{formatVND(receipt.shippingFee)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT</span><span>{formatVND(receipt.vat)}</span></div>
              <div className="border-t pt-1.5 flex justify-between font-bold text-base">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatVND(receipt.totalCost + receipt.shippingFee + receipt.vat)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t flex gap-2">
            <button onClick={() => setBarcodeOpen(true)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-md hover:bg-muted">
              <Barcode className="h-4 w-4" /> In mã vạch
            </button>
            <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover">
              <Printer className="h-4 w-4" /> In phiếu
            </button>
          </div>
        </div>
      </div>

      {/* Print area */}
      <PrintableReceipt receipt={receipt} lines={lines} />

      <BarcodePrintDialog
        open={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
        title={`In mã vạch — ${receipt.number}`}
        items={lines.map(l => ({
          productName: l.productName,
          variantName: l.variantName,
          code: l.variantCode,
          price: l.unitCost,
          lot: receipt.number,
          defaultQty: l.quantity,
        }))}
      />
    </>
  );
}
