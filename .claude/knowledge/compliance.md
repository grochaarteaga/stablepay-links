# Compliance — Knowledge Base

> Maintained by the **compliance** agent. Read at the start of every task. Append to `## Log` after real work.
> **Never store customer PII, KYB documents, or sensitive data here. Patterns only.**

## Project snapshot

- **Product:** PortPagos — payment links that settle in USDC on Base; payer fiat on-ramp + merchant off-ramp via Transak
- **Money flows:** payer → on-chain settlement → merchant treasury wallet (Privy) → optional off-ramp to merchant bank (Transak)
- **Markets active today:** EU, LATAM (specifics to confirm)
- **Markets gated on regulatory review:** US, UK
- **Vendors in critical path:** Transak (fiat on/off-ramp — replaced Bridge), Privy (wallet auth + custody pattern), Circle (USDC issuer), Alchemy (chain monitoring)
- **Bridge: dropped.** KYB rejected 2026-06-03; we will not work with Bridge. All Bridge code/copy being removed.

## Regulatory map

_(One subsection per jurisdiction. Cite the actual rule when relevant. Update when something changes.)_

### EU
- **MiCA (Regulation 2023/1114):** USDC is an e-money token (EMT) issued by Circle (regulated entity). MiCA Title III applies to issuer, not us. Our role as link/payment-flow facilitator likely classifies as crypto-asset service provider (CASP) — TODO confirm.
- **PSD2 / PSD3:** any direct fiat handling triggers PSP / EMI licensing. We delegate fiat handling to Transak — confirm Transak's license/registration posture covers our use case in target EU countries.
- **GDPR:** any EU customer/user personal data triggers full GDPR compliance. Privacy policy + DPA with EU customers required.
- **AML/CFT (5AMLD/6AMLD):** virtual asset service providers obligated to KYC/KYB, sanctions screening, suspicious-activity reporting. Inherit/leverage Transak's KYC/KYB where applicable.

### US
- **FinCEN MSB:** money transmitter framework. Likely triggered by us; nationally registers via FinCEN (Form 107).
- **State MTLs:** money transmitter licenses required state-by-state. Long expensive path. **Defer until founder approves US market entry.**
- **OFAC sanctions screening:** required regardless of state. Run all counterparties.
- **BSA / AML:** customer identification, recordkeeping, SAR filing.

### UK
- **FCA:** crypto-asset firms required to register under MLRs. Defer until UK market entry.
- **GDPR (UK GDPR):** mirror of EU rules.

### LATAM
- **Per-country variance.** Mexico (CNBV / Fintech Law), Brazil (BACEN crypto rules), Colombia (DIAN). Country-by-country review needed before live activity.

## Vendor compliance

_(Track each upstream's regulatory posture. Update on each vendor review.)_

| Vendor | Role | Status / notes |
|---|---|---|
| **Transak** | Fiat on/off-ramp | Replaced Bridge (Bridge KYB rejected 2026-06-03). Confirm: which jurisdictions Transak is registered/licensed in, KYC/KYB inheritance pattern, SLA on suspicious-activity escalation. **KYB resubmission pending — no reply on first submission.** |
| ~~Bridge~~ | ~~Fiat on/off-ramp~~ | **Dropped 2026-06-03 — KYB rejected. Do not re-engage.** |
| **Privy** | Wallet auth + key custody | Non-custodial pattern (server-authenticated). Confirm SOC 2 status, DPA in place, key-recovery audit trail |
| **Circle** | USDC issuer | Regulated NY trust company; relies on their compliance for issuance. We are downstream user, no direct relationship typically |
| **Alchemy** | On-chain event monitoring | Read-only infrastructure. Confirm DPA for log data retention |
| **Resend** | Transactional email | DPA in place? Data flow audit needed |

## Standard procedures

_(Process docs that get used repeatedly. Append more as they're built.)_

- **Regulated-money vendor gate:** do not approve production buildout against a vendor that gatekeeps money movement until its KYB / approval / registration is confirmed in hand. A flagged spike to de-risk is fine; full integration is not. (Bridge lesson: full fiat path built while blocked, then KYB rejected 2026-06-03 → forced Transak rewrite.)
- **KYB onboarding:** _(TBD — first compliance task should design)_
- **Sanctions screening on counterparties:** _(TBD)_
- **Suspicious-activity escalation:** _(TBD)_
- **Incident reporting:** _(TBD)_
- **GDPR data-subject requests:** _(TBD)_

## Audit history

_(Append only — internal or external audits, dates, scope, outcomes.)_

_(None yet.)_

## Open compliance questions

_(Things that need legal counsel or vendor confirmation before we proceed.)_

- Is our payment-link flow CASP-classified under MiCA? (Likely yes — confirm with EU counsel. HIGH priority — gating Bridge production application.)
- Does the PortPagos frontend initiate the on-chain transaction on behalf of payers? If yes, PSD2 PISP authorization may be required. Needs technical flow confirmation from engineer.
- Does PortPagos control any smart contract, intermediate wallet, or escrow in the payment flow? If yes, MiCA CASP transfer-service classification is more likely.
- Does Bridge's MSB / EMI licensing cover our use case in target markets? (Confirm with Bridge legal.)
- Entity form: Qorua is a micro-entreprise. If ACPR/AMF CASP or PSAN registration is ever required, the entity form must be upgraded to SAS/SARL first. Revenue cap (EUR 77,700/yr) also a structural constraint.
- What's the threshold below which transactions don't trigger SAR filing in US? (Standard: $5k for SAR, $10k for CTR — confirm.)
- Privacy policy and Terms of Service drafts: status?
- DPA agreements with each vendor: status?
- Are any US-based merchants or payers currently using PortPagos? If yes, FinCEN MSB analysis is activated regardless of EU entity form.

## Log

_(Append-only.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with regulatory map and vendor compliance skeleton.
- Major open items: MiCA classification, Bridge license footprint, US market gating decision (founder owns), privacy policy + TOS drafts, vendor DPAs.
- TODO: first compliance task should pick one open question and work through it with citations.

### 2026-05-26 — Bridge KYB Persona follow-up: service-provider docs + entity link
- Bridge (via Persona, bridge@cases.withpersona.com) requested (1) service-provider documentation for non-custodial infrastructure and (2) proof of Qorua ↔ PortPagos relationship + website ownership.
- Founder's plan: send a Vercel admin panel screenshot for #2. Assessed as necessary but not sufficient — the screenshot proves website control by Guillermo personally, not by Qorua. Recommended adding (a) INSEE/SIRENE extract for SIREN 943823955, (b) one-paragraph cover note explaining the French micro-entreprise (EI) form and nom commercial relationship between Qorua and PortPagos, (c) optional domain registrar screenshot.
- For #1, the company has no formal partnership agreements (early stage). Recommended package: Privy dashboard screenshot + Privy ToS + Privy SOC 2/security page link; Alchemy dashboard screenshot + Alchemy ToS link; 1-2 page architecture PDF documenting money flow, custody per leg, vendor roles, and an explicit "no PortPagos custody" statement; statement that Base is a public blockchain requiring no contractual relationship.
- Risk flagged: the "non-custodial" framing in any response to Bridge becomes a representation. Engineer must confirm before sending that (i) PortPagos backend never holds a private key even ephemerally, (ii) no on-chain transaction is signed by anything other than payer/merchant wallets, (iii) no smart contract or sweep wallet is controlled by PortPagos. If any is "yes," the architecture doc and framing must be revised.
- Reminded founder this is a vendor onboarding reply, not a regulatory submission. French legal counsel review on broader MiCA/PSD2 classification remains the open gating item from 2026-04-30 and should not be conflated with this reply.
- Pattern to capture for future KYB submissions: French micro-entreprise + nom commercial (DBA-equivalent) regularly confuses US-based compliance reviewers. Always include a plain-language explanatory paragraph alongside the INSEE extract.

### 2026-05-27 — Bridge-audience pitch deck review + slide drafts
- Reviewed current client deck (`.claude/sources/decks/client-pitch.md`, 10 slides) for suitability as a Bridge compliance-audience document. Current deck is sales-oriented and missing the Bridge integration entirely; would mislead a compliance reviewer if sent as-is.
- Reframed deck narrative around three claims: (1) PortPagos is a payment-coordination layer, not a money mover; (2) each money-movement leg is owned by a regulated counterparty (Circle, Bridge, Privy); (3) KYC/KYB ownership follows the money — PortPagos owns merchant KYB, Bridge owns fiat-leg payer KYC + sanctions + Travel Rule.
- Drafted three additional slides: (A) full payment architecture with Path A on-chain / Path B fiat / merchant off-ramp, each labeled with regulated counterparty; (B) compliance & KYC/KYB ownership matrix listing every obligation and its owner; (C) why Bridge is core infrastructure, with entity disclosure (Qorua micro-entreprise, planned SAS/SARL conversion path).
- Risks flagged to founder: (R1) "non-custodial" framing becomes a representation once in the deck — engineer must confirm in writing that backend never holds keys, no PortPagos-signed transactions, no PortPagos-controlled smart contract or sweep wallet, before deck leaves the door; (R2) on-chain wallet-address sanctions screening is a real gap if no chain-analytics provider screens payer wallet before payment is matched — should be either honestly described as "in scope for implementation" or closed before submission, preference is to close first; (R3) drop generic "regulated partners" framing from current Slide 9 and name partners + what each is regulated as; (R4) no US compliance representations; (R5) no LATAM country-by-country compliance representations beyond named pilot countries; (R6) surface the micro-entreprise + nom commercial structure pre-emptively rather than hide it; (R7) Travel Rule (EU Reg. 2023/1113) owned by Bridge on fiat legs; on-chain leg classification remains under French counsel review; (R8) representations bind future conduct — architectural changes must be communicated to Bridge.
- Language to avoid in any Bridge-facing copy: "we process payments", "we settle funds", "we move money", "we screen payers against OFAC" (false on on-chain path), "bank-grade encryption" (vague).
- Pattern to capture: distinguishing PortPagos role vs Bridge role at each leg should be the spine of any compliance-audience doc going forward (Persona reply, Bridge deck, future EU counsel brief, eventual French regulator submission if needed).
- This is a vendor-onboarding doc, not a regulatory filing. French legal counsel review on MiCA CASP / PSD2 classification (open from 2026-04-30) remains independent and gating for broader EU posture.

### 2026-06-04 — Legal page review + pilot agreement draft
- Reviewed `src/app/legal/page.tsx` (Terms / Privacy / Regulatory notice, last updated April 2026). Bridge → Transak rename appears complete (no residual "Bridge" references in the page).
- Drafted one-page pilot agreement at `docs/legal/pilot-agreement.md`. Qorua (SIREN 943 823 955) ↔ Merchant; 30 days; up to 20 invoices; 0.60% (waivable); French governing law; 5-day termination for convenience; non-custodial framing consistent with the Bridge-deck spine (PortPagos coordinates, regulated counterparties move money).
- Liability cap pegged to fees received, with a EUR 500 floor when fees are waived — pilots will frequently be free so the floor matters.
- Critical gaps flagged in existing legal page (to be fixed before first pilot signs): (G1) governing law on TOS is Ireland but operating entity is French — inconsistent and likely unenforceable as drafted; (G2) Privacy Policy is missing required GDPR Article 13 fields (controller identity + EU contact, legal basis per processing purpose, recipients list including sub-processors, international transfer mechanism, right to lodge complaint with CNIL, DPO/representative if any); (G3) TOS Section 3 says "PortPagos does not custody funds" but never names Privy as the wallet provider — inconsistent with Bridge-facing architecture story and with the pilot agreement; payer/merchant should be told who holds the keys.
- Reminded: pilot agreement is a commercial template; if a Merchant pushes back on liability cap, governing law, or scope, escalate to founder + counsel before redlining. French counsel review remains the binding step before any of these documents go live at scale.
- Assessed licensing position for Bridge API production application (entity: Qorua, micro-entreprise, SIREN 943 823 955, France).
- Architecture reviewed: non-custodial invoice/payment coordination layer. Bridge handles fiat conversion; Privy handles wallet/key management. PortPagos has no on-chain footprint of its own per stated architecture.
- EU (PSD2 / MiCA): Non-custodial position is directionally defensible. PSD2 Article 3(j) technical services exclusion and MiCA CASP definition both support the non-PSP / non-CASP argument IF PortPagos does not initiate transactions on behalf of payers and does not control any smart contract or intermediate wallet. Neither point has been confirmed technically or legally. Recommend French legal counsel with ACPR/AMF experience before submitting.
- US: Not assessed for current application — US market is gated. However, if US persons transact through PortPagos, FinCEN MSB analysis is activated. Bridge application should not make US compliance representations.
- LATAM: No jurisdiction-specific review completed. Do not represent LATAM compliance.
- Recommendation: Do not answer Bridge's licensing question as a bare "No." Submit a qualified architecture explanation noting the non-custodial design and that French legal review is underway.
- Structural risk flagged: micro-entreprise form is incompatible with any ACPR/AMF regulated-activity registration and has EUR 77,700/yr revenue cap. If regulatory registration is ever required, entity conversion to SAS/SARL is a prerequisite. Flagged to Guillermo.
- Highest-priority open item: MiCA CASP classification + PSD2 PISP technical flow review (gating further EU activity).
