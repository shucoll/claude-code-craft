#!/usr/bin/env bash
# PostToolUse: run oxlint on the file Claude just wrote and feed any findings
# back as context. Non-blocking — the edit already happened.
set -uo pipefail

input=$(cat)
fp=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // ""')

case "$fp" in
  *.ts|*.tsx|*.js|*.jsx|*.cjs|*.mjs) ;;
  *) exit 0 ;;
esac
[ -f "$fp" ] || exit 0

if out=$(npx --no-install oxlint --deny-warnings "$fp" 2>&1); then
  exit 0
fi

printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":%s}}\n' \
  "$(jq -Rs --arg p "$fp" '"oxlint reported issues in \($p):\n" + .' <<<"$out")"
exit 0
