import type { ShippingService } from "@/services/shipping/ShippingService";
import type {
  ShippingConfig,
  ShippingQuote,
  ShippingQuoteInput,
} from "@/services/types";

interface ErrorWithLatency extends Error {
  latencyMs?: number;
}

/**
 * Tries the carrier (GHN) adapter first; falls back to the local zone adapter
 * when the carrier is unconfigured, times out, or errors. Marks fallback
 * results with `usedFallback` + `fallbackReason` so the UI can warn the user.
 *
 * Includes a tiny circuit breaker: after `no_config` or 3 consecutive failures,
 * the carrier path is disabled for 60s to avoid spamming the edge function.
 */
export class HybridShippingAdapter implements ShippingService {
  private disabledUntil = 0;
  private consecutiveFailures = 0;
  private warned = false;

  constructor(
    private readonly carrier: ShippingService,
    private readonly fallback: ShippingService,
  ) {}

  getConfig(): Promise<ShippingConfig> {
    return this.fallback.getConfig();
  }

  saveConfig(input: ShippingConfig): Promise<ShippingConfig> {
    return this.fallback.saveConfig(input);
  }

  /** Force the next quote to retry the carrier even if circuit-breaker tripped. */
  resetBreaker(): void {
    this.disabledUntil = 0;
    this.consecutiveFailures = 0;
    this.warned = false;
  }

  async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    const now = Date.now();
    if (now < this.disabledUntil) {
      const q = await this.fallback.quote(input);
      return decorateFallback(q, "carrier_disabled", undefined, new Date().toISOString());
    }

    try {
      const q = await this.carrier.quote(input);
      this.consecutiveFailures = 0;
      return q;
    } catch (err) {
      const e = err as ErrorWithLatency;
      const reason = e?.message ?? String(err);
      const latencyMs = e?.latencyMs;
      this.consecutiveFailures += 1;

      if (reason === "no_config") {
        this.disabledUntil = now + 60_000;
      } else if (this.consecutiveFailures >= 3) {
        this.disabledUntil = now + 60_000;
        this.consecutiveFailures = 0;
      }

      if (!this.warned) {
        this.warned = true;
        console.warn("[shipping] carrier quote failed, falling back to zones:", reason);
      }
      const q = await this.fallback.quote(input);
      return decorateFallback(q, reason, latencyMs, new Date().toISOString());
    }
  }
}

function decorateFallback(
  q: ShippingQuote,
  reason: string,
  latencyMs: number | undefined,
  attemptedAt: string,
): ShippingQuote {
  // Don't mark "incomplete" or "unavailable" as a carrier-fallback —
  // those are address-state issues, not carrier failures.
  if (q.status !== "quoted") return q;
  return { ...q, usedFallback: true, fallbackReason: reason, latencyMs, attemptedAt };
}
