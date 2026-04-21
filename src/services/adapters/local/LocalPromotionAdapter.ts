// Stub adapter — Batch 2 will fill this in. UI must still compile.
import type {
  CartContext,
  EvaluatedPromotion,
  PromotionEvaluationService,
} from "@/services/types";

export class LocalPromotionAdapter implements PromotionEvaluationService {
  async evaluateAll(_ctx: CartContext): Promise<EvaluatedPromotion[]> {
    return [];
  }
  async pickBest(_ctx: CartContext): Promise<EvaluatedPromotion | null> {
    return null;
  }
}
