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
- Bridge fiat off-ramp UX (withdrawal / sweep flow)
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

### 2026-04-30 — Roadmap reprioritized for pilot gate
- Context: pre-revenue, Bridge API production access submitted, legal entity is Qorua (French micro-entreprise), strategic goal is 2-3 pilots with real USDC flows before fundraising.
- Top 5: (1) close Bridge + live e2e payment, (2) sign pilots, (3) fix Alchemy webhook reliability, (4) rotate compromised prod secrets, (5) minimum merchant dashboard.
- Explicit non-goals until pilots are live: multi-currency, KYB tiers, fundraising materials, landing page optimization.
- Follow-up: engineer should be handed item 3 (Alchemy webhook fix) and item 5 (dashboard MVP) once Bridge access closes. Secrets rotation is a devops + human action item — flag to Guillermo directly.
