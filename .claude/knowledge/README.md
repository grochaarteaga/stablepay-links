# Agent Knowledge Bases

This folder is the shared brain of the PortPagos agent team. Each agent owns one `.md` file here. **Filenames match agent names 1:1** so the pairing is obvious.

| Agent definition | Knowledge file |
|---|---|
| `.claude/agents/product-manager.md` | `product-manager.md` |
| `.claude/agents/designer.md` | `designer.md` |
| `.claude/agents/engineer.md` | `engineer.md` |
| `.claude/agents/devops.md` | `devops.md` |
| `.claude/agents/qa.md` | `qa.md` |
| `.claude/agents/marketer.md` | `marketer.md` |

## The protocol

Every time an agent starts a task it **reads** its file. Every time it does real work it **appends** a dated entry to the `## Log` section (and updates the living sections above the log if something structural changed).

A good log entry is one to three bullets: what happened, why, any follow-up. Over time these files become the project's institutional memory.

## What goes where

- **Top of the file (snapshot)** — things the agent needs to know every session. Keep current; prune when stale.
- **Living sections (roadmap, conventions, runbooks, messaging library, etc.)** — domain-specific structure per agent. Edit in place as things evolve.
- **Log (bottom)** — append-only trail of dated decisions and activity. Never rewrite history — if you were wrong, add a new entry correcting it.

## Canonical sources — `.claude/sources/`

Knowledge files are the **agent's own writing**: decisions, conventions, conclusions. For raw reference material — pitch decks, approved landing copy, positioning briefs — look in `.claude/sources/`. Everything there is stored as `.md` so agents can read it cheaply without extracting from PDF/PPTX at runtime.

## Hard rules

- **No secrets.** Ever. No API keys, RPC URLs with keys, wallet private keys, database URLs with credentials, service role keys, or customer PII. Names/references only ("`SUPABASE_SERVICE_ROLE_KEY` is set in Vercel prod") — never values.
- **No customer data.** No private emails, contract terms, deal specifics. Only aggregate patterns.
- **Dated entries.** Every log entry starts with `### YYYY-MM-DD — short title`.
- **Cross-references over duplication.** If the same fact belongs in two files (e.g. a Supabase schema decision is both product and engineering), write it in one and link to it.

## Why this is in git

These files are versioned alongside the code because they ARE the project — decisions, conventions, learnings. If you switch machines or bring in a collaborator, the team's memory comes along. The `.gitignore` has been configured so these files are committed while `.claude/settings.local.json` stays personal.
