# Review & Critique Protocol

This file defines how artifacts move through the agent team with a light review loop. Every agent references this doc.

## The core rule

**No meaningful artifact advances to the next stage without a one-paragraph sanity check from the next-in-line reviewer.** Not a formal process — a quick "does this hold up?" read from a specialist outside the domain.

## Who reviews what

| Artifact | Author | Reviewer(s) | What the reviewer checks |
|---|---|---|---|
| Spec / PRD | `product-manager` | `designer` + `engineer` | Is the UX feasible? Is the tech estimate realistic? Any scope creep? |
| UX flow / wireframe | `designer` | `product-manager` + `marketer` | Does it solve the stated problem? Is microcopy on-brand? |
| Code change / PR | `engineer` | `qa` + `designer` (if UI changed) | Edge cases, concurrency, test gaps, UX regressions |
| Deploy plan | `devops` | `engineer` | Tests green on preview? Migration reversible? Rollback documented? |
| Marketing copy | `marketer` | `product-manager` | Are claims verifiable? Does it match actual product state? |
| Test plan / threat model | `qa` | `engineer` | Are the scenarios realistic? Any infeasible ones? |

## How to request a review

Explicit: *"Hand this to `designer` for review — check UX states and microcopy, flag anything missing."*

Implicit: an agent finishing a non-trivial artifact SHOULD say at the end: *"Ready for review by X. Reviewer should check: [1–3 items]."* This is a signal to the user that the hand-off should happen.

## How a reviewer responds

One paragraph, max. Three buckets:

1. **Blocker** — something has to change before proceeding. Name it.
2. **Should-fix** — could ship but meaningfully weaker. Name it.
3. **Nits** — optional polish. List briefly or skip.

If zero of the above: "LGTM, proceed."

## When to skip review

- Trivial fixes (typo, one-line config change, dependency bump)
- Work that's exploratory or being thrown away
- When the user explicitly says "just do it, skip review"

## When the reviewer disagrees with the author

Named disagreement. The author and reviewer each state their position in one sentence, then the **product-manager** arbitrates. If the disagreement is purely technical (e.g. architecture), **engineer** arbitrates instead.

## Tracking reviews

Reviews don't need their own file — they live in the author's knowledge-base log entry. Example log entry from `engineer.md`:

> ### 2026-05-02 — PR #47: Add recurring invoices
> - Implemented scheduled cron job using Supabase pg_cron.
> - **Reviewed by qa (2026-05-02):** flagged concurrency issue when two cron runs overlap. Fixed with advisory lock before shipping.
> - Merged 2026-05-03.
