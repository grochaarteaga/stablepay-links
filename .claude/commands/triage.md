---
description: Triage a bug, issue, or ambiguous request with product-manager and engineer working together
argument-hint: <issue-description-or-path-to-writeup>
---

Triage: **$ARGUMENTS**

Two-agent flow:

**Step 1 — engineer** reads the repo to establish the facts:
- If $ARGUMENTS references a file path, read it.
- If it's a bug report, read the implicated code paths and git log around them.
- Answer: what is actually happening? Is this a bug, a missing feature, a config issue, or a misunderstanding?
- Estimate scope of a fix (S/M/L) and identify files that would change.

**Step 2 — product-manager** decides disposition based on engineer's findings:
- **Fix now** — hotfix, schedule for current sprint.
- **Fix soon** — add to roadmap, priority labeled.
- **Decline** — not the right scope, explain why.
- **Clarify** — need more info from Guillermo before deciding.

**Output format:**
1. Facts (engineer)
2. Scope estimate (engineer)
3. Disposition + reasoning (product-manager)
4. If "fix now" or "fix soon": proposed next action and which agent owns it.

Log the triage in `.claude/knowledge/product-manager.md` under a new `## Triage log` section if it doesn't exist yet.
