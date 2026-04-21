import type { AddressService, District, Province, Ward } from "@/services/types";
import { VN_DISTRICTS, VN_PROVINCES, VN_WARDS } from "./data/vn-address";

export class LocalAddressAdapter implements AddressService {
  async listProvinces(): Promise<Province[]> {
    return [...VN_PROVINCES].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }
  async listDistricts(provinceCode: string): Promise<District[]> {
    return VN_DISTRICTS
      .filter((d) => d.provinceCode === provinceCode)
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }
  async listWards(districtCode: string): Promise<Ward[]> {
    return VN_WARDS
      .filter((w) => w.districtCode === districtCode)
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }
}
