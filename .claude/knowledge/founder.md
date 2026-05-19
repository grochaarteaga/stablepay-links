# Founder — Knowledge Base

> Maintained by the **founder** agent. Read at the start of every task. Append to `## Log` after real work.

## Project snapshot

- **Company:** PortPagos
- **Owner:** Guillermo Rocha (sole founder, sole employee, as of 2026-04-24)
- **Stage:** Pre-/early-revenue. Pre-seed, no institutional capital yet.
- **Repo:** github.com/grochaarteaga/stablepay-links

## Current strategy

_(Update when direction changes. Each section is a current best answer.)_

- **Market entry:** EU + LATAM port agents, with US expansion gated on regulatory cost
- **Wedge:** Replace SWIFT for cross-border port-call settlement
- **Pricing:** Flat per-payment (Growth 0.60% / Enterprise 0.35% / Custom)
- **Capital:** Bootstrapped. Solo. No fundraising in flight. Pre-seed delayed to Q4 2026 at earliest — revenue first decision made 2026-04-25.
- **Hiring:** None planned in the next 90 days

## Legal entity

- **Entity name:** Qorua (operating brand: PortPagos)
- **Legal form:** Entrepreneur individuel / Micro-entreprise (French sole trader)
- **Registered:** 28/04/2025, INPI — Registre National des Entreprises
- **SIREN:** 943 823 955 · **SIRET:** 94382395500019
- **Address:** 43 Rue Jean Bonal, 92250 La Garenne-Colombes, France
- **Domain:** qorua.com · **APE code:** 6201Z (software/web development)
- **Note:** Micro-entreprise cannot hold a regulated financial license in France. If licensing is ever required (MiCA CASP, PSD2 PISP), entity conversion to SAS or SARL is a prerequisite — flag this before entering new markets.

## Open strategic questions

_(Things that haven't been decided.)_

- ~~Do we raise pre-seed in Q3 2026 or push for revenue first?~~ **Decided 2026-04-25: revenue first. See log.**
- US market — wait for revenue traction in EU first, or parallel?
- Co-founder search — defer until product-market fit is clearer, or start now?
- Partnership with Bridge — deepen (preferred partner status) or stay arms-length?
- When to open conversations with maritime industry investors / strategic acquirers?

## Decisions log

_(Append-only. Format: `### YYYY-MM-DD — short title` then 1–3 bullets.)_

### 2026-04-24 — Founder agent introduced
- Decision: Added a dedicated founder agent with scope above the PM (roadmap) layer.
- Why: Cross-functional strategic decisions (markets, hiring, fundraising, partnerships) lacked a clear owner; PM was being asked to make calls outside their lane.
- Initial focus areas seeded above. To be filled in as decisions are made.

## Log

_(Append-only.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with current state. TODO: capture decisions on the open questions above as they're made.

### 2026-04-25 — Current product working loop and go-to-market posture

**Context:** Full working loop confirmed: create invoice → share link → payer pays USDC via MetaMask/WalletConnect → merchant receives USDC → withdraws to wallet. EUR/SEPA top-up and card/bank pay options are code-complete but blocked (Bridge API keys not obtained). Both sides of a transaction require a non-custodial wallet and USDC fluency today.

**Strategic call: product is marketable now, to a narrow user.**
- Minimum viable user = port agent or shipping ops person whose counterparty already holds USDC and has a wallet. This is a small but real segment in EU and LATAM corridors with crypto exposure.
- Do not position around disabled features. Pitch the real loop: invoice out, USDC in within minutes, free withdrawal.

**F&F validation rejected for this stage.**
- Friends and family sessions are consumer-app validation. They will not surface the real blockers in a B2B maritime context: counterparty wallet readiness, treasurer sign-off, compliance friction, corridor-specific trust barriers.
- Right move: one structured live pilot with a real operator. One real invoice, real value, fee waived if needed. That single data point is worth more than ten F&F sessions.

**Key risk identified: counterparty symmetry.** Both merchant and payer must have wallets. Go-to-market for the next 60 days must target pairs where both sides already have wallets, or where founder can personally walk the payer through first-transaction setup.

**Immediate implication:** Find one real port agent contact (even loosely warm) and run a live invoice on a small real transaction. This is the priority above any further feature work.

### 2026-04-25 — F&F sessions: rejected; counterparty symmetry confirmed as primary GTM risk

**Question asked:** Can the product be marketed/sold now? Should Guillermo run friends & family sessions for feedback?

**Answers:**
- Product is sellable today, to a narrow user: port agent or shipping ops contact whose payer already holds USDC in a non-custodial wallet. EU-LATAM corridors with crypto exposure.
- Pitch the working loop only. Do not reference disabled features (EUR on-ramp, card/bank pay). One complete capability beats ten partial ones for an operator audience.
- F&F sessions rejected for this stage. They do not surface the real blockers: counterparty wallet readiness, treasurer sign-off, compliance friction, corridor trust. B2B maritime buyers are not reachable via consumer-style feedback sessions.
- Closest acceptable substitute if no real operator contact exists yet: structured conversation with a port agency ops or shipping finance practitioner — not a demo, a pressure-test of the payer-wallet assumption.
- Key risk confirmed: counterparty symmetry. Merchant side is controlled; payer side is not. Qualify both sides before committing any merchant's time to a pilot session.

**Immediate action:** Identify one warm contact (even second-degree) in port agency or shipping ops. Run one live invoice on a real, small transaction. That single data point outranks all other validation activity.

### 2026-04-25 — Pre-seed timing decision: revenue first, delay raise to Q4 2026 at earliest

**Decision:** Do not raise pre-seed in Q3 2026. Push for first revenue. Revisit fundraising at the end of Q3 2026 with pilot data in hand.

**Reasoning (summary):**
- Maritime is a relationship market. Capital does not compress the sales cycle. The constraint is trust and relationship-hours, not money.
- Pre-revenue pre-seed = weakest negotiating position and lowest valuation. Two to three active pilots processing real invoices re-prices the round materially — "evidence of payment flow" is a categorically different fundraise from "idea with code."
- Compliance gaps (MiCA classification unconfirmed, Bridge license footprint unconfirmed, no KYB procedure, no privacy policy or TOS, vendor DPAs outstanding) are investor diligence risks. These need to close for paying merchants anyway — close them for merchants first, not under investor time pressure.
- Actual capital need in the next six months is small. Solo, no payroll, infrastructure-only burn. Raising now would produce idle cash or premature hires the company isn't ready to absorb.
- This is a two-way door. Delaying is reversible. Locking in dilution and investor clock is not.

**Exception / flip condition:** If a first-of-kind, multi-port deal requires dedicated resources (CS, integration, legal) that cannot be staffed solo, and losing that deal is a material setback — that is the right moment to raise. The deal creates the case; capital follows the deal.

**Immediate priorities implied:**
1. Sign 2–3 EU port agent pilots (30-day, one corridor, up to 20 invoices each).
2. Get at least one pilot live with real USDC flows and measurable settlement time vs. SWIFT.
3. Close compliance gaps: MiCA classification answer, Bridge license confirmation, KYB procedure, privacy policy + TOS, vendor DPAs.
4. Track volume processed and settlement time — these become the fundraising narrative.
5. Revisit raise decision end of Q3 2026 with data.
