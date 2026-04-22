// Casso webhook receiver.
// - Public endpoint (no JWT). Verifies a shared "Secure-Token" header.
// - Idempotent via UNIQUE (provider, provider_tx_id) on payment_events.
// - Extracts order code (e.g. DH-20240115-1234) from the transfer description
//   when possible; otherwise stores as 'unmatched' for admin to link manually.
//
// Casso v2 payload shape:
// {
//   "error": 0,
//   "data": [
//     {
//       "id": 12345,
//       "tid": "FT24011500001",
//       "description": "Khach DH-20240115-1234 chuyen khoan",
//       "amount": 350000,
//       "when": "2024-01-15T10:30:00.000Z",
//       "bank_sub_acc_id": "...",
//       "subAccId": "...",
//       "bankName": "VCB",
//       ...
//     }
//   ]
// }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, secure-token",
};

const ORDER_CODE_RE = /DH[-\s]?(\d{8})[-\s]?(\d{4})/i;

function extractOrderCode(description: string): string | null {
  if (!description) return null;
  const normalized = description
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ");
  const m = normalized.match(ORDER_CODE_RE);
  if (!m) return null;
  return `DH-${m[1]}-${m[2]}`.toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const expectedToken = Deno.env.get("CASSO_WEBHOOK_TOKEN");
  if (!expectedToken) {
    console.error("CASSO_WEBHOOK_TOKEN is not configured");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Casso sends the Secure-Token header configured in their dashboard.
  const provided =
    req.headers.get("secure-token") ?? req.headers.get("Secure-Token");
  if (provided !== expectedToken) {
    console.warn("Invalid secure-token");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const transactions: any[] = Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body)
    ? body
    : body?.data
    ? [body.data]
    : [];

  if (transactions.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const tx of transactions) {
    const providerTxId = String(
      tx.tid ?? tx.id ?? tx.transactionId ?? tx.reference ?? "",
    ).trim();
    if (!providerTxId) {
      errors.push("Missing tx id");
      continue;
    }

    const description: string = String(tx.description ?? tx.content ?? "");
    const amountRaw = Number(tx.amount ?? tx.value ?? 0);
    const amount = Math.max(0, Math.round(amountRaw));
    const matchedCode = extractOrderCode(description);
    const txTime = tx.when ?? tx.transactionDateTime ?? tx.tranDate ?? null;

    const row = {
      provider: "casso",
      provider_tx_id: providerTxId,
      amount,
      transfer_content: description,
      matched_code: matchedCode,
      bank_account: tx.bankAccount ?? tx.bank_account ?? null,
      bank_sub_acc:
        tx.subAccId ?? tx.bank_sub_acc_id ?? tx.bankSubAccId ?? null,
      tx_time: txTime ? new Date(txTime).toISOString() : null,
      raw_payload: tx,
      status: matchedCode ? "matched" : "unmatched",
    };

    const { error } = await supabase.from("payment_events").insert(row);

    if (error) {
      // Unique violation → already processed this tx, treat as success (idempotent).
      if (
        error.code === "23505" ||
        /duplicate key/i.test(error.message ?? "")
      ) {
        skipped++;
        continue;
      }
      console.error("Insert payment_event failed:", error);
      errors.push(error.message);
      continue;
    }
    inserted++;
  }

  return new Response(
    JSON.stringify({
      ok: true,
      received: transactions.length,
      inserted,
      skipped,
      errors,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
