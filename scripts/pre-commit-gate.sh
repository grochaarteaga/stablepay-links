#!/usr/bin/env bash
# Claude Code PreToolUse hook — runs automated checks before any git commit.
# Receives tool call JSON on stdin. Blocks the commit if tests or tsc fail.
set -euo pipefail

INPUT=$(cat)

# Bail out if this isn't a git commit call
if ! echo "$INPUT" | grep -q '"git commit'; then
  exit 0
fi

echo ""
echo "━━━ QA Gate ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "git commit detected — running automated checks"
echo ""

cd "$(dirname "$0")/.."

echo "→ npm test"
if ! npm test --silent 2>&1; then
  echo ""
  echo "✗ BLOCKED: Fix failing tests before committing."
  echo "  Run 'npm test' to see the full output."
  exit 1
fi
echo "✓ Tests passed"
echo ""

echo "→ tsc"
TSC_OUT=$(npx tsc --noEmit --pretty false 2>&1 || true)
if echo "$TSC_OUT" | grep -q "error TS"; then
  echo "$TSC_OUT"
  echo ""
  echo "✗ BLOCKED: Fix TypeScript errors before committing."
  exit 1
fi
echo "✓ TypeScript clean"
echo ""
echo "✓ QA Gate passed — commit proceeding"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
