

# Phase A — Province Open API cho dữ liệu địa chỉ VN

## Mục tiêu
Thay nguồn dữ liệu địa chỉ tĩnh (`vn-address.json`) bằng **Province Open API** (`provinces.open-api.vn`), giữ JSON local làm fallback khi mất mạng / API down. Không thay đổi UI, không thay đổi service interface.

## Phạm vi
- Chỉ động đến tầng adapter của `AddressService`.
- Không sửa: UI components, `AddressService` interface, `vn-address.json` (giữ làm fallback).
- Không động đến shipping (Phase B sau).

## Kiến trúc

```text
UI (AddressSelect, Checkout, CustomerFormDrawer)
        │
        ▼
@/services  ──►  AddressService (interface, không đổi)
                       │
                       ▼
        RemoteAddressAdapter (mới)
            ├── fetch provinces.open-api.vn
            ├── cache localStorage (TTL 7 ngày)
            └── fallback ──► LocalAddressAdapter (vn-address.json)
```

## Mapping dữ liệu

API trả về:
- `/p/` → `[{ code: 1, name: "Hà Nội", ... }]`
- `/p/{code}?depth=2` → tỉnh + `districts[]`
- `/d/{code}?depth=2` → quận + `wards[]`

Map sang type hiện tại (`Province | District | Ward` trong `services/types.ts`):
- `code`: ép sang **string** (API trả number) để khớp type hiện tại.
- `District.provinceCode` / `Ward.districtCode`: lấy từ tham số request.

## Triển khai chi tiết

### 1. File mới: `src/services/adapters/remote/RemoteAddressAdapter.ts`
- Implement `AddressService`.
- 3 method: `listProvinces`, `listDistricts(provinceCode)`, `listWards(districtCode)`.
- Mỗi method:
  1. Đọc cache `localStorage` key `addr:provinces` / `addr:districts:{code}` / `addr:wards:{code}`.
  2. Nếu cache còn hạn (TTL 7 ngày) → trả ngay.
  3. Fetch API với `AbortController` timeout 6s.
  4. Map response → type chuẩn, sort theo tên (locale `vi`).
  5. Ghi cache, trả kết quả.
  6. Nếu fetch lỗi/timeout → throw để layer fallback xử lý.

### 2. File mới: `src/services/adapters/remote/HybridAddressAdapter.ts`
- Wrap `RemoteAddressAdapter` + `LocalAddressAdapter`.
- Try remote trước, catch lỗi → fallback local, log warning console một lần.
- Đảm bảo UI luôn có data dù offline.

### 3. Sửa `src/services/index.ts`
- Đổi binding:
  ```ts
  export const addresses: AddressService = new HybridAddressAdapter(
    new RemoteAddressAdapter(),
    new LocalAddressAdapter(),
  );
  ```
- Không đổi gì khác.

### 4. Cache helper (inline trong RemoteAddressAdapter)
- Key prefix `addr:` để dễ clear.
- Value: `{ data, savedAt }`. TTL: `7 * 86400 * 1000` ms.
- Try/catch quanh `localStorage` (Safari private mode).

### 5. Không sửa
- `LocalAddressAdapter.ts` — giữ nguyên làm fallback.
- `vn-address.json` — giữ nguyên (bundle fallback).
- `AddressService.ts` interface — giữ nguyên.
- Mọi UI component dùng `addresses` từ `@/services`.

## Endpoints sử dụng
- `GET https://provinces.open-api.vn/api/p/` — danh sách tỉnh
- `GET https://provinces.open-api.vn/api/p/{provinceCode}?depth=2` — quận của tỉnh
- `GET https://provinces.open-api.vn/api/d/{districtCode}?depth=2` — phường của quận

## Rủi ro & xử lý
| Rủi ro | Giải pháp |
|---|---|
| API down / timeout | Fallback `LocalAddressAdapter` tự động |
| Mất mạng | Cache 7 ngày + fallback JSON |
| Code tỉnh API ≠ code trong JSON cũ | Sau khi swap, dữ liệu cũ trong order/customer vẫn lưu code/string — chỉ ảnh hưởng khi user mở lại form chỉnh sửa địa chỉ. Nếu phát hiện mismatch sẽ ghi chú và xử lý ở Phase A.1 (không nằm trong scope hiện tại). |
| Sáp nhập tỉnh xã 2024–2025 | API cập nhật chuẩn, JSON fallback có thể lệch — chấp nhận vì chỉ dùng khi offline |

## Kiểm thử sau triển khai
1. Mở Checkout / CustomerFormDrawer → chọn tỉnh → quận → phường: load mượt.
2. Tắt mạng (DevTools offline) → reload → vẫn chọn được nhờ cache hoặc fallback.
3. Xoá `localStorage` key `addr:*` → mở lại → fetch fresh.
4. Throttle network 3G → vẫn dùng được nhờ cache.

## Files thay đổi
- ➕ `src/services/adapters/remote/RemoteAddressAdapter.ts` (mới)
- ➕ `src/services/adapters/remote/HybridAddressAdapter.ts` (mới)
- ✏️ `src/services/index.ts` (đổi 1 dòng binding)
- ✏️ `src/services/README.md` (ghi chú thêm folder `adapters/remote/`)

Không file nào khác bị ảnh hưởng. Không cần migration DB, không cần secret, không cần user thao tác.

