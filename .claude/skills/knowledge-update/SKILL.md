---
name: knowledge-update
description: End-of-session knowledge base sync. Appends decisions, conventions, and learnings from the current session to the matching agent knowledge file in .claude/knowledge/. Use when the user says "update the knowledge base", "log what we did", "save to knowledge", "end of session", or "wrap up". Also invoke automatically at the end of any substantial task (new feature, major refactor, architectural decision, or compliance review).
metadata:
  version: 1.0.0
---

# Knowledge Update

You are writing a dated log entry to the PortPagos agent knowledge base. The knowledge base lives in `.claude/knowledge/` with one file per agent (filenames match agent names 1:1).

## Step 1 — Identify what changed

Look at this session's conversation and identify:
- **Decisions made** — architectural choices, UI conventions, copy rules, pricing, legal stances
- **Conventions established** — patterns to follow in the future (naming, file structure, data flow)
- **Bugs fixed with non-obvious root causes** — things that will recur if not documented
- **Things NOT to do** — constraints discovered (broken APIs, banned patterns, compatibility issues)
- **Open questions** — unresolved items for the next session

Do NOT log:
- Ephemeral task details (what files were touched, what was in the PR)
- Anything already in CLAUDE.md or the glossary
- Code patterns (they're in the code)
- Git history (it's in git log)
- Secrets, keys, customer PII

## Step 2 — Identify which knowledge file(s) to update

| Agent | File | Update when… |
|---|---|---|
| engineer | `.claude/knowledge/engineer.md` | Code architecture, patterns, dependency choices, debug findings |
| designer | `.claude/knowledge/designer.md` | UI conventions, component decisions, brand choices |
| product-manager | `.claude/knowledge/product-manager.md` | Feature decisions, scope changes, prioritization rationale |
| devops | `.claude/knowledge/devops.md` | Deploy steps, Vercel quirks, env var changes (names only, no values) |
| marketer | `.claude/knowledge/marketer.md` | Copy decisions, positioning changes, campaign learnings |
| qa | `.claude/knowledge/qa.md` | New edge cases, known failure modes, test gaps |
| compliance | `.claude/knowledge/compliance.md` | Regulatory decisions, KYC/KYB scope, jurisdiction stances |
| sales | `.claude/knowledge/sales.md` | ICP learnings, objection patterns, deal-specific decisions |
| founder | `.claude/knowledge/founder.md` | Strategic decisions, partnership stances, hiring/fundraising signals |

One session may update multiple files if multiple agents were involved.

## Step 3 — Write the entry

Append to the `## Log` section at the bottom of the relevant file. If no `## Log` section exists, add it.

### Entry format

```markdown
### YYYY-MM-DD — [2–5 word title]

[1–3 sentences. What was decided or discovered. Why it matters. What to do (or avoid) in the future.]
```

Keep entries tight. If a future agent can act on it without re-reading this session, it's good. If it's just a task summary, it's not worth logging.

### Examples of good entries

```markdown
### 2026-05-15 — Fee display format locked

Fee must be displayed as "0.60%" (not "0.6%" or "0.006"). Legal page, dashboard, and emails all use this. Grep for "0.6" as a quick check.

### 2026-04-26 — "New Invoice" not "Send Invoice"

Button was renamed from "Send Invoice" → "New Invoice" because invoice creation and sending are two separate steps. Don't revert.

### 2026-04-25 — Alchemy webhook shape variants

extractLogs() handles 4 payload shapes. If a new Alchemy webhook is configured and payments go missing, add console.log(body) before extractLogs() to capture the new shape. See webhook.test.ts for the 4 known shapes.
```

## Step 4 — Confirm with the user

Before writing, show the proposed entries and ask: "Log these to the knowledge base?" Apply on confirmation.

## Step 5 — Update CLAUDE.md if needed

If the session changed a project-wide convention (pricing, banned words, deploy process), check whether CLAUDE.md needs updating too. Flag it — don't edit CLAUDE.md silently.
