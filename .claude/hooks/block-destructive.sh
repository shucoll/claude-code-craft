#!/usr/bin/env bash
# PreToolUse(Bash) safety net: deny catastrophic / irreversible shell commands,
# and ask for confirmation on risky-but-sometimes-legit ones. Heuristic by design.
set -uo pipefail

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')

emit() { # $1 = decision (deny|ask), $2 = reason
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":%s,"permissionDecisionReason":%s}}\n' \
    "$(jq -Rn --arg d "$1" '$d')" "$(jq -Rn --arg m "$2" '$m')"
  exit 0
}

# --- DENY: catastrophic / irreversible ---------------------------------------

# rm -rf (any flag order) aimed at a filesystem root, home, cwd, or bare glob
if printf '%s' "$cmd" | grep -Eq '\brm\b[^|;&]*-[a-z]*[rf][a-z]*[[:space:]]+(-[a-z]+[[:space:]]+)*(/|/\*|~|~/|\$HOME|\.|\.\.|\*)([[:space:]]|$)'; then
  emit deny 'Blocked: rm -rf targeting a root/home/cwd/glob path is irreversible. Narrow the target to a specific subdirectory.'
fi

# Fork bomb
if printf '%s' "$cmd" | grep -Eq ':\(\)[[:space:]]*\{[[:space:]]*:[[:space:]]*\|[[:space:]]*:'; then
  emit deny 'Blocked: fork bomb pattern.'
fi

# Writing raw to a block device / disk wipes
if printf '%s' "$cmd" | grep -Eq '\b(dd)\b[^|;&]*\bof=/dev/(disk|sd|nvme|hd|rdisk)' \
   || printf '%s' "$cmd" | grep -Eq '>[[:space:]]*/dev/(disk|sd|nvme|hd|rdisk)' \
   || printf '%s' "$cmd" | grep -Eq '\bmkfs(\.[a-z0-9]+)?\b'; then
  emit deny 'Blocked: command writes directly to a disk/block device.'
fi

# Recursive permission/ownership nukes on a root path
if printf '%s' "$cmd" | grep -Eq '\b(chmod|chown)\b[^|;&]*-[a-zA-Z]*R[a-zA-Z]*[[:space:]]+[^|;&]*[[:space:]]/([[:space:]]|$)'; then
  emit deny 'Blocked: recursive chmod/chown on a root path.'
fi

# --- ASK: risky but legitimate sometimes -------------------------------------

if printf '%s' "$cmd" | grep -Eq '\bgit[[:space:]]+push\b[^|;&]*(--force|[[:space:]]-f\b)' \
   && ! printf '%s' "$cmd" | grep -Eq -- '--force-with-lease'; then
  emit ask 'git push --force can overwrite remote history. Prefer --force-with-lease. Confirm?'
fi

if printf '%s' "$cmd" | grep -Eq '\bgit[[:space:]]+reset[[:space:]]+--hard\b' \
   || printf '%s' "$cmd" | grep -Eq '\bgit[[:space:]]+clean\b[^|;&]*-[a-z]*f'; then
  emit ask 'This discards uncommitted work irreversibly. Confirm?'
fi

exit 0
