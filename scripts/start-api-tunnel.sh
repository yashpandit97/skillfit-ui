#!/usr/bin/env bash
# Expose local API (port 8000) via a Cloudflare quick tunnel and update public/config.json.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLOUDFLARED="${ROOT}/../../.tools/cloudflared"
CONFIG="${ROOT}/public/config.json"
API_URL="${1:-http://127.0.0.1:8000}"
LOG="$(mktemp)"

if [[ ! -x "$CLOUDFLARED" ]]; then
  echo "cloudflared not found at $CLOUDFLARED"
  echo "Download: curl -fsSL -o $CLOUDFLARED https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 && chmod +x $CLOUDFLARED"
  exit 1
fi

curl -sf "${API_URL%/}/health" >/dev/null || {
  echo "API not reachable at $API_URL — start the backend first."
  exit 1
}

echo "Starting tunnel to $API_URL ..."
"$CLOUDFLARED" tunnel --url "$API_URL" 2>&1 | tee "$LOG" &
CF_PID=$!

cleanup() {
  kill "$CF_PID" 2>/dev/null || true
  rm -f "$LOG"
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 30); do
  TUNNEL_URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)"
  [[ -n "$TUNNEL_URL" ]] && break
  sleep 1
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "Timed out waiting for tunnel URL."
  exit 1
fi

printf '{\n  "apiBaseUrl": "%s/api"\n}\n' "$TUNNEL_URL" > "$CONFIG"
echo ""
echo "Tunnel:  $TUNNEL_URL"
echo "Updated: $CONFIG"
echo ""
echo "Redeploy UI:  cd skillfit-ui/skillfit-ui && npm run build && npx wrangler deploy"
echo "Keep this terminal open — tunnel dies when cloudflared stops."
echo ""

wait "$CF_PID"
