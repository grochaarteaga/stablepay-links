---
description: Have the engineer agent review the current git branch (uncommitted + unpushed changes) and flag issues
argument-hint: [optional: scope note like "focus on security" or "just the schema changes"]
---

Use the **engineer** agent. Review the current branch's changes.

Process:
1. Run `git status` and `git diff` (both working tree and against origin/main) to see what's changed.
2. Read the full diff — don't skim.
3. Check against conventions in `.claude/knowledge/engineer.md` and the stack notes there.
4. If there are UI changes, hand to **designer** for UX/microcopy review.
5. If there are schema / payment flow / auth changes, hand to **qa** for edge-case review.

Respond in the review format from `.claude/sources/review-protocol.md`:
- **Blockers** — must fix before merge
- **Should-fix** — ships but weaker if not addressed
- **Nits** — optional polish

$ARGUMENTS (if provided, treat as scope guidance — e.g. "security focus" means skip style/nits).

Do NOT commit or push anything — this is a read-only review.
