#!/usr/bin/env bash
# PostToolUse (async): incremental project type-check after a source edit.
# Runs in the background; exit 2 wakes Claude with the errors only when tsc fails.
set -uo pipefail

input=$(cat)
fp=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // ""')

case "$fp" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

if out=$(npx --no-install tsc -b 2>&1); then
  exit 0
fi

printf '%s\n' "$out"
exit 2
