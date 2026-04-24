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

_(No incidents yet.)_

## Test coverage gaps

_(Add known gaps here so they're visible. Engineer and QA work together to close them.)_

- _(TODO on first QA task: audit `src/` + `supabase/migrations/` and populate.)_

## Log

_(Append-only. Format: `### YYYY-MM-DD — short title` then 1–3 bullets.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with high-risk surfaces and standard edge-case checklist for PortPagos stack.
- TODO: first QA task should audit existing code and flag unaddressed items from the checklist.
