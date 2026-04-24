# Marketing — Knowledge Base

> Maintained by the **marketer** agent. Read at the start of every task. Append to `## Log` after real work.

## Product snapshot

- **Name:** PortPagos
- **One-liner:** Instant USDC settlement for port agents and shipping companies.
- **Problem:** Cross-border SWIFT wires take 3–21 days; port agents can't pay vessel bills, port fees, or suppliers on time.
- **Solution:** Payment links settled in USDC on Base. Merchant creates invoice → shares link → payer pays → merchant holds USDC or off-ramps to fiat via Bridge.

## ICP (ideal customer profile)

- **Primary:** Port agents and freight forwarders handling international A/R
- **Secondary:** Shipping CFOs / finance ops at mid-market carriers
- **Tertiary:** Any B2B merchant in emerging markets with cross-border A/R pain

## Voice & tone

- **Clear, serious, trustworthy.** This is a finance product handling real money. Skip hype.
- **Plain language.** Most buyers are not crypto-native. Explain USDC as "a digital dollar," not "a stablecoin pegged 1:1."
- **Specific, not generic.** "Settle in under 10 minutes" beats "lightning fast."
- **Channel register:**
  - Landing page: clear, serious, proof-heavy
  - Email: personal, direct, one ask per message
  - Twitter/X: sharper, specifics and screenshots, minimal crypto-twitter energy
  - LinkedIn: operator-first — pain points and case studies

## Messaging library

_Sources: `.claude/sources/decks/client-pitch.md`, `.claude/sources/decks/enterprise-pitch.md`, `.claude/sources/landing-page/brand-spec.md`. All copy below is verbatim from those files. Source tags indicate origin._

---

### 1. Banned words

Never use the following words anywhere in public copy:

- crypto
- blockchain
- web3
- token
- tokenize
- wallet
- seamless
- revolutionary
- cutting-edge
- game-changing
- leverage
- solution

Verification rule (from build prompts): grep rendered output for "crypto", "blockchain", "web3", "wallet", "seamless", "revolutionary" before shipping.

---

### 2. Preferred framing

Use these terms instead of the banned words above:

- "stablecoin rails"
- "modern payment rails"
- "instant settlement network"
- "payment infrastructure"
- "regulated digital dollars" (in FAQ answers, not "crypto")
- Full form for FAQ: "stablecoin rails — regulated, dollar-backed digital assets issued by licensed financial institutions"

---

### 3. Headlines (approved, verbatim)

| Section | Headline |
|---|---|
| Hero eyebrow | Modern payment rails for maritime |
| Hero | Port payments, settled in minutes. |
| Logo strip label | Built on enterprise-grade rails |
| Problem / Stats | The maritime industry still moves money like it's 1995. |
| How It Works | From port call to paid — in 4 steps. |
| For Port Agents | Stop being your customer's bank. |
| For Shipping Companies | One way to pay every port, everywhere. |
| Infrastructure & Trust | Enterprise-grade payment infrastructure. |
| Social Proof (no testimonials yet) | Currently onboarding port agencies across Europe and LATAM. |
| Pricing Teaser | Priced for operations, not for banks. |
| FAQ | Frequently asked questions. |
| Final CTA | Get paid faster. Starting today. |

---

### 4. Value propositions

#### General / Hero

- **Hero sub-headline:** PortPagos is the instant settlement network for port agents and shipping companies. Replace SWIFT wires and three-week payment cycles with a single link.
- **Trust line (below hero CTAs):** Running on stablecoin rails. KYC-compliant. Live in Europe and LATAM.
- **Infrastructure sub:** The speed of a consumer payment app. The rails of a global financial network.
- **Pricing one-liner:** Flat per-transaction fee. No setup. No monthly minimums. No SWIFT surcharges.
- **Final CTA sub-line:** No setup fees. No contracts. Live in minutes.
- **Page `<title>`:** PortPagos — Instant settlement for maritime payments.
- **Footer tagline:** © 2026 PortPagos. Built for the maritime industry.

#### Problem stats (verbatim)

| Stat | Caption |
|---|---|
| 3–15 days | Average time a port agent waits to get paid |
| $30–50 | Cost of a single SWIFT wire per port call |
| 0 | Visibility most finance teams have into payment status |

#### How it works — 4 steps (verbatim)

1. **Port call ends.** Create an invoice in 30 seconds. Amount, service type, due date.
2. **Send the link.** Delivered by email or WhatsApp. No SWIFT codes. No intermediaries.
3. **Ship owner pays.** One click, any country, any time zone.
4. **Funds arrive.** Same-day settlement. Auto-reconciled. Invoice marked paid.

#### Port agents

- **Eyebrow:** For Port Agents
- **Headline:** Stop being your customer's bank.
- **Sub:** You coordinate every port call. You pay providers before you get paid. PortPagos closes the gap.
- **Bullets:**
  - Create invoices in seconds
  - Send a payment link, get paid the same day
  - Automatic reconciliation
  - No SWIFT codes, no correspondent banks
- **CTA:** Create your first invoice →

#### Shipping companies

- **Eyebrow:** For Shipping Companies
- **Headline:** One way to pay every port, everywhere.
- **Sub:** You manage payments across dozens of ports and currencies. PortPagos gives your team one operational rail.
- **Bullets:**
  - Pay any agent in any country via a single link
  - Full audit trail, receipts, and exportable history
  - Flat, transparent fees — no SWIFT charges, no FX surprises
  - Built for high-value operational payments
- **CTA:** Talk to our team →

#### Infrastructure / trust cards (verbatim)

- **Regulated partners** — Settlement orchestrated through licensed providers including Bridge and Circle.
- **KYC & KYB verified** — Every agent and payer verified before transacting.
- **1:1 USD-backed** — Funds settle in fully-reserved, regulated stablecoins.
- **Real-time audit trail** — Every payment timestamped, receipted, and exportable.

#### FAQ answers (verbatim — never say "crypto" in answers)

1. **Is this crypto?** — No. PortPagos runs on stablecoin rails — regulated, dollar-backed digital assets issued by licensed financial institutions. From your side, it's USD in, USD out.
2. **How do I receive money in my local currency?** — PortPagos settles in US dollars. Our licensed partners support local-currency payouts in supported regions via regulated off-ramp providers.
3. **What are the fees?** — A flat per-transaction fee. No setup cost. No monthly minimums. No SWIFT surcharges. Exact pricing on the pricing page.
4. **Is PortPagos legal in my country?** — We operate through licensed financial partners. Coverage is live in Europe and LATAM, with more regions onboarding.
5. **How long does setup take?** — Most port agents are onboarded and sending their first invoice within a day. KYB verification takes minutes to hours.
6. **Who holds the funds during settlement?** — Regulated partners including Bridge and Circle. PortPagos never custodies user funds.
7. **Do ship owners need an account?** — No. Ship owners can pay via a hosted link without creating an account. Onboarding takes under a minute for repeat payers.

#### Approved CTA labels and destinations

| Label | Destination |
|---|---|
| Get started — free | /signup |
| Book a demo | /contact or Calendly |
| Create your first invoice → | /signup |
| Talk to our team → | /contact |
| See pricing → | /pricing |
| Create your account | /signup |

---

### 5. Copy rules

**Voice and tone**

- Bold startup. Challenger-brand energy. High-contrast, opinionated, confident.
- Think Ramp, Mercury, or Bridge — translated to the shipping industry.
- Active voice. Second person ("you get paid").
- Short sentences.
- Numbers beat adjectives. Numbers and nouns beat adjectives.
- Keep copy biting, not apologetic.
- Infrastructure & Trust tone: confident, matter-of-fact. No defensiveness. This is the "yes, it works, yes it's legal, moving on" section.

**Structure rules**

- Lead with speed, cost, visibility — in that order.
- Every section has exactly one primary CTA.
- Use real copy from the approved prompts. Do not lorem ipsum.
- Do not rephrase approved copy — use exact wording from `docs/marketing/lovable-v1-prompt.md`.

**Positioning rule**

- Under the hood, PortPagos runs on stablecoin rails (USDC on Base), but the positioning is "modern payment rails for maritime."
- Do not lead with crypto, web3, or blockchain anywhere in the public copy.

**SEO**

- Page `<title>`: "PortPagos — Instant settlement for maritime payments."
- Meta description: ~150 characters summarizing the value prop.

---

### 6. Approved headlines — client deck (verbatim from slide titles and header copy)

_Source: [client-pitch]_

| Slide | Headline / Header copy |
|---|---|
| Cover | Get paid in minutes, not days. |
| Cover sub | A faster, simpler way for shipping and port companies to send invoices and collect payments — without changing how you work. |
| Problem | Getting paid in shipping is slow, expensive, and hard to track. |
| Problem closing line | Up to 15 days between invoice and payment. Every day costs you cash flow, time, and certainty. |
| Hidden costs | Slow payments hurt more than your P&L. |
| Solution | Send a payment link. Get paid the same day. |
| How it works | Four steps. No friction. |
| How it works closing line | Typical end-to-end settlement: same day — often in minutes. |
| Product UI | Simple enough to learn in a minute. |
| What changes | Your team moves faster. Your customers pay easier. |
| What changes sub | Same workflow. Better outcomes. |
| Before vs After | The difference, side by side. |
| Trust & Safety | Built to be trusted with your money. |
| Trust & Safety closing line | No change to your bank setup. No software to install. No new process for your team. |
| Final CTA | Let's move your first invoice this week. |

---

### 7. Approved headlines — enterprise deck (verbatim from slide titles and header copy)

_Source: [enterprise-pitch]_

| Slide | Headline / Header copy |
|---|---|
| Cover | Stablecoin B2B payments, built for maritime & logistics. |
| Cover sub | Invoice in your currency. Get paid in USDC on Base. Settle in minutes, not days. |
| Problem | Cross-border B2B payments in shipping are slow, expensive, and opaque. |
| What we do | One payment link. Minutes to settle. Zero crypto complexity for your counterparty. |
| End-to-end flow | From invoice to settled USDC in one flow. |
| Dashboard | Purpose-built dashboard. No blockchain jargon. |
| Enterprise fit | Faster capital, cleaner books, lower cost. |
| Security & Compliance | Enterprise-grade controls across the stack. |
| Pricing | Transparent pricing. Flat per-payment. No FX spread. No surprises. |
| Roadmap | What's shipping next. Built with your treasury team in mind. |
| Next steps | Let's move your first invoice on-chain this quarter. |

---

### 8. Value propositions — client deck

_Source: [client-pitch]. Verbatim from slide copy._

**Hidden costs framing (Slide 3 — "What It Costs You"):**
- Cash flow delays — Capital is tied up for weeks while invoices sit in transit.
- Operational friction — Finance, ops, and sales all pulled into chasing one payment.
- Time lost to follow-ups — Emails, calls, reminders — week after week, invoice after invoice.
- Risk of errors — Wire details mistyped, wrong references, reconciliation mismatches.

**Solution framing (Slide 4):**
- No new bank account — Keep the setup you already trust.
- No software to install — Customers pay from a browser.
- Works globally — EU, LATAM, and beyond.

**What changes (Slide 7 — benefit bullets):**
- Get paid in minutes, not weeks
- No SWIFT delays or correspondent fees
- No manual reconciliation — matched automatically
- Works globally, across currencies
- Full visibility on every payment
- Your customers pay with one tap

**Before vs After (Slide 8 — verbatim):**

| TODAY — The way shipping pays today. | WITH PORTPAGOS — The way shipping should pay. |
|---|---|
| Waits days or weeks | Paid same day |
| Manual follow-up | Automatic reconciliation |
| Bank friction & FX surprises | Simple link, clear costs |
| Limited visibility | Full tracking, end to end |

**Trust & Safety (Slide 9 — verbatim):**
- Regulated partners — We work only with licensed payment and custody providers.
- Secure by design — Bank-grade encryption. Isolated infrastructure. Continuous monitoring.
- Your bank, unchanged — Keep your existing accounts. Withdraw whenever you want.
- Proven in the field — Already in use by port agents and shipping companies across EU and LATAM.

**Pilot / Next steps (Slide 10 — verbatim):**
- Start a 30-day pilot — Pick one route, issue up to 20 invoices.
- Request access — We'll set you up in under 48 hours.
- Try your first payment — Live link in 10 minutes.

**Real example (Slide 10 — verbatim):**
> A port agent in Spain sends a €12,000 invoice. Shares the payment link via WhatsApp. Ship owner pays in one tap. Funds received the same day — no chasing, no fees, no surprises.

---

### 9. Value propositions — enterprise deck

_Source: [enterprise-pitch]. Verbatim from slide copy._

**Cover stats (Slide 1):**
- < 2 min — typical settlement
- USDC · Base — on-chain rail
- Non-custodial — Privy-managed keys
- 0 FX fees — stable 1:1 to USD

**Problem stats (Slide 2):**
- 2–5 days to settle an international wire between ports & carriers
- 1.5–4% lost to FX spreads, correspondent fees, and intermediaries
- Manual reconciliation — invoices matched by hand across banks, ERPs, and portals
- Limited visibility — no real-time status until funds arrive (if they arrive)

**Three-step flow description (Slide 3 — verbatim):**
> PortPagos turns every invoice into a shareable payment link. Your customer pays in USDC on Base — a regulated, dollar-pegged stablecoin — and funds land in your treasury wallet the moment the transfer confirms. No correspondent banks. No FX roulette. No wallet for your customer to install.

**Enterprise fit bullets (Slide 6 — verbatim):**
- Working capital unlocked — Cash-conversion cycle shortens from days to minutes. Forecast with confidence.
- Zero FX surprise — USDC is 1:1 to USD. No mid-market guessing, no correspondent markups.
- Automated reconciliation — Each payment auto-matches to an invoice. Export to NetSuite, SAP, QuickBooks.
- Audit-ready ledger — Every credit/debit traceable to an on-chain tx hash and signed webhook.
- Role-based access — Separation of duties for AR, treasury, and finance leadership.
- Non-custodial by design — You own the wallet. Withdraw any time to any address you control.

**Pricing table (Slide 9 — verbatim):**

| Tier | Rate | Volume | Includes |
|---|---|---|---|
| Growth | 0.60% per payment | Up to $250k/mo | Unlimited invoices, standard support, dashboard + API |
| Enterprise (Recommended) | 0.35% per payment | $250k+/mo | Volume discounts, SLA + named CSM, SSO + audit exports, ERP connectors |
| Custom | Let's talk | $5M+/mo | Bespoke contracts, dedicated settlement wallet, on-prem connectors |

All tiers include: non-custodial wallet · real-time webhooks · auto-reconciliation · role-based access.

**Pilot framing (Slide 11 — verbatim):**
> We propose a 30-day pilot: pick one corridor, issue up to 20 invoices, and compare settlement time and landed cost against your current rails. No long-term commitment.

---

### 10. Audience-specific framing notes

_Sources: [client-pitch], [enterprise-pitch], [brand-spec]_

- **Client / operator deck** targets port agents and shipping agencies. Leads with "Get paid in minutes, not days." Avoids all technical rails language. Emphasizes no change to existing bank setup and no software to install. Never mentions USDC, Base, or stablecoins.
- **Enterprise / CFO deck** targets treasury teams and finance leadership. Explicitly names USDC on Base, Privy, Alchemy, and the on-chain flow. Leads with "Stablecoin B2B payments, built for maritime & logistics." Uses terms like "on-chain tx hash," "non-custodial," "cash-conversion cycle." This is the only approved context to use "stablecoin" in a headline.
- **Landing page / brand-spec** bridges both: positions as "modern payment rails for maritime." Uses "stablecoin rails" only as a trust signal in the sub-hero line; never leads with it.

---

## Claims we can actually make

_(Verified with product-manager. Update as product ships.)_

- USDC on Base: yes
- Payment link flow: in development (confirm status before claiming it's live)
- Median settlement time: **TBD** — need real data before using in copy

## Claims to avoid until verified

- Any specific transaction volume, customer count, or revenue numbers
- Customer logos/names (require explicit permission)
- "Faster than [competitor]" comparisons without a citable source
- Regulatory/licensing status claims without legal review

## Channels and playbooks

_(Expand as we test.)_

- **Landing page** (in progress): conversion goal = book a demo / start free trial
- **LinkedIn**: operator/CFO thought leadership
- **Industry outreach**: maritime and freight publications — TBD
- **Partnerships**: Bridge, Privy, Base ecosystem co-marketing — TBD

## Campaigns log

_(Append-only. Format: date, surface, what ran, outcome.)_

_(No campaigns logged yet.)_

## Log

_(Append-only. Format: `### YYYY-MM-DD — short title` then 1–3 bullets.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with product one-liner, ICP, voice/tone baseline.
- TODO: first marketer task should read `LANDING-PAGE-VSCODE-PROMPT.md` and extract any approved headlines into the messaging library.

### 2026-04-24 — Messaging library populated
- Extracted banned words, preferred framing, all approved headlines, value props by audience (general, port agents, shipping companies), FAQ answers, CTA labels, and copy rules verbatim from `docs/marketing/lovable-v1-prompt.md`, `docs/marketing/landing-build-prompt.md`, and `LANDING-PAGE-VSCODE-PROMPT.md`.

### 2026-04-24 — Sources line cleanup
- Removed three stale paths from the Messaging library Sources line: `docs/marketing/lovable-v1-prompt.md`, `docs/marketing/landing-build-prompt.md`, and `LANDING-PAGE-VSCODE-PROMPT.md` (deleted).
- Authoritative copies now live under `.claude/sources/landing-page/`; Sources line now references only the three canonical files.

### 2026-04-24 — Messaging library extended with deck sources
- Added sections 6–10 to the Messaging library from `.claude/sources/decks/client-pitch.md` (10 slides) and `.claude/sources/decks/enterprise-pitch.md` (11 slides).
- Extracted: all slide-level headlines, hidden-cost framing, before/after table, trust & safety bullets, enterprise fit bullets, pilot framing, real example (Spain port agent), and the full pricing table.
- Added audience-specific framing note: client deck never names USDC/stablecoin; enterprise deck leads with "Stablecoin B2B payments" — the only approved headline context to use that term.
- Updated the Messaging library sources line to reference all five source files.
