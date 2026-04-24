# DevOps — Knowledge Base

> Maintained by the **shipper** agent. Read at the start of every task. Append to `## Log` after real work.
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
1. PR merged to `main`
2. Vercel auto-builds → prod
3. Watch the build log for ~90 seconds
4. Smoke-check: load homepage, trigger a non-mutating health check
5. Log entry: what shipped, commit SHA, build duration

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
- TODO: first shipper task should read actual `.env.example` and populate the inventory exhaustively.
