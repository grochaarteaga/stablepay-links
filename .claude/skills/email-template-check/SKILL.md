---
name: email-template-check
description: Audit PortPagos transactional email templates for dark theme consistency, brand compliance, glossary violations, and deliverability. Use when the user says "check the emails", "email template audit", "email theme", "email copy", "transactional email", or after adding or editing any email template. Outputs a punch list of issues with file:line references.
metadata:
  version: 1.1.0
---

# Email Template Check

You are auditing PortPagos transactional email templates. These emails are sent via Resend from `@portpagos.com` and must match the app's dark theme, pass glossary rules, and deliver well.

## Files to check

Read all of these before producing output:

- `src/app/api/auth/welcome-email/route.ts` — welcome email to new merchants
- `src/app/api/invoices/[invoiceId]/send-email/route.ts` — payment request email to payers

If other email templates exist under `src/app/api/`, include them.

---

## Step 1 — Run the banned-word scan (deterministic)

Use the shared script scoped to the email template files specifically:

```bash
bash .claude/skills/scripts/scan-banned-words.sh src/app/api/auth/welcome-email
bash .claude/skills/scripts/scan-banned-words.sh src/app/api/invoices
```

This catches banned words and wrong pricing in one pass. No need to re-read the banned-words list manually — the script is the source of truth.

Capture violations. Then continue with the email-specific checks below.

---

## Step 2 — Dark theme compliance (AI judgment)

Read the email HTML in each template file. Flag any element that breaks the dark theme:

| Element | Expected |
|---|---|
| Background | Dark (`#0a0a0a` or equivalent near-black) |
| Card/container | Slightly lighter dark (`#111` or `#1a1a1a` range) |
| Body text | Light (`#e5e5e5` or white-ish) |
| Muted/secondary text | Gray (`#9ca3af` range) |
| CTA button background | Brand accent (check existing buttons in the codebase for canonical value) |
| CTA button text | White or near-white |
| Border/divider | Low-contrast dark (`#2a2a2a` range) |

Flag: white/light backgrounds, dark text on light background, default email gray, any `background-color: #fff` or `background: white`.

---

## Step 3 — Email-specific content checks (AI judgment)

### Subject lines
- Must be specific and action-oriented
- No all-caps, excessive punctuation, or spam triggers ("FREE", "!!!", "Act now")
- Welcome email: set clear expectation of what's inside
- Invoice email: must reference the amount or invoice number if available

### CTA buttons
- One primary CTA per email
- Text must start with a verb: "Pay now", "View invoice", "Go to dashboard"
- Button must be tappable on mobile (min height ~44px via padding)
- Link must use `NEXT_PUBLIC_SITE_URL` — never a hardcoded domain

### Structure
- Must have: from name, subject, preheader text (if implemented)
- Must not expose: internal IDs, Supabase row IDs, or wallet addresses to payers
- tx_hash → label as "Payment reference" if shown
- No marketing content mixed into transactional emails

### Responsive / fallback
- `max-width` container (600px)
- Inline styles for critical layout (email clients strip `<style>` blocks)
- Alt text on all images

---

## Step 4 — Output

Group by file:

```
WELCOME EMAIL (src/app/api/auth/welcome-email/route.ts)
  1. [BANNED] Line 34: "seamless onboarding" — fix: "get set up in minutes"
  2. [THEME] Line 67: white background on outer container — fix: #0a0a0a
  3. [CTA] Line 89: button text "Submit" — fix: "Go to dashboard"

INVOICE EMAIL (src/app/api/invoices/[invoiceId]/send-email/route.ts)
  1. [LINK] Line 44: hardcoded "portpagos.com" — fix: use NEXT_PUBLIC_SITE_URL

N issues across X files.
```

Apply fixes only after user confirms.
