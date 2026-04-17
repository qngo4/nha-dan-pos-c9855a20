// Print helper: ensures the "Đang in..." toast auto-dismisses
// even if the user cancels the browser print dialog.
import { toast } from "sonner";

export function triggerPrint(label: string) {
  const id = toast.loading(`Đang chuẩn bị in ${label}...`);
  // Dismiss when print dialog closes (works for both confirm + cancel in modern browsers)
  const onAfter = () => {
    toast.dismiss(id);
    window.removeEventListener("afterprint", onAfter);
  };
  window.addEventListener("afterprint", onAfter);
  // Safety net — dismiss after 8s no matter what (covers browsers that don't fire afterprint)
  setTimeout(() => toast.dismiss(id), 8000);

  // Tiny delay so the print-area DOM is in the document
  setTimeout(() => {
    try {
      window.print();
    } catch {
      toast.dismiss(id);
    }
  }, 100);
}
