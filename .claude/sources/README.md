# Canonical Sources

This folder holds **raw reference material** that agents read for context. Everything in here is `.md` — no PDFs or PPTX at read time. That means agents can `grep`, `read`, and reason over these cheaply without extracting binary content on every task.

## Index

| File | What it is | Useful for |
|---|---|---|
| `decks/client-pitch.md` | Content from `PortPagos-Client-Deck.pptx` — merchant/customer-facing pitch | `marketer` |
| `decks/enterprise-pitch.md` | Content from `PortPagos-Enterprise-Deck.pdf` — enterprise/CFO/treasury pitch | `marketer` |
| `landing-page/brand-spec.md` | Source of truth for landing page **copy, tone, voice, palette, typography**. "Lovable v1 prompt." | `marketer`, `designer` |
| `landing-page/build-spec.md` | Build instructions for the landing page (component scope, files to touch/not touch, git workflow) | `engineer`, `designer` |
| `landing-page/foundation-pr-notes.md` | PR description for the foundation commit that scaffolded the landing page | `engineer`, `designer` |

## Versus `.claude/knowledge/`

- `.claude/sources/` = **raw material**, the inputs. Mostly write-once (or update when the underlying deck/brief changes).
- `.claude/knowledge/` = **agent-authored memory**, the outputs. Append-only logs, evolving conventions, decisions over time.

When a marketer extracts a headline from `decks/client-pitch.md`, the headline gets added to the `## Messaging library` section of `knowledge/marketer.md` — not back into the source. The source stays the pristine record of what the deck says.

## House rules

- **No secrets, no customer PII.** Same rule as knowledge files.
- **When a source changes** (deck revised, landing page redesigned), update the `.md` here AND note the change in the relevant knowledge file's `## Log`.
- **Keep binary originals out of the repo.** The PDFs/PPTX that fed these extracts will be deleted from the repo root. The extracts here are the source of truth for agents.
- **Don't duplicate.** If content exists in `knowledge/`, link to it here rather than copying.
