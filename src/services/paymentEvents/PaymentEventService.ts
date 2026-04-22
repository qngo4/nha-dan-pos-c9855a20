// Payment event service interface.
// Backed by Lovable Cloud (Casso webhook writes rows; admin reads/links them).
// UI MUST go through @/services — never read the supabase table directly.

export interface PaymentEvent {
  id: string;
  provider: string;
  providerTxId: string;
  amount: number;
  transferContent: string;
  matchedCode: string | null;
  bankAccount: string | null;
  bankSubAcc: string | null;
  txTime: string | null;
  linkedOrderCode: string | null;
  linkedAt: string | null;
  linkedBy: string | null;
  status: "unmatched" | "matched" | "ignored" | "linked";
  createdAt: string;
}

export interface PaymentEventService {
  /** Latest events overall, newest first. */
  listRecent(limit?: number): Promise<PaymentEvent[]>;
  /** Events not yet linked to any order (admin worklist). */
  listUnmatched(limit?: number): Promise<PaymentEvent[]>;
  /** Events whose extracted matched_code equals the given order code. */
  findByOrderCode(code: string): Promise<PaymentEvent[]>;
  /** Manually link an event to an order (status -> 'linked'). */
  linkToOrder(
    eventId: string,
    orderCode: string,
    by: "auto" | "admin",
  ): Promise<PaymentEvent>;
  /** Mark an event as ignored (e.g. wrong-recipient transfer). */
  markIgnored(eventId: string): Promise<PaymentEvent>;
  /** Count of events still needing admin attention. */
  countUnmatched(): Promise<number>;
}
