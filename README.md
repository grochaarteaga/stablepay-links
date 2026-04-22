# PortPagos

Instant settlement infrastructure for port agents and shipping companies. Merchants create invoices, send a payment link, and receive USDC on Base within minutes — no SWIFT wires, no 3-week waits.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (Postgres + Auth + RLS) |
| Wallet auth | Privy |
| On-chain | Base mainnet · USDC ERC-20 |
| On-chain monitoring | Alchemy webhooks |
| Fiat top-up | Bridge API |
| Email | Resend |
| Styles | Tailwind CSS v4 |

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/grochaarteaga/stablepay-links.git
cd stablepay-links
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local` — see the [Environment variables](#environment-variables) section below.

### 3. Run database migrations

Open [supabase.com](https://supabase.com), go to your project → **SQL Editor**, and run the migration files in order:

```
supabase/migrations/001_topups.sql
supabase/migrations/002_ledger_hardening.sql
```

### 4. Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in every value.

### Supabase

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API → `service_role` key |

### Privy (wallet auth)

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | [console.privy.io](https://console.privy.io) → your app → App ID |
| `PRIVY_APP_SECRET` | Privy console → Settings → API keys |

### Alchemy (on-chain monitoring)

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_USDC_CONTRACT_ADDRESS` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Base mainnet USDC) |
| `ALCHEMY_WEBHOOK_SECRET` | Alchemy dashboard → Webhooks → your webhook → Signing key |
| `ALCHEMY_AUTH_TOKEN` | Alchemy dashboard → Account → Auth token |
| `ALCHEMY_WEBHOOK_ID` | Alchemy dashboard → Webhooks → your webhook → ID |

The Alchemy webhook must be an **Address Activity** webhook pointing at your merchants' invoice wallet addresses. Endpoint: `https://your-domain.com/api/webhooks/alchemy`

### Bridge (fiat top-up)

| Variable | Value |
|---|---|
| `BRIDGE_API_URL` | `https://api.bridge.xyz` |
| `BRIDGE_API_KEY` | From your Bridge dashboard |
| `BRIDGE_WEBHOOK_SECRET` | From your Bridge webhook configuration |

Bridge webhook endpoint: `https://your-domain.com/api/webhooks/bridge`

### WalletConnect

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | [cloud.walletconnect.com](https://cloud.walletconnect.com) |

### Other

| Variable | Description |
|---|---|
| `WALLET_ENCRYPTION_SECRET` | 32-character random string used to encrypt wallet keys at rest. Generate with: `openssl rand -hex 16` |
| `GAS_FUNDER_PRIVATE_KEY` | Private key of a Base wallet holding ETH to fund gas for server-side transactions |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys. Domain `portpagos.com` must be verified. |

---

## Deploying to production (Vercel)

### 1. Import project

Go to [vercel.com/new](https://vercel.com/new) → Import from GitHub → select `stablepay-links`.

### 2. Set environment variables

In Vercel → Project → Settings → Environment Variables, add every variable from `.env.example`. Set them for the **Production** environment.

### 3. Deploy

Vercel auto-deploys on every push to `main`. The first deploy triggers automatically after import.

### 4. Point your domain

In Vercel → Project → Settings → Domains, add `portpagos.com` and follow the DNS instructions (add a CNAME or A record in Squarespace DNS).

### 5. Update webhook URLs

After your domain is live, update the webhook endpoint URLs in:
- **Alchemy** dashboard → Webhooks → edit endpoint URL
- **Bridge** dashboard → Webhooks → edit endpoint URL

---

## Project structure

```
src/
├── app/
│   ├── (app)/                  # Authenticated merchant app
│   │   ├── dashboard/          # Invoice management, balance, top-up
│   │   └── pay/[invoiceId]/    # Public payment page
│   ├── api/
│   │   ├── contact/            # Demo request form → Resend email
│   │   ├── invoices/           # Invoice CRUD + payment routes
│   │   ├── topups/             # EUR→USDC top-up via Bridge
│   │   ├── webhooks/
│   │   │   ├── alchemy/        # On-chain USDC payment detection
│   │   │   └── bridge/         # Fiat top-up lifecycle events
│   │   └── withdrawals/        # USDC withdrawal to external wallet
│   ├── contact/                # Book a demo page
│   ├── legal/                  # Terms, privacy, regulatory notice
│   └── security/               # Security overview page
├── components/
│   ├── marketing/              # Landing page sections
│   └── TopUpModal.tsx          # EUR→USDC top-up flow (7-step)
└── lib/
    ├── bridge.ts               # Bridge API client
    ├── supabaseAdmin.ts        # Service-role Supabase client
    └── usdc.ts                 # USDC contract ABI + helpers

supabase/
└── migrations/
    ├── 001_topups.sql          # partner_accounts, topups, topup_events
    └── 002_ledger_hardening.sql # Immutable ledger, materialized balances
```

---

## Key conventions

- **Ledger is append-only.** Never `UPDATE` or `DELETE` ledger entries. A database trigger enforces this and will throw `restrict_violation` if violated.
- **Always use `idempotency_key`** when inserting ledger entries. Format: `{source}:{id}:{action}` — e.g. `invoice:abc123:payment`.
- **Balance is read from the `balances` table**, not computed from `ledger_entries`. The balance is maintained atomically by a trigger on insert.
- **Webhook handlers always return HTTP 200**, even on error, to prevent the provider from auto-pausing the webhook on repeated failures.
- **All webhook signatures are verified** with HMAC-SHA256 before any payload is processed.
- **`supabaseAdmin`** (service role) is used in API routes. **`supabase`** (anon key) is used in client components. Never expose the service role key to the browser.

---

## Running tests

```bash
npm test
```

Tests cover the Bridge webhook handler (HMAC verification, all event types, idempotency).

---

## Payment flow (Method 1 — Crypto)

1. Merchant creates an invoice → a Privy wallet address is assigned
2. Merchant sends the `/pay/{invoiceId}` link to their customer
3. Customer connects MetaMask / WalletConnect and approves a USDC transfer on Base
4. Alchemy detects the on-chain transfer → fires webhook → `/api/webhooks/alchemy`
5. Webhook matches the invoice, marks it `paid`, credits the merchant ledger
6. Payment page polls and shows the success confirmation

Bank transfer and card payment are planned for a future release.
