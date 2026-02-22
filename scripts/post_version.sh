#!/usr/bin/env bash
# Usage: ./post_version.sh <api_base> <update_token>
# Example: ./post_version.sh https://mission-control-lite.pages.dev/api/version/update ABC123
set -euo pipefail
API_BASE="${1:-https://mission-control-lite.pages.dev/api/version/update}"
TOKEN="${2:-}"
VER=$(openclaw --version 2>/dev/null || echo "unknown")
URL="${API_BASE}?token=${TOKEN}&v=${VER}"
exec curl -fsSL -X POST "$URL" -H 'Content-Type: application/json' -d '{}'
