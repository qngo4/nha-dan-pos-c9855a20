import type {
  StorePaymentSettings,
  StoreSettingsService,
} from "@/services/types";
import { readJson, writeJson } from "./storage";

const KEY = "store_payment_settings";

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
};

export class LocalStoreSettingsAdapter implements StoreSettingsService {
  private listeners = new Set<(s: StorePaymentSettings | null) => void>();

  async getPaymentSettings(): Promise<StorePaymentSettings | null> {
    const stored = readJson<StorePaymentSettings | null>(KEY, null);
    if (stored) return stored;
    return DEFAULT_SETTINGS;
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
