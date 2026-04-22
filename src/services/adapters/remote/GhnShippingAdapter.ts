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

export class GhnShippingAdapter implements ShippingService {
  // Reuse local adapter for getConfig/saveConfig (zone rules + freeship thresholds).
  private readonly local = new LocalShippingAdapter();

  constructor(_storeSettings?: StoreSettingsService) {
    // storeSettings reserved for future use (e.g. dynamic from-warehouse).
  }

  getConfig(): Promise<ShippingConfig> {
    return this.local.getConfig();
  }

  saveConfig(input: ShippingConfig): Promise<ShippingConfig> {
    return this.local.saveConfig(input);
  }

  async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    const { address, subtotal, weightGrams } = input;
    const provinceName = address.provinceName?.trim();
    const districtName = address.districtName?.trim();
    const wardName = address.wardName?.trim();

    if (!provinceName || !districtName || !wardName) {
      throw new Error("address_incomplete");
    }

    const weight = weightGrams ?? 500;
    const key = cacheKey(provinceName, districtName, wardName, weight);

    // Resolve freeship threshold from local zone config.
    const cfg = await this.local.getConfig();
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
      };
    }

    // Invoke edge function with timeout
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    let res;
    try {
      res = await supabase.functions.invoke("ghn-quote", {
        body: { provinceName, districtName, wardName, weightGrams: weight, subtotal },
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.error) {
      throw new Error(res.error.message ?? "ghn_invoke_failed");
    }
    const data = res.data as
      | { ok: true; fee: number; etaDays: { min: number; max: number }; serviceId: number }
      | { ok: false; reason: string; message: string };

    if (!data || (data as { ok: boolean }).ok !== true) {
      const reason = (data as { reason?: string })?.reason ?? "ghn_unknown";
      throw new Error(reason);
    }

    writeCache(key, { at: Date.now(), fee: data.fee, etaDays: data.etaDays });

    return {
      status: "quoted",
      source: "carrier_api",
      fee: freeShip ? 0 : data.fee,
      etaDays: data.etaDays,
      freeShipApplied: freeShip,
    };
  }
}

function pickFreeshipThreshold(cfg: ShippingConfig, provinceCode?: string): number | undefined {
  if (!provinceCode) return undefined;
  const direct = cfg.zoneRules.find((r) => r.provinceCodes.includes(provinceCode));
  const wildcard = cfg.zoneRules.find((r) => r.provinceCodes.includes("*"));
  return (direct ?? wildcard)?.freeShipThreshold;
}
