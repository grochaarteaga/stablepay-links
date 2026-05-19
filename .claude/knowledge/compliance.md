# Compliance — Knowledge Base

> Maintained by the **compliance** agent. Read at the start of every task. Append to `## Log` after real work.
> **Never store customer PII, KYB documents, or sensitive data here. Patterns only.**

## Project snapshot

- **Product:** PortPagos — payment links that settle in USDC on Base; merchant on/off-ramps via Bridge
- **Money flows:** payer → on-chain settlement → merchant treasury wallet (Privy) → optional off-ramp to merchant bank (Bridge)
- **Markets active today:** EU, LATAM (specifics to confirm)
- **Markets gated on regulatory review:** US, UK
- **Vendors in critical path:** Bridge (fiat on/off-ramp), Privy (wallet auth + custody pattern), Circle (USDC issuer), Alchemy (chain monitoring)

## Regulatory map

_(One subsection per jurisdiction. Cite the actual rule when relevant. Update when something changes.)_

### EU
- **MiCA (Regulation 2023/1114):** USDC is an e-money token (EMT) issued by Circle (regulated entity). MiCA Title III applies to issuer, not us. Our role as link/payment-flow facilitator likely classifies as crypto-asset service provider (CASP) — TODO confirm.
- **PSD2 / PSD3:** any direct fiat handling triggers PSP / EMI licensing. We delegate fiat handling to Bridge — confirm Bridge's license posture covers our use case in target EU countries.
- **GDPR:** any EU customer/user personal data triggers full GDPR compliance. Privacy policy + DPA with EU customers required.
- **AML/CFT (5AMLD/6AMLD):** virtual asset service providers obligated to KYC/KYB, sanctions screening, suspicious-activity reporting. Inherit/leverage Bridge's KYB where applicable.

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
| **Bridge** | Fiat on/off-ramp | Confirm: which jurisdictions Bridge holds licenses for, KYB inheritance pattern, SLA on suspicious-activity escalation |
| **Privy** | Wallet auth + key custody | Non-custodial pattern (server-authenticated). Confirm SOC 2 status, DPA in place, key-recovery audit trail |
| **Circle** | USDC issuer | Regulated NY trust company; relies on their compliance for issuance. We are downstream user, no direct relationship typically |
| **Alchemy** | On-chain event monitoring | Read-only infrastructure. Confirm DPA for log data retention |
| **Resend** | Transactional email | DPA in place? Data flow audit needed |

## Standard procedures

_(Process docs that get used repeatedly. Append more as they're built.)_

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

### 2026-04-30 — Bridge production application licensing assessment
- Assessed licensing position for Bridge API production application (entity: Qorua, micro-entreprise, SIREN 943 823 955, France).
- Architecture reviewed: non-custodial invoice/payment coordination layer. Bridge handles fiat conversion; Privy handles wallet/key management. PortPagos has no on-chain footprint of its own per stated architecture.
- EU (PSD2 / MiCA): Non-custodial position is directionally defensible. PSD2 Article 3(j) technical services exclusion and MiCA CASP definition both support the non-PSP / non-CASP argument IF PortPagos does not initiate transactions on behalf of payers and does not control any smart contract or intermediate wallet. Neither point has been confirmed technically or legally. Recommend French legal counsel with ACPR/AMF experience before submitting.
- US: Not assessed for current application — US market is gated. However, if US persons transact through PortPagos, FinCEN MSB analysis is activated. Bridge application should not make US compliance representations.
- LATAM: No jurisdiction-specific review completed. Do not represent LATAM compliance.
- Recommendation: Do not answer Bridge's licensing question as a bare "No." Submit a qualified architecture explanation noting the non-custodial design and that French legal review is underway.
- Structural risk flagged: micro-entreprise form is incompatible with any ACPR/AMF regulated-activity registration and has EUR 77,700/yr revenue cap. If regulatory registration is ever required, entity conversion to SAS/SARL is a prerequisite. Flagged to Guillermo.
- Highest-priority open item: MiCA CASP classification + PSD2 PISP technical flow review (gating further EU activity).
