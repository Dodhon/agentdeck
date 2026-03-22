# AgentDeck

Local-first personal ops board with a minimal web UI, snapshotting, and agent
action logging.

## Requirements
- Node.js 18+

## Setup
```bash
npm install
```

## Configure source paths
The ingest scripts read from your clawd workspace. Provide one of:
- `SOURCE_ROOT` (preferred)
- or explicit flags: `--briefly-dir`, `--mission-control-dir`, `--memory-file`

Example:
```bash
export SOURCE_ROOT="/Users/thuptenwangpo/clawd"
```

## Configuration summary
Required (ingest/snapshot):
- `SOURCE_ROOT` or CLI flags (`--briefly-dir`, `--mission-control-dir`, `--memory-file`)

Optional:
- `AGENT_SESSIONS_PATH`: path to sessions JSON or a directory containing `sessions.json`
- `DB_PATH`: override SQLite file (default `ops_board/ops_board.sqlite`)
- `PORT`: UI port (default `3333`)
- `OPENCLAW_GATEWAY_ENABLED`: set to `1` to use the Gateway as session source
- `OPENCLAW_GATEWAY_URL`: Gateway WS URL (example `ws://127.0.0.1:18789`)
- `OPENCLAW_GATEWAY_TOKEN`: Gateway token (preferred)
- `OPENCLAW_GATEWAY_PASSWORD`: Gateway password (fallback)
- `OPENCLAW_GATEWAY_SCOPES`: comma-separated scopes (default `operator.read,operator.write`)
- `OPENCLAW_GATEWAY_FALLBACK`: set to `1` to fallback to file sessions on errors
- `OPENCLAW_SESSION_ID_FIELD`: required session id field path for normalization
- `OPENCLAW_SESSION_TITLE_FIELD`: optional title field path
- `OPENCLAW_SESSION_AGENT_FIELD`: optional agent field path
- `OPENCLAW_SESSION_LAST_MESSAGE_FIELD`: optional last message field path
- `OPENCLAW_SESSION_LAST_ACTIVE_FIELD`: optional last active field path
- `OPENCLAW_CHAT_SEND_SESSION_FIELD`: session field name for `chat.send` (default `sessionKey`)
- `OPENCLAW_CHAT_SEND_MESSAGE_FIELD`: message field name for `chat.send` (default `message`)

Example:
```bash
export SOURCE_ROOT="/Users/thuptenwangpo/clawd"
export AGENT_SESSIONS_PATH="/Users/thuptenwangpo/.openclaw/agents/main/sessions"
export DB_PATH="/Users/thuptenwangpo/Documents/GitHub/agentdeck/ops_board/ops_board.sqlite"
export PORT=3333
export OPENCLAW_GATEWAY_ENABLED=1
export OPENCLAW_GATEWAY_URL="ws://127.0.0.1:18789"
export OPENCLAW_GATEWAY_TOKEN="your-token"
export OPENCLAW_SESSION_ID_FIELD="id"
export OPENCLAW_SESSION_TITLE_FIELD="title"
export OPENCLAW_SESSION_LAST_MESSAGE_FIELD="last_message"
```

## Run ingest + snapshot
```bash
npm run ingest:dry
npm run snapshot
```

Snapshots are written to `reports/ops-board/YYYY-MM-DD.json`.

## Start the UI
```bash
npm start
```
Open `http://localhost:3333`.

## Agent sessions
The UI reads sessions from a JSON file. By default:
`ops_board/agent/sessions.json`

If OpenClaw is installed, AgentDeck will automatically look for
`~/.openclaw/agents/<agent>/sessions` (preferring `main`, then `main2`) before
falling back to the repo default. Set `AGENT_SESSIONS_PATH` to override.

To point at a different file:
```bash
export AGENT_SESSIONS_PATH="/path/to/sessions.json"
```

Example format:
```json
{
  "sessions": [
    {
      "id": "session-123",
      "title": "Daily ops",
      "last_message": "Working on ingest.",
      "history": [
        { "role": "assistant", "content": "Task received." }
      ]
    }
  ]
}
```

## Gateway sessions
To use the OpenClaw Gateway as the session source, enable it and provide the
session field mapping you want to normalize from the live Gateway response.
Gateway auth is sent on connect as `connect.params.auth.token` or `.password`.

Minimal example:
```bash
export OPENCLAW_GATEWAY_ENABLED=1
export OPENCLAW_GATEWAY_URL="ws://127.0.0.1:18789"
export OPENCLAW_GATEWAY_TOKEN="your-token"
export OPENCLAW_SESSION_ID_FIELD="id"
```

## Validate
```bash
npm run validate
```

## UI testing
Run Playwright regression tests:
```bash
npx playwright install chromium
npm run test:e2e
```

Run browser automation smoke checks (requires `agent-browser` CLI):
```bash
npm run test:browser:smoke
```

## Mission Control web app (Next.js + Convex)
Phase 1 implementation lives in `web/`.

Install:
```bash
cd web
npm install
```

Run:
```bash
npm run dev -- --port 4100
```
Open `http://127.0.0.1:4100`.

Web validation gates:
```bash
npm run web:convex:schema:check
npm run web:test:tasks
npm run web:test:scheduler
npm run web:test:memory
npm run web:test:e2e
npm run web:test:browser:smoke
```
