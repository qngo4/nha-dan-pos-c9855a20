// Bundled minimal VN address dataset used by LocalAddressAdapter.
// Source-of-truth model: code + name (per canonical types).
// Future: replace with full Province Open API dataset; the adapter API stays the same.
//
// NOTE: kept TS (not .json) so we get type-checking for free. Same shape as a future API response.

import type { Province, District, Ward } from "@/services/types";

export const VN_PROVINCES: Province[] = [
  { code: "01", name: "Hà Nội" },
  { code: "79", name: "TP. Hồ Chí Minh" },
  { code: "48", name: "Đà Nẵng" },
  { code: "31", name: "Hải Phòng" },
  { code: "92", name: "Cần Thơ" },
  { code: "74", name: "Bình Dương" },
  { code: "75", name: "Đồng Nai" },
  { code: "77", name: "Bà Rịa - Vũng Tàu" },
  { code: "80", name: "Long An" },
  { code: "27", name: "Bắc Ninh" },
  { code: "33", name: "Hưng Yên" },
  { code: "30", name: "Hải Dương" },
  { code: "26", name: "Vĩnh Phúc" },
  { code: "72", name: "Tây Ninh" },
  { code: "46", name: "Thừa Thiên Huế" },
  { code: "49", name: "Quảng Nam" },
  { code: "56", name: "Khánh Hòa" },
  { code: "60", name: "Bình Thuận" },
  { code: "68", name: "Lâm Đồng" },
  { code: "82", name: "Tiền Giang" },
  { code: "94", name: "Bạc Liêu" },
];

// Minimal districts per province (1–4 each) to keep bundle small but realistic.
export const VN_DISTRICTS: District[] = [
  // Hà Nội
  { code: "001", name: "Quận Ba Đình", provinceCode: "01" },
  { code: "002", name: "Quận Hoàn Kiếm", provinceCode: "01" },
  { code: "003", name: "Quận Tây Hồ", provinceCode: "01" },
  { code: "007", name: "Quận Cầu Giấy", provinceCode: "01" },
  { code: "008", name: "Quận Đống Đa", provinceCode: "01" },
  { code: "019", name: "Quận Long Biên", provinceCode: "01" },
  // TP.HCM
  { code: "760", name: "Quận 1", provinceCode: "79" },
  { code: "761", name: "Quận 12", provinceCode: "79" },
  { code: "764", name: "Quận Gò Vấp", provinceCode: "79" },
  { code: "765", name: "Quận Bình Thạnh", provinceCode: "79" },
  { code: "766", name: "Quận Tân Bình", provinceCode: "79" },
  { code: "768", name: "Quận Phú Nhuận", provinceCode: "79" },
  { code: "770", name: "Thành phố Thủ Đức", provinceCode: "79" },
  { code: "777", name: "Quận 7", provinceCode: "79" },
  // Đà Nẵng
  { code: "490", name: "Quận Hải Châu", provinceCode: "48" },
  { code: "491", name: "Quận Thanh Khê", provinceCode: "48" },
  { code: "492", name: "Quận Sơn Trà", provinceCode: "48" },
  // Hải Phòng
  { code: "303", name: "Quận Hồng Bàng", provinceCode: "31" },
  { code: "304", name: "Quận Ngô Quyền", provinceCode: "31" },
  // Cần Thơ
  { code: "916", name: "Quận Ninh Kiều", provinceCode: "92" },
  { code: "917", name: "Quận Bình Thủy", provinceCode: "92" },
  // Bình Dương
  { code: "718", name: "Thành phố Thủ Dầu Một", provinceCode: "74" },
  { code: "719", name: "Thành phố Dĩ An", provinceCode: "74" },
  { code: "720", name: "Thành phố Thuận An", provinceCode: "74" },
  // Đồng Nai
  { code: "731", name: "Thành phố Biên Hòa", provinceCode: "75" },
  { code: "732", name: "Thành phố Long Khánh", provinceCode: "75" },
  // Bà Rịa - Vũng Tàu
  { code: "747", name: "Thành phố Vũng Tàu", provinceCode: "77" },
  { code: "748", name: "Thành phố Bà Rịa", provinceCode: "77" },
  // Long An
  { code: "794", name: "Thành phố Tân An", provinceCode: "80" },
  // Bắc Ninh
  { code: "256", name: "Thành phố Bắc Ninh", provinceCode: "27" },
  // Hưng Yên
  { code: "323", name: "Thành phố Hưng Yên", provinceCode: "33" },
  // Hải Dương
  { code: "288", name: "Thành phố Hải Dương", provinceCode: "30" },
  // Vĩnh Phúc
  { code: "243", name: "Thành phố Vĩnh Yên", provinceCode: "26" },
  // Tây Ninh
  { code: "703", name: "Thành phố Tây Ninh", provinceCode: "72" },
  // Huế
  { code: "474", name: "Thành phố Huế", provinceCode: "46" },
  // Quảng Nam
  { code: "502", name: "Thành phố Tam Kỳ", provinceCode: "49" },
  { code: "503", name: "Thành phố Hội An", provinceCode: "49" },
  // Khánh Hòa
  { code: "568", name: "Thành phố Nha Trang", provinceCode: "56" },
  // Bình Thuận
  { code: "593", name: "Thành phố Phan Thiết", provinceCode: "60" },
  // Lâm Đồng
  { code: "672", name: "Thành phố Đà Lạt", provinceCode: "68" },
  { code: "673", name: "Thành phố Bảo Lộc", provinceCode: "68" },
  // Tiền Giang
  { code: "815", name: "Thành phố Mỹ Tho", provinceCode: "80" },
  // Bạc Liêu
  { code: "954", name: "Thành phố Bạc Liêu", provinceCode: "94" },
];

// 2–4 wards per district, enough to feel real without bundle bloat.
function w(code: string, name: string, districtCode: string): Ward {
  return { code, name, districtCode };
}

export const VN_WARDS: Ward[] = VN_DISTRICTS.flatMap((d) => [
  w(`${d.code}-01`, `Phường 1`, d.code),
  w(`${d.code}-02`, `Phường 2`, d.code),
  w(`${d.code}-03`, `Phường 3`, d.code),
  w(`${d.code}-04`, `Phường 4`, d.code),
]);
