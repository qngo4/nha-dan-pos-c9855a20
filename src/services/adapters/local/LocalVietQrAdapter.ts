import type {
  StoreSettingsService,
  VietQrRequest,
  VietQrResult,
  VietQrService,
  VietQrTemplate,
} from "@/services/types";

/**
 * VietQR image generator using img.vietqr.io.
 * URL pattern: https://img.vietqr.io/image/{bank}-{account}-{template}.png?amount=&addInfo=&accountName=
 * Bank code = NAPAS code (e.g. VCB, TCB, ACB, MB).
 */
export class LocalVietQrAdapter implements VietQrService {
  constructor(private settings: StoreSettingsService) {}

  async generate(request: VietQrRequest): Promise<VietQrResult> {
    const s = await this.settings.getPaymentSettings();
    if (!s || !s.qrEnabled || !s.vietQrBankCode || !s.accountNumber) {
      throw new Error("VietQR chưa được cấu hình. Vào 'Cài đặt cửa hàng' để thiết lập.");
    }
    const template: VietQrTemplate = s.qrTemplate ?? "compact2";
    const params = new URLSearchParams({
      amount: String(Math.max(0, Math.round(request.amount))),
      addInfo: request.transferContent,
      accountName: s.accountName ?? "",
    });
    const imageUrl = `https://img.vietqr.io/image/${encodeURIComponent(
      s.vietQrBankCode
    )}-${encodeURIComponent(s.accountNumber)}-${template}.png?${params.toString()}`;

    return {
      imageUrl,
      rawPayload: imageUrl,
      bankName: s.bankName,
      accountNumber: s.accountNumber,
      accountName: s.accountName,
      amount: request.amount,
      transferContent: request.transferContent,
      template,
    };
  }
}
