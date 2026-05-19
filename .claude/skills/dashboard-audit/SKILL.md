---
name: dashboard-audit
description: Audit the PortPagos app dashboard and authenticated pages for stale copy, misleading UI states, disabled features without proper badges, missing affordances, and label inconsistencies. Use when the user says "dashboard audit", "UI cleanup", "polish the dashboard", "check for stale copy", "find UI issues", or before a release. Outputs a numbered punch list with file:line references.
metadata:
  version: 1.0.0
---

# Dashboard Audit

You are auditing the PortPagos authenticated app UI for accumulated technical debt in copy, state management, and UX consistency. This is not a visual design review — it's a systematic hunt for the kind of small mismatches that slip through during fast feature work.

## Files to scan

- `src/app/(app)/dashboard/page.tsx` — main dashboard
- `src/app/(app)/invoices/` — invoice list and new invoice flow
- `src/app/(app)/invoices/new/page.tsx` — invoice creation
- `src/app/(auth)/onboarding/` — all onboarding steps
- `src/components/` — shared components used in the app shell
- Any other routes under `src/app/(app)/`

Read the files, don't just grep — state and conditional rendering require context.

## Antipattern checklist

### Stale feature flags and "coming soon"
- Any button/feature marked "Soon", "Coming soon", or disabled — is the feature actually live? If yes, remove the badge and enable it.
- Any placeholder copy like "USDC withdrawal coming soon" — check if the feature shipped.
- Hardcoded "Pending" or "Verification: Pending" states that don't read from real data.

### Wrong action labels
- Buttons that say what they are, not what they do ("Invoice" vs "Create invoice")
- "Send Invoice" when the action is create-then-optionally-send (correct label: "New Invoice")
- "Submit" anywhere — replace with a specific action verb

### Misleading trust copy
- "No wallet needed" or similar if the user does have a wallet (they do — via Privy)
- Copy that implies PortPagos holds funds (it doesn't — non-custodial)
- Copy that says "bank account" when it means "treasury wallet"

### Missing affordances
- Invoice rows without a copy-link button (payment link should be accessible from the list)
- Amounts shown without currency label (must show "USDC" or "$")
- Dates shown without timezone context

### Redundant or confusing columns/elements
- Table columns that show the same data as another column
- Cards that duplicate information already visible elsewhere on the page
- Empty section headers with no content beneath them

### Onboarding flow
- Steps that re-navigate completed users back to the start (users who finished onboarding should not be sent back)
- "Complete setup" that doesn't actually complete (check that it saves country + business type and redirects to dashboard)
- Form fields that don't persist on refresh if not submitted

### Copy tone (quick check)
- Any exclamation points in error or status messages
- "Error: [technical message]" shown raw to users
- Empty states with no CTA

## Output format

```
DASHBOARD (src/app/(app)/dashboard/page.tsx)
  1. [STALE FLAG] Line 78: "Top up — Soon" badge — is Bridge live? If yes, remove badge.
  2. [MISSING AFFORDANCE] Line 134: invoice rows missing copy-link button
  3. [WRONG LABEL] Line 23: button says "Send Invoice" — should be "New Invoice"

INVOICE CREATION (src/app/(app)/invoices/new/page.tsx)
  1. [MISLEADING COPY] Line 201: "No wallet needed" — payers do use a wallet via Privy

N issues across X files.
```

For each issue, include:
- Category tag: `[STALE FLAG]`, `[WRONG LABEL]`, `[MISSING AFFORDANCE]`, `[MISLEADING COPY]`, `[REDUNDANT]`, `[ONBOARDING BUG]`, `[COPY TONE]`
- File and line
- What was found
- Suggested fix (one line)

After the list: "Apply all fixes, or go issue by issue?"
