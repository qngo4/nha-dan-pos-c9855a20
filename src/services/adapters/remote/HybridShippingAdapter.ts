import type { ShippingService } from "@/services/shipping/ShippingService";
import type {
  ShippingConfig,
  ShippingQuote,
  ShippingQuoteInput,
} from "@/services/types";

/**
 * Tries the primary (carrier API) adapter first; falls back to the local
 * zone-based adapter when the carrier is unconfigured, times out, or errors.
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

  async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    const now = Date.now();
    if (now < this.disabledUntil) {
      return this.fallback.quote(input);
    }

    try {
      const q = await this.carrier.quote(input);
      this.consecutiveFailures = 0;
      return q;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.consecutiveFailures += 1;

      if (message === "no_config") {
        this.disabledUntil = now + 60_000;
      } else if (this.consecutiveFailures >= 3) {
        this.disabledUntil = now + 60_000;
        this.consecutiveFailures = 0;
      }

      if (!this.warned) {
        this.warned = true;
        console.warn("[shipping] carrier quote failed, falling back to zones:", message);
      }
      return this.fallback.quote(input);
    }
  }
}
