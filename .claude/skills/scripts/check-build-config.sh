#!/usr/bin/env bash
# Pre-flight check for common PortPagos Vercel build issues.
# Covers the three most common failure modes before touching the error log.
# Usage: bash .claude/skills/scripts/check-build-config.sh
# Exit 0 = all clear. Exit 1 = issues found (details printed to stdout).

set -euo pipefail
ISSUES=0

echo "=== Build config pre-flight ==="
echo ""

# ── Check 1: @walletconnect/core pinned to 2.21.10 ──────────────────────────
wc_version=$(node -e "
  const p = require('./package.json');
  console.log(
    p.dependencies?.['@walletconnect/core'] ||
    p.overrides?.['@walletconnect/core']    ||
    'NOT PINNED'
  );
" 2>/dev/null || echo "PARSE_ERROR")

if [ "$wc_version" = "2.21.10" ]; then
  echo "✓ @walletconnect/core pinned to 2.21.10"
else
  echo "✗ @walletconnect/core not pinned to 2.21.10 (found: $wc_version)"
  echo "  Fix: add \"@walletconnect/core\": \"2.21.10\" under dependencies or overrides in package.json"
  ISSUES=$((ISSUES + 1))
fi

# ── Check 2: .npmrc has legacy-peer-deps=true ────────────────────────────────
if [ -f .npmrc ] && grep -q "^legacy-peer-deps=true" .npmrc; then
  echo "✓ .npmrc has legacy-peer-deps=true"
else
  echo "✗ .npmrc missing legacy-peer-deps=true"
  echo "  Fix: echo 'legacy-peer-deps=true' >> .npmrc"
  ISSUES=$((ISSUES + 1))
fi

# ── Check 3: All .env.example vars present in .env.local ────────────────────
if [ ! -f .env.example ]; then
  echo "⚠ .env.example not found — skipping env var check"
elif [ ! -f .env.local ]; then
  echo "⚠ .env.local not found — Vercel env vars must be set in the dashboard"
else
  missing=()
  while IFS= read -r line; do
    [[ "$line" =~ ^#.*$  ]] && continue
    [[ -z "$line"        ]] && continue
    var="${line%%=*}"
    grep -q "^${var}=" .env.local || missing+=("$var")
  done < .env.example

  if [ "${#missing[@]}" -eq 0 ]; then
    echo "✓ All .env.example vars present in .env.local"
  else
    for var in "${missing[@]}"; do
      echo "✗ Missing in .env.local: $var"
      ISSUES=$((ISSUES + 1))
    done
  fi
fi

echo ""
if [ "$ISSUES" -eq 0 ]; then
  echo "All pre-flight checks passed. Proceed to read the build error."
  exit 0
else
  echo "$ISSUES issue(s) — fix the above before debugging the error log."
  exit 1
fi
