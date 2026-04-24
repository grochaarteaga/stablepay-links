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

_(Update this section as priorities shift.)_

- [ ] Landing page foundation (in progress — see `LANDING-PAGE-VSCODE-PROMPT.md`)
- [ ] Invoice → payment link flow (core)
- [ ] Bridge fiat on/off-ramp integration
- [ ] Merchant dashboard (balance, history, export)
- [ ] Alchemy webhook → ledger reconciliation

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
