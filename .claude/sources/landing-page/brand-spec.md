# PortPagos — Landing Page Redesign Prompt (Lovable)

> Paste everything below the line into Lovable. Swap the partner logo list for your real one before submitting.

---

## Context

You are redesigning the landing page for **PortPagos** — a B2B payment platform for the maritime and shipping industry. PortPagos replaces slow, expensive SWIFT wires with instant settlement between port agents and shipping companies. Under the hood, PortPagos runs on stablecoin rails (USDC on Base), but the positioning is **"modern payment rails for maritime."** Do not lead with crypto, web3, or blockchain anywhere in the public copy.

The current site lives at portpagos.com. It reads too calm and generic. The new page should feel bold, confident, and category-defining — think Ramp, Mercury, or Bridge, translated to the shipping industry.

## Audiences (speak to both)

1. **Port agents / shipping agencies** — operators who coordinate port calls and currently wait 3–15 days to get paid via SWIFT.
2. **Ship owner finance teams / CFOs** — pay hundreds of port agents globally every month across dozens of countries and currencies.

## Tone and voice

- Bold startup. Challenger-brand energy. High-contrast, opinionated, confident.
- Short sentences. Active voice. Second person ("you get paid").
- Numbers over adjectives.
- **Banned words:** seamless, revolutionary, cutting-edge, game-changing, leverage, solution, crypto, blockchain, web3, tokenize.
- **Preferred framing:** "stablecoin rails," "modern payment rails," "instant settlement network," "payment infrastructure."

## Visual direction

- **Dark mode native — no light mode toggle.** Match the existing PortPagos dashboard exactly. Colors were extracted directly from the production dashboard code (Next.js + Tailwind). Do not invent new brand colors.
- **Use the Tailwind default `slate` and `green` scales.** The dashboard uses `bg-slate-950` as the canvas, `slate-900` for cards, `slate-800` for surfaces, and `green-600` as the primary accent. Your Tailwind config should keep these defaults.

### Color tokens (exact values — use these everywhere)

**Canvas & surfaces**
- Page background: `slate-950` → `#020617`
- Card background: `slate-900` → `#0F172A`
- Input / tag / secondary button: `slate-800` → `#1E293B`
- Hover surface / subtle pill: `slate-700` → `#334155`

**Borders**
- Primary border (cards, sections): `slate-800` → `#1E293B`
- Secondary border (inputs, subtle dividers): `slate-700` → `#334155`
- Footer hairline: `slate-800/50`

**Text**
- Primary headings: `white` → `#FFFFFF`
- Body text: `slate-300` → `#CBD5E1`
- Muted body / secondary: `slate-400` → `#94A3B8`
- Captions / labels / uppercase tracking: `slate-500` → `#64748B`
- Hint / footnote text: `slate-600` → `#475569`

**Brand accent (the one real color on the page)**
- Primary CTA background: `green-600` → `#16A34A`
- Primary CTA hover: `green-500` → `#22C55E`
- Brand inline text / highlight / checkmarks: `green-400` → `#4ADE80`
- Success pill background: `green-900/60` → `rgba(20,83,45,0.6)` with `text-green-400`
- Success badge icon bg: `green-600/20` with `border-green-600/30`

**Status colors (use sparingly, only in trust/FAQ/pricing areas if needed)**
- Warning / pending: `bg-amber-900/30` + `text-amber-400` (#FBBF24); progress bars use `bg-amber-500` (#F59E0B)
- Error / failed: `bg-red-900/60` + `text-red-400` (#F87171)
- Info / link secondary: `text-blue-400` (#60A5FA), hover `text-blue-300` (#93C5FD); badges `bg-blue-900/50`

### Rules of the palette

- Green is the ONLY brand accent. No teal, no emerald variant, no yellow highlights in marketing copy. `green-600` for buttons, `green-400` for inline text and checkmarks. That's it.
- Every background surface is from the slate scale. No pure black (`#000`). No navy blue. No off-whites.
- Do not introduce shadows using colored glows. If you need elevation, step up one slate shade (e.g. `slate-900` → `slate-800`) or use a thin `border-slate-800` outline.
- Gradients allowed only as subtle slate-to-slate on the hero (e.g. `from-slate-950 to-slate-900`). No colored gradients.
- Keep uppercase tracking-widest `slate-500` eyebrow labels — the dashboard uses them everywhere (`"Money received this month"`, `"Available balance"`, etc.). Mirror that on the marketing page for section eyebrows.

### Typography

- Headline display: heavy sans-serif, big. Use **Geist Sans** (what the dashboard already loads via `--font-geist-sans`) or **Inter** as a drop-in. Do not use a serif.
- Body: same Geist/Inter at regular weight.
- Monospace for transaction IDs, invoice numbers, or code-like UI elements: **Geist Mono** (the dashboard uses `font-mono` for `inv.id`, `tx_hash`, references).
- Display sizes should feel unapologetically big; body should be tight and information-dense, mirroring the dashboard's density.
- Generous whitespace. Oversized numerics for stats.
- Subtle gradients and grain on the hero. Light motion on the workflow diagram.
- Imagery: abstract maritime/port motifs shot like tech product photography — container ships at night, port cranes, overhead terminal shots. Avoid stock-photo people in ties.
- Responsive, mobile-first. Accessible: WCAG AA contrast, proper heading hierarchy, keyboard nav, alt text.

## Page structure (build these sections, in this order)

### 1. Nav
Logo (left). Links (center): Product, For Port Agents, For Shipping Companies, Pricing, Login. CTA button (right, accent color): **Get started**.

### 2. Hero
- **Eyebrow:** Modern payment rails for maritime
- **Headline (display):** Port payments, settled in minutes.
- **Sub:** PortPagos is the instant settlement network for port agents and shipping companies. Replace SWIFT wires and three-week payment cycles with a single link.
- **Primary CTA:** Get started — free  →  /signup
- **Secondary CTA:** Book a demo  →  contact/Calendly
- **Trust line below CTAs (small):** Running on stablecoin rails. KYC-compliant. Live in Europe and LATAM.
- Background: dark, subtle gradient, maybe a muted animated port/container motif.

### 3. Partner / infrastructure logo strip
Label above (small, uppercase, muted): **Built on enterprise-grade rails**
Logos (grayscale, evenly spaced, centered): Bridge · Coinbase · Base · Circle · Privy
> Replace this list with your actual partner set before submitting.

### 4. The problem (3-column stat block)
Section headline: **The maritime industry still moves money like it's 1995.**

| Stat | Label |
|---|---|
| **3–15 days** | Average time a port agent waits to get paid |
| **$30–50** | Cost of a single SWIFT wire per port call |
| **0** | Visibility most finance teams have into payment status |

Oversized numerals, small captions underneath. Keep copy biting, not apologetic.

### 5. How it works (4-step workflow)
Section headline: **From port call to paid — in 4 steps.**
Animated horizontal flow with icons.

1. **Port call ends.** Create an invoice in 30 seconds. Amount, service type, due date.
2. **Send the link.** Delivered by email or WhatsApp. No SWIFT codes. No intermediaries.
3. **Ship owner pays.** One click, any country, any time zone.
4. **Funds arrive.** Same-day settlement. Auto-reconciled. Invoice marked paid.

### 6. For port agents (full-width, two-column)
Left: product screenshot / mock UI of an invoice being sent.
Right:
- **Headline:** Stop being your customer's bank.
- **Sub:** You coordinate every port call. You pay providers before you get paid. PortPagos closes the gap.
- **Bullets:**
  - Create invoices in seconds
  - Send a payment link, get paid the same day
  - Automatic reconciliation
  - No SWIFT codes, no correspondent banks
- **CTA:** Create your first invoice →

### 7. For shipping companies / CFOs (mirrored, full-width)
Left copy, right mock UI of a payment dashboard.
- **Headline:** One way to pay every port, everywhere.
- **Sub:** You manage payments across dozens of ports and currencies. PortPagos gives your team one operational rail.
- **Bullets:**
  - Pay any agent in any country via a single link
  - Full audit trail, receipts, and exportable history
  - Flat, transparent fees — no SWIFT charges, no FX surprises
  - Built for high-value operational payments
- **CTA:** Talk to our team →

### 8. Infrastructure & trust
Headline: **Enterprise-grade payment infrastructure.**
Sub: The speed of a consumer payment app. The rails of a global financial network.

Four cards (icon + short copy each):
- **Regulated partners** — Settlement orchestrated through licensed providers including Bridge and Circle.
- **KYC & KYB verified** — Every agent and payer verified before transacting.
- **1:1 USD-backed** — Funds settle in fully-reserved, regulated stablecoins.
- **Real-time audit trail** — Every payment timestamped, receipted, and exportable.

Tone: confident, matter-of-fact. No defensiveness. This is the "yes, it works, yes it's legal, moving on" section.

### 9. Social proof
A full-width dark band. If no testimonials yet, use an oversized statement:
> **Currently onboarding port agencies across Europe and LATAM.**

When testimonials exist, swap in one quote (port agent) and one quote (CFO / shipping company), with name, title, and company.

### 10. Pricing teaser (optional but recommended)
Headline: **Priced for operations, not for banks.**
One line: Flat per-transaction fee. No setup. No monthly minimums. No SWIFT surcharges.
CTA: See pricing →

### 11. FAQ (accordion, 6–8 items)
- Is this crypto?
- How do I receive money in my local currency?
- What are the fees?
- Is PortPagos legal in my country?
- How long does setup take?
- Who holds the funds during settlement?
- Do ship owners need an account?
- What currencies do you support?

Write answers that are short, direct, and legally careful. Never say "crypto" in answers — use "stablecoin rails" or "regulated digital dollars."

### 12. Final CTA (full-width dark band)
- **Headline (display):** Get paid faster. Starting today.
- **CTA button (accent):** Create your account
- **Small line below:** No setup fees. No contracts. Live in minutes.

### 13. Footer
Columns: Product · For Port Agents · For Shipping Companies · Pricing · Security · Contact · Legal.
Social links. Small line: © 2026 PortPagos. Built for the maritime industry.

## Copy rules (repeat for the model)

- Never say *crypto*, *blockchain*, *web3*, *token*, *wallet* in public copy.
- Lead with *speed*, *cost*, *visibility* — in that order.
- Every section has exactly one primary CTA.
- Use real copy from this prompt. Do not lorem ipsum.
- Numbers and nouns beat adjectives.

## Technical

- Lovable default stack (React + Tailwind).
- Component-based. Each section should be its own component so future edits are isolated.
- Lazy-load images below the fold. Optimize for Lighthouse ≥ 95.
- Primary CTA "Get started — free" routes to `/signup`. Secondary "Book a demo" routes to the existing contact flow.
- Keep the existing "Request access" path alive but move it off the primary CTA.
- Preserve SEO: page `<title>` = "PortPagos — Instant settlement for maritime payments." Meta description ≈ 150 chars summarizing the value prop.

## Deliverable

A single-page redesign replacing the current portpagos.com homepage. Dark-mode-first, fully responsive, component-based, with real copy from this brief.
