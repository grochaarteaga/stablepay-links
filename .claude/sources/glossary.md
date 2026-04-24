# PortPagos Glossary

Shared vocabulary for the agent team. Keep this tight — one line per term, with "prefer / avoid" flags where relevant. Agents should read this before writing anything customer-facing.

## Audience & roles

- **Port agent** — Company that coordinates a vessel's port call: paperwork, port fees, supplier payments on behalf of the ship owner. Primary ICP.
- **Freight forwarder** — Arranges shipping for cargo owners across multiple carriers and modes. Secondary ICP.
- **Ship owner** — Owns the vessel. Pays port agents and suppliers. Finance team is typically the decision-maker for PortPagos.
- **Shipping line / carrier** — Operates the vessel (Maersk, CMA CGM, Hapag-Lloyd). Less direct buyer, but influences their port agents.
- **Merchant** (PortPagos term) — Anyone who issues a PortPagos invoice. Usually a port agent or freight forwarder.
- **Payer / counterparty** (PortPagos term) — The one paying the invoice. Usually the ship owner or cargo owner.

## Shipping operations

- **Port call** — A vessel's visit to a port. Typically 24–72 hours. Triggers invoices from pilots, tugs, stevedores, suppliers.
- **BL / Bill of Lading** — Legal doc issued by a carrier acknowledging cargo received. Core reference on invoices.
- **PO / Purchase Order** — Pre-authorized payment reference from the ship owner's ERP.
- **Demurrage** — Fee paid when cargo/vessel exceeds allowed free time. High-urgency payments.
- **Laytime / lay days** — Allowed time for loading/unloading. Overrun triggers demurrage.
- **Bunker** — Ship fuel. Big-ticket recurring invoice line.
- **Stevedore** — Loads/unloads cargo. Invoices port agents per port call.
- **Tug / pilotage** — Harbor services. Per-call invoices.
- **TEU** — Twenty-foot Equivalent Unit (container capacity measure).

## Payments & finance

- **SWIFT** — Traditional bank-to-bank messaging network. Takes 2–5 days for cross-border. PortPagos' primary competitor.
- **MT101 / MT103** — SWIFT message types for payment instructions. Appear in customer conversations.
- **Correspondent bank** — Intermediary bank that routes cross-border wires. Source of fees and delay.
- **FX spread** — Margin banks take on currency conversion. Typically 1.5–4% on cross-border wires.
- **Nostro / Vostro** — Bank accounts held abroad. Cross-border settlement infrastructure.
- **KYC / KYB** — Know-Your-Customer / Know-Your-Business. Onboarding compliance.
- **Sanctions screening** — Required check against OFAC/EU sanctions lists.
- **Off-ramp / On-ramp** — Converting between stablecoin and fiat. PortPagos uses Bridge.
- **Settlement time** — From payment initiation to funds usable. PortPagos target: < 2 min.
- **Chargeback** — Reversed card payment. Doesn't apply to USDC (final on-chain) — a selling point.
- **ACH / Wire** — US domestic payment rails. Faster than SWIFT but still not instant.

## Stablecoin / on-chain (INTERNAL ONLY — do NOT use in customer copy)

> The audience is shipping/finance, not crypto. Lead with "modern payment rails" or "stablecoin rails," never "crypto," "blockchain," "web3," or "tokenize." See `marketing.md` banned-words list for the full list.

- **USDC** — Dollar-pegged stablecoin issued by Circle. 1:1 to USD. Frame to customers as "a digital dollar."
- **Base** — Ethereum L2 chain by Coinbase. Low fees, fast finality. Where PortPagos payments settle.
- **Circle** — USDC issuer. Regulated NY-chartered trust company. Good for trust/compliance framing.
- **L2 / Layer 2** — Scaling layer on top of Ethereum. Avoid in customer copy.
- **ERC-20** — Ethereum token standard USDC uses. Technical only.
- **On-chain / off-chain** — Whether a transaction is settled on the blockchain. Customer-facing: just say "settled" or "completed."
- **Tx hash** — Unique ID for an on-chain transaction. Shown in PortPagos dashboard as "reference."
- **Privy** — Wallet auth provider. Handles key management so customers don't need to. Customer-facing framing: "your wallet, managed for you."
- **Alchemy** — Infrastructure provider for monitoring on-chain events. Internal only.
- **Smart contract** — Self-executing code on-chain. Avoid in marketing except when talking to technical enterprise buyers.
- **Gas / gas fees** — Cost of on-chain operations. Internal only (PortPagos absorbs these).

## PortPagos-specific terms

- **Payment link** — Shareable URL that lets a payer settle an invoice. Core product primitive.
- **Invoice** — The record of what's owed. Created by a merchant, pays via a payment link.
- **Treasury wallet** — The merchant's receiving wallet. Non-custodial (merchant owns the keys via Privy).
- **Ledger** — PortPagos' internal accounting of what was paid, owed, and settled. Reconciled against on-chain events.
- **Withdrawal / sweep** — Moving USDC from the treasury wallet to a bank or external wallet.

## Banned words (customer-facing)

From the brand spec: `seamless`, `revolutionary`, `cutting-edge`, `game-changing`, `leverage`, `solution`, `crypto`, `blockchain`, `web3`, `tokenize`. Prefer plain language and specific numbers.

## Preferred framings (customer-facing)

- Not "crypto" → **"stablecoin rails"** or **"modern payment rails"**
- Not "blockchain" → **"instant settlement network"**
- Not "wallet" (when talking to payers) → **"account"** or just describe the link flow
- Not "decentralized" → don't mention; describe the outcome ("you own the funds, not us")
- Not "gas fees" → we absorb these; don't surface to the customer
- Not "transaction hash" → **"payment reference"** in customer-facing UI
