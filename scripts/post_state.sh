#!/usr/bin/env bash
# Usage: ./post_state.sh <api_base> <update_token>
# Example: ./post_state.sh https://mission-control-lite.pages.dev/api/state/update ABC123
set -euo pipefail
API_BASE="${1:-https://mission-control-lite.pages.dev/api/state/update}"
TOKEN="${2:-}"
# Placeholder: pull from OpenClaw CLI when available
AGENTS_JSON='[]'
CRONS_JSON='[]'
# Try to populate from files if you maintain a JSON dump locally
[ -f "$HOME/.openclaw/agents.json" ] && AGENTS_JSON=$(cat "$HOME/.openclaw/agents.json") || true
[ -f "$HOME/.openclaw/crons.json" ] && CRONS_JSON=$(cat "$HOME/.openclaw/crons.json") || true
PAYLOAD=$(jq -n --argjson agents "$AGENTS_JSON" --argjson crons "$CRONS_JSON" '{agents:$agents, crons:$crons}')
exec curl -fsSL -X POST "${API_BASE}?token=${TOKEN}" -H 'Content-Type: application/json' -d "$PAYLOAD"
