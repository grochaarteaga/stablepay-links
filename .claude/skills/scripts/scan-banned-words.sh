#!/usr/bin/env bash
# Scan PortPagos source files for banned words and wrong pricing.
# Usage: bash .claude/skills/scripts/scan-banned-words.sh [path]
# Default path: src
# Exit 0 = clean. Exit 1 = violations found.

set -euo pipefail
SEARCH_PATH="${1:-src}"

BANNED_WORDS=(
  "seamless"
  "revolutionary"
  "cutting-edge"
  "game-changing"
  "leverage"
  "blockchain"
  "web3"
  "tokenize"
  "decentralized"
  "ERC-20"
  "gas fees"
  "on-chain"
  "off-chain"
  "smart contract"
  "transaction hash"
  "Alchemy"
  "Privy"
  "Supabase"
  "Resend"
)

GREP_OPTS=(--include="*.tsx" --include="*.ts" --include="*.html"
           --exclude-dir=node_modules --exclude-dir=.next
           --exclude="*.test.ts" --exclude="*.spec.ts"
           -rn -i)

VIOLATIONS=0

for term in "${BANNED_WORDS[@]}"; do
  results=$(grep "${GREP_OPTS[@]}" "$term" "$SEARCH_PATH" 2>/dev/null || true)
  if [ -n "$results" ]; then
    echo "[BANNED] \"$term\""
    echo "$results" | sed 's/^/  /'
    echo ""
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done

# "crypto" needs word-boundary to avoid matching "cryptocurrency" in comments
results=$(grep "${GREP_OPTS[@]}" -w "crypto" "$SEARCH_PATH" 2>/dev/null || true)
if [ -n "$results" ]; then
  echo "[BANNED] \"crypto\" (whole word)"
  echo "$results" | sed 's/^/  /'
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# "L2" needs word boundary — too short for -i case-insensitive match
results=$(grep "${GREP_OPTS[@]}" -w "L2" "$SEARCH_PATH" 2>/dev/null || true)
if [ -n "$results" ]; then
  echo "[BANNED] \"L2\" (whole word)"
  echo "$results" | sed 's/^/  /'
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# Pricing must be exactly 0.60% — flag 0.6% (missing zero), 0.006, or wrong rate
results=$(grep "${GREP_OPTS[@]}" -E "0\.6[^0]%|[^0-9]0\.006|fee[^0-9]*1%" "$SEARCH_PATH" 2>/dev/null || true)
if [ -n "$results" ]; then
  echo "[WRONG PRICE] Fee must be \"0.60%\" exactly"
  echo "$results" | sed 's/^/  /'
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "Clean — no banned words or pricing errors found in $SEARCH_PATH."
  exit 0
else
  echo "$VIOLATIONS violation group(s) found."
  exit 1
fi
