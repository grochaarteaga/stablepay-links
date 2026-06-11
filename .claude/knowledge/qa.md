# QA — Knowledge Base

> Maintained by the **qa** agent. Read at the start of every task. Append to `## Log` after real work.

## Project snapshot

- **Name:** PortPagos — USDC settlement infrastructure for port agents and shipping companies
- **Why quality is critical:** The product moves real money across borders. A bug can cause duplicate payments, lost funds, or compliance violations. Prioritize correctness > feature velocity.

## High-risk surfaces (check these first)

| Surface | Risk | Primary defense |
|---|---|---|
| Alchemy webhook → ledger | Double-credit if webhook replayed | Idempotency key on tx_hash |
| Transak off-ramp (merchant) | ORDER_FAILED without reversal, double-debit under concurrency | idempotency_key guards, non-negative balance constraint |
| Transak on-ramp (payer) | Invoice marked paid before USDC actually arrives | Poll invoice status only; Alchemy webhook is the source of truth |
| postMessage from Transak widget | Malicious origin sends crafted ORDER_CREATED | e.origin validated against TRANSAK_ORIGIN constant |
| Privy wallet ops | Key-not-available edge case | Fail safe, retry with backoff |
| Supabase RLS | Unauthorized cross-tenant read/write | Explicit tests per policy |
| Payment link open | URL guessing, enumeration | Random high-entropy ID, rate-limit |
| Amount handling | Float vs integer, decimal rounding | Integer minor units, assertions |
| Timezone at period boundaries | Midnight reports, settlement cutoffs | Store UTC, convert at render |
| Webhook retry storms | Many callbacks when upstream flaps | Dedup window, circuit breaker |

## Standard edge-case checklist (run for any new feature)

- [ ] Concurrent writes from same user
- [ ] Double-submit (user double-clicks)
- [ ] Session timeout mid-flow
- [ ] Network loss between write and confirm
- [ ] Upstream API 5xx / timeout
- [ ] Webhook replay (same event delivered twice)
- [ ] Webhook out-of-order (B arrives before A)
- [ ] Integer boundaries (0, negative, max USDC)
- [ ] Unicode / emoji / RTL in text fields
- [ ] Large input (10k-row CSV, 100MB file)
- [ ] RLS bypass attempt (user A reads user B's data)
- [ ] Race between two legitimate operations on same resource
- [ ] Timezone crossover (DST, leap second)
- [ ] Missing env var / misconfigured secret

## Known failure modes

_(Append patterns as they're found. Format: what broke → why → the check that catches it next time.)_

**Alchemy webhook payload shape varies across event types** — past missed payments traced to this. The `event.activity` array structure differs between `ADDRESS_ACTIVITY` and `TOKEN_TRANSFER` event types; fields like `value`, `asset`, and `toAddress` are not always present or named consistently. Check: always validate the full payload shape before extracting amount/address, log the raw payload on receipt, and write tests against multiple real payload samples — not a single assumed shape.

**No Next.js middleware for auth** — all auth guards are client-side `useEffect` checks. A user with a stale/expired session sees the page flash before redirect. Any SSR or RSC route has zero protection at the edge. Check: audit every protected route for server-side guard; add `middleware.ts` for the `/(app)` group.

**Profile insert race in login.tsx** — if a user with email confirmation enabled clicks "Continue to login" (rather than the email link), login.tsx finds no profile and inserts one with `onboarding_completed: true`, bypassing all onboarding steps and skipping wallet provisioning. The user then has a dashboard with no wallet. Check: login.tsx should redirect to `/onboarding/step-2` when profile is missing, not auto-complete onboarding.

**onAuthStateChange listener never unsubscribed** — reset-password/page.tsx registers an auth state change listener in a `useEffect` with no cleanup return. This leaks the subscription on unmount. Check: always capture the `{ data: { subscription } }` return and call `subscription.unsubscribe()` in the cleanup function.

**Welcome-email has no idempotency guard** — any authenticated user can POST to `/api/auth/welcome-email` repeatedly; there is no `welcome_sent_at` column or similar flag. Under the email-confirm flow, both `signup.tsx` and `onboarding/step-2` can fire the email for the same user. Check: add a `welcome_email_sent boolean` column to `profiles` and gate the send behind it.

**Withdrawal double-submit via UI** — "Confirm withdrawal" button in WithdrawModal.tsx has no `disabled` guard during the processing step. The modal transitions to "processing" step but the button still exists in the review step and can be re-clicked if the modal is re-rendered or the user navigates back. No server-side idempotency guard on the `/api/withdrawals` endpoint. Two concurrent requests from the same user will both pass the balance check (non-atomic read-then-write) and both write separate debit ledger entries, draining the balance twice. Check: disable or unmount the confirm button immediately on first click; add a concurrency guard at the DB layer (SELECT FOR UPDATE or optimistic lock on balances.version).

**Balance check is non-atomic** — withdrawals/route.ts reads balance then checks if amount <= balance, then inserts a debit ledger entry in separate statements. Two concurrent withdrawal requests for the same merchant will both read the same balance, both pass the check, and both proceed, resulting in a negative balance. The balances table has no CHECK constraint for amount >= 0. Check: use a database-level check constraint OR perform the debit and balance check in a single atomic operation (e.g., UPDATE balances SET amount = amount - $1 WHERE merchant_id = $2 AND amount >= $1 and check rows affected = 1).

## Test coverage gaps

_(Add known gaps here so they're visible. Engineer and QA work together to close them.)_

- Auth flow: no tests for onboarding bypass via direct login after signup with email confirmation on
- Auth flow: no tests for reset-password with expired/reused token
- Auth flow: no test for welcome-email duplicate send
- Auth flow: no test for step-3 skip button double-click race
- Profile insert: no test for concurrent insert from two tabs (Supabase PK constraint is the backstop but no app-level test)

## Known failure modes

**Transak execute: non-atomic idempotency check allows double-debit under concurrency** — execute/route.ts reads `withdrawals WHERE partner_order_id = X` then inserts. Two concurrent requests for the same partnerOrderId both see no row, both insert, both debit. The unique partial index on `partner_order_id` (migration 005) causes the second INSERT to throw a 23505, but only after the debit ledger entry is already written for the first request. The second request reaches the debit step between the first request's INSERT and the unique-index constraint error. Fix: the idempotency SELECT + INSERT must be a single `INSERT ... ON CONFLICT DO NOTHING` or the unique-index constraint must be checked before any ledger writes.

**Transak webhook: JWT verification failure returns 200 silently** — webhooks/transak/route.ts catches JWT errors and returns 200 with no security audit log entry that distinguishes "malformed JWT" from "valid event we already processed". A crafted invalid payload will silently succeed. The Bridge webhook correctly returns 200 too (to prevent auto-pause) but logs with `console.error`. Transak does the same, but the risk is that signature-verification failures are not clearly separated in logs from idempotency skips.

**Transak execute: amount flows from postMessage without server-side re-validation against create-widget-url** — the `amount` sent to execute comes from `orderData.cryptoAmount` in the postMessage, not from the original session amount stored server-side. An attacker who can inject a postMessage (or who intercepts the message) can pass a higher amount to execute than was approved in the widget session.

**Transak webhook: double reversal possible between execute failure path and ORDER_FAILED webhook** — if the USDC send in execute throws (catch block writes a reversal), AND Transak also fires ORDER_FAILED for the same order, the webhook handler checks `withdrawal.status` but at the moment it fires, the status may still be `"failed"` from the execute catch path — which correctly skips the second reversal. However the execute catch path sets status to `"failed"` and writes the reversal BEFORE the webhook fires. The idempotency_key `withdrawal:<id>:reversal` guards against the double-credit correctly. But only if the execute catch path and the webhook handler use the same idempotency_key. They do. This is working as designed — but it must not be changed.

## Log

_(Append-only. Format: `### YYYY-MM-DD — short title` then 1–3 bullets.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with high-risk surfaces and standard edge-case checklist for PortPagos stack.
- TODO: first QA task should audit existing code and flag unaddressed items from the checklist.

### 2026-05-19 — Auth flow adversarial review
- Reviewed all 7 auth route files plus the welcome-email API route. Found 2 P0 issues (onboarding bypass, missing middleware), 5 P1 issues, 4 P2 issues. Full punch list delivered in response.
- Promoted three new patterns to Known failure modes: profile insert race at login, unsubscribed auth listener, welcome-email idempotency gap.
- Test coverage gaps section seeded with auth-flow gaps.

### 2026-06-04 — Staging environment awareness
- Staging environment live: `staging` branch → Vercel Preview → `portpagos-staging` Supabase.
- QA gate now applies to staging too: all features must pass on staging before shipping to prod.
- Transak staging keys auto-applied on `staging` branch. Test Transak flows on staging, not prod.

### 2026-06-04 — Payer fiat-pay (Transak on-ramp) review
- New surface: `/pay/[invoiceId]` bank transfer option. Public route, no auth.
- Key risk: `create-onramp-url` uses `supabaseAdmin` to read invoice — confirm no data leakage beyond wallet address and amount.
- Bank transfer hidden for invoices < $30 (Transak minimum). Test with $29.99 invoice to verify.

### 2026-06-04 — Transak off-ramp adversarial review
- Full pass on all 5 new files: create-widget-url, execute, webhooks/transak, migration 005, WithdrawModal.
- npm test: 37/37 pass. tsc: clean.
- Found 2 CRITICAL, 4 HIGH, 4 MEDIUM, 3 LOW issues. Full findings delivered in agent response.
- Key patterns promoted to Known failure modes: non-atomic idempotency check in execute (double-debit under concurrency); postMessage amount not re-validated server-side; double-reversal analysis (guarded by idempotency_key — confirmed safe); JWT silent-failure logging.

### 2026-05-27 — Gas sponsorship migration review (gasFunder removal + sponsor:true)
- Reviewed withdrawal route after deletion of gasFunder.ts, sweep.ts, encryption.ts and addition of `sponsor: true` to Privy sendTransaction.
- Found 2 blocking issues: GAS_FUNDER_PRIVATE_KEY orphan declaration in env.d.ts (secret still declared as required type, will fail tsc if env is strict); and double-submit on "Confirm withdrawal" button in WithdrawModal (no disabled guard during processing — can fire two withdrawal requests).
- Found 3 warnings: Privy sponsorship errors are opaque server errors (no way to distinguish "out of credits" from "TEE misconfigured" from network errors on the client); balance check is a non-atomic read-then-write allowing concurrent double-spend; `sponsor: true` silently ignored if not configured per SDK type (optional bool, no SDK-side validation).
- `env.d.ts` still declares `GAS_FUNDER_PRIVATE_KEY: string` and `WALLET_ENCRYPTION_SECRET: string`; neither is used in any src file anymore — stale declarations should be removed.
- Promoted double-submit on withdrawal confirm to Known failure modes.

### 2026-06-11 — Bridge/topups removal pre-commit verification (GO)
- Bridge vendor dropped (KYB rejected). Verified removal of bridge.ts, TopUpModal, /api/topups (3 routes), /api/webhooks/bridge, webhook-bridge.test, plus dashboard edits and BRIDGE_* env vars.
- npm test 28/28; tsc clean after rm -rf .next; full `npm run build` exit 0 (no topups/bridge routes in manifest). grep src/ for bridge|topup: zero matches. No path imports of deleted modules. Alchemy + Transak webhooks independent of Bridge — confirmed.
- Dashboard Promise.all destructuring verified positionally aligned (3 queries: invoices, ledger_entries, balances). No orphan state/imports/types.
- Dead tables `topups`/`topup_events` left in DB intentionally — inert (RLS on, merchant-scoped, no code touches them). Safe to leave; dropping is a separate prod decision.
- Only stale residue is in docs (README, CLAUDE.md stack table, product-marketing-context) — NICE-TO-HAVE, non-blocking. Regression heuristic: after a vendor removal, always grep the WHOLE repo (not just src/) and check README/marketing context for stale vendor docs.
- Note: same diff also flipped all 9 agent `model:` fields (qa→opus) — unrelated to removal; flagged to founder for intent.

### 2026-05-20 — QA tooling overhaul
- Root cause identified: QA agent was never invoked before shipping. No enforcement mechanism existed.
- Implemented 7 QA improvements:
  1. `engineer.md` — hard QA handoff rule added; explicitly references 2026-05-19 incident.
  2. `qa.md` agent — opening protocol added: run `npm test` + `tsc` as first action on every task.
  3. `scripts/pre-commit-gate.sh` — Claude Code PreToolUse hook that intercepts `git commit` Bash calls and runs tests + tsc before allowing the commit.
  4. `.claude/settings.json` — PreToolUse hook wired to `pre-commit-gate.sh`.
  5. `scripts/test-reset-flow.js` — automated Node.js test covering 7 reset-password scenarios (link generation, OTP verify, password update, old-password rejection, new-password acceptance, replay prevention).
  6. `scripts/test-login-flow.js` — automated Node.js test covering 4 login scenarios (wrong password, no-enumeration, unconfirmed email error, correct credentials).
  7. Playwright installed + `playwright.config.ts` + `e2e/auth.spec.ts` — browser-level E2E tests for login failure, redirect behavior, forgot-password, and reset-password expired-link state.
- `test-scenarios.md` committed to `.claude/sources/` as the canonical QA reference document.
- New test:scripts added to package.json: `test:reset`, `test:login`, `test:e2e`, `test:all`.
