# DevOps — Knowledge Base

> Maintained by the **devops** agent. Read at the start of every task. Append to `## Log` after real work.
> **Never write actual secret values here. Names only.**

## Project snapshot

- **Repo:** github.com/grochaarteaga/stablepay-links
- **Deploy target:** Vercel (production)
- **Main branch:** `main` — prod auto-deploys from here
- **Preview deploys:** every PR gets a Vercel preview URL

## Environments

| Name | Where | Notes |
|---|---|---|
| Local | `.env.local` (gitignored) | Dev work only |
| Preview | Vercel PR deploys | Branches into isolated envs |
| Production | Vercel `main` | Live customers |

## Env var inventory

_(Names only. Actual values live in Vercel / Supabase / `.env.local` — never record values here.)_

See `.env.example` for the canonical shape. Expected keys include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, sensitive)
- Privy keys (app id + client id)
- Alchemy API key / webhook signing secret
- Bridge API credentials
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
1. Migration tested on dev Supabase project
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

_(No incidents logged yet.)_

## Log

_(Append-only. Format: `### YYYY-MM-DD — short title` then 1–3 bullets.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with baseline runbooks (deploy, migration, rollback, env var) and env var inventory skeleton.
- TODO: first devops task should read actual `.env.example` and populate the inventory exhaustively.

### 2026-04-24 — UX writing pass + agent system ship
- SHAs shipped to origin/main: `661c805..3749f47` (7 commits). Final HEAD: `3749f47`.
- Commit `3749f47` — UX writing pass on 8 marketing components: `ForPortAgents.tsx`, `ForShippingCompanies.tsx`, `HowItWorks.tsx`, `InfrastructureTrust.tsx`, `LogoStrip.tsx`, `Nav.tsx`, `PricingTeaser.tsx`, `SocialProof.tsx`. Removed banned words, corrected pricing copy to 0.60%.
- Commits `faf7fe8..c25e201` — agent system (6 files): knowledge bases, QA agent, slash commands, review protocol, glossary, designer skills, devops rename.
- No DB migrations. No env var changes. No new dependencies.
- Engineer sign-off: GO (structural revert in ForShippingCompanies.tsx confirmed before commit).
- Smoke-check items: homepage load, pricing display shows 0.60%, no console errors, logo strip renders, nav intact, no banned words in copy sections.
- Smoke-check result: PASSED (confirmed by Guillermo).
- Rollback procedure if needed: Vercel dashboard → Deployments → promote previous "Ready" deployment.
