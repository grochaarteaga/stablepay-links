---
name: vercel-debug
description: Debug and fix Vercel build failures for PortPagos. Use when the user says "Vercel build failed", "deploy is broken", "build error", "it won't deploy", "fix the Vercel build", or pastes a Vercel error log. Runs a local build, diagnoses against a known-issues checklist, and applies a fix.
disable-model-invocation: true
metadata:
  version: 1.1.0
---

# Vercel Debug

You are diagnosing a Vercel build failure for PortPagos (Next.js 16, Tailwind CSS v4, Supabase, Privy, WalletConnect).

> **`disable-model-invocation: true`** — this skill commits and pushes to production. It must only run when the user explicitly asks for it.

---

## Step 1 — Run the config pre-flight (deterministic)

Before reading the error, check whether the three most common config issues are present. This script exits 0 if clean, exit 1 with details if broken:

```bash
bash .claude/skills/scripts/check-build-config.sh
```

If the script reports failures, fix those first and re-run the build. Do not proceed to error diagnosis until the pre-flight is clean — these config issues mask the real error.

---

## Step 2 — Get the error

If the user pasted an error, read it. Otherwise run:

```bash
npm run build 2>&1 | tail -60
```

Capture the first error line and 10 lines of context around it. Do not fix anything until you have identified the root cause.

---

## Step 3 — Diagnose (AI judgment)

Match the error against the known failure modes below. The pre-flight already handled A (WalletConnect) and B (env vars) if it passed — start from C.

### C. Module resolution / import error

**Symptoms:** `Module not found`, `Cannot find module`, `SyntaxError: Unexpected token`

**Checks:**
1. Import path uses `@/` alias? Check `tsconfig.json` paths.
2. Package in `dependencies` (not `devDependencies`)? Runtime packages can't be in dev.
3. Named export exists in the installed version?

**Fix:** Move package to `dependencies`, or fix the import path.

### D. TypeScript / type error

**Symptoms:** `Type error:`, `TS2345`, `TS2339`

**Checks:**
1. Run `npx tsc --noEmit` locally to reproduce.
2. Error in generated Supabase types? Regenerate: `npx supabase gen types typescript --local > src/types/supabase.ts`
3. `null`/`undefined` guard missing at compile time?

**Fix:** Fix the type. Do not add `@ts-ignore` unless it's a known false positive in a third-party type.

### E. Next.js App Router / RSC issue

**Symptoms:** `useState only works in Client Components`, `Dynamic server usage`, `headers() was called`

**Checks:**
1. Component using React hooks without `"use client"` at top?
2. Server component importing a module that uses browser APIs?
3. `cookies()` or `headers()` called in a statically-rendered place?

**Fix:** Add `"use client"` at the correct boundary, or move browser-only code into a client component.

### F. Tailwind CSS v4 issue

**Symptoms:** Styles missing in production, PostCSS error, `@import` order error

**Checks:**
1. `postcss.config.js` uses `@tailwindcss/postcss` (v4 plugin)?
2. `globals.css` starts with `@import "tailwindcss"` (v4 syntax)?
3. Custom CSS variables defined before use?

---

## Step 4 — Propose the fix

State:
- **Root cause:** one sentence
- **Fix:** exact code or config change
- **Confidence:** high / medium / low

Ask: "Apply this fix?"

---

## Step 5 — Verify and ship

After applying:

```bash
npm run build 2>&1 | tail -20
```

If it passes:
```bash
git add -p   # stage only the fix
git commit -m "fix: resolve Vercel build — [root cause in 5 words]"
```

**Ask before pushing.** Confirm the user wants to push to the current branch before running `git push`.

Then confirm the Vercel deploy goes green.

---

## If none of the above match

Read the full build log (not just the tail). Vercel's dashboard summary often truncates the real error. Ask the user to share the Vercel deploy URL so you can read raw output.
