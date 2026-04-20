// Print helper: ensures the "Đang in..." toast auto-dismisses
// even if the user cancels the browser print dialog, and supports
// switching paper size between A4 and POS58 thermal.
import { toast } from "sonner";

export type PrintMode = "a4" | "pos58";

const POS58_STYLE_ID = "pos58-page-style";

function applyPos58PageStyle() {
  if (document.getElementById(POS58_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = POS58_STYLE_ID;
  // @page rules can't be nested under selectors, so we inject this only
  // while POS58 printing is active and remove it right after.
  style.textContent = `@media print { @page { size: 58mm auto; margin: 0; } }`;
  document.head.appendChild(style);
}

function removePos58PageStyle() {
  const el = document.getElementById(POS58_STYLE_ID);
  if (el) el.remove();
}

/**
 * Trigger browser print.
 * - "a4" (default): standard A4 layout (existing PrintableInvoice/PrintableReceipt).
 * - "pos58": 58mm thermal layout (Printable58Invoice / Printable58Receipt).
 */
export function triggerPrint(label: string, mode: PrintMode = "a4") {
  const id = toast.loading(`Đang chuẩn bị in ${label}...`);

  document.body.classList.remove("print-a4", "print-pos58");
  document.body.classList.add(mode === "pos58" ? "print-pos58" : "print-a4");
  if (mode === "pos58") applyPos58PageStyle();

  const cleanup = () => {
    toast.dismiss(id);
    document.body.classList.remove("print-a4", "print-pos58");
    removePos58PageStyle();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  setTimeout(cleanup, 8000);

  setTimeout(() => {
    try {
      window.print();
    } catch {
      cleanup();
    }
  }, 100);
}
