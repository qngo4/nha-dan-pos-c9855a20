// Stub adapter — Batch 2 will implement evaluateAll/pickBest against existing
// promotion logic in src/lib/promotions.ts. UI must still compile today.
import type { PromotionEvaluationService } from "@/services/promotions/PromotionEvaluationService";
import type { CartContext, EvaluatedPromotion } from "@/services/types";

export class LocalPromotionAdapter implements PromotionEvaluationService {
  async evaluateAll(_ctx: CartContext): Promise<EvaluatedPromotion[]> {
    return [];
  }
  async pickBest(_ctx: CartContext): Promise<EvaluatedPromotion | null> {
    return null;
  }
}
