#!/usr/bin/env bash
# PreToolUse guard for Claude Code Craft "load-bearing invariants" (see CLAUDE.md).
# Reads the Write/Edit payload on stdin and returns a PreToolUse permission
# decision: deny for hard rules, ask for things a human should eyeball.
set -uo pipefail

input=$(cat)
fp=$(printf '%s' "$input" | jq -r '.tool_input.file_path // ""')

# Text being written: Write -> content, Edit -> new_string, MultiEdit -> edits[].new_string
content=$(printf '%s' "$input" | jq -r '
  (.tool_input.content // empty),
  (.tool_input.new_string // empty),
  (.tool_input.edits[]?.new_string // empty)
' 2>/dev/null || true)

emit() { # $1 = decision (deny|ask), $2 = reason
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":%s,"permissionDecisionReason":%s}}\n' \
    "$(jq -Rn --arg d "$1" '$d')" "$(jq -Rn --arg m "$2" '$m')"
  exit 0
}

# Hard rule: Tailwind v4 is CSS-first — no tailwind.config.* in this repo.
case "$fp" in
  *tailwind.config.js|*tailwind.config.ts|*tailwind.config.cjs|*tailwind.config.mjs)
    emit deny 'CLAUDE.md: Tailwind v4 is CSS-first (no tailwind.config.*). Configure via @import "tailwindcss" and @custom-variant in CSS.' ;;
esac

case "$fp" in
  *.ts|*.tsx)
    # localStorage keys must live in src/lib/storageKeys.ts (ccc: namespace).
    case "$fp" in
      *storageKeys.ts) : ;;
      *)
        if printf '%s' "$content" | grep -q 'localStorage\.'; then
          emit ask 'CLAUDE.md: localStorage keys belong in src/lib/storageKeys.ts (ccc: namespace), not inline here.'
        fi ;;
    esac ;;
esac

# Design system: consume semantic tokens only — no raw hex, no --ccc-* primitives — in TSX.
case "$fp" in
  *.tsx)
    if printf '%s' "$content" | grep -Eq '#[0-9a-fA-F]{3,8}\b'; then
      emit ask 'CLAUDE.md design system: use semantic tokens (bg-background, text-primary, border-ink), not raw hex colors.'
    fi
    if printf '%s' "$content" | grep -q -- '--ccc-'; then
      emit ask 'CLAUDE.md design system: use semantic tokens, not --ccc-* primitives directly.'
    fi ;;
esac

exit 0
