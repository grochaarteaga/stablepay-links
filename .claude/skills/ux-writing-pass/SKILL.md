---
name: ux-writing-pass
description: Sweep all PortPagos user-facing copy for banned words, wrong pricing, crypto jargon, and preferred framing violations. Use when the user says "ux writing pass", "copy sweep", "check the copy", "banned words", "scan for jargon", or after any UI feature lands. Outputs a numbered punch list of violations with file:line references and suggested fixes.
metadata:
  version: 1.2.0
---

# UX Writing Pass

You are doing a systematic copy audit of PortPagos. Your goal is to finish the full cycle — scan, fix, verify — in **one user turn** for mechanical issues, and **one user turn** for judgment calls.

---

## Step 1 — Run the banned-word scan (deterministic)

```bash
bash .claude/skills/scripts/scan-banned-words.sh src
```

Capture the full output. If exit 0: report "No violations found" and stop.

---

## Step 2 — Filter false positives (before showing anything to the user)

Read the raw line for every script hit. Silently discard matches that are **not** user-visible strings:

- Line starts with `import ` → import path, not a string shown to users
- Match is inside a `console.log(`, `console.error(`, `console.warn(` call → internal log
- Match is in a TypeScript type name, interface, or enum value → not rendered
- Match is in a `// comment` or `/* comment */` → the script excludes comments but grep can still catch them in `.ts` files
- Match is inside `process.env.` or an environment variable reference → config, not copy
- Match is a variable or function name (no surrounding quotes `"` or `` ` ``) → identifier, not copy

After filtering, if no violations remain: report "No user-visible violations" and stop.

---

## Step 3 — Classify into two tiers (no user input needed)

### Tier A — Auto-fix (mechanical, unambiguous)

These have a 1:1 replacement with no contextual judgment required. **Apply these immediately without asking.**

| Found | Auto-fix to |
|---|---|
| `0.6%` (missing trailing zero) | `0.60%` |
| `0.006` (decimal form of fee) | `0.60%` |
| `"transaction hash"` (exact phrase) | `"payment reference"` |
| `"on-chain confirmation"` (exact phrase) | `"payment confirmed"` |
| `"gas fees"` | remove the sentence (we absorb them) |

These are safe to apply blindly — the replacement is unambiguous regardless of context.

### Tier B — Judgment calls (contextual rephrasing needed)

Everything else: terms where the correct replacement depends on surrounding copy.

For each Tier B hit, **pre-generate two alternative fixes** before presenting. Don't ask "what should I replace X with?" — give options and ask for a pick.

---

## Step 4 — Apply Tier A fixes silently

Make all Tier A edits. Do not announce them one-by-one. After all are applied, briefly confirm:

```
Auto-fixed N mechanical issues:
  • 0.6% → 0.60% in src/app/legal/page.tsx:88
  • "transaction hash" → "payment reference" in src/components/InvoiceCard.tsx:17
```

---

## Step 5 — Present Tier B for one-shot resolution

Show all judgment calls together. For each, pre-generate two alternatives so the user can pick without a follow-up turn:

```
JUDGMENT CALLS — pick a fix for each (reply with numbers, e.g. "1a, 2b, 3-custom text"):

1. [BANNED WORD] src/app/(app)/dashboard/page.tsx:42
   Found: "seamless settlement experience"
   A: "settlement in under 2 minutes"
   B: "faster international settlement"

2. [JARGON] src/app/landing/page.tsx:105
   Found: "powered by blockchain"
   A: "built on modern payment rails"
   B: "settled on an instant payment network"

3. [INTERNAL TOOL] src/app/api/auth/welcome-email/route.ts:67
   Found: "Your Privy wallet is ready"
   A: "Your payment account is ready"
   B: "Your wallet is set up — you own the keys"
```

Wait for one reply. Apply all selected fixes in a single pass.

---

## Step 6 — Verify automatically

After all Tier A + B fixes are applied, re-run immediately without prompting:

```bash
bash .claude/skills/scripts/scan-banned-words.sh src
```

If exit 0: "All clear — N violations fixed, 0 remaining."

If exit 1: "X violations still present" — show remaining hits and ask if they're false positives or need fixing. Do not loop more than once.

---

## Preferred framings reference (for Tier B option generation)

| Found | Options to offer |
|---|---|
| "crypto" / "blockchain" | "stablecoin rails" / "modern payment rails" |
| "on-chain" (not exact phrase) | "settled" / "confirmed" |
| "wallet" (to payers) | "account" / "payment account" |
| "decentralized" | "you own the funds, not us" / "non-custodial" |
| "USDC" (first payer-facing mention) | "digital dollar (USDC)" / "US dollar-equivalent" |
| "web3" / "tokenize" | remove the sentence / rephrase around the outcome |
| Internal tool name (Alchemy, Privy, Supabase, Resend) | describe the function without naming the vendor |

## Tone rules (flag during Tier B review)

- Exclamation points in error/status messages → remove
- Button label doesn't start with a verb → fix label
- Error message skips "what to do next" → add action
- Empty state has no CTA → add one
