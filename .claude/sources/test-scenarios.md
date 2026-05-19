# PortPagos — Test Scenarios

> QA agent reads this before every review. Engineer reads this before every commit.
> Format: Flow → Happy path → Failure paths → Edge cases → Automated coverage.
> Keep updated as flows are added or changed.

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
- None yet — all manual

---

## Pre-ship QA checklist (run before every push)

For the feature changed, walk through:
1. Happy path end-to-end
2. At least 2 failure paths
3. Double-submit (click the primary button twice fast)
4. Unauthenticated access to any new protected route
5. Run `npm test` — all green
6. Run `npx tsc --noEmit` — clean
