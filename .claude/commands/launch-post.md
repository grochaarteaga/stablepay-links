---
description: Have the marketer agent draft a launch announcement for a shipped feature
argument-hint: <feature-or-release-name>
---

Use the **marketer** agent. Draft a launch announcement for: **$ARGUMENTS**

Process:
1. Read `.claude/knowledge/marketer.md` for voice, tone, banned words, preferred framing.
2. Read `.claude/sources/glossary.md` for shipping/payments vocabulary — use domain terms correctly.
3. Read `.claude/knowledge/product-manager.md` to confirm what actually shipped (don't guess or embellish).
4. If any factual claim can't be verified from the above, hand to **product-manager** before writing.

Produce three variants, each in its own section:

- **Landing-page update** — a short section (1–2 paragraphs) that could slot into the marketing site. Lead with the buyer's problem.
- **Email to existing customers / waitlist** — personal tone, one ask, short.
- **LinkedIn post** — 120 words max, specific numbers preferred, no crypto jargon.

At the bottom, list any claims you were unsure about — flag for Guillermo to verify before publishing.

When done: save the draft to `docs/marketing/announcements/<kebab-case-feature>.md`, log a dated entry in `.claude/knowledge/marketer.md`, hand to **product-manager** for a claim-accuracy review per `.claude/sources/review-protocol.md`.
