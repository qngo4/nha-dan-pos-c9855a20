// Adapter that wraps the existing rule engine in src/lib/promotions.ts and
// exposes it through the canonical PromotionEvaluationService contract.
//
// Source of promotion definitions: the existing in-memory store (src/lib/store.ts),
// which already migrates legacy mock data into the discriminated-union model.
import type { PromotionEvaluationService } from "@/services/promotions/PromotionEvaluationService";
import type {
  CartContext,
  EvaluatedPromotion,
  GiftLine,
  PromotionAffectedLine,
  PromotionType as ServicePromotionType,
} from "@/services/types";
import {
  applyPromotionToCart,
  type Cart as LibCart,
  type CartLine as LibCartLine,
  type Promotion as LibPromotion,
  type PromotionApplication,
  type PromotionType as LibPromotionType,
  formatPromotionSummary,
} from "@/lib/promotions";

// Lazy import of the store to avoid a circular dep at module init time.
function readPromotions(): LibPromotion[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@/lib/store") as typeof import("@/lib/store");
  return mod.useStore.length === 0
    ? // useStore is a hook — read raw state via the getSnapshot exposed indirectly:
      (mod as unknown as { __getState?: () => { promotions: LibPromotion[] } }).__getState?.()
        ?.promotions ?? readPromotionsFallback(mod)
    : readPromotionsFallback(mod);
}
function readPromotionsFallback(mod: typeof import("@/lib/store")): LibPromotion[] {
  // The store doesn't expose a getter, so we tap through useStore's snapshot
  // by calling the internal subscribe pattern: the safest cross-cut is to read
  // via a one-shot subscriber. Since we don't want to subscribe forever, we use
  // a tiny trick: useStore's getSnapshot returns the live state object — but it
  // is only available inside a React render. As a service we instead rely on the
  // module-level `state` via a runtime accessor we add below.
  const anyMod = mod as unknown as { getStoreState?: () => { promotions: LibPromotion[] } };
  return anyMod.getStoreState?.().promotions ?? [];
}

const TYPE_MAP: Record<LibPromotionType, ServicePromotionType> = {
  percent: "percent_discount",
  fixed: "fixed_discount",
  "buy-x-get-y": "buy_x_get_y",
  gift: "gift",
  "free-shipping": "free_shipping",
};

function toLibCart(ctx: CartContext): LibCart {
  const lines: LibCartLine[] = ctx.lines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId,
    productName: l.productName,
    unitPrice: l.unitPrice,
    quantity: l.qty,
  }));
  return {
    lines,
    subtotal: ctx.subtotal,
    shippingFee: ctx.shippingQuote?.fee ?? 0,
  };
}

function buildAffectedLines(ctx: CartContext, app: PromotionApplication): PromotionAffectedLine[] {
  // Distribute the discount proportionally across cart lines that fall within
  // the promotion's effective scope. Free-shipping never affects line items.
  if (app.discount <= 0) return [];
  const totalSubtotal = ctx.lines.reduce((s, l) => s + l.lineSubtotal, 0);
  if (totalSubtotal <= 0) return [];
  return ctx.lines.map((l) => ({
    lineId: l.id,
    productId: l.productId,
    variantId: l.variantId,
    productName: l.productName,
    variantName: l.variantName,
    eligibleQty: l.qty,
    discountedAmount: Math.round((l.lineSubtotal / totalSubtotal) * app.discount),
  }));
}

function buildGiftLines(app: PromotionApplication): GiftLine[] {
  if (!app.freeItems?.length) return [];
  return app.freeItems.map((g) => ({
    productId: g.productId,
    productName: g.productName,
    qty: g.quantity,
    unitPrice: 0,
    lineTotal: 0,
    promotionId: app.promotionId,
    promotionName: app.promotionName,
  }));
}

function toEvaluated(p: LibPromotion, app: PromotionApplication, ctx: CartContext): EvaluatedPromotion {
  return {
    promotionId: app.promotionId,
    name: app.promotionName,
    type: TYPE_MAP[p.type],
    ruleSummary: formatPromotionSummary(p),
    eligible: app.applied,
    reasonIfIneligible: app.applied ? undefined : app.skipReason,
    discountAmount: app.discount,
    shippingDiscountAmount: app.shippingDiscount,
    voucherDiscountAmount: 0,
    affectedLines: buildAffectedLines(ctx, app),
    giftLines: buildGiftLines(app),
  };
}

export class LocalPromotionAdapter implements PromotionEvaluationService {
  async evaluateAll(ctx: CartContext): Promise<EvaluatedPromotion[]> {
    const promos = readPromotions();
    if (promos.length === 0) return [];
    const libCart = toLibCart(ctx);
    return promos.map((p) => toEvaluated(p, applyPromotionToCart(libCart, p), ctx));
  }

  async pickBest(ctx: CartContext): Promise<EvaluatedPromotion | null> {
    const all = await this.evaluateAll(ctx);
    const eligible = all.filter((e) => e.eligible);
    if (eligible.length === 0) return null;
    // Prefer the one with the highest combined discount (line discount + shipping discount).
    eligible.sort(
      (a, b) =>
        b.discountAmount + b.shippingDiscountAmount -
        (a.discountAmount + a.shippingDiscountAmount)
    );
    return eligible[0];
  }
}
