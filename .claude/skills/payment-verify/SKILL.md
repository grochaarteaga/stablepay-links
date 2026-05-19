---
name: payment-verify
description: Verify whether a PortPagos payment actually landed — checks Supabase (invoice status + ledger entry) AND cross-references the tx_hash on Base chain (Basescan). Use when the user says "did the payment go through", "check if invoice was paid", "payment missing", "customer says they paid", "verify payment", "invoice status", "was the webhook received", "silent drop", or "debug missing payment". Eliminates the 3-tab manual check (Supabase dashboard → ledger → Basescan).
disable-model-invocation: true
metadata:
  version: 1.1.0
---

# Payment Verify

You are doing a 3-source payment reconciliation for PortPagos. The goal is to answer definitively: **did this payment land, and is everything consistent?**

> **`disable-model-invocation: true`** — the SILENT DROP debug path can write directly to the production Supabase database. This skill must only run when the user explicitly asks for it.

## Why this exists

Alchemy webhooks have silently dropped payments when the payload shape didn't match any of the 4 known variants in `extractLogs()`. When that happens, Alchemy gets a 200 OK, the customer's wallet shows the funds left, but the invoice stays `pending`. The only way to catch this was manual cross-referencing across 3 tabs. This skill does it in one step.

## Tools required

- **Bash** — queries Supabase REST API using env vars from `.env.local`
- **WebFetch** — fetches tx receipt from Basescan API (Base mainnet)

---

## Step 1 — Get the identifier

Ask the user for one of:
- **Invoice ID** (UUID) — e.g. `3f2a1b...`
- **tx_hash** — e.g. `0xabc123...`
- **Merchant wallet address** — e.g. `0xABC...` (finds the latest invoice for that wallet)
- **"The last one"** — queries the most recently updated invoice

If none provided, ask once: "Invoice ID, tx_hash, or wallet address?"

---

## Step 2 — Load env vars (deterministic)

```bash
SUPABASE_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d'=' -f2-)
SUPABASE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d'=' -f2-)
```

If either is empty, stop: "`.env.local` not found or SUPABASE vars missing — cannot query."

---

## Step 3 — Query Supabase: Invoice record (deterministic)

**By invoice ID:**
```bash
curl -s "${SUPABASE_URL}/rest/v1/invoices?id=eq.{INVOICE_ID}&select=id,status,amount,tx_hash,paid_at,invoice_wallet_address,merchant_id,created_at,customer_name,description" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

**By tx_hash:**
```bash
curl -s "${SUPABASE_URL}/rest/v1/invoices?tx_hash=eq.{TX_HASH}&select=id,status,amount,tx_hash,paid_at,invoice_wallet_address,merchant_id,created_at" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

**By wallet address (most recent 5):**
```bash
curl -s "${SUPABASE_URL}/rest/v1/invoices?invoice_wallet_address=eq.{WALLET}&select=id,status,amount,tx_hash,paid_at,invoice_wallet_address,merchant_id,created_at&order=updated_at.desc&limit=5" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

**Most recent (fallback):**
```bash
curl -s "${SUPABASE_URL}/rest/v1/invoices?select=id,status,amount,tx_hash,paid_at,invoice_wallet_address,merchant_id,created_at&order=updated_at.desc&limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

If empty array: "No invoice found."

---

## Step 4 — Query Supabase: Ledger entry (deterministic)

```bash
curl -s "${SUPABASE_URL}/rest/v1/ledger_entries?invoice_id=eq.{INVOICE_ID}&type=eq.credit&select=id,amount,tx_hash,idempotency_key,created_at,metadata" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

Expected: exactly one row with `idempotency_key = invoice:{INVOICE_ID}:payment`.

Flag:
- Zero rows → ledger credit missing
- More than one row → duplicate credit (serious — idempotency key collision)

---

## Step 5 — Verify on-chain (deterministic)

If `tx_hash` is present, use **WebFetch**:

**Tx receipt:**
```
https://api.basescan.org/api?module=transaction&action=gettxreceiptstatus&txhash={TX_HASH}&apikey=YourApiKeyToken
```

**Tx details:**
```
https://api.basescan.org/api?module=proxy&action=eth_getTransactionByHash&txhash={TX_HASH}&apikey=YourApiKeyToken
```

(`YourApiKeyToken` works for free-tier lookups at low volume.)

From receipt: `result.status = "1"` → succeeded. `"0"` → reverted. `null` → not found.
From tx details: confirm `to` = USDC contract (`NEXT_PUBLIC_USDC_CONTRACT_ADDRESS`).

---

## Step 6 — Reconcile and report (AI judgment)

```
PAYMENT VERIFICATION REPORT
────────────────────────────────────────
Invoice ID:   {id}
Customer:     {customer_name or "–"}
Amount:       {amount} USDC
Created:      {created_at}

SUPABASE — INVOICE
  Status:     {status}
  Paid at:    {paid_at or "–"}
  Wallet:     {invoice_wallet_address}
  tx_hash:    {tx_hash or "MISSING"}

SUPABASE — LEDGER
  Credit entry:    {PRESENT / MISSING}
  Credit amount:   {amount or "–"}
  Idempotency key: {idempotency_key or "–"}
  Duplicate rows:  {extras or "none"}

ON-CHAIN (Basescan / Base mainnet)
  Tx found:       {YES / NO}
  Tx status:      {SUCCEEDED / REVERTED / PENDING / NOT FOUND}
  Block:          {blockNumber or "–"}
  Basescan link:  https://basescan.org/tx/{tx_hash}

VERDICT: {see table below}
```

| Invoice | Ledger | On-chain | Verdict |
|---|---|---|---|
| `paid` | present | SUCCEEDED | **FULLY SETTLED** |
| `paid` | MISSING | SUCCEEDED | **LEDGER GAP** — may cause balance mismatch |
| `paid` | present | NOT FOUND | **HASH MISMATCH** — investigate |
| `pending` | absent | SUCCEEDED | **SILENT DROP** — see debug path below |
| `pending` | absent | NOT FOUND | **NOT PAID** |
| `pending` | absent | PENDING | **IN FLIGHT** — wait ~30s and re-run |

---

## Debug path: SILENT DROP

If on-chain confirms payment but Supabase shows `pending`:

1. Check Vercel function logs: **Settings → Functions → `/api/webhooks/alchemy`** — find the timestamp near the payment.
2. Most likely cause: Alchemy sent a webhook shape not handled by `extractLogs()` in `src/app/api/webhooks/alchemy/route.ts`.
3. To diagnose: add `console.log(JSON.stringify(body))` before `extractLogs(body)` (~line 66), deploy, then ask Alchemy to resend the webhook (Alchemy dashboard → Webhooks → Resend).
4. If confirmed new shape: extend `extractLogs()` and add a test to `src/__tests__/webhook.test.ts`.

**To manually mark the invoice paid** (only after confirming on-chain):

Show the user this command and **ask for explicit confirmation** before running it:

```bash
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/invoices?id=eq.{INVOICE_ID}" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"status":"paid","tx_hash":"{TX_HASH}","paid_at":"{ISO_TIMESTAMP}"}'
```

**Never run this PATCH without user confirmation.** It writes to production.

---

## Edge cases

- **Multiple invoices for same wallet**: show all rows, ask which to verify
- **Bridge fiat payment**: Basescan won't find it — check `src/app/api/webhooks/bridge/route.ts` logs
- **Wallet not yet generated**: check `invoice_wallet_address` is not null
- **Withdrawal tx_hash**: confirm you're looking at a `credit` ledger entry, not a `debit`
