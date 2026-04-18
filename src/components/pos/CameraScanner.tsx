import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Camera as CameraIcon, RefreshCw, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type CameraStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "scanning"
  | "denied"
  | "unavailable"
  | "error";

interface CameraScannerProps {
  active: boolean;
  onDetected: (code: string) => void;
  onClose?: () => void;
  /** ms to suppress identical successive scans */
  duplicateWindowMs?: number;
}

/**
 * Real camera barcode scanner using @zxing/browser.
 * - requests real camera permission
 * - prefers rear camera on mobile
 * - releases media stream on unmount / when active=false
 * - suppresses duplicate frames of the same code
 */
export function CameraScanner({
  active,
  onDetected,
  onClose,
  duplicateWindowMs = 1500,
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

  // Enumerate cameras once we have permission
  const loadDevices = async () => {
    try {
      const list = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(list);
      if (!deviceId && list.length) {
        // Prefer rear camera if label hints exist
        const rear = list.find((d) => /back|rear|environment/i.test(d.label));
        setDeviceId((rear || list[0]).deviceId);
      }
    } catch {
      /* ignore */
    }
  };

  // Stop any in-flight stream cleanly
  const stop = () => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* noop */
    }
    controlsRef.current = null;
  };

  // Start / restart scanning when active or chosen device changes
  useEffect(() => {
    if (!active) {
      stop();
      setStatus("idle");
      return;
    }

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    (async () => {
      setStatus("requesting");
      setErrorMsg("");

      // Quick check: API support
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        setErrorMsg("Trình duyệt không hỗ trợ truy cập camera.");
        return;
      }

      try {
        // Trigger permission prompt explicitly (so we get a clear denied state)
        const probe = await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: { ideal: "environment" } },
        });
        // Stop probe tracks immediately — zxing will open its own stream
        probe.getTracks().forEach((t) => t.stop());

        await loadDevices();
        if (cancelled) return;

        if (!videoRef.current) return;
        setStatus("ready");

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, _err, ctrl) => {
            if (!result) return;
            const code = result.getText();
            const now = Date.now();
            const last = lastScanRef.current;
            if (
              last &&
              last.code === code &&
              now - last.at < duplicateWindowMs
            ) {
              return; // suppress duplicate frames
            }
            lastScanRef.current = { code, at: now };
            setStatus("scanning");
            onDetected(code);
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string };
        if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
          setStatus("denied");
          setErrorMsg("Camera chưa được cấp quyền.");
        } else if (
          e?.name === "NotFoundError" ||
          e?.name === "OverconstrainedError"
        ) {
          setStatus("unavailable");
          setErrorMsg("Không phát hiện thiết bị camera.");
        } else {
          setStatus("error");
          setErrorMsg(e?.message || "Không thể khởi động camera.");
        }
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, deviceId]);

  // Stop on unmount as a safety net
  useEffect(() => () => stop(), []);

  const statusLabel: Record<CameraStatus, string> = {
    idle: "",
    requesting: "Đang xin quyền camera...",
    ready: "Camera đã sẵn sàng — đưa mã vạch vào khung",
    scanning: "Đã quét — đang tiếp tục...",
    denied: "Camera chưa được cấp quyền",
    unavailable: "Không phát hiện thiết bị camera",
    error: errorMsg || "Lỗi camera",
  };

  return (
    <div className="rounded-md border bg-background overflow-hidden">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
        />
        {/* Aiming overlay */}
        {(status === "ready" || status === "scanning") && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-1/3 border-2 border-primary/80 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}
        {(status === "denied" ||
          status === "unavailable" ||
          status === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-3">
            <AlertTriangle className="h-6 w-6 text-danger" />
            <p className="text-xs text-white">{statusLabel[status]}</p>
          </div>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-1.5 right-1.5 p-1 rounded bg-black/50 text-white hover:bg-black/70"
            title="Đóng camera"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 p-2 text-[11px]">
        <div
          className={cn(
            "flex items-center gap-1.5 truncate",
            status === "denied" || status === "unavailable" || status === "error"
              ? "text-danger"
              : "text-muted-foreground"
          )}
        >
          <CameraIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{statusLabel[status]}</span>
        </div>
        {devices.length > 1 && (
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="h-6 text-[11px] bg-muted rounded px-1 max-w-[40%]"
            title="Chọn camera"
          >
            {devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        )}
        {(status === "denied" || status === "error") && (
          <button
            type="button"
            onClick={() => setDeviceId((id) => (id ? id : undefined))}
            className="flex items-center gap-1 px-1.5 h-6 rounded border hover:bg-muted"
            title="Thử lại"
          >
            <RefreshCw className="h-3 w-3" /> Thử lại
          </button>
        )}
      </div>
    </div>
  );
}
