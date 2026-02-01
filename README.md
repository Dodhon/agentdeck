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

Example:
```bash
export SOURCE_ROOT="/Users/thuptenwangpo/clawd"
export AGENT_SESSIONS_PATH="/Users/thuptenwangpo/.openclaw/agents/main/sessions"
export DB_PATH="/Users/thuptenwangpo/Documents/GitHub/agentdeck/ops_board/ops_board.sqlite"
export PORT=3333
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

## Validate
```bash
npm run validate
```
