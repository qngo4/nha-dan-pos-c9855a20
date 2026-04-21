// Composition root.
// To swap to EC2 backend later: replace the right-hand side of each export only.
// UI MUST import services from this file (or "@/services/types") — never from adapters directly.

import type { StoreSettingsService } from "./storeSettings/StoreSettingsService";
import type { VietQrService } from "./vietQr/VietQrService";
import type { AddressService } from "./addresses/AddressService";
import type { ShippingService } from "./shipping/ShippingService";
import type { PendingOrderService } from "./pendingOrders/PendingOrderService";
import type { PromotionEvaluationService } from "./promotions/PromotionEvaluationService";
import type { CustomerService } from "./customers/CustomerService";

import { LocalStoreSettingsAdapter } from "./adapters/local/LocalStoreSettingsAdapter";
import { LocalVietQrAdapter } from "./adapters/local/LocalVietQrAdapter";
import { LocalAddressAdapter } from "./adapters/local/LocalAddressAdapter";
import { LocalShippingAdapter } from "./adapters/local/LocalShippingAdapter";
import { LocalPendingOrderAdapter } from "./adapters/local/LocalPendingOrderAdapter";
import { LocalPromotionAdapter } from "./adapters/local/LocalPromotionAdapter";
import { LocalCustomerAdapter } from "./adapters/local/LocalCustomerAdapter";

export const storeSettings: StoreSettingsService = new LocalStoreSettingsAdapter();
export const vietQr: VietQrService = new LocalVietQrAdapter(storeSettings);
export const addresses: AddressService = new LocalAddressAdapter();
export const shipping: ShippingService = new LocalShippingAdapter();
export const pendingOrders: PendingOrderService = new LocalPendingOrderAdapter();
export const promotions: PromotionEvaluationService = new LocalPromotionAdapter();
export const customers: CustomerService = new LocalCustomerAdapter();

// Re-export interface types for UI consumers that need to type service references.
export type { StoreSettingsService } from "./storeSettings/StoreSettingsService";
export type { VietQrService } from "./vietQr/VietQrService";
export type { AddressService } from "./addresses/AddressService";
export type { ShippingService } from "./shipping/ShippingService";
export type { PendingOrderService } from "./pendingOrders/PendingOrderService";
export type { PromotionEvaluationService } from "./promotions/PromotionEvaluationService";
export type { CustomerService } from "./customers/CustomerService";
