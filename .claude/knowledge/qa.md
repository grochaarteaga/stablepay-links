# QA — Knowledge Base

> Maintained by the **qa** agent. Read at the start of every task. Append to `## Log` after real work.

## Project snapshot

- **Name:** PortPagos — USDC settlement infrastructure for port agents and shipping companies
- **Why quality is critical:** The product moves real money across borders. A bug can cause duplicate payments, lost funds, or compliance violations. Prioritize correctness > feature velocity.

## High-risk surfaces (check these first)

| Surface | Risk | Primary defense |
|---|---|---|
| Alchemy webhook → ledger | Double-credit if webhook replayed | Idempotency key on tx_hash |
| Bridge on/off-ramp callbacks | Partial state if Bridge + internal state diverge | Reconciliation job, alert on drift |
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

## Test coverage gaps

_(Add known gaps here so they're visible. Engineer and QA work together to close them.)_

- Auth flow: no tests for onboarding bypass via direct login after signup with email confirmation on
- Auth flow: no tests for reset-password with expired/reused token
- Auth flow: no test for welcome-email duplicate send
- Auth flow: no test for step-3 skip button double-click race
- Profile insert: no test for concurrent insert from two tabs (Supabase PK constraint is the backstop but no app-level test)

## Log

_(Append-only. Format: `### YYYY-MM-DD — short title` then 1–3 bullets.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with high-risk surfaces and standard edge-case checklist for PortPagos stack.
- TODO: first QA task should audit existing code and flag unaddressed items from the checklist.

### 2026-05-19 — Auth flow adversarial review
- Reviewed all 7 auth route files plus the welcome-email API route. Found 2 P0 issues (onboarding bypass, missing middleware), 5 P1 issues, 4 P2 issues. Full punch list delivered in response.
- Promoted three new patterns to Known failure modes: profile insert race at login, unsubscribed auth listener, welcome-email idempotency gap.
- Test coverage gaps section seeded with auth-flow gaps.

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
