#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${PORT:-3340}"
URL="${1:-http://127.0.0.1:${PORT}}"
DB_PATH="${DB_PATH:-$ROOT_DIR/ops_board/ops_board.browser-smoke.sqlite}"
REPORT_DIR="${REPORT_DIR:-$ROOT_DIR/reports/browser-smoke}"
SERVER_LOG="$REPORT_DIR/server.log"
SCREENSHOT_PATH="$REPORT_DIR/ops-board-smoke.png"

if ! command -v agent-browser >/dev/null 2>&1; then
  echo "agent-browser CLI is required but not installed."
  exit 1
fi

mkdir -p "$REPORT_DIR"

PORT="$PORT" DB_PATH="$DB_PATH" node "$ROOT_DIR/ops_board/server.js" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  agent-browser close >/dev/null 2>&1 || true
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS "$URL" >/dev/null

agent-browser open "$URL" >/dev/null
TITLE="$(agent-browser get title)"
SNAPSHOT="$(agent-browser snapshot -i)"

echo "$TITLE" | grep -q "AgentDeck Ops Board"
echo "$SNAPSHOT" | grep -q "Send Task"
echo "$SNAPSHOT" | grep -q "Search sessions"

agent-browser screenshot "$SCREENSHOT_PATH" >/dev/null
echo "Browser smoke test passed. Screenshot: $SCREENSHOT_PATH"
