# PortPagos — Product Marketing Context

> **This is the foundation file every marketing skill reads first.** It compiles the canonical PortPagos context in one place. Point the Corey Haines marketing skills here before they do any copy, positioning, or strategy work.
>
> **Source of truth for deeper detail:** sections below link to the `.claude/sources/` and `.claude/knowledge/` files that hold the full versions. When those update, they're authoritative; this file summarizes.

---

## 1. Product Overview

**One-liner:** Instant USDC settlement infrastructure for port agents and shipping companies.

**What it does:** Merchants create an invoice in PortPagos, share a payment link, and receive USDC on Base mainnet within minutes. Replaces SWIFT wires that take 2–15 days with settlement that typically clears in under 2 minutes.

**Product category:** Modern payment rails for maritime and logistics. (Not "crypto" or "blockchain" — see banned-words list.)

**Product type:** B2B payment infrastructure. SaaS with flat per-payment pricing.

**Business model:** Transaction fees per payment. Growth tier (entry) 0.60% up to $250k/mo, Enterprise tier 0.35% at $250k+/mo, Custom $5M+/mo. No free trial or freemium layer — Growth is where you start.

---

## 2. Target Audience

**Primary ICP — Port agents and freight forwarders.** Companies coordinating vessel port calls, handling paperwork, port fees, and supplier payments on behalf of ship owners. They currently wait 3–21 days for SWIFT wires across jurisdictions.

**Secondary ICP — Shipping CFOs / finance teams at mid-market carriers.** They pay hundreds of port agents globally every month across dozens of countries and currencies. Pain is working capital tied up, manual reconciliation, FX surprises.

**Tertiary — Any B2B merchant in emerging markets with cross-border A/R pain.** Expansion audience once core ICP proven.

**Geography:** EU + LATAM now, US expanding.

---

## 3. Personas (B2B buying committee)

- **User (port agent operator)** — issues invoices, chases payments. Cares about: time saved, end of chasing, reliable cash flow.
- **Champion (head of operations / finance ops)** — feels the operational friction weekly. Cares about: team productivity, fewer errors, cleaner books.
- **Decision-maker (CFO / shipping company finance leader)** — pays many port agents, often. Cares about: working capital velocity, FX cost, audit trail, compliance.
- **Technical influencer (IT / procurement)** — must greenlight a new payments tool. Cares about: security posture, KYB, audit exports, vendor reliability.

---

## 4. Problems & Pain Points

**Core challenge:** Cross-border B2B payments in shipping are slow (2–15 days), expensive (1.5–4% FX + correspondent fees), and opaque (no visibility until funds arrive — if they arrive).

**Why current solutions fail:**
- **SWIFT:** 2–5 days minimum, often longer. Fees compound across correspondent banks.
- **Stripe / PayPal:** not built for cross-border B2B invoicing at shipping-industry scale; poor fit for port-agent counterparty complexity.
- **Crypto-native rails:** require counterparty technical sophistication; port agents aren't going to install MetaMask.

**What it costs them:** cash flow delays, operational friction, time-to-follow-up, risk of errors.

**Emotional tension:** feeling of being at the mercy of banks. Guessing when money will arrive. Explaining to suppliers why payments are late.

---

## 5. Value Propositions

**Operator-facing (port agents):**
- Get paid in minutes, not weeks
- No SWIFT delays, no correspondent fees
- No manual reconciliation — matched automatically
- Your customers pay with one tap, no wallet required **[COMING SOON — Bridge payer-fiat-pay not yet live]**

**CFO / finance-facing:**
- Working capital unlocked — cash conversion cycle from days to minutes
- Zero FX surprise — USDC is 1:1 to USD
- Automated reconciliation — export to NetSuite, SAP, QuickBooks
- Audit-ready ledger — every credit/debit traceable

**Full messaging library with approved copy:** `.claude/knowledge/marketer.md`

---

## 6. Competitive Landscape

**Primary competitor:** SWIFT (the status quo) — frame ourselves as faster, cheaper, more transparent. Most marketing energy goes here.

**Adjacent players:**
- **Airwallex, Wise Business** — global payments platforms, not shipping-specialized, slower than our claim, no per-invoice flow
- **Bridge (the API we use\!)** — not a competitor; integration partner
- **Traditional correspondent bank networks** — the pain we're unwinding

**Crypto-native (not direct but adjacent):** Ramp, Circle Mint, Request Finance. Not positioned for maritime; their audience is web3-first.

**Full framework: use the `competitor-profiling` skill for any specific competitor research.**

---

## 7. Voice & Tone

**Register:** bold startup. Challenger-brand energy. Confident, opinionated, serious (this is real money).

**Writing rules:**
- Short sentences. Active voice. Second person ("you get paid").
- Numbers over adjectives. "<2 min" beats "lightning fast."
- Lead with the buyer's problem, never our solution.
- Plain language. Shipping/finance audience, not crypto-native.

**Banned words:** `seamless`, `revolutionary`, `cutting-edge`, `game-changing`, `leverage`, `solution`, `crypto`, `blockchain`, `web3`, `tokenize`.

**Preferred framings:**
- Instead of "crypto" → "stablecoin rails" or "modern payment rails"
- Instead of "blockchain" → "instant settlement network"
- Instead of "wallet" (with payers) → "account" or describe the flow
- Instead of "gas fees" → don't surface, we absorb them
- Instead of "transaction hash" → "payment reference"

**Full glossary with domain vocabulary:** `.claude/sources/glossary.md`

**Channel register:**
- **Landing page** — clear and serious, proof-heavy
- **Email (1:1)** — personal, direct, one ask per message
- **LinkedIn** — operator-first, pain points and case studies
- **Twitter/X** — sharper, specifics and screenshots
- **Decks** — confident, numbers-forward

---

## 8. Proof Points & Claims

**Verified, safe to use:**
- USDC on Base settlement
- Typical settlement time: under 2 minutes (claim from enterprise deck)
- Privy-managed non-custodial wallets
- Alchemy webhooks with HMAC verification
- Postgres RLS, encrypted at rest and in transit
- Supports EU and LATAM today

**Claims to verify before using:**
- Specific customer names or logos (require permission)
- Transaction volume, user count, revenue numbers (not yet public)
- "Faster than [competitor]" comparisons (need a citation)
- Regulatory / licensing claims (need legal review)

**Real example that's reusable (live customer, anonymous):**
> A port agent in Mexico sends a €12,000 invoice. Shares the payment link via WhatsApp. Ship owner pays in one tap. Funds received the same day — no chasing, no fees, no surprises.

---

## 9. Current Marketing Surfaces

- **Landing page:** portpagos.com (dark-native, slate + green, Geist Sans)
- **Decks:** client-facing (merchant audience) and enterprise (CFO audience). Full content: `.claude/sources/decks/`.
- **Email:** Resend as provider; no lifecycle sequences yet.
- **Social:** none launched yet.
- **SEO:** none deliberate yet. Will shift when `seo-audit` and `programmatic-seo` skills get used.

---

## 10. References (the source files this compiles)

- `CLAUDE.md` — project orientation + agent system
- `.claude/sources/landing-page/brand-spec.md` — full visual + voice spec (colors, typography)
- `.claude/sources/glossary.md` — shipping / payments / crypto vocabulary, banned words
- `.claude/sources/decks/client-pitch.md` — merchant-facing pitch deck, 10 slides
- `.claude/sources/decks/enterprise-pitch.md` — CFO/treasury pitch deck, 11 slides
- `.claude/knowledge/marketer.md` — marketer agent's living knowledge base, messaging library
- `.claude/knowledge/product-manager.md` — product roadmap, open questions, decisions

When any of these update, they take precedence over this file. Keep this file a summary index, not a primary author.

---

_Last compiled: 2026-04-24. Update when any of the referenced sources shift materially._
