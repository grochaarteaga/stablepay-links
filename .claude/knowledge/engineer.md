# Engineering — Knowledge Base

> Maintained by the **engineer** agent. Read at the start of every task. Append to `## Log` after real work.

## Project snapshot

- **Repo:** github.com/grochaarteaga/stablepay-links
- **Product:** PortPagos — USDC settlement for port agents, payment links, Base mainnet

## Stack

| Layer | Tech | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | No Pages Router. Server components by default. |
| Styling | Tailwind CSS v4 | CSS-first config via `@theme`, no `tailwind.config.js` |
| DB + Auth | Supabase (Postgres + RLS) | Always reason about RLS for any query path |
| Wallet auth | Privy | |
| Chain | Base mainnet | |
| Token | USDC (ERC-20) | 6 decimals, canonical USDC contract |
| Chain monitoring | Alchemy webhooks | Must be idempotent |
| Fiat on-ramp | Bridge API | |
| Email | Resend | |
| Tests | Vitest | See `vitest.config.ts` |
| Lint | ESLint | See `eslint.config.mjs` |
| Deploy | Vercel | |

## Directory shape

- `src/` — application code
- `supabase/migrations/` — SQL migrations, numbered (001, 002…). Run in order.
- `public/` — static assets
- `docs/` — specs, ADRs, marketing (gitignored, local-only)
- `.env.example` — env var shape. Real values live in `.env.local` (gitignored) and Vercel.

## Conventions

_(Expand as established. Promote patterns here when you notice them recurring.)_

- TypeScript strict mode
- App Router → prefer Server Components; mark `'use client'` explicitly when needed
- Supabase access: always through the typed client; RLS enforced server-side
- Money amounts: integer minor units, never floats. USDC uses 6 decimals.
- Dates: store as `timestamptz` in Postgres, render in user TZ in UI
- File naming: kebab-case for files, PascalCase for React components

## Gotchas & learnings

_(Append discovered traps here so nobody relearns them.)_

- Tailwind v4 doesn't use `tailwind.config.js` — theme tokens live in `globals.css` under `@theme`
- Alchemy webhooks can deliver multiple times — always check ledger idempotency keys

## Migration runbook (local)

1. Write migration in `supabase/migrations/NNN_description.sql`
2. Test locally with Supabase CLI or by running against a dev project
3. Verify rollback path (or document that it's forward-only)
4. Hand off to **devops** for prod application

## Log

_(Append-only. Format: `### YYYY-MM-DD — short title` then 1–3 bullets.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with stack reference and baseline conventions.
- TODO: first engineer task should inventory `src/` structure and add directory conventions here.

### 2026-04-24 — Code review: agent system + env type additions
- Reviewed 4-commit branch adding agent system, slash commands, knowledge bases, canonical sources, `.claude/settings.json`, `vercel.json`, and two new env type declarations (`GAS_FUNDER_PRIVATE_KEY`, `RESEND_API_KEY`).
- Blockers: 3 leftover "shipper" references in committed `.claude/` files after the shipper→devops rename; `build-spec.md` references `docs/marketing/lovable-v1-prompt.md` (gitignored, not the canonical committed path `.claude/sources/landing-page/brand-spec.md`).
- `settings.json` `"Bash(git add *)"` permission is broad — worth narrowing or at least documenting why it's intentional.
- No application code, schema, or auth changes on this branch; QA review not required. UI changes are documentation/marketing files only — designer review optional.
