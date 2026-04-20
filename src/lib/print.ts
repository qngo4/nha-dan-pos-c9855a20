// Print helper: ensures the "Đang in..." toast auto-dismisses
// even if the user cancels the browser print dialog, and supports
// switching paper size between A4 and POS58 thermal.
import { toast } from "sonner";

export type PrintMode = "a4" | "pos58";

/**
 * Trigger browser print.
 * - "a4" (default): standard A4 layout (existing PrintableInvoice/PrintableReceipt).
 * - "pos58": 58mm thermal layout (Printable58Invoice / Printable58Receipt).
 *
 * The mode toggles a body class consumed by @media print rules in index.css
 * so @page size + visible print-area variant are switched accordingly.
 */
export function triggerPrint(label: string, mode: PrintMode = "a4") {
  const id = toast.loading(`Đang chuẩn bị in ${label}...`);

  // Apply body class so print CSS knows which paper size + which template to show.
  document.body.classList.remove("print-a4", "print-pos58");
  document.body.classList.add(mode === "pos58" ? "print-pos58" : "print-a4");

  const cleanup = () => {
    toast.dismiss(id);
    document.body.classList.remove("print-a4", "print-pos58");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  // Safety net — dismiss after 8s no matter what (covers browsers that don't fire afterprint)
  setTimeout(cleanup, 8000);

  // Tiny delay so the print-area DOM / body class is in the document
  setTimeout(() => {
    try {
      window.print();
    } catch {
      cleanup();
    }
  }, 100);
}
