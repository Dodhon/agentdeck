#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-4101}"
URL="${1:-http://127.0.0.1:${PORT}}"
REPORT_DIR="${REPORT_DIR:-$ROOT_DIR/reports/browser-smoke}"
SERVER_LOG="$REPORT_DIR/server.log"
SCREENSHOT_PATH="$REPORT_DIR/mission-control-smoke.png"

if ! command -v agent-browser >/dev/null 2>&1; then
  echo "agent-browser CLI is required but not installed."
  exit 1
fi

mkdir -p "$REPORT_DIR"

npm run dev -- --port "$PORT" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  agent-browser close >/dev/null 2>&1 || true
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS "$URL" >/dev/null

agent-browser open "$URL" >/dev/null
TITLE="$(agent-browser get title)"
SNAPSHOT="$(agent-browser snapshot -i)"

echo "$TITLE" | grep -q "AgentDeck Mission Control"
echo "$SNAPSHOT" | grep -q "Tasks Board"
echo "$SNAPSHOT" | grep -q "Content Pipeline"
echo "$SNAPSHOT" | grep -q "Calendar"

agent-browser screenshot "$SCREENSHOT_PATH" >/dev/null
echo "Mission Control browser smoke passed. Screenshot: $SCREENSHOT_PATH"
