import type { AddressService } from "@/services/addresses/AddressService";
import type { Province, District, Ward } from "@/services/types";

const BASE = "https://provinces.open-api.vn/api";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_PREFIX = "ndshop:addr:";
const FETCH_TIMEOUT_MS = 6000;

interface CacheEntry<T> {
  data: T;
  savedAt: number;
}

function readCache<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    if (typeof window === "undefined") return;
    const entry: CacheEntry<T> = { data, savedAt: Date.now() };
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* ignore quota / private mode */
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

interface ApiProvince { code: number; name: string; districts?: ApiDistrict[]; }
interface ApiDistrict { code: number; name: string; wards?: ApiWard[]; }
interface ApiWard { code: number; name: string; }

const viSort = <T extends { name: string }>(arr: T[]) =>
  [...arr].sort((a, b) => a.name.localeCompare(b.name, "vi"));

export class RemoteAddressAdapter implements AddressService {
  async listProvinces(): Promise<Province[]> {
    const cacheKey = "provinces";
    const cached = readCache<Province[]>(cacheKey);
    if (cached) return cached;

    const data = await fetchJson<ApiProvince[]>(`${BASE}/p/`);
    const mapped: Province[] = viSort(
      data.map((p) => ({ code: String(p.code), name: p.name })),
    );
    writeCache(cacheKey, mapped);
    return mapped;
  }

  async listDistricts(provinceCode: string): Promise<District[]> {
    const cacheKey = `districts:${provinceCode}`;
    const cached = readCache<District[]>(cacheKey);
    if (cached) return cached;

    const data = await fetchJson<ApiProvince>(
      `${BASE}/p/${encodeURIComponent(provinceCode)}?depth=2`,
    );
    const districts = data.districts ?? [];
    const mapped: District[] = viSort(
      districts.map((d) => ({
        code: String(d.code),
        name: d.name,
        provinceCode,
      })),
    );
    writeCache(cacheKey, mapped);
    return mapped;
  }

  async listWards(districtCode: string): Promise<Ward[]> {
    const cacheKey = `wards:${districtCode}`;
    const cached = readCache<Ward[]>(cacheKey);
    if (cached) return cached;

    const data = await fetchJson<ApiDistrict>(
      `${BASE}/d/${encodeURIComponent(districtCode)}?depth=2`,
    );
    const wards = data.wards ?? [];
    const mapped: Ward[] = viSort(
      wards.map((w) => ({
        code: String(w.code),
        name: w.name,
        districtCode,
      })),
    );
    writeCache(cacheKey, mapped);
    return mapped;
  }
}
