import type { StoreSettingsService } from "@/services/storeSettings/StoreSettingsService";
import type { StorePaymentSettings } from "@/services/types";
import { readJson, writeJson } from "./storage";

const KEY = "store_payment_settings:v1";

const DEFAULT_SETTINGS: StorePaymentSettings = {
  shopName: "Nhã Đan Shop",
  qrEnabled: false,
  vietQrBankCode: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
  branch: "",
  transferPrefix: "DH",
  qrTemplate: "compact2",
  momoQrImage: "",
  momoAccountName: "",
  momoPhone: "",
  zalopayQrImage: "",
  zalopayAccountName: "",
  zalopayPhone: "",
};

export class LocalStoreSettingsAdapter implements StoreSettingsService {
  private listeners = new Set<(s: StorePaymentSettings | null) => void>();

  async getPaymentSettings(): Promise<StorePaymentSettings | null> {
    const stored = readJson<StorePaymentSettings | null>(KEY, null);
    return stored ?? DEFAULT_SETTINGS;
  }

  async savePaymentSettings(input: StorePaymentSettings): Promise<StorePaymentSettings> {
    writeJson(KEY, input);
    this.listeners.forEach((cb) => cb(input));
    return input;
  }

  subscribePaymentSettings(cb: (s: StorePaymentSettings | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}
