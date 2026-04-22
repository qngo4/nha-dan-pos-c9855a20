// GHN Fee quote edge function.
// Maps Province Open API names → GHN internal IDs and returns shipping fee.
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GHN_BASE = "https://online-gateway.ghn.vn/shiip/public-api";

const BodySchema = z.object({
  provinceName: z.string().min(1),
  districtName: z.string().min(1),
  wardName: z.string().min(1),
  weightGrams: z.number().int().min(1).max(30000).optional(),
  subtotal: z.number().min(0),
});

type Province = { ProvinceID: number; ProvinceName: string; NameExtension?: string[] };
type District = { DistrictID: number; ProvinceID: number; DistrictName: string; NameExtension?: string[] };
type Ward = { WardCode: string; DistrictID: number; WardName: string; NameExtension?: string[] };

interface CacheEntry<T> { at: number; data: T }
const TTL = 24 * 60 * 60 * 1000;
const provinceCache: { v: CacheEntry<Province[]> | null } = { v: null };
const districtCache = new Map<number, CacheEntry<District[]>>();
const wardCache = new Map<number, CacheEntry<Ward[]>>();

function fresh<T>(c: CacheEntry<T> | null | undefined): c is CacheEntry<T> {
  return !!c && Date.now() - c.at < TTL;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/^(tinh|thanh pho|tp\.?|quan|huyen|thi xa|phuong|xa|thi tran)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchByName<T extends { NameExtension?: string[] }>(
  list: T[],
  target: string,
  getName: (t: T) => string,
): T | null {
  const n = norm(target);
  // Exact
  for (const it of list) {
    if (norm(getName(it)) === n) return it;
    if (it.NameExtension?.some((e) => norm(e) === n)) return it;
  }
  // Contains
  for (const it of list) {
    const nm = norm(getName(it));
    if (nm.includes(n) || n.includes(nm)) return it;
    if (it.NameExtension?.some((e) => norm(e).includes(n) || n.includes(norm(e)))) return it;
  }
  return null;
}

async function ghnFetch<T>(path: string, token: string, body?: unknown, method = "GET"): Promise<T> {
  const res = await fetch(`${GHN_BASE}${path}`, {
    method,
    headers: { Token: token, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(`GHN ${path} failed: ${json.message ?? res.statusText}`);
  }
  return json.data as T;
}

async function getProvinces(token: string): Promise<Province[]> {
  if (fresh(provinceCache.v)) return provinceCache.v!.data;
  const data = await ghnFetch<Province[]>("/master-data/province", token);
  provinceCache.v = { at: Date.now(), data };
  return data;
}

async function getDistricts(token: string, provinceId: number): Promise<District[]> {
  const c = districtCache.get(provinceId);
  if (fresh(c)) return c!.data;
  const data = await ghnFetch<District[]>("/master-data/district", token, { province_id: provinceId }, "POST");
  districtCache.set(provinceId, { at: Date.now(), data });
  return data;
}

async function getWards(token: string, districtId: number): Promise<Ward[]> {
  const c = wardCache.get(districtId);
  if (fresh(c)) return c!.data;
  const data = await ghnFetch<Ward[]>("/master-data/ward", token, { district_id: districtId }, "POST");
  wardCache.set(districtId, { at: Date.now(), data });
  return data;
}

function fail(reason: string, message: string) {
  return new Response(JSON.stringify({ ok: false, reason, message }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ ok: false, reason: "bad_input", message: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { provinceName, districtName, wardName, weightGrams, subtotal } = parsed.data;
    const TOKEN = Deno.env.get("GHN_TOKEN");
    const SHOP_ID = Deno.env.get("GHN_SHOP_ID");
    const FROM_DISTRICT = Deno.env.get("GHN_FROM_DISTRICT_ID");

    if (!TOKEN || !SHOP_ID || !FROM_DISTRICT) {
      return fail("no_config", "GHN secrets not configured");
    }
    const fromDistrictId = Number(FROM_DISTRICT);
    const shopId = Number(SHOP_ID);
    if (!fromDistrictId || !shopId) return fail("no_config", "GHN_SHOP_ID / GHN_FROM_DISTRICT_ID must be numeric");

    // Map names → GHN IDs
    const provinces = await getProvinces(TOKEN);
    const province = matchByName(provinces, provinceName, (p) => p.ProvinceName);
    if (!province) return fail("address_unmapped", `Province "${provinceName}" not found in GHN`);

    const districts = await getDistricts(TOKEN, province.ProvinceID);
    const district = matchByName(districts, districtName, (d) => d.DistrictName);
    if (!district) return fail("address_unmapped", `District "${districtName}" not found in GHN`);

    const wards = await getWards(TOKEN, district.DistrictID);
    const ward = matchByName(wards, wardName, (w) => w.WardName);
    if (!ward) return fail("address_unmapped", `Ward "${wardName}" not found in GHN`);

    const weight = weightGrams ?? 500;

    // Pick available service
    const services = await ghnFetch<Array<{ service_id: number; service_type_id: number }>>(
      "/v2/shipping-order/available-services",
      TOKEN,
      {
        shop_id: shopId,
        from_district: fromDistrictId,
        to_district: district.DistrictID,
      },
      "POST",
    );
    if (!services?.length) return fail("no_service", "No GHN service available for this route");
    const service =
      services.find((s) => s.service_type_id === 2) ?? services[0];

    // Fee
    const feeRes = await fetch(`${GHN_BASE}/v2/shipping-order/fee`, {
      method: "POST",
      headers: {
        Token: TOKEN,
        ShopId: String(shopId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: service.service_id,
        service_type_id: service.service_type_id,
        from_district_id: fromDistrictId,
        to_district_id: district.DistrictID,
        to_ward_code: ward.WardCode,
        weight,
        length: 20,
        width: 15,
        height: 10,
        insurance_value: Math.min(subtotal, 5_000_000),
      }),
    });
    const feeJson = await feeRes.json();
    if (!feeRes.ok || feeJson.code !== 200) {
      console.error("GHN fee error:", feeJson);
      return fail("ghn_error", feeJson.message ?? "GHN fee API failed");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        fee: feeJson.data?.total ?? 0,
        etaDays: { min: 2, max: 4 },
        serviceId: service.service_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("ghn-quote error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return fail("ghn_error", message);
  }
});
