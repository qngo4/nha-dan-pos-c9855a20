// Local voucher adapter — hard-coded demo codes so the storefront flow can be
// exercised end-to-end without a backend. Replace with a real adapter when
// vouchers move server-side; the VoucherService contract stays the same.

import type {
  VoucherService,
  VoucherValidationResult,
} from "@/services/vouchers/VoucherService";
import { computePercentOff } from "@/services/vouchers/VoucherService";
import type { CartContext, Money, VoucherSnapshot } from "@/services/types";

interface VoucherDef {
  code: string;
  ruleSummary: string;
  /** Minimum cart subtotal required, in VND. */
  minSubtotal?: Money;
  compute: (ctx: CartContext) => Money;
}

const VOUCHERS: VoucherDef[] = [
  {
    code: "NHADAN10",
    ruleSummary: "Giảm 10% đơn hàng (tối đa 50.000đ)",
    compute: (ctx) => computePercentOff(ctx.subtotal, 10, 50_000),
  },
  {
    code: "NHADAN20",
    ruleSummary: "Giảm 20% cho đơn từ 200.000đ (tối đa 100.000đ)",
    minSubtotal: 200_000,
    compute: (ctx) => computePercentOff(ctx.subtotal, 20, 100_000),
  },
  {
    code: "GIAM50K",
    ruleSummary: "Giảm 50.000đ cho đơn từ 300.000đ",
    minSubtotal: 300_000,
    compute: () => 50_000,
  },
];

export class LocalVoucherAdapter implements VoucherService {
  async validate(rawCode: string, ctx: CartContext): Promise<VoucherValidationResult> {
    const code = rawCode.trim().toUpperCase();
    if (!code) return { valid: false, reasonIfInvalid: "Vui lòng nhập mã giảm giá" };

    const def = VOUCHERS.find((v) => v.code === code);
    if (!def) return { valid: false, reasonIfInvalid: "Mã giảm giá không hợp lệ" };

    if (def.minSubtotal && ctx.subtotal < def.minSubtotal) {
      return {
        valid: false,
        reasonIfInvalid: `Đơn tối thiểu ${def.minSubtotal.toLocaleString("vi-VN")}đ để dùng mã này`,
      };
    }

    const discount = Math.max(0, Math.min(def.compute(ctx), ctx.subtotal));
    if (discount <= 0) {
      return { valid: false, reasonIfInvalid: "Mã không tạo ra giảm giá nào cho đơn hiện tại" };
    }

    const snapshot: VoucherSnapshot = {
      code: def.code,
      ruleSummary: def.ruleSummary,
      discountAmount: discount,
    };
    return { valid: true, snapshot };
  }
}
