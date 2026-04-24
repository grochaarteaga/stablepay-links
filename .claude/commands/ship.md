---
description: Have the devops agent walk through shipping the current branch to production safely
argument-hint: [optional: branch name or "current"]
---

Use the **devops** agent. Walk through shipping $ARGUMENTS (default: current branch) to production.

Follow the deploy runbook in `.claude/knowledge/devops.md` and the safety rules in `.claude/agents/devops.md`.

**Before doing anything:**
1. Confirm `git status` is clean or staged intentionally.
2. Confirm the current branch has a passing Vercel preview URL.
3. Confirm **engineer** has signed off on the code (`/review` done).
4. If the PR includes a DB migration, confirm **qa** has reviewed and the migration has been tested on a dev Supabase project.
5. Print the full deploy plan as a numbered list: each step, the command, the expected outcome, and the rollback move if it fails.
6. **Stop. Ask Guillermo to confirm before executing any step.**

On confirmation: execute one step at a time, printing the outcome before the next. If anything returns an error or unexpected output, STOP and ask.

After a successful deploy: log the entry in `.claude/knowledge/devops.md` with commit SHA, build duration, smoke-check results.
