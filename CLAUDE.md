# PortPagos — Claude Code project memory

This file is auto-loaded by Claude Code whenever it runs in this repo. Keep it short, current, and high-signal.

## Product

**PortPagos** (repo: `stablepay-links`) — instant USDC settlement infrastructure for port agents and shipping companies. Merchants create invoices, share a payment link, and receive USDC on Base within minutes. Eliminates SWIFT wires and multi-week international settlement.

## Stack

| Layer | Tech |
|---|---|
| App framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Database / Auth | Supabase (Postgres + RLS) |
| Wallet auth | Privy |
| Chain / token | Base mainnet · USDC (ERC-20) |
| Chain monitoring | Alchemy webhooks |
| Fiat on-ramp | Bridge API |
| Email | Resend |
| Deploy | Vercel |
| Repo | github.com/grochaarteaga/stablepay-links |

## Owner

Guillermo Rocha (guillermo.rocha.arteaga@gmail.com). Early stage — working solo for now.

## Agent system

This project uses a team of 6 specialized subagents defined in `.claude/agents/`. Each owns a domain and maintains its own knowledge base in `.claude/knowledge/` (1:1 filename match).

| Agent | Domain | Invoke for… |
|---|---|---|
| `product-manager` | Vision, roadmap, specs, prioritization | Feature scoping, user stories, trade-off decisions, release planning |
| `designer` | Visual design, UX, information architecture | Wireframes, component decisions, flows, accessibility, brand |
| `engineer` | Code architecture, implementation, refactors | Writing/reviewing code, debugging, technical decisions, migrations |
| `qa` | Adversarial thinking, edge cases, security review | What could break, concurrency, test gaps, threat models |
| `devops` | Git, Vercel, Supabase ops, env vars, deploys | Preparing PRs, pushing releases, env management, rollbacks |
| `marketer` | Positioning, copy, launches, growth | Landing copy, announcements, campaigns, messaging tests |

## How to invoke an agent

Either (a) describe what you need and let Claude Code pick — it uses the `description` field in each agent file to route — or (b) be explicit:

> "Use the **product-manager** agent to write a spec for the recurring-payment feature."

Agents delegate to each other along a defined hand-off protocol (see `.claude/sources/review-protocol.md`). A typical flow: `product-manager` drafts spec → `designer` adds flows → `engineer` implements → `qa` reviews for edge cases → `devops` deploys → `marketer` announces.

## Slash commands

Five project-level slash commands wrap the most common multi-agent flows. Type `/` in Claude Code to see them.

| Command | What it does |
|---|---|
| `/spec <feature>` | `product-manager` writes a short, buildable spec |
| `/review [scope]` | `engineer` reviews the current branch, hands UI bits to `designer` and risky paths to `qa` |
| `/ship [branch]` | `devops` walks through a staged, confirmed-per-step deploy to production |
| `/launch-post <feature>` | `marketer` drafts landing / email / social variants, flags unverified claims |
| `/triage <issue>` | `engineer` establishes facts, `product-manager` decides disposition (fix-now / fix-soon / decline / clarify) |

## House rules for any agent working here

- **Read your knowledge base first.** Every agent file points to its matching knowledge file (e.g. the `engineer` agent reads `.claude/knowledge/engineer.md` — name matches 1:1). Read it before doing real work. Append decisions, conventions, and learnings at the end when the task is done. Date every entry.
- **Canonical sources live in `.claude/sources/`.** Pitch decks, landing drafts, glossary, and review protocol are stored as `.md` there so any agent can grep and read cheaply. Prefer reading from `.claude/sources/` over the original PDFs/PPTX.
- **Read the glossary before writing customer-facing copy.** `.claude/sources/glossary.md` has the domain vocabulary, banned words, and preferred framings. Keeps tone consistent and prevents crypto-jargon leaks.
- **Non-trivial artifacts get a one-paragraph review from the next-in-line agent** per `.claude/sources/review-protocol.md`. Not a formal process — a quick sanity check.
- **Never write secrets to the knowledge base** — no API keys, RPC URLs with keys, database connection strings, customer PII, or wallet private keys. If you discover one, redact it and flag it.
- **Read-only by default for anything outside your domain.** Engineer touches code, devops touches deploy config, etc. When in doubt, propose and ask.
- **Destructive actions (delete, force-push, drop table, revoke key) require explicit human confirmation.** Never assume.
- **Skip heavy folders when scanning**: `node_modules`, `.next`, `.vercel`, `build`, `coverage`, `dist`, lockfiles, `*.pdf`, `*.pptx`.

## Quick orientation files

- `README.md` — full project setup, env var list
- `docs/` — feature specs, ADRs, marketing drafts (gitignored, local-only)
- `supabase/migrations/` — DB schema, run in order
- `.env.example` — shape of the env file (real values are in `.env.local`, gitignored)
