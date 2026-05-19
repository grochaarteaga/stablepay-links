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

### 2026-04-24 — Pre-ship review: marketing microcopy / UX-writing pass (8 files)
- All 8 files in `src/components/marketing/` reviewed (working-tree diff, not committed).
- One structural change slipped in alongside the text changes: `ForShippingCompanies.tsx` got a new `<Link href="/signup">` CTA with layout wrapper (`flex flex-col gap-3 sm:flex-row`). This is a layout/component change, not just copy. Route confirmed to exist (`src/app/(auth)/signup`). Flagged as a blocker because it bypasses designer review for a UI addition.
- Price change 0.5% → 0.60%: consistent across both the hero display and comparison table row in `PricingTeaser.tsx`. No other hardcoded occurrences found.
- "tx hash" and "on-chain" banned phrases removed correctly in `ForPortAgents.tsx`, `ForShippingCompanies.tsx`, `InfrastructureTrust.tsx`. Pre-existing "No crypto wallets" in `HowItWorks.tsx` not touched by this diff (was already there; should-fix but not a blocker for this PR).
- `LogoStrip.tsx` "Wallet security" label for Privy: "wallet" is permitted in partner/infra context; the ban is specifically when addressing payers.
- JSX structure, tags, and TypeScript in all 8 files are valid. No mismatched tags, no missing quotes, no logic changes outside `ForShippingCompanies.tsx` layout.

### 2026-04-25 — New API routes: send-email + welcome-email
- Created `POST /api/invoices/[invoiceId]/send-email`: Bearer-auth, ownership-checked, 409 on paid/cancelled, escapes all user HTML, sends payment-request email via Resend. Resend SDK uses `replyTo` (camelCase), not `reply_to` — confirmed by tsc.
- Created `POST /api/auth/welcome-email`: Bearer-auth, non-fatal Resend call (errors logged but always returns `{ ok: true }` to not block signup flow), three-step onboarding template.
- `profiles` table is queried as `.eq("user_id", user.id)` matching the pattern in `GET /api/invoices/[invoiceId]/route.ts`. `merchant_profiles` is a separate table used by wallet routes.
- Auth pattern: `authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""` — consistent with `generate-wallet` and `merchant/wallet` routes.
- `amount` field on invoices comes back as `number | string` depending on Supabase client serialization; coerce with `Number()` before calling `toLocaleString`.

### 2026-04-25 — Rewrite: invoices/new/page.tsx — two-step form + success screen
- Replaced single-step form + `window.location.href` redirect with a `Step = "form" | "success"` state machine. No redirect on success.
- `SuccessData` type captures `invoiceId`, `amount`, `customerName`, `customerEmail` — passed from submit handler to success step without a round-trip.
- Customer email is held in component state only (never written to DB) and pre-fills the send-email input on the success screen.
- `generate-wallet` call wrapped in `.catch(() => null)` — already non-fatal in the original, but now must not throw because we can no longer show a separate "generating wallet..." message.
- `handleSendEmail` uses `supabase.auth.getSession()` for the Bearer token, consistent with other API call sites in this codebase.
- Copy-link button uses `navigator.clipboard.writeText` with a 2s "✓ Copied!" revert; safe here because this is a `"use client"` component in a browser context.
- WhatsApp share opens `wa.me/?text=` in a new tab with `rel="noopener noreferrer"`.
- `resetAll()` resets all state slices back to initial values — important that `emailResult` and `copied` are also cleared so stale UI doesn't persist across "Create another" cycles.
- Visual token alignment: `rounded-2xl`, `py-2.5`, `text-xs font-medium text-slate-400` labels, `bg-slate-800 border border-slate-700` inputs, `focus:border-slate-500 focus:ring-1 focus:ring-slate-500` — all lifted directly from WithdrawModal to keep the two surfaces consistent.
- `tsc --noEmit` passed with zero errors.

### 2026-04-25 — 8 targeted edits to dashboard/page.tsx
- Added `siteOrigin` state (initialized empty, set via `window.location.origin` in a dedicated `useEffect`) to build full copy-link URLs without SSR mismatch.
- Quick Actions: renamed "Send Invoice" → "New Invoice"; disabled Top up button with "Soon" badge (matches Send Payment pattern); `showTopUpModal` setter is now unreachable from the button but the modal and state are still wired — safe to clean up later or when the feature ships.
- Balance card: removed "Ready to withdraw — coming soon" stale line and the entire trust block (`No wallet needed` / etc.) — these belong on the marketing surface, not inside the merchant dashboard.
- Invoice table: removed Currency `<th>` and `<td>` (currency is always USDC; redundant column).
- Invoice table Link column: added `<CopyButton>` next to "Open ↗", passing `${siteOrigin}/pay/${inv.id}` — reuses the existing `CopyButton` component already in scope.
- Account & Settings: removed the Verification "Pending" `<div>` block; Email and Bank withdrawal divs left intact.
- `tsc --noEmit` passed with zero errors.

### 2026-04-24 — Code review: agent system + env type additions
- Reviewed 4-commit branch adding agent system, slash commands, knowledge bases, canonical sources, `.claude/settings.json`, `vercel.json`, and two new env type declarations (`GAS_FUNDER_PRIVATE_KEY`, `RESEND_API_KEY`).
- Blockers: 3 leftover "shipper" references in committed `.claude/` files after the shipper→devops rename; `build-spec.md` references `docs/marketing/lovable-v1-prompt.md` (gitignored, not the canonical committed path `.claude/sources/landing-page/brand-spec.md`).
- `settings.json` `"Bash(git add *)"` permission is broad — worth narrowing or at least documenting why it's intentional.
- No application code, schema, or auth changes on this branch; QA review not required. UI changes are documentation/marketing files only — designer review optional.
