---
name: priorities
description: Daily priority digest for Guillermo. Aggregates the roadmap, active blockers, memory flags, and today's Obsidian daily note into a single ranked list of what to work on right now. Use when the user says "priorities", "what should I work on", "what's next", "top tasks", "daily focus", "what are my tasks", or asks about short-term priorities.
metadata:
  version: 1.0.0
---

# Priorities

You are producing a focused, daily priority digest for Guillermo — solo founder of PortPagos. No strategy, no fluff. Just: here's what to do today, ranked.

## Step 1 — Read the three sources in parallel

**Source A — Roadmap**
Read `.claude/knowledge/product-manager.md`.
Extract:
- The "Now" items and their completion status (`[ ]` vs `[x]`)
- Any open questions flagged as blocking
- Any follow-up items logged in the `## Log` section within the last 7 days

**Source B — Memory index**
Read `/Users/guillermorocha/.claude/projects/-Users-guillermorocha-stablepay-links/memory/MEMORY.md`.
Look for:
- Active blockers with deadlines (e.g. "if no reply by DATE, do X")
- Rotation / security flags (secrets, credentials)
- Partnership statuses pending action

For any entry that looks time-sensitive, read the full memory file it points to.

**Source C — Today's daily note**
Today's date is available in the `currentDate` system reminder. Look for the file at:
`PortPagos-brain/daily/DD-MM-YYYY.md` (e.g. `20-05-2026.md`)
Also try `YYYY-MM-DD.md` format as fallback.
Extract any tasks, notes, or log entries from today.

## Step 1.5 — Non-negotiable top slots (check before ranking)

Two categories ALWAYS occupy the top of BLOCKING, above everything else, regardless of what the roadmap or daily note says:

1. **Open one-way-door risk** — any unresolved security/rotation flag in memory (e.g. `project_rotate_secrets`). If present, it is BLOCKING item #1. Always.
2. **Empty pilot pipeline** — if no pilot is live and no outreach is logged in the last 7 days, then *"Send pilot outreach"* is BLOCKING (right after any security item). An empty pipeline is itself the top blocker.

A feature, polish, or infrastructure task may **never** rank above either of these. If the only work you would otherwise surface is building, the correct top item is still one of the two above.

## Step 2 — Rank and classify

Classify each open item into one of three buckets:

| Bucket | Criteria |
|---|---|
| **BLOCKING** | Blocks a pilot, a live payment, or a time-bound external dependency (deadline within 7 days) |
| **HIGH** | Unblocks pilots but no hard deadline; must ship before fundraising |
| **QUEUE** | Everything else — soon/backlog items, non-goals |

Deduplicate. If the same item appears in multiple sources, merge it into one line.

## Step 3 — Output the digest

Print exactly this format. No intro paragraph. No trailing commentary unless there is a hard deadline today or tomorrow.

```
## Priorities — [DATE]

### BLOCKING
1. [item] — [one-line reason it's blocking] [deadline if known]
2. ...

### HIGH
1. [item] — [one-line reason]
2. ...

### QUEUE (don't touch yet)
- [item]
- [item]

---
[Only if a deadline is within 48h]: ⚠ [specific deadline callout]
```

Rules:
- Maximum 3 items per bucket. If more exist, keep the highest-impact ones and note "+(N) more in roadmap."
- Each item is one line. No sub-bullets, no elaboration unless asked.
- Use plain names — no agent jargon, no "per the PM knowledge base."
- If today's daily note has tasks, surface them first within the relevant bucket.
- A feature / build / polish / infra item may appear in HIGH at most — never BLOCKING — until a pilot is live.
- If all roadmap items are blocked on an external party (e.g. Transak KYB), say so clearly in one line under BLOCKING.

## Step 4 — Offer next action

After the digest, print one line:

> Pick an item and I'll open it up, or type `/spec <feature>` to plan something new.

Do not suggest a full strategy session, do not invoke other agents, do not ask clarifying questions. Surface the list and wait.
