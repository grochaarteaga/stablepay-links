---
description: Have the product-manager agent write a short, buildable spec for a feature
argument-hint: <feature-name-or-sentence>
---

Use the **product-manager** agent. Write a spec for: **$ARGUMENTS**

Follow the PM knowledge-base protocol: read `.claude/knowledge/product-manager.md` first, read `.claude/sources/glossary.md` for domain vocabulary, check existing docs in `src/` and `supabase/migrations/` for current state.

The spec should include:
- **Problem** — what user pain does this solve? (one paragraph)
- **Success metric** — how will we know it worked?
- **Requirements** — bullet list, must-haves only
- **Non-goals** — what we are explicitly NOT doing in this scope
- **Scope** — S/M/L estimate
- **Open questions** — anything you couldn't resolve from current context

Keep it short. If you find blocking ambiguity, stop and ask Guillermo before inventing answers.

When done: save the spec to `docs/specs/<kebab-case-name>.md` (create the folder if it doesn't exist), log a dated entry in `.claude/knowledge/product-manager.md`, and flag for review by **designer** (UX implications) and **engineer** (feasibility) per `.claude/sources/review-protocol.md`.
