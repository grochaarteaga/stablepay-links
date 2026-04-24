# PortPagos Landing Page — VS Code Build Prompt

> Paste this into your AI assistant in VS Code (Claude Code, Cursor, Continue,
> etc.). It is self-contained: it tells the assistant what to read, what to
> build, what NOT to touch, and how to produce a clean PR your developer can
> review in isolation.

---

## Your role

You are a senior frontend engineer working inside the existing PortPagos
Next.js 16 codebase (repo: `stablepay-links`). Your ONLY job is to build the
marketing landing page at `/`. The app code (auth, dashboard, invoices, API
routes, Supabase schemas) is off-limits — do not read, edit, or refactor it.

---

## Read these files first, in order (do not skip)

Before writing any code, read these files in the repo:

1. `.claude/sources/landing-page/brand-spec.md` — the full brand spec, color palette, copy,
   section list, tone, and banned words. This is the source of truth for copy
   and visual direction.
2. `src/app/page.tsx` — the landing page composition root. Contains `TODO`
   comment blocks naming each remaining section and the file path where its
   component should live.
3. `src/app/layout.tsx` — fonts (Geist Sans / Geist Mono), metadata. Do not
   modify.
4. `src/app/globals.css` — dark-native base styles. Do not modify.
5. `src/components/marketing/Nav.tsx` — reference pattern for a top-level
   section component. Study it.
6. `src/components/marketing/Hero.tsx` — reference pattern for a content
   section. Study structure, imports, palette usage, spacing scale, mobile
   breakpoints.
7. `src/components/marketing/Footer.tsx` — reference pattern for a multi-column
   layout.
8. `tsconfig.json` — confirm the `@/*` path alias maps to `./src/*`.
9. `package.json` — confirm Next.js 16, React 19, Tailwind v4.

After reading, confirm out loud: the stack (Next 16, React 19, Tailwind v4,
App Router), the alias (`@/`), and the palette scope (slate + green only).

---

## Scope: files you ARE allowed to create or modify

- `src/components/marketing/*.tsx` — new section components (one per section)
- `src/app/page.tsx` — to import and place new components in the `<main>` tree
  (replacing `TODO` comment blocks with actual component usage)

## Files you ARE NOT allowed to touch

- Anything under `src/app/(app)/` — dashboard, invoices, pay flows
- Anything under `src/app/(auth)/` — signup, login, onboarding, forgot-password
- Anything under `src/app/api/` — server routes
- `src/lib/`, `src/components/TopUpModal.tsx`, `src/components/WithdrawModal.tsx`,
  `src/components/Web3Provider.tsx` — app runtime
- `supabase/`, `.env*`, `next.config.ts`, `eslint.config.mjs`,
  `postcss.config.mjs`, `tsconfig.json`, `package.json`, `package-lock.json`
- `src/app/layout.tsx`, `src/app/globals.css` — already configured for the
  landing

If you think you need a new dependency (e.g., an accordion library, framer-
motion), STOP and ask the user before `npm install`-ing anything. Prefer
implementing things in plain React + Tailwind.

---

## Git workflow (this PR goes to a developer — scope matters)

Before writing code, create and switch to a feature branch:

```
git checkout -b feat/landing-page-redesign
```

Commit in logical chunks, one commit per section is fine. Use Conventional
Commits:

```
feat(marketing): add ProblemStats section
feat(marketing): add HowItWorks section
feat(marketing): wire all sections into page.tsx
```

After all sections ship:

```
git push -u origin feat/landing-page-redesign
gh pr create --title "feat(marketing): landing page redesign v2" --body "$(cat <<'EOF'
## Summary
- Replaces MVP placeholder at / with full marketing landing page
- Adds 10 marketing section components under src/components/marketing/
- No changes to app, auth, api, supabase, or runtime dependencies

## Scope
- New files: src/components/marketing/*.tsx
- Modified: src/app/page.tsx (composition root)

## Test plan
- [ ] npm run dev — landing loads at /, no console errors
- [ ] npm run build — compiles cleanly
- [ ] npm run lint — passes
- [ ] Lighthouse ≥ 95 on built preview
- [ ] Mobile responsive at 375px, 768px, 1280px, 1440px
- [ ] Dashboard, login, signup, invoice routes unaffected
EOF
)"
```

**Do not push to `main`.** Do not merge your own PR.

---

## Code rules (non-negotiable)

### Colors (only these — no invention)

- Canvas: `bg-slate-950`
- Cards: `bg-slate-900`
- Inputs / secondary surfaces: `bg-slate-800`
- Hover surface: `bg-slate-700`
- Borders: `border-slate-800` (primary), `border-slate-700` (subtle)
- Footer hairline: `border-slate-800/50`
- Primary text: `text-white`
- Body: `text-slate-300`
- Muted: `text-slate-400`
- Eyebrow / caption: `text-slate-500` with `uppercase tracking-widest`
- Hint: `text-slate-600`
- Primary CTA: `bg-green-600 hover:bg-green-500 text-white`
- Inline accent / checkmarks: `text-green-400`
- Success pill: `bg-green-900/60 text-green-400`
- Status colors (use only if truly needed — FAQ / pricing / trust only):
  amber-900/30 + amber-400; red-900/60 + red-400; blue-900/50 + blue-400.

**Green is the only brand accent.** No teal, emerald variants, yellow, or
colored glows. No pure black (`#000`). No navy. No off-whites.

### Typography

- Headings: Geist Sans (already loaded via `var(--font-geist-sans)` in the
  root layout). Heavy weight (`font-semibold` or `font-bold`), tight tracking
  (`tracking-tight`).
- Body: Geist Sans regular.
- Monospace (for invoice IDs, tx hashes, code-like UI inside mock screenshots):
  `font-mono` (Geist Mono).
- No serifs anywhere.

### Layout & spacing

- Max content width: `max-w-7xl mx-auto px-6`.
- Section vertical rhythm: `py-20` to `py-32` depending on importance.
- Mobile-first: start with the mobile layout, add `md:` and `lg:` modifiers to
  scale up. Test at 375px, 768px, 1280px.

### Copy rules (strict)

- Never use: **crypto, blockchain, web3, token, tokenize, wallet, seamless,
  revolutionary, cutting-edge, game-changing, leverage, solution.**
- Preferred framing: "stablecoin rails," "modern payment rails," "instant
  settlement network," "payment infrastructure."
- Use the exact copy from `.claude/sources/landing-page/brand-spec.md` for each section. Do
  not rephrase.
- Active voice. Second person. Short sentences. Numbers beat adjectives.

### Component contract

Each section component should:

- Be a default export of a pure React function component.
- Take no props (the landing is static v1).
- Wrap itself in `<section className="...">` with a border or background that
  visually separates it.
- Include semantic HTML: `<h2>` for section headlines, `<h3>` for sub-items.
- Be accessible: alt text on images, aria-labels on icon-only buttons, proper
  heading hierarchy, visible focus rings.
- No client-side JS unless necessary. If a section needs interactivity (e.g.,
  FAQ accordion), add `"use client";` at the top of that file only.

---

## The task: build sections 3 through 12

For each section below, create the named file under
`src/components/marketing/`, implement it, then replace the corresponding
`TODO` comment block in `src/app/page.tsx` with `<ComponentName />` and add
the import.

Build them in this order (each one should compile and render cleanly before
you move on):

### 3. `LogoStrip.tsx`

- Small uppercase `slate-500` label: "Built on enterprise-grade rails"
- Grayscale partner wordmarks, evenly spaced, centered: Bridge, Coinbase,
  Base, Circle, Privy.
- For v1, render the names as styled text (no logos yet). Use
  `text-slate-500 font-medium tracking-wide` and a flexbox with `gap-12`.
- Section: `border-b border-slate-800`, `py-12`.

### 4. `ProblemStats.tsx`

- Headline (`text-white text-4xl md:text-5xl font-semibold tracking-tight`):
  "The maritime industry still moves money like it's 1995."
- Three-column grid (`grid md:grid-cols-3 gap-8`), each column:
  - Oversized numeral: `text-6xl md:text-7xl font-semibold text-white`
  - Caption below: `text-slate-400 text-sm`
- Stats:
  - `3–15 days` — Average time a port agent waits to get paid
  - `$30–50` — Cost of a single SWIFT wire per port call
  - `0` — Visibility most finance teams have into payment status
- Section: `py-24`, `border-b border-slate-800`.

### 5. `HowItWorks.tsx`

- Headline: "From port call to paid — in 4 steps."
- Horizontal 4-step flow on desktop, stacked vertical on mobile.
  (`grid md:grid-cols-4 gap-6`)
- Each step: a numbered badge (`bg-slate-800 border border-slate-700
  rounded-full w-10 h-10` with the number in `text-green-400`), a short title,
  a one-line description.
- Steps:
  1. Port call ends. Create an invoice in 30 seconds. Amount, service type,
     due date.
  2. Send the link. Delivered by email or WhatsApp. No SWIFT codes. No
     intermediaries.
  3. Ship owner pays. One click, any country, any time zone.
  4. Funds arrive. Same-day settlement. Auto-reconciled. Invoice marked paid.
- Section: `py-24`, `border-b border-slate-800`.

### 6. `ForPortAgents.tsx`

- Two-column on `md:`, stacked on mobile. `grid md:grid-cols-2 gap-12
  items-center`.
- Left column: a mock UI "screenshot" built in pure HTML/Tailwind showing an
  invoice being sent. Dimensions roughly 500x400, rounded card with
  `bg-slate-900 border border-slate-800 rounded-2xl p-6`. Inside, render a
  fake invoice:
  - Top: `text-slate-500 uppercase tracking-widest text-xs` label
    "Invoice #inv_9k2h"
  - Amount: `text-3xl font-semibold text-white` "$12,480.00 USD"
  - Recipient row, due date row, a `Send payment link` button in `green-600`.
- Right column:
  - Eyebrow: "For Port Agents"
  - Headline: "Stop being your customer's bank."
  - Sub: "You coordinate every port call. You pay providers before you get
    paid. PortPagos closes the gap."
  - Bulleted list (with `green-400` check icons):
    - Create invoices in seconds
    - Send a payment link, get paid the same day
    - Automatic reconciliation
    - No SWIFT codes, no correspondent banks
  - CTA: "Create your first invoice →" → `/signup`
- Section: `py-24`, `border-b border-slate-800`, `id="for-port-agents"`.

### 7. `ForShippingCompanies.tsx`

- Mirror of section 6 (columns swapped: copy left, mock UI right).
- Mock UI: a payments dashboard mock. A card with a small table of 3–4 rows,
  each row: port name, amount, status pill (mostly `bg-green-900/60
  text-green-400` "Paid", one `bg-amber-900/30 text-amber-400` "Pending").
- Copy:
  - Eyebrow: "For Shipping Companies"
  - Headline: "One way to pay every port, everywhere."
  - Sub: "You manage payments across dozens of ports and currencies. PortPagos
    gives your team one operational rail."
  - Bullets:
    - Pay any agent in any country via a single link
    - Full audit trail, receipts, and exportable history
    - Flat, transparent fees — no SWIFT charges, no FX surprises
    - Built for high-value operational payments
  - CTA: "Talk to our team →" → `/contact`
- Section: `py-24`, `border-b border-slate-800`, `id="for-shipping-companies"`.

### 8. `InfrastructureTrust.tsx`

- Headline: "Enterprise-grade payment infrastructure."
- Sub: "The speed of a consumer payment app. The rails of a global financial
  network."
- Four cards: `grid md:grid-cols-2 lg:grid-cols-4 gap-6`. Each card:
  `bg-slate-900 border border-slate-800 rounded-2xl p-6`. A small icon block
  at the top (`bg-green-600/20 border border-green-600/30 rounded-lg w-10 h-10`
  with an inline SVG or a `text-green-400` character), a bold title, a short
  body.
- Cards:
  - Regulated partners — Settlement orchestrated through licensed providers
    including Bridge and Circle.
  - KYC & KYB verified — Every agent and payer verified before transacting.
  - 1:1 USD-backed — Funds settle in fully-reserved, regulated stablecoins.
  - Real-time audit trail — Every payment timestamped, receipted, and
    exportable.
- Section: `py-24`, `border-b border-slate-800`.

### 9. `SocialProof.tsx`

- Full-width dark band: `bg-slate-900 border-y border-slate-800 py-20`.
- Oversized centered statement: "Currently onboarding port agencies across
  Europe and LATAM." — `text-3xl md:text-5xl font-semibold text-white max-w-4xl
  mx-auto text-center tracking-tight`.
- Leave a `{/* TODO: swap for testimonials when available */}` comment.

### 10. `PricingTeaser.tsx`

- Headline: "Priced for operations, not for banks."
- One line: "Flat per-transaction fee. No setup. No monthly minimums. No
  SWIFT surcharges." — `text-lg text-slate-300`.
- CTA: "See pricing →" → `/pricing` (link is fine even if page doesn't exist
  yet — developer can wire it).
- Section: `py-24`, `border-b border-slate-800`, `id="pricing"`,
  `text-center`.

### 11. `FAQ.tsx`

- Needs `"use client";` at the top (accordion state).
- Headline: "Frequently asked questions."
- Accordion with 7 items. Build a simple accordion with `useState` — no
  library. Each item: a button header toggling expansion, a body revealed
  below. Border between items: `border-b border-slate-800`.
- Items (copy the answers directly, never say "crypto"):
  1. **Is this crypto?** — No. PortPagos runs on stablecoin rails — regulated,
     dollar-backed digital assets issued by licensed financial institutions.
     From your side, it's USD in, USD out.
  2. **How do I receive money in my local currency?** — PortPagos settles in
     US dollars. Our licensed partners support local-currency payouts in
     supported regions via regulated off-ramp providers.
  3. **What are the fees?** — A flat per-transaction fee. No setup cost. No
     monthly minimums. No SWIFT surcharges. Exact pricing on the pricing page.
  4. **Is PortPagos legal in my country?** — We operate through licensed
     financial partners. Coverage is live in Europe and LATAM, with more
     regions onboarding.
  5. **How long does setup take?** — Most port agents are onboarded and
     sending their first invoice within a day. KYB verification takes minutes
     to hours.
  6. **Who holds the funds during settlement?** — Regulated partners including
     Bridge and Circle. PortPagos never custodies user funds.
  7. **Do ship owners need an account?** — No. Ship owners can pay via a
     hosted link without creating an account. Onboarding takes under a minute
     for repeat payers.
- Section: `py-24`, `border-b border-slate-800`.

### 12. `FinalCTA.tsx`

- Full-width dark band: `bg-slate-900 border-y border-slate-800 py-24
  text-center`.
- Display headline: "Get paid faster. Starting today." (`text-5xl md:text-6xl
  font-semibold tracking-tight text-white`)
- Primary CTA below: "Create your account" — `bg-green-600 hover:bg-green-500`
  — → `/signup`.
- Small line below: "No setup fees. No contracts. Live in minutes." —
  `text-slate-500 text-sm`.

### Final step: wire everything into `page.tsx`

Replace the `TODO` comment blocks in `src/app/page.tsx` with the actual
component imports and usage. Keep the Nav, Hero, and Footer as-is. Final
structure:

```tsx
<Nav />
<main>
  <Hero />
  <LogoStrip />
  <ProblemStats />
  <HowItWorks />
  <ForPortAgents />
  <ForShippingCompanies />
  <InfrastructureTrust />
  <SocialProof />
  <PricingTeaser />
  <FAQ />
  <FinalCTA />
</main>
<Footer />
```

---

## Definition of done

Before opening the PR:

1. `npm run dev` — landing loads at `/`, no console errors, no hydration
   warnings.
2. `npm run build` — compiles without TypeScript errors.
3. `npm run lint` — passes.
4. Manual check at 375px, 768px, 1280px, 1440px widths — no horizontal scroll,
   all sections legible.
5. Keyboard-only nav: Tab through the page, every interactive element has a
   visible focus ring, CTAs are reachable.
6. Confirm: no banned words appear in rendered copy (grep your own output for
   "crypto", "blockchain", "web3", "wallet", "seamless", "revolutionary").
7. Confirm: no new npm dependencies were installed.
8. Confirm: `git status` shows only files under `src/components/marketing/`
   and `src/app/page.tsx` (nothing else).

If any of these fail, fix before pushing.

---

## When to ask the user

Ask before:

- Installing any new dependency.
- Modifying anything outside the allowed scope.
- Making a copy choice that deviates from `.claude/sources/landing-page/brand-spec.md`.
- Adding images or binary assets.

Otherwise, proceed section by section and commit as you go.
