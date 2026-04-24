# feat(marketing): scaffold landing page foundation

## Summary

Replaces the "Chunk 1 is alive" MVP placeholder at `/` with the foundation
for the new PortPagos marketing landing page. This PR lands the plumbing and
three top-level section components (Nav, Hero, Footer) so the remaining 10
sections can be built on a consistent base in a follow-up PR.

This is scaffolding only — all app, auth, api, supabase, and runtime code is
untouched.

## What changed

**Configuration & typography**

- `src/app/layout.tsx` — wires Geist Sans and Geist Mono via `next/font/google`
  (no external link tags, no layout shift). Updates page `<title>` and meta
  description to the SEO-correct values. Adds Open Graph metadata.
- `src/app/globals.css` — removes the light-mode `:root` and
  `prefers-color-scheme: dark` blocks that would fight the dark-only brand
  spec. Sets `slate-950` canvas, `color-scheme: dark` on `<html>`, and the
  Geist font stack on `<body>`.

**Landing composition**

- `src/app/page.tsx` — replaces the MVP placeholder. Composes Nav, Hero, and
  Footer, with `TODO` comment blocks naming the 10 remaining sections and the
  component file paths they will live at.

**New marketing components**

- `src/components/marketing/Nav.tsx` — sticky, backdrop-blurred top nav. Logo
  (left), anchor links (center), `green-600` "Get started" CTA (right)
  routing to `/signup`.
- `src/components/marketing/Hero.tsx` — eyebrow / display headline with
  `green-400` accent on "settled in minutes" / subhead / primary + secondary
  CTAs / trust line. Subtle slate-to-slate gradient with a low-opacity grid
  texture. No colored glows.
- `src/components/marketing/Footer.tsx` — four-column footer with
  `slate-800/50` hairline and dual copyright / infrastructure lines.

**Documentation & reorganization**

Existing root-level docs are moved into a conventional `docs/` folder at the
same time, to keep the repo root clean for tooling config and to establish a
pattern for future specs.

- `docs/README.md` — index and conventions for the new `docs/` folder.
- `docs/adr/0001-landing-at-root.md` — first architecture decision record,
  explaining why the landing lives at `/` rather than behind a `(marketing)`
  route group, and the trigger conditions for revisiting.
- `docs/marketing/landing-build-prompt.md` — the spec the follow-up PR
  (section components 3–12) will be built against. Included here so reviewers
  can see the full target shape and scope boundaries.
- `docs/marketing/lovable-v1-prompt.md` — moved from
  `portpagos-lovable-prompt.md` at repo root. Original Lovable brand/copy
  spec referenced by the build prompt.
- `docs/features/handoff.md` — moved from `HANDOFF.md` at repo root.
- `docs/features/eur-usdc-topup.md` — moved from `EUR-USDC-TOPUP-PROMPT.md`
  at repo root.

No content changes to the moved files; `git log --follow` preserves history.

## What did NOT change

- `src/app/(app)/*` — dashboard, invoices, pay flows
- `src/app/(auth)/*` — signup, login, onboarding, forgot-password
- `src/app/api/*` — server routes
- `src/lib/*`, existing runtime components (`TopUpModal`, `WithdrawModal`,
  `Web3Provider`)
- `supabase/`, `.env*`, `next.config.ts`, `eslint.config.mjs`,
  `postcss.config.mjs`, `tsconfig.json`, `package.json`, `package-lock.json`

No new dependencies. No database or API changes.

## Design decisions

- **Landing at `/` instead of a `(marketing)` route group.** Route groups
  like `(app)` and `(auth)` in this repo provide auth wrappers; the landing
  needs none of that. A route group can be introduced later when additional
  marketing pages (`/pricing`, `/for-agents`, `/for-shipping-companies`) land
  and need a shared layout.
- **Fonts via `next/font/google`, not `<link rel="stylesheet">`.** Avoids
  layout shift and keeps everything self-hosted at build time.
- **Palette stays on Tailwind's default `slate` + `green` scales.** Matches
  the production dashboard exactly. No custom color tokens in
  `tailwind.config`.
- **Per-section component files under `src/components/marketing/`.** Keeps
  future edits isolated and review diffs small.
- **Docs in `docs/`, grouped by domain.** Replaces ad-hoc root-level
  `HANDOFF.md` / `*-PROMPT.md` files with `docs/marketing/`, `docs/features/`,
  and `docs/adr/`. Lowercase-with-hyphens filenames, numbered ADRs. Full
  conventions in `docs/README.md`.

## Test plan

- [ ] `npm run dev` — landing loads at `/`, no console errors, no hydration
      warnings
- [ ] `npm run build` — compiles cleanly (no TS errors)
- [ ] `npm run lint` — passes
- [ ] Manual visual check at 375px, 768px, 1280px, 1440px widths — no
      horizontal scroll, Nav + Hero + Footer legible at every breakpoint
- [ ] Keyboard navigation: Tab order through Nav links → primary CTA →
      secondary CTA → footer links, all focusable with visible focus rings
- [ ] Dashboard (`/dashboard`), login (`/login`), signup (`/signup`), invoice
      routes continue to work unchanged
- [ ] Lighthouse ≥ 90 on built preview (`npm run start`); full ≥ 95 target
      lands with the follow-up PR once images and remaining sections are in

## Follow-up

A separate branch (`feat/landing-page-redesign`) will add sections 3–12:
LogoStrip, ProblemStats, HowItWorks, ForPortAgents, ForShippingCompanies,
InfrastructureTrust, SocialProof, PricingTeaser, FAQ, FinalCTA. Each section
will be one component file, wired into `src/app/page.tsx` by replacing the
corresponding `TODO` block. Scope and copy rules for that PR are captured in
`docs/marketing/landing-build-prompt.md`.
