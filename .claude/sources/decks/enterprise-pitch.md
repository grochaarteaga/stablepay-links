# PortPagos — Enterprise Deck

> Extracted from `PortPagos-Enterprise-Deck.pdf` on 2026-04-24.
> 11 slides. Enterprise / CFO / treasury-facing pitch. Use as approved messaging source for the `marketer` agent.

---

## Slide 1 — Cover

**Stablecoin B2B payments, built for maritime & logistics.**

Invoice in your currency. Get paid in USDC on Base. Settle in minutes, not days.

- **< 2 min** — typical settlement
- **USDC · Base** — on-chain rail
- **Non-custodial** — Privy-managed keys
- **0 FX fees** — stable 1:1 to USD

_Prepared for: Enterprise Customer · portpagos.com · April 2026_

---

## Slide 2 — The Problem (Context)

**Cross-border B2B payments in shipping are slow, expensive, and opaque.**

- **2–5 days** to settle an international wire between ports & carriers
- **1.5–4%** lost to FX spreads, correspondent fees, and intermediaries
- **Manual reconciliation** — invoices matched by hand across banks, ERPs, and portals
- **Limited visibility** — no real-time status until funds arrive (if they arrive)

---

## Slide 3 — What We Do

**One payment link. Minutes to settle. Zero crypto complexity for your counterparty.**

PortPagos turns every invoice into a shareable payment link. Your customer pays in USDC on Base — a regulated, dollar-pegged stablecoin — and funds land in your treasury wallet the moment the transfer confirms. No correspondent banks. No FX roulette. No wallet for your customer to install.

Three-step flow: **Invoice → Get paid → Withdraw**

- **Invoice** — Create and send in seconds. Currency, PO, memo, due date.
- **Get paid** — Customer taps link → pays → USDC lands in your Privy wallet.
- **Withdraw** — Sweep to your bank's off-ramp or any wallet you control.

---

## Slide 4 — How It Works (End-to-End Flow)

**From invoice to settled USDC in one flow.**

1. **Create invoice** — Amount, counterparty, PO/BL ref. Link generated.
2. **Customer pays** — WalletConnect or MetaMask. No PortPagos account required.
3. **On-chain detect** — Alchemy webhook confirms Transfer event on Base.
4. **Auto-match** — Invoice reconciled to USDC amount. Ledger credited.
5. **Withdraw** — Sweep to external wallet or off-ramp partner.

**Typical end-to-end settlement: < 2 minutes** vs. 2–5 business days for traditional correspondent banking.

---

## Slide 5 — Product (What Your Team Sees)

**Purpose-built dashboard. No blockchain jargon.**

Dashboard sections: Overview · Invoices · Payments · Withdrawals · Wallets · Team · Settings

Example invoices view headline metrics:
- **$482.3K** collected (30d)
- **1m 42s** avg settlement
- **99.8%** payment success
- **14 / 46** paid / total

Sample invoice rows:
- INV-1041 · Maersk Line SA · $24,800.00 · Paid · 1m 08s
- INV-1042 · CMA CGM Group · $11,250.00 · Paid · 2m 21s
- INV-1043 · Hapag-Lloyd AG · $58,400.00 · Pending
- INV-1044 · Evergreen Marine · $7,980.00 · Paid · 54s
- INV-1045 · ZIM Shipping · $32,100.00 · Pending

---

## Slide 6 — Enterprise Fit

**Faster capital, cleaner books, lower cost.**

- **Working capital unlocked** — Cash-conversion cycle shortens from days to minutes. Forecast with confidence.
- **Zero FX surprise** — USDC is 1:1 to USD. No mid-market guessing, no correspondent markups.
- **Automated reconciliation** — Each payment auto-matches to an invoice. Export to NetSuite, SAP, QuickBooks.
- **Audit-ready ledger** — Every credit/debit traceable to an on-chain tx hash and signed webhook.
- **Role-based access** — Separation of duties for AR, treasury, and finance leadership.
- **Non-custodial by design** — You own the wallet. Withdraw any time to any address you control.

---

## Slide 7 — Security & Compliance

**Enterprise-grade controls across the stack.**

- **Wallet custody** — Privy server-authenticated wallets. Private keys never leave the enclave.
- **Network** — Payments on Base (Ethereum L2). USDC issued by Circle.
- **Payment detection** — Alchemy webhooks · HMAC-SHA256 verified · replay-protected.
- **Monitoring** — 24/7 on-chain monitoring, anomaly detection on inbound transfers.
- **Data plane** — Postgres with row-level security. Encrypted at rest and in transit.
- **Compliance** — KYB onboarding. Sanctions screening. Audit trail exports.
- **Auth** — Email + SSO. Session binding, hardware-key support on the roadmap.
- **Business continuity** — Multi-region failover. Withdraw funds even during app outages.

---

## Slide 8 — Integration

**REST API, webhooks, and ERP connectors.**

Start in the dashboard, then automate. Issue invoices programmatically, subscribe to payment events, and push reconciled transactions directly into your accounting or TMS.

Example API call:

```
POST /api/invoices
{
  "amount_usd": 24800.00,
  "counterparty": "Maersk Line SA",
  "reference": "BL-2026-0412-001",
  "due_date": "2026-04-28",
  "webhook_url": "https://erp.you/hooks"
}

→ 200 OK
{ "pay_url": "https://portpagos.com/p/abc123",
  "expires_at": "2026-04-28T23:59Z" }
```

Native connectors:
- **NetSuite** — AR auto-post · invoice sync
- **SAP S/4HANA** — Outbound invoice · cash application
- **QuickBooks** — Invoice + payment sync
- **Xero** — Invoice + payment sync
- **Zapier** — No-code triggers for any tool
- **Webhooks** — `invoice.paid` · `withdrawal.completed` · `wallet.funded`

---

## Slide 9 — Commercials (Pricing)

**Transparent pricing. Flat per-payment. No FX spread. No surprises.**

| Tier | Rate | Volume | Includes |
|---|---|---|---|
| **Growth** | 0.60% per payment | Up to $250k/mo | Unlimited invoices, standard support, dashboard + API |
| **Enterprise** _(Recommended)_ | 0.35% per payment | $250k+/mo | Volume discounts, SLA + named CSM, SSO + audit exports, ERP connectors |
| **Custom** | Let's talk | $5M+/mo | Bespoke contracts, dedicated settlement wallet, on-prem connectors |

All tiers include: non-custodial wallet · real-time webhooks · auto-reconciliation · role-based access.

---

## Slide 10 — Roadmap

**What's shipping next. Built with your treasury team in mind.**

- **LIVE NOW (Q2 2026):** USDC on Base · Dashboard + API · NetSuite connector · Alchemy webhooks
- **IN BUILD (Q3 2026):** SSO (SAML/OIDC) · SAP connector · Multi-sig withdrawals · Granular roles
- **PLANNED (Q4 2026):** EUR/MXN stablecoins · Automated off-ramp · Supplier on-boarding portal
- **EXPLORATION (Q1 2027):** Letter-of-credit smart contracts · Embedded financing · Partner marketplace

---

## Slide 11 — Next Steps

**Let's move your first invoice on-chain this quarter.**

We propose a 30-day pilot: pick one corridor, issue up to 20 invoices, and compare settlement time and landed cost against your current rails. No long-term commitment.

1. **Discovery call** — 60 min · corridors, volumes, compliance requirements
2. **Pilot kickoff** — Sandbox keys, KYB, first invoice template
3. **Production** — Go-live with your selected counterparties in 10 business days

_Guillermo Rocha · PortPagos · guillermo.rocha.arteaga@gmail.com · portpagos.com_
