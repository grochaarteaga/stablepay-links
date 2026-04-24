# Design — Knowledge Base

> Maintained by the **designer** agent. Read at the start of every task. Append to `## Log` after real work.

## Product snapshot

- **Name:** PortPagos — instant USDC settlement for port agents and shipping companies
- **Audience:** shipping/logistics operators. Some older, many non-English-first, global. High-stakes financial flows. Not crypto-native.
- **Tone:** clear, serious, trustworthy. Professional finance product, not a consumer crypto app.

## Design system

_(Expand as patterns emerge. Confirm from codebase before invoking.)_

- **Framework:** Tailwind CSS v4 (CSS-first config, `globals.css` / `@theme`)
- **Spacing scale:** default Tailwind scale unless overridden — check `src/` for any custom tokens
- **Typography:** TBD — read `src/app/layout.tsx` and any `fonts/` for current setup
- **Color palette:** TBD — inventory from existing components

## Core patterns

_(Add as established. Current screens/flows to document.)_

- Landing page layout (work in progress — see `LANDING-PAGE-VSCODE-PROMPT.md` locally)
- Invoice creation flow (merchant side)
- Payment link flow (payer side)
- Merchant dashboard shell

## Accessibility baseline

- Color contrast: WCAG AA minimum (4.5:1 body text, 3:1 large text)
- All interactive elements keyboard-reachable
- Error messages tied to inputs via `aria-describedby`
- Focus rings visible and not overridden
- Copy: 8th-grade reading level for payer-facing screens (global audience)

## Microcopy conventions

- Buttons: verb-first, specific. "Create invoice" not "Submit." "Pay now" not "OK."
- Errors: what happened + what to do. "We couldn't verify that wallet. Try again or contact support."
- Empty states: explain the purpose + next action, not "no data."

## Components inventory

_(List components as they get built. Pull from `src/components/` on each task.)_

- _(TODO: first designer task should grep `src/components/` and populate this.)_

## Log

_(Append-only. Format: `### YYYY-MM-DD — short title` then 1–3 bullets.)_

### 2026-04-24 — Knowledge base initialized
- Seeded with baseline design values for PortPagos audience (shipping/logistics, non-crypto-native).
- TODO: inventory actual components in `src/components/` and populate design system tokens from `globals.css` on next designer task.
