# Product — Knowledge Base

> Maintained by the **product-manager** agent. Read at the start of every task. Append to `## Log` after real work.

## Product snapshot

- **Name:** PortPagos (repo: stablepay-links)
- **What:** Instant USDC settlement infrastructure for port agents and shipping companies
- **Problem:** Port agents and freight forwarders wait 3–21 days for SWIFT wires to clear across borders. They can't pay vessel bills, port fees, or suppliers on time.
- **Approach:** Merchants create an invoice in PortPagos, send a payment link, payer settles in USDC on Base, merchant receives USDC (or fiat via Bridge on/off-ramp).
- **Stage:** Early (pre-/early-revenue, solo founder)

## ICP (who we're building for)

- Primary: port agents and freight forwarders handling international settlements
- Secondary: shipping CFOs / finance ops at mid-market carriers
- Tertiary: any B2B merchant in emerging markets with cross-border A/R pain

## Current roadmap

_(Last updated 2026-04-30. Pre-revenue, Bridge API production access submitted, 2-3 pilots is the gate before fundraising.)_

**Now (unblocks pilots)**
1. [ ] Close Bridge API production access + run one live end-to-end payment (invoice → link → USDC received)
2. [ ] Sign 2-3 pilot port agents; get each to issue one real invoice within 30 days
3. [ ] Fix Alchemy webhook reliability (payload shape variation caused past missed payments — see memory file)
4. [ ] Rotate all production secrets (compromised via developer zip share — do before any pilot payment)
5. [ ] Minimum merchant dashboard: USDC balance + paid invoice list (no analytics, no export yet) — S scope

**Soon (after first pilot payment)**
- Payer fiat-pay via Transak on-ramp (spec done 2026-06-04, ready to build)
- Pilot consumption monitoring + billing dashboard — Guillermo cannot charge pilots without this
- Staging environment (Supabase + Vercel) — required before first real pilot merchant
- Invoice PDF / export for merchant accounting

**Explicit non-goals right now**
- Multi-currency invoicing
- KYB tier model
- Fundraising materials
- Landing page optimization
- Fiat conversion at checkout

## Open questions

_(Things to resolve before or during next planning.)_

- What's our honest median settlement time today, end-to-end? (marketing needs this)
- Do we support multi-currency invoicing, or USDC-only display with fiat conversion at checkout?
- KYC/KYB tier model — which markets do we serve day one?

## Success metrics (early)

- Time-to-first-payment-received for a new merchant
- Payment completion rate from link-click to settled
- Median end-to-end settlement time
- Merchant retention month-over-month

## Product decisions (append-only)

### 2026-04-24 — Agent system introduced
- Decision: Added 5 subagents (PM, Designer, Engineer, Shipper, Marketer) with per-agent knowledge bases committed to git.
- Why: Company is solo-run; needs structured memory that persists across Claude Code sessions and (eventually) team members.

## Log

_(Append-only. Format: `### YYYY-MM-DD — short title` then 1–3 bullets.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with PortPagos product context, ICP, initial roadmap.
- TODO: fill in real current roadmap from `docs/features/` on next PM task.

### 2026-05-20 — Intake: AI agent team public page
- Recommendation: Wait. Landing page optimization is an explicit non-goal until pilots are live; this page serves a secondary/investor audience, not the port agents we need to close.
- Risk flagged: conservative buyers (port agent CFOs) may read "AI agents" as "no real team" — trust penalty. Eng days consumed would compete with Alchemy webhook fix and secrets rotation, both pilot-blocking.
- If Guillermo overrides: designer should lead with outcomes the team produces, not AI model names. Marketer must frame as "AI-augmented operations," not "AI company." No crypto/web3 vocabulary.
- Follow-up: revisit after first pilot payment is live and investor conversations begin.

### 2026-05-20 — Sidebar nav review
- Guillermo implemented left sidebar (224px desktop, hamburger mobile): logo, nav items, settings/logout, company name/email. Top navbar removed. New /settings page with email, company name, wallet address, password change link.
- PM verdict: structurally correct decision, right pattern for a growing dashboard. No roadmap impact — does not move pilot gate items.
- Two gaps flagged: (1) nav is passive, no urgency signals for outstanding invoices; (2) "wallet address" label on settings page is ambiguous — should read "Receiving address" or "Treasury wallet" with a one-line explanation.
- Follow-up: route wallet address label copy to designer as a UX writing micro-task. No new roadmap items added.

### 2026-06-04 — Spec: pilot billing dashboard
- Drafted spec for internal operator billing view at /admin/billing.
- Scope: S (~4h eng). All data exists in invoices + ledger_entries + profiles — pure read aggregation, no new tables.
- 4 open questions: admin protection method, fee basis, pilot free period, billing cycle.
- Saved to `docs/specs/billing-dashboard.md`. Flagged for designer (layout + copy format) and engineer (service role safety, FK confirmation).

### 2026-06-04 — Spec: payer fiat-pay via Transak on-ramp
- Drafted spec for activating "Pay by bank transfer" on the invoice payment page using Transak BUY flow.
- Scope: S (~4h eng). Reuses off-ramp backend pattern already built.
- 4 open questions requiring Guillermo input before build: fee ownership, FX display, minimum invoice amount, referrerDomain for public route.
- Saved to `docs/specs/payer-fiat-pay-transak.md`. Flagged for designer (UX states) and engineer (public route auth) review.

### 2026-04-30 — Roadmap reprioritized for pilot gate
- Context: pre-revenue, Bridge API production access submitted, legal entity is Qorua (French micro-entreprise), strategic goal is 2-3 pilots with real USDC flows before fundraising.
- Top 5: (1) close Bridge + live e2e payment, (2) sign pilots, (3) fix Alchemy webhook reliability, (4) rotate compromised prod secrets, (5) minimum merchant dashboard.
- Explicit non-goals until pilots are live: multi-currency, KYB tiers, fundraising materials, landing page optimization.
- Follow-up: engineer should be handed item 3 (Alchemy webhook fix) and item 5 (dashboard MVP) once Bridge access closes. Secrets rotation is a devops + human action item — flag to Guillermo directly.
