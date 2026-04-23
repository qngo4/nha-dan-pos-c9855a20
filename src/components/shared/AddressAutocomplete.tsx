import { useEffect, useRef, useState, useCallback } from "react";
import { Search, Loader2, AlertTriangle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { addresses } from "@/services";
import type { Province, District, Ward } from "@/services/types";
import { cn } from "@/lib/utils";

export interface GoongResolvedAddress {
  street: string;
  formattedAddress: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
  wardCode?: string;
  wardName?: string;
  lat?: number;
  lng?: number;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
}

interface Props {
  /** Called when the user picks a suggestion. Provides the best-effort mapping
   *  to our VN administrative dataset. Caller decides whether to overwrite. */
  onResolved: (addr: GoongResolvedAddress) => void;
  /** Called when fallback (manual) mode is forced — quota / network / disabled. */
  onFallback?: (reason: string) => void;
  defaultValue?: string;
  className?: string;
}

const DEBOUNCE_MS = 700;
const MIN_CHARS = 4;

// Session-scoped cache so identical re-queries during a single visit are free.
const localAcCache = new Map<string, Prediction[]>();
const localDetailCache = new Map<string, GoongResolvedAddress>();

let sessionFallback = false; // once true for this session, stop calling Goong

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function coreName(s: string): string {
  // Drop common admin prefixes so "Tỉnh Hà Nội" matches "Hà Nội", "Phường 1" matches "1", etc.
  return stripDiacritics(s)
    .replace(/^(tinh|thanh pho|tp\.?|tp|quan|huyen|thi xa|thi tran|phuong|xa)\s+/i, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findByName<T extends { code: string; name: string }>(list: T[], target: string): T | undefined {
  if (!target) return undefined;
  const t = coreName(target);
  return (
    list.find((x) => coreName(x.name) === t) ??
    list.find((x) => coreName(x.name).includes(t) || t.includes(coreName(x.name)))
  );
}

interface CompoundShape {
  province?: string;
  district?: string;
  commune?: string;
}

async function mapToDataset(
  compound: CompoundShape | undefined,
  fallbackText: string,
): Promise<{ provinceCode?: string; provinceName?: string; districtCode?: string; districtName?: string; wardCode?: string; wardName?: string }> {
  const provinces = await addresses.listProvinces();
  const provName = compound?.province ?? "";
  const districtName = compound?.district ?? "";
  const wardName = compound?.commune ?? "";

  // Goong sometimes omits compound — try to grep from the formatted text.
  const text = fallbackText ?? "";
  const province = findByName(provinces, provName) ?? provinces.find((p) => coreName(text).includes(coreName(p.name)));
  if (!province) return {};

  const districts = await addresses.listDistricts(province.code);
  const district = findByName(districts, districtName) ?? districts.find((d) => coreName(text).includes(coreName(d.name)));
  const result = {
    provinceCode: province.code,
    provinceName: province.name,
    districtCode: district?.code,
    districtName: district?.name,
    wardCode: undefined as string | undefined,
    wardName: undefined as string | undefined,
  };
  if (!district) return result;
  const wards = await addresses.listWards(district.code);
  const ward = findByName(wards, wardName) ?? wards.find((w) => coreName(text).includes(coreName(w.name)));
  if (ward) {
    result.wardCode = ward.code;
    result.wardName = ward.name;
  }
  return result;
}

export function AddressAutocomplete({ onResolved, onFallback, defaultValue = "", className }: Props) {
  const [input, setInput] = useState(defaultValue);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "typing" | "searching" | "noresult" | "error" | "fallback">(
    sessionFallback ? "fallback" : "idle",
  );
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // close popover on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const enterFallback = useCallback((reason: string) => {
    sessionFallback = true;
    setState("fallback");
    setPredictions([]);
    setOpen(false);
    onFallback?.(reason);
  }, [onFallback]);

  const runSearch = useCallback(async (q: string) => {
    if (sessionFallback) return;
    if (q.length < MIN_CHARS) {
      setPredictions([]);
      setState("typing");
      return;
    }
    const key = q.trim().toLowerCase().replace(/\s+/g, " ");
    const cached = localAcCache.get(key);
    if (cached) {
      setPredictions(cached);
      setState(cached.length ? "idle" : "noresult");
      setOpen(true);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState("searching");
    try {
      const { data, error } = await supabase.functions.invoke("goong-proxy", {
        body: { op: "autocomplete", input: q },
      });
      if (ctrl.signal.aborted) return;
      if (error) {
        enterFallback("network_error");
        return;
      }
      if (data?.quotaExceeded) {
        enterFallback("quota_exceeded");
        return;
      }
      const preds: Prediction[] = (data?.predictions ?? []).slice(0, 5);
      localAcCache.set(key, preds);
      setPredictions(preds);
      setState(preds.length ? "idle" : "noresult");
      setOpen(true);
    } catch {
      if (!ctrl.signal.aborted) enterFallback("network_error");
    }
  }, [enterFallback]);

  const onChange = (val: string) => {
    setInput(val);
    if (sessionFallback) return;
    setState("typing");
    setOpen(val.length >= MIN_CHARS);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(val), DEBOUNCE_MS);
  };

  const pickPrediction = async (p: Prediction) => {
    setOpen(false);
    setInput(p.description);
    const cachedDetail = localDetailCache.get(p.place_id);
    if (cachedDetail) {
      onResolved({ ...cachedDetail, street: cachedDetail.street || p.structured_formatting?.main_text || p.description });
      return;
    }
    setState("searching");
    try {
      const { data, error } = await supabase.functions.invoke("goong-proxy", {
        body: { op: "detail", place_id: p.place_id },
      });
      if (error) { enterFallback("network_error"); return; }
      if (data?.quotaExceeded) { enterFallback("quota_exceeded"); return; }
      const r = data?.result;
      const compound = (r?.compound ?? {}) as CompoundShape;
      const formatted = r?.formatted_address ?? p.description;
      const mapped = await mapToDataset(compound, formatted);
      const street = p.structured_formatting?.main_text || (r?.name as string) || formatted.split(",")[0] || "";
      const resolved: GoongResolvedAddress = {
        street,
        formattedAddress: formatted,
        ...mapped,
        lat: r?.geometry?.location?.lat,
        lng: r?.geometry?.location?.lng,
      };
      localDetailCache.set(p.place_id, resolved);
      onResolved(resolved);
      setState("idle");
    } catch {
      enterFallback("network_error");
    }
  };

  if (state === "fallback") {
    return (
      <div className={cn("rounded-xl border border-warning/40 bg-warning-soft/40 p-3 flex items-start gap-2", className)}>
        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-warning-foreground">
          Tạm thời không dùng được gợi ý địa chỉ, vui lòng chọn tỉnh/quận/phường và nhập địa chỉ thủ công bên dưới.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label className="text-xs font-semibold text-muted-foreground">Tìm địa chỉ giao hàng</label>
      <div className="relative mt-1.5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          placeholder="Nhập số nhà, tên đường, phường…"
          className="w-full h-11 pl-10 pr-10 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
          autoComplete="off"
        />
        {state === "searching" && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Gợi ý sẽ hiện sau khi bạn nhập ít nhất {MIN_CHARS} ký tự. Chọn 1 gợi ý để tự điền tỉnh/quận/phường.
      </p>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1.5 bg-popover border rounded-xl shadow-lg overflow-hidden">
          {state === "searching" && predictions.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tìm…
            </div>
          )}
          {state === "noresult" && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Không có gợi ý — bạn có thể nhập địa chỉ thủ công bên dưới.</div>
          )}
          {predictions.map((p) => (
            <button
              key={p.place_id}
              type="button"
              onClick={() => pickPrediction(p)}
              className="w-full text-left px-4 py-2.5 hover:bg-accent flex items-start gap-2.5 border-b last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.structured_formatting?.main_text ?? p.description}</p>
                {p.structured_formatting?.secondary_text && (
                  <p className="text-xs text-muted-foreground truncate">{p.structured_formatting.secondary_text}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Re-export for callers that want to pre-warm dataset
export type { Province, District, Ward };
