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
