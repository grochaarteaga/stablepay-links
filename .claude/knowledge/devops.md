# DevOps — Knowledge Base

> Maintained by the **devops** agent. Read at the start of every task. Append to `## Log` after real work.
> **Never write actual secret values here. Names only.**

## Project snapshot

- **Repo:** github.com/grochaarteaga/stablepay-links
- **Deploy target:** Vercel (production)
- **Main branch:** `main` — prod auto-deploys from here
- **Preview deploys:** every PR gets a Vercel preview URL

## Environments

| Name | Branch | Supabase project | Notes |
|---|---|---|---|
| Local | — | prod (uses `.env.local`) | Dev work only — swap to staging keys when testing features |
| Staging | `staging` | `portpagos-staging` (`ygrjqjwptvnffaysjgax`) | Auto-deploys to Vercel Preview on push to `staging` branch |
| Production | `main` | `qqhuuvunzblsokcwhmfy` | Live — auto-deploys from `main` |

### Staging workflow
1. All new features built and QA-passed on `main` locally
2. Before shipping to prod: `git checkout staging && git merge main && git push`
3. Vercel auto-builds a preview URL with staging Supabase — test here
4. If staging passes: `git checkout main && git push origin main`

**Staging Supabase project:** `portpagos-staging`
**Staging Vercel env vars:** scoped to `preview` + `staging` branch only — Supabase URL/keys, `NEXT_PUBLIC_TRANSAK_ENVIRONMENT=staging`

## Env var inventory

_(Names only. Actual values live in Vercel / Supabase / `.env.local` — never record values here.)_

See `.env.example` for the canonical shape. Expected keys include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, sensitive)
- Privy keys (app id + client id)
- Alchemy API key / webhook signing secret
- Transak API key + secret key (`TRANSAK_API_KEY`, `TRANSAK_SECRET_KEY`)
- `NEXT_PUBLIC_TRANSAK_ENVIRONMENT` (`staging` or `production`)
- `ADMIN_USER_ID` (Guillermo's Supabase user ID — protects `/admin/billing`)
- `BILLING_EXEMPT_IDS` (comma-separated user IDs exempt from billing fees)
- Resend API key
- Base RPC endpoint

_(Shipper should diff `.env.example` on each task and update this list.)_

## Runbooks

### Standard deploy
0. **QA gate (mandatory — never skip):** invoke the `qa` agent on every changed feature before committing. Auth flows, payment paths, and webhook handlers always get a QA pass. No exceptions. This is the lesson from the 2026-05-19 auth incident (missing /reset-password page, no middleware, broken SMTP, onboarding bypass — all would have been caught in one QA pass).
1. Run all tests (`npm test`) — must be green
2. TypeScript check (`npx tsc --noEmit`) — must be clean
3. PR merged to `main`
4. Vercel auto-builds → prod
5. Watch the build log for ~90 seconds
6. Smoke-check the changed feature manually: happy path + one failure path
7. Log entry: what shipped, commit SHA, build duration

### Pre-ship checklist (run before every push to main)
- [ ] QA agent invoked and punch list reviewed
- [ ] `npm test` passes (all tests green)
- [ ] `npx tsc --noEmit` clean
- [ ] Happy path manually tested in browser
- [ ] At least one failure/error path tested (wrong password, missing field, expired token, etc.)
- [ ] Any new env vars added to Vercel + `.env.example`
- [ ] Any DB migrations noted and ready to apply to prod Supabase
- [ ] No secrets committed (grep for API keys, tokens, passwords in diff)

### Database migration (prod)
1. Migration tested on **staging Supabase** first (`portpagos-staging`)
2. Diff reviewed with **engineer**
3. Schedule low-traffic window if destructive
4. Apply via Supabase dashboard SQL editor or CLI
5. Verify schema + a representative read/write path
6. **Never run `DROP TABLE`, `DROP COLUMN`, or `TRUNCATE` on prod without explicit human confirmation**

### Rollback (Vercel)
1. Vercel dashboard → Deployments → pick last-known-good → "Promote to Production"
2. If the rollback reverts a schema change, coordinate with a DB rollback first
3. Log the rollback: what failed, why, recovery time

### New env var
1. Add to `.env.example` (shape only, placeholder value)
2. Add to Vercel (Preview + Production)
3. Update this file's inventory (name only)
4. If any local dev needs it, tell Guillermo to add to `.env.local`

## Incident history

_(Append-only. Format: date, blast radius, resolution, follow-ups.)_

### 2026-05-19 — Auth shipped without QA; 7 P0/P1 bugs found post-ship
- **Blast radius:** Production auth broken/exposed — missing `/reset-password` page, no edge middleware (every protected route unguarded), broken SMTP, and an onboarding bypass that left users with no wallet. All found *after* shipping.
- **Root cause:** QA agent was never invoked before shipping; no enforcement mechanism existed.
- **Resolution:** All P0/P1 fixed (commits `daa11c2`, `b165541`, `52e6b95`…`31c90c7`). Then institutionalized: `scripts/pre-commit-gate.sh` hook, automated reset/login tests, Playwright E2E, and QA made mandatory in house rules + ship runbook.
- **Follow-ups:** QA-before-ship now enforced. Still open: confirm middleware coverage on all `(app)` routes; verify Alchemy webhook reliability (separate known failure mode).

## Log

_(Append-only. Format: `### YYYY-MM-DD — short title` then 1–3 bullets.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with baseline runbooks (deploy, migration, rollback, env var) and env var inventory skeleton.
- TODO: first devops task should read actual `.env.example` and populate the inventory exhaustively.

### 2026-06-04 — Staging environment set up
- Created `portpagos-staging` Supabase project (ref: `ygrjqjwptvnffaysjgax`, eu-west-2).
- All 10 tables + triggers + RLS policies applied via SQL editor (000_base_schema.sql + migrations 001–005).
- `staging` git branch created and pushed. Vercel Preview scoped to this branch with staging Supabase keys + `NEXT_PUBLIC_TRANSAK_ENVIRONMENT=staging`.
- Pre-ship workflow: merge main → staging → push → test on Vercel preview URL → merge staging → main.

### 2026-06-04 — Transak replaces Bridge; billing dashboard + payer fiat-pay shipped
- Bridge KYB rejected. All Bridge references replaced with Transak across codebase and copy.
- New routes: `/api/transak/create-widget-url` (merchant off-ramp), `/api/transak/execute` (USDC send), `/api/transak/create-onramp-url` (payer fiat-pay), `/api/webhooks/transak`.
- New migrations: `005_transak_offramp.sql` (partner_order_id + type columns on withdrawals).
- Admin billing dashboard at `/admin/billing` — protected by `ADMIN_USER_ID` env var.
- Payer bank transfer activated on `/pay/[invoiceId]` for invoices ≥ $30.

### 2026-05-27 — Replace gas funder key with Privy gas sponsorship
- Commit `b0fdccf` shipped to `origin/main`. 10 files changed (15 insertions, 274 deletions).
- Changes: `sponsor: true` on Privy `sendTransaction`; deleted `gasFunder.ts`, `sweep.ts`, `encryption.ts`; removed `GAS_FUNDER_PRIVATE_KEY` + `WALLET_ENCRYPTION_SECRET` from `env.d.ts` / `.env.example` / `.env.local`; added `isSubmitting` double-submit guard on `WithdrawModal`; migration `004_balances_non_negative.sql` (`CHECK amount >= 0` on balances — applied to prod directly via Supabase SQL editor).
- QA sign-off: YES — QA agent ran full punch list this session; 2 blocking issues found and fixed before commit.
- Tests: 37/37 green. TypeScript: clean.
- Vercel build: READY.
- Env var cleanup pending: `GAS_FUNDER_PRIVATE_KEY` and `WALLET_ENCRYPTION_SECRET` still present in Vercel environment variables — no longer referenced by any code, safe to delete from Vercel dashboard at next opportunity.
- Smoke-check items: withdrawal happy path, double-submit guard (rapid double-click blocked), no 500s from deleted modules.

### 2026-04-24 — UX writing pass + agent system ship
- SHAs shipped to origin/main: `661c805..3749f47` (7 commits). Final HEAD: `3749f47`.
- Commit `3749f47` — UX writing pass on 8 marketing components: `ForPortAgents.tsx`, `ForShippingCompanies.tsx`, `HowItWorks.tsx`, `InfrastructureTrust.tsx`, `LogoStrip.tsx`, `Nav.tsx`, `PricingTeaser.tsx`, `SocialProof.tsx`. Removed banned words, corrected pricing copy to 0.60%.
- Commits `faf7fe8..c25e201` — agent system (6 files): knowledge bases, QA agent, slash commands, review protocol, glossary, designer skills, devops rename.
- No DB migrations. No env var changes. No new dependencies.
- Engineer sign-off: GO (structural revert in ForShippingCompanies.tsx confirmed before commit).
- Smoke-check items: homepage load, pricing display shows 0.60%, no console errors, logo strip renders, nav intact, no banned words in copy sections.
- Smoke-check result: PASSED (confirmed by Guillermo).
- Rollback procedure if needed: Vercel dashboard → Deployments → promote previous "Ready" deployment.
