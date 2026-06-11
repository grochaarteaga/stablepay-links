# PortPagos — Test Scenarios

> QA agent reads this before every review. Engineer reads this before every commit.
> Format: Flow → Happy path → Failure paths → Edge cases → Automated coverage.
> Keep updated as flows are added or changed. Every new feature MUST be added here.
>
> **Automated coverage today (Vitest, 28 tests):** Alchemy webhook, generate-wallet, USDC helpers · plus reset-password + login (scripts) and auth E2E (Playwright). **Every payment / withdrawal / Transak / invoice / onboarding flow below is MANUAL-only** — re-running the suite does NOT yet regression-check them. Converting these to automated tests is the open regression priority (see §8–§10 especially).

---

## 1. Signup

### Happy path
1. Land on `/signup`
2. Enter company name, email, password (≥8 chars)
3. Submit → "Check your inbox" screen
4. Click confirmation email link → land on `/onboarding/step-2`
5. Complete onboarding → dashboard with wallet provisioned

### Failure paths
- [ ] Password < 8 chars → frontend error, no submit
- [ ] Duplicate email → Supabase returns "User already registered" → show error
- [ ] Email not confirmed → try to log in → "Please confirm your email first" message (not "invalid password")
- [ ] Confirmation email link clicked twice → second click shows "link expired or already used"
- [ ] User closes tab after signup, reopens → re-entering `/signup` with same email shows duplicate error

### Edge cases
- [ ] Double-click submit → only one signup attempt fires (button disabled on first click)
- [ ] Welcome email sent once only, even if user refreshes step-2 (idempotency via `welcome_email_sent` flag)
- [ ] Supabase email confirmation disabled: user goes directly to `/onboarding/step-2` without email step

### Automated coverage
- None yet — all manual

---

## 2. Login

### Happy path
1. Land on `/login`
2. Enter email + password
3. Submit → redirect to `/dashboard` (or resume onboarding if incomplete)
4. Already logged-in user hitting `/login` → redirect to `/dashboard` immediately (middleware)

### Failure paths
- [ ] Wrong password → "Invalid email or password"
- [ ] Email not confirmed → "Please confirm your email first — check your inbox"
- [ ] Non-existent email → "Invalid email or password" (same message, no enumeration)
- [ ] Unauthenticated user hitting `/dashboard` → redirect to `/login?reason=auth`

### Edge cases
- [ ] User with no profile (pre-onboarding era) → redirected to `/onboarding/step-2`, not dashboard
- [ ] User with incomplete onboarding → redirected to correct step, not dashboard
- [ ] Session expires mid-session → next protected page hit redirects to `/login`

### Automated coverage
- None yet — all manual

---

## 3. Forgot password / Reset password

### Happy path
1. Land on `/forgot-password`
2. Enter email → "Check your inbox" screen
3. Receive email from `noreply@portpagos.com` within ~60 seconds
4. Click link → land on `/reset-password` with form unlocked (not "expired")
5. Enter new password (≥8 chars, confirmed) → "Password updated"
6. Click "Go to login" → land on `/login` (not redirected to dashboard)
7. Log in with new password → dashboard

### Failure paths
- [ ] Email not in Supabase → API returns OK silently (no enumeration), user sees "check your inbox" regardless
- [ ] Reset link clicked twice → second click shows "Link expired or already used"
- [ ] Reset link older than 1 hour → "Link expired or already used"
- [ ] Passwords don't match → inline error, no submit
- [ ] Password < 8 chars → inline error, no submit
- [ ] Old password rejected after reset
- [ ] After reset, clicking "Go to login" lands on `/login`, not dashboard (recovery session signed out)

### Edge cases
- [ ] Two reset emails sent in quick succession → only latest link works, previous one is invalid
- [ ] 60-second rate limit: second request within 60 seconds silently dropped by Supabase
- [ ] Page loaded without a recovery token → shows "expired" after 3-second wait (not immediately)

### Automated coverage
- Backend: `node scripts/test-reset-flow.js` — creates user, generates link, updates password, verifies old/new credentials, cleans up

---

## 4. Onboarding

### Happy path
1. Step 2: enter country + business type → continue to step 3
2. Step 3: create first invoice OR skip → dashboard with wallet provisioned

### Failure paths
- [ ] Step 2 submitted without selecting country → inline error
- [ ] Step 2 submitted without selecting business type → inline error
- [ ] Step 3 amount ≤ 0 → inline error
- [ ] Unauthenticated user hitting `/onboarding/step-2` → redirected to `/login`

### Edge cases
- [ ] Already completed onboarding → `/onboarding/step-2` redirects to dashboard
- [ ] Skip button double-click → only one update fires (button disabled during async)
- [ ] User refreshes step-2 → profile upsert handles re-entry safely (no duplicate insert error)

### Automated coverage
- None yet — all manual

---

## 5. Invoice creation

### Happy path
1. Click "New invoice" on dashboard
2. Enter amount, description, payer name
3. Submit → invoice created → payment link generated
4. Copy/share link

### Failure paths
- [ ] Amount = 0 → error
- [ ] Amount negative → error
- [ ] Missing required fields → error per field
- [ ] Unauthenticated → redirect to login

### Edge cases
- [ ] Amount with many decimal places → rounded to 6 decimal places (USDC precision)
- [ ] Very large amount (>1,000,000) → rejected with clear message
- [ ] Double-click submit → only one invoice created

### Automated coverage
- None yet — all manual

---

## 6. Payment (pay link)

### Happy path
1. Payer opens `/pay/[invoiceId]`
2. Connects wallet
3. Approves USDC → transaction submitted → invoice marked paid
4. Merchant sees balance update on dashboard

### Failure paths
- [ ] Invoice already paid → page shows "already paid" state, no double payment
- [ ] Invoice not found (bad ID) → 404
- [ ] Payer has insufficient USDC → wallet shows error, invoice stays pending
- [ ] Transaction rejected by payer → invoice stays pending, payer can retry

### Edge cases
- [ ] Alchemy webhook delivered twice (replay) → ledger credited once only (tx_hash idempotency)
- [ ] Alchemy webhook delayed → invoice shows pending until webhook arrives
- [ ] Payer pays wrong amount → handle partial payment or overpayment
- [ ] Webhook payload shape varies by event type → always validate before extracting fields

### Automated coverage
- `src/__tests__/webhook.test.ts` — Alchemy webhook handler (covers signature verification, idempotency)

---

## 7. Dashboard / Withdrawal

### Happy path
1. Dashboard shows correct USDC balance
2. Click "Withdraw" → enter wallet address + amount → submit
3. Transaction sent → balance updated

### Failure paths
- [ ] Invalid wallet address → rejected before submit
- [ ] Amount > balance → rejected
- [ ] Amount = 0 → rejected
- [ ] Unauthenticated → redirect to login

### Edge cases
- [ ] Withdraw full balance → balance shows 0, not negative
- [ ] Double-click withdraw → only one transaction sent

### Automated coverage
- None yet — all manual (to-wallet withdrawal). Fiat off-ramp now via Transak — see §8.

---

## 8. Fiat off-ramp — merchant (Transak SELL)

### Happy path
1. Dashboard → Withdraw → choose the "to bank account (fiat)" option
2. Transak SELL widget opens (iframe/SDK — **not** headless) pre-filled with the merchant amount
3. Merchant completes Transak KYC + the SELL order
4. `ORDER_COMPLETED` → `/api/transak/execute` sends USDC from the merchant wallet → withdrawal recorded as a debit

### Failure paths
- [ ] Transak KYB/KYC not approved → widget blocks the order, no debit written
- [ ] `ORDER_FAILED` → withdrawal marked failed, reversal written (no funds lost)
- [ ] Privy USDC send throws inside execute → catch path writes a reversal, status `failed`
- [ ] Amount > balance → rejected before the widget opens

### Edge cases
- [ ] **Concurrent execute for the same `partner_order_id` → double-debit.** The idempotency SELECT+INSERT is non-atomic; the unique partial index (migration 005) throws 23505 but only AFTER the first debit. Fix path: `INSERT ... ON CONFLICT DO NOTHING`, or check the constraint before any ledger write. [CRITICAL]
- [ ] **`amount` from postMessage (`orderData.cryptoAmount`) is not re-validated server-side** against the session amount stored at create-widget-url → a crafted/intercepted message can pass a higher amount to execute. [HIGH — must fix]
- [ ] postMessage origin validated against `TRANSAK_ORIGIN` — reject a crafted `ORDER_CREATED` from a malicious origin
- [ ] Double reversal between the execute catch path and an `ORDER_FAILED` webhook → guarded by idempotency_key `withdrawal:<id>:reversal` (both paths MUST use the same key — do not change)

### Automated coverage
- None yet — all manual. **HIGH-RISK GAP — top target for automated regression tests (part 3).**

---

## 9. Payer fiat-pay — on-ramp (Transak BUY)

### Happy path
1. Payer opens `/pay/[invoiceId]` (public, no auth) → chooses bank transfer / card
2. `/api/transak/create-onramp-url` (reads the invoice via `supabaseAdmin`) returns a Transak BUY widget URL
3. Payer pays fiat in the widget → Transak delivers USDC on-chain to the invoice wallet
4. **The Alchemy webhook** detects the on-chain USDC → marks the invoice paid + credits the merchant (Alchemy is the source of truth)

### Failure paths
- [ ] Invoice amount < €30 (Transak minimum) → bank-transfer option hidden entirely
- [ ] Invoice not found → 404
- [ ] Transak KYB not approved → on-ramp option unavailable
- [ ] Payer abandons the fiat payment → invoice stays pending, never a false "paid"

### Edge cases
- [ ] **Invoice is marked paid ONLY via the Alchemy webhook**, never from a Transak `ORDER_COMPLETED` alone (the USDC may not have settled on-chain yet)
- [ ] `create-onramp-url` (supabaseAdmin) must expose ONLY the wallet address + amount — no other invoice/merchant data leakage on this public route
- [ ] €29.99 invoice → option hidden; €30.00 → shown (boundary)
- [ ] Payer pays, USDC lands, then re-opens the link → shows "already paid", no second on-ramp

### Automated coverage
- None yet — all manual. **HIGH-RISK GAP — part 3.**

---

## 10. Transak webhook (`/api/webhooks/transak`)

### Happy path
1. Transak POSTs a signed (JWT) lifecycle event
2. Signature verified → order/withdrawal status updated idempotently → 200

### Failure paths
- [ ] Invalid / malformed JWT → currently returns 200 silently; must log a signature-verification failure DISTINCTLY from an idempotency skip (a crafted payload must not look like a processed event)
- [ ] Unknown order reference → log + 200, no state change

### Edge cases
- [ ] Replay (same event twice) → idempotent, no double state change / double reversal
- [ ] Out-of-order delivery (e.g. COMPLETED before PROCESSING) → handled, state not corrupted
- [ ] Always returns 200 (prevents Transak auto-pausing the webhook) — but every error path still logs

### Automated coverage
- None yet — all manual. **HIGH-RISK GAP — part 3** (mirror the Alchemy `webhook.test.ts` pattern: signature verification, idempotency, replay).

---

## Pre-ship QA checklist (run before every push)

For the feature changed, walk through:
1. Happy path end-to-end
2. At least 2 failure paths
3. Double-submit (click the primary button twice fast)
4. Unauthenticated access to any new protected route
5. Run `npm test` — all green (**full** suite — regression check, not just the new tests)
6. Run `npx tsc --noEmit` — clean
7. New flow added? Add it to this registry **and** an automated test for its high-risk use cases.
