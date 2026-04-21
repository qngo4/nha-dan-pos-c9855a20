// Composition root.
// To swap to EC2 backend later: replace the right-hand side of each export only.
// UI MUST import services from this file (or re-exports) — never from adapters directly.

import type {
  AddressService,
  CustomerService,
  PendingOrderService,
  PromotionEvaluationService,
  ShippingService,
  StoreSettingsService,
  VietQrService,
} from "./types";

import { LocalAddressAdapter } from "./adapters/local/LocalAddressAdapter";
import { LocalCustomerAdapter } from "./adapters/local/LocalCustomerAdapter";
import { LocalPendingOrderAdapter } from "./adapters/local/LocalPendingOrderAdapter";
import { LocalPromotionAdapter } from "./adapters/local/LocalPromotionAdapter";
import { LocalShippingAdapter } from "./adapters/local/LocalShippingAdapter";
import { LocalStoreSettingsAdapter } from "./adapters/local/LocalStoreSettingsAdapter";
import { LocalVietQrAdapter } from "./adapters/local/LocalVietQrAdapter";

export const storeSettings: StoreSettingsService = new LocalStoreSettingsAdapter();
export const vietQr: VietQrService = new LocalVietQrAdapter(storeSettings);
export const addresses: AddressService = new LocalAddressAdapter();
export const shipping: ShippingService = new LocalShippingAdapter();
export const pendingOrders: PendingOrderService = new LocalPendingOrderAdapter();
export const promotions: PromotionEvaluationService = new LocalPromotionAdapter();
export const customers: CustomerService = new LocalCustomerAdapter();

export type * from "./types";
