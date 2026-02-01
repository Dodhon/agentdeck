# AgentDeck: OpenClaw Gateway API integration for multi-session control

0) Executive Summary (5–10 lines)
Objective: design and ship Gateway API–backed multi-session management in AgentDeck so one UI can list, filter, and safely message multiple OpenClaw sessions. Decision needed: confirm session identity strategy and scope of initial controls (list + send only vs include history/abort) by **2026-02-04**. Dispatch uses Gateway WebSocket RPC `chat.send`. Problem: AgentDeck currently reads a static sessions.json and logs “send” actions locally without dispatching to OpenClaw, which blocks true multi-session control. Proposal: add a Gateway WebSocket client + session ingestion from the Gateway, unify session metadata, add UI filters/search, and wire send actions to real `chat.send` (with confirmation + audit log). Benefits: one control surface for all sessions across agents (main/main2/etc), accurate session state, and verified dispatch. Ask: approve the plan and new issues so implementation can proceed without touching the OpenClaw repo.

1) End‑user context
- Primary user: Thupten (technical, prefers concise, autonomous execution).
- Goals: manage multiple OpenClaw sessions from AgentDeck; safely dispatch tasks; keep auditability.
- Constraints: local-first; no changes to OpenClaw repo; minimize extra auth/config steps.

2) Requirements `R1..Rn`
**User requirements**
- UR1: See all active sessions across agents (main/main2/subplan) in one list.
- UR2: Search/filter sessions by agent, title, and recent activity.
- UR3: Send a task to a selected session with explicit confirmation and audit trail.
- UR4: Use Gateway API as the source of truth (no manual session file updates). Multi‑gateway is explicitly deferred.

**Functional requirements**
- R1: Add a Gateway WebSocket RPC client to list sessions (`sessions.list`).
- R2: Normalize Gateway session records into a UI-friendly schema (id, title, agent, last_message, last_active, source).
- R3: Implement message dispatch via Gateway RPC (`chat.send`) and record the action in SQLite.
- R4: Provide UI filters + search over sessions and items.
- R5: Add config/env for Gateway URL + auth token/password.
- R6: Maintain compatibility with file-based sessions for fallback (optional, off by default). Multi-gateway support is out of scope for v1.

**Non‑functional requirements**
- NFR1: No OpenClaw repo changes required.
- NFR2: UI session list loads in <= 2 seconds with <= 500 sessions.
- NFR3: Actions are explicit and auditable (every send logged with timestamp + session id).
- NFR4: If the Gateway is unreachable, UI shows a clear error and continues to show file-based sessions (if enabled).

3) Non‑goals
- NG1: No multi-tenant or remote-user access control beyond Gateway auth.
- NG2: No background agents or auto-dispatch.
- NG3: No changes to OpenClaw’s internal session storage or schemas.
- NG4: No agent run orchestration beyond “send message”.

4) Success metrics (quantified)
- SM1: 100% of sessions in Gateway appear in AgentDeck within 10 seconds of refresh.
- SM2: Session list renders in <= 2 seconds for <= 500 sessions (local machine).
- SM3: 100% of “send” actions create a SQLite audit entry and a corresponding Gateway runId.
- SM4: Zero manual edits required to keep session list current.

5) Current repo state (repo‑grounded)
- UI and API live in `ops_board/server.js` and `ops_board/public/app.js`.
- Sessions are loaded from a file or directory via `ops_board/lib/agents.js` (env: `AGENT_SESSIONS_PATH`).
- `/api/agents/:id/send` only records an action to SQLite (`ops_board/lib/storage.js`), no Gateway dispatch.
- DB defaults to `ops_board/ops_board.sqlite` (`defaultDbPath()` in `ops_board/lib/storage.js`).
- README already documents `AGENT_SESSIONS_PATH`, `DB_PATH`, and `PORT` (root `README.md`).

6) Architecture/system impact diagram (ASCII)
```
AgentDeck UI (browser)
   ├─ /api/agents  ───────────────┐
   ├─ /api/agents/:id/send        │
   └─ /api/items                  │
                                 ▼
                       AgentDeck API (Express)
                         ├─ Gateway WS RPC client
                         │     ├─ sessions.list
                         │     └─ chat.send
                         ├─ Sessions normalizer
                         └─ SQLite audit log (actions)
                                 │
                                 ▼
                         OpenClaw Gateway (WS)
```

7) Assumptions & constraints
- Gateway is reachable at `ws://127.0.0.1:18789` (configurable).
- Gateway auth token is available and can be stored as env var (not hardcoded).
- No edits to OpenClaw repo are required.
- Path assumptions: AgentDeck uses `__dirname` for `ops_board/public` and `ops_board/agent/sessions.json`; DB path defaults to `ops_board/ops_board.sqlite`.
- Data directories: SQLite file is created if missing; snapshot output dir is created by `snapshot.js`.
- Error states: if Gateway is unreachable, return `{ sessions: [], error }` and render a warning.

8) Work breakdown `E1..En` mapping to `R*`
- E1 (R1, R5): Implement Gateway WebSocket RPC client (single Gateway only).
  - Artifacts: `ops_board/lib/gateway.js` (new), config schema in README.
  - Touchpoints: `ops_board/server.js` (inject client), env vars.
  - Owner: TBD. Window: by 2026-02-06.
- E2 (R2, R6): Normalize + merge sessions (Gateway primary, file fallback optional).
  - Artifacts: `ops_board/lib/agents.js` updates, session schema doc.
  - Owner: TBD. Window: by 2026-02-07.
- E3 (R3, NFR3): Wire `/api/agents/:id/send` to Gateway `chat.send` and log action + runId.
  - Artifacts: updated route handler + action payload contract.
  - Owner: TBD. Window: by 2026-02-08.
- E4 (R4, NFR2): Add filters + search in UI (agent/profile/source + query).
  - Artifacts: UI controls + client filtering; optional server-side query for large lists.
  - Owner: TBD. Window: by 2026-02-09.
- E5 (R5): Document configuration variables and safe auth handling.
  - Artifacts: README updates + `.env.example` (if adopted).
  - Owner: TBD. Window: by 2026-02-10.

9) Validation plan `V1..Vn` mapping to `R*` + success metrics
- V1 (R1, SM1): With Gateway running, call `/api/agents` and verify it returns non-empty sessions and includes `source: "gateway"`.
  - Steps: start server, open `/api/agents` in browser.
  - Pass if: sessions list includes Gateway sessions within 10 seconds.
- V2 (R3, SM3): Send a test message to a session; confirm Gateway response includes `runId` and action recorded in SQLite.
  - Steps: select session, send message, query `actions` table or check snapshot.
  - Pass if: action row contains session_id, message, runId, timestamp.
- V3 (R4, SM2): Load UI with >= 200 sessions (synthetic or real) and measure render time.
  - Pass if: UI renders in <= 2 seconds.
- V4 (R5, NFR4): Simulate Gateway down; verify UI shows a warning and optionally uses file-based sessions.
  - Pass if: warning present and no crash.

10) Risks & mitigations
- Risk: Gateway WS auth/token handling is unclear.
  - Mitigation: document env vars; use same token as Control UI; support password auth if token missing.
- Risk: API surface changes (RPC method names).
  - Mitigation: encapsulate in `gateway.js` with clear error messages.
- Risk: Latency or large session lists degrade UI.
  - Mitigation: client-side debounce + optional server-side filtering/pagination.

11) Top 10 reader questions (with answers or explicit follow‑up)
1. Do we need to edit OpenClaw repo? → No. We integrate via the Gateway WebSocket RPC.
2. What auth is required? → Use the Gateway token/password (same as Control UI).
3. What if the Gateway is down? → UI shows warning; optional fallback to file sessions.
4. How are sessions identified? → Use Gateway session key as primary id; store agent/profile in metadata.
5. Can we see session history? → Not in v1; optional follow‑up (sessions.history).
6. How is safety enforced? → Confirmation dialog + audit log for every send.
7. Does this conflict with existing `AGENT_SESSIONS_PATH`? → Gateway becomes primary; file path is fallback.
8. Is it secure to store token? → Use env vars; avoid committing secrets.
9. How will we test without real sessions? → Provide a mock sessions JSON and a fake Gateway response mode.
10. Will this affect ingest/snapshot? → No changes required beyond logging actions with runId.

12) Open questions
- Q1: Should session history be in scope for MVP?
- Q2: Should file-based fallback be enabled by default or opt-in?

13) Core PR vs Optional follow‑ups
**Core PR (must‑do)**
- Gateway WS client + config env vars.
- Sessions list from Gateway + normalized schema.
- Real `send` dispatch + audit log with runId.
- UI filters/search for sessions.
- Documentation update (config + usage).

**Optional follow‑ups**
- Session history panel (RPC: sessions.history/chat.history).
- Abort/stop run actions.
- Multiple gateway support (profiles per gateway).
- Export/share snapshot (Issue #25).

14) Recommendation
- Proceed with Gateway WebSocket RPC integration (`chat.send`) as the single source of truth for sessions.
- Keep file-based sessions as a fallback only (disabled by default).
- Scope v1 to list + send + audit log; defer history/abort and multi‑gateway support to follow‑ups.

15) Next steps
- Thupten: confirm whether session history is in scope and whether file-based fallback should be opt-in by **2026-02-04**.
- Clawd: create issues and prepare implementation branch after approval.

## Decision contracts
- Contract A (workflow semantics): “Send” is an explicit user action, always confirmed, and always logged with runId; no auto-send.
- Contract B (source of truth): Gateway session list is authoritative; file-based sessions are fallback only.
- Contract C (release/deploy): AgentDeck releases do not require OpenClaw changes; rollback means disabling Gateway integration via env.

## Current vs proposed schema/interface
- Current: `/api/agents` returns file-sourced sessions from `AGENT_SESSIONS_PATH`.
- Proposed: `/api/agents` returns Gateway-sourced sessions (primary) plus optional file-sourced sessions (fallback), each with `source` and `agent` metadata.
- Current: `/api/agents/:id/send` logs to SQLite only.
- Proposed: `/api/agents/:id/send` calls Gateway RPC and logs `{ session_id, message, runId }`.

## State machine semantics (send action)
- Non-terminal states: `queued` → `sent` → `acknowledged` (runId received).
- Terminal states: `failed` (RPC error) or `acknowledged` (runId received).
- Correction rule: if a send fails, the UI should surface the error and allow re-send; failed sends remain in the audit log with error detail.

## WAF‑lite non‑functional posture
- Principals/auth boundary: Gateway token/password in env; no embedded secrets in repo.
- Security/privacy/compliance: local-only; no data leaves host; audit log stored locally.
- Reliability: clear error states and fallback to file sessions (optional).
- Ops/observability: log Gateway connection errors to console and surface in UI.
- Performance: list rendering <= 2 seconds for 500 sessions.
- Cost posture: zero external cost for core functionality.

## Best‑practice references
- OpenClaw Control UI (Gateway WS + RPC methods list): https://docs.openclaw.ai/web/control-ui
- OpenClaw Gateway CLI (RPC over WebSocket): https://docs.openclaw.ai/cli/gateway
- OpenClaw Gateway security considerations: https://docs.openclaw.ai/gateway/security

## Issue incorporation + new issue proposals
**Existing issues to keep (from repo):**
- #24 Add filters + search in the UI (becomes part of E4).
- #22 Document configuration variables (E5).
- #21 Improve dev workflow docs (out-of-scope for core but can be bundled).
- #20 Add screenshots + short demo GIF to README (optional follow-up).
- #19 Document snapshot data contract + add sample JSON (already partially in README).
- #25 Add snapshot export/share (optional follow-up).

**New issues to create (recommended):**
1) **Gateway WS client + config**
   - Summary: Add Gateway WS RPC client with env-configured URL/auth.
   - Acceptance: `/api/agents` returns sessions from Gateway; errors handled.
2) **Session normalization + metadata**
   - Summary: Normalize Gateway sessions with agent/profile/source fields.
   - Acceptance: UI shows agent/source labels; session id stable.
3) **Gateway dispatch + audit log**
   - Summary: Wire send action to Gateway RPC and record runId.
   - Acceptance: Action recorded with runId; Gateway receives message.
4) **Gateway down fallback (optional)**
   - Summary: Optional fallback to file-based sessions if Gateway unreachable.
   - Acceptance: UI warning + fallback sessions rendered when enabled.

## Ready for Execution
- [ ] Gateway URL/auth config agreed (`OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_TOKEN` or password).
- [ ] Issue list approved (existing + new).
- [ ] Success metrics accepted (SM1–SM4).
- [ ] No OpenClaw repo changes required (confirmed).
- [ ] Multi‑gateway explicitly deferred.
