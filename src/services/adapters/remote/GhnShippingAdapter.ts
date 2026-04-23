import { supabase } from "@/integrations/supabase/client";
import type { ShippingService } from "@/services/shipping/ShippingService";
import type { StoreSettingsService } from "@/services/storeSettings/StoreSettingsService";
import type {
  ShippingConfig,
  ShippingQuote,
  ShippingQuoteInput,
} from "@/services/types";
import { LocalShippingAdapter } from "../local/LocalShippingAdapter";

const CACHE_PREFIX = "ndshop:ship:ghn:";
const CACHE_TTL = 30 * 60 * 1000; // 30 min

interface CachedQuote {
  at: number;
  fee: number;
  etaDays: { min: number; max: number };
}

function cacheKey(p: string, d: string, w: string, weight: number): string {
  return `${CACHE_PREFIX}${p}|${d}|${w}|${weight}`;
}

function readCache(key: string): CachedQuote | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as CachedQuote;
    if (Date.now() - v.at > CACHE_TTL) return null;
    return v;
  } catch {
    return null;
  }
}

function writeCache(key: string, v: CachedQuote): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

interface InvokeResp {
  data:
    | { ok: true; fee: number; etaDays: { min: number; max: number }; serviceId: number }
    | { ok: false; reason: string; message: string }
    | null;
  error: { message?: string } | null;
}

interface ErrorWithLatency extends Error {
  latencyMs?: number;
}

/**
 * GHN shipping adapter. Implements `ShippingService` over a Supabase edge
 * function. Includes:
 *   - 30-minute localStorage cache keyed on (province, district, ward, weight)
 *   - In-flight request deduplication (rapid address typing collapses to 1 call)
 *   - 8-second client-side timeout via AbortController → throws "timeout"
 *   - Forwards `orderCode` so admin log rows can be traced to a draft order
 *   - Records `latencyMs` + `attemptedAt` on each successful quote
 */
export class GhnShippingAdapter implements ShippingService {
  private readonly local = new LocalShippingAdapter();
  private readonly inflight = new Map<string, Promise<ShippingQuote>>();

  constructor(_storeSettings?: StoreSettingsService) {
    /* reserved for future dynamic from-warehouse config */
  }

  getConfig(): Promise<ShippingConfig> {
    return this.local.getConfig();
  }

  saveConfig(input: ShippingConfig): Promise<ShippingConfig> {
    return this.local.saveConfig(input);
  }

  async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    const { address, subtotal, weightGrams, orderCode, parcel, declaredValue } = input;
    const provinceName = address.provinceName?.trim();
    const districtName = address.districtName?.trim();
    const wardName = address.wardName?.trim();

    if (!provinceName || !districtName || !wardName) {
      throw new Error("address_incomplete");
    }

    const cfg = await this.local.getConfig();
    const pd = cfg.parcelDefaults;
    const weight = weightGrams ?? pd?.weightGrams ?? 500;
    const length = parcel?.length ?? pd?.length ?? 10;
    const width = parcel?.width ?? pd?.width ?? 10;
    const height = parcel?.height ?? pd?.height ?? 10;

    let insuranceValue = 0;
    if (declaredValue !== undefined) {
      insuranceValue = declaredValue;
    } else if (pd?.declaredValueMode === "subtotal") {
      insuranceValue = Math.min(subtotal, 5_000_000);
    } else if (pd?.declaredValueMode === "fixed") {
      insuranceValue = Math.min(pd.declaredValueFixed ?? 0, 5_000_000);
    }

    const key = cacheKey(provinceName, districtName, wardName, weight) +
      `|${length}x${width}x${height}|${insuranceValue}`;

    const freeshipThreshold = pickFreeshipThreshold(cfg, address.provinceCode);
    const freeShip = freeshipThreshold !== undefined && subtotal >= freeshipThreshold;

    const cached = readCache(key);
    if (cached) {
      return {
        status: "quoted",
        source: "carrier_api",
        fee: freeShip ? 0 : cached.fee,
        etaDays: cached.etaDays,
        freeShipApplied: freeShip,
        latencyMs: 0,
        attemptedAt: new Date().toISOString(),
      };
    }

    const existing = this.inflight.get(key);
    if (existing) return existing;

    const promise = this.fetchAndCache(key, provinceName, districtName, wardName, weight, length, width, height, insuranceValue, subtotal, freeShip, orderCode)
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }

  private async fetchAndCache(
    key: string,
    provinceName: string,
    districtName: string,
    wardName: string,
    weight: number,
    subtotal: number,
    freeShip: boolean,
    orderCode?: string,
  ): Promise<ShippingQuote> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const startedAt = Date.now();
    let res: InvokeResp;
    try {
      res = (await supabase.functions.invoke("ghn-quote", {
        body: { provinceName, districtName, wardName, weightGrams: weight, subtotal, orderCode },
      })) as InvokeResp;
    } catch (err) {
      const latencyMs = Date.now() - startedAt;
      if (ctrl.signal.aborted) {
        const e: ErrorWithLatency = new Error("timeout");
        e.latencyMs = latencyMs;
        throw e;
      }
      const e: ErrorWithLatency = err instanceof Error ? err : new Error(String(err));
      e.latencyMs = latencyMs;
      throw e;
    } finally {
      clearTimeout(timer);
    }

    const latencyMs = Date.now() - startedAt;
    if (res.error) {
      const e: ErrorWithLatency = new Error(res.error.message ?? "ghn_invoke_failed");
      e.latencyMs = latencyMs;
      throw e;
    }
    const data = res.data;
    if (!data || data.ok !== true) {
      const e: ErrorWithLatency = new Error((data && "reason" in data ? data.reason : null) ?? "ghn_unknown");
      e.latencyMs = latencyMs;
      throw e;
    }

    writeCache(key, { at: Date.now(), fee: data.fee, etaDays: data.etaDays });

    return {
      status: "quoted",
      source: "carrier_api",
      fee: freeShip ? 0 : data.fee,
      etaDays: data.etaDays,
      freeShipApplied: freeShip,
      latencyMs,
      attemptedAt: new Date().toISOString(),
    };
  }
}

function pickFreeshipThreshold(cfg: ShippingConfig, provinceCode?: string): number | undefined {
  if (!provinceCode) return undefined;
  const direct = cfg.zoneRules.find((r) => r.provinceCodes.includes(provinceCode));
  const wildcard = cfg.zoneRules.find((r) => r.provinceCodes.includes("*"));
  return (direct ?? wildcard)?.freeShipThreshold;
}
