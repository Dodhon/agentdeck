# AgentDeck Plan: Merge sessions across all detected agents

0) Executive Summary (5–10 lines)
Objective: merge file‑based OpenClaw sessions across **all detected agents** so the AgentDeck UI can list every local session in one view. Decision needed: confirm merge semantics (dedupe strategy + ordering) and whether to include only `~/.openclaw/agents/*` or also allow additional search roots by **2026-02-04**. Problem: `ops_board/lib/agents.js` currently detects a single agent path (prefers `main`, then `main2`) and returns only one sessions file, which hides other local agents. Proposal: scan all agent directories under `~/.openclaw/agents`, load each `sessions.json`, normalize, label with agent name, and return a merged list with deterministic ordering and stable IDs. Benefits: complete local visibility, fewer “missing session” confusions, and consistent agent labels across the UI. Ask: approve the plan and merge semantics so implementation can proceed.

1) End‑user context
- Primary user: Thupten (technical, uses multiple OpenClaw agents and needs a single control surface).
- Goal: see every local agent session without manual path switching.
- Constraint: local‑only; no gateway required; must be deterministic and safe if files are missing.

2) Requirements `R1..Rn`
**User requirements**
- UR1: See sessions from all locally detected agents in one list.
- UR2: Each session clearly shows its agent label.
- UR3: Duplicates are prevented or clearly resolved.

**Functional requirements**
- R1: Detect **all** agent directories under `~/.openclaw/agents/` and load each `sessions.json` or `sessions/` directory.
- R2: Normalize each session with `agent` populated from the agent directory name.
- R3: Merge sessions into a single array with deterministic ordering (by `last_active` desc, fallback to `id`).
- R4: Ensure ID stability for merged sessions (no accidental collisions).

**Non‑functional requirements**
- NFR1: No crashes if an agent’s session file is missing or unreadable; return an error note and continue.
- NFR2: Merge should complete in <= 300ms for <= 500 sessions on a local machine.
- NFR3: Zero changes required to OpenClaw repos or config.

3) Non‑goals
- NG1: No Gateway changes (file‑based only).
- NG2: No session history expansion; only session list.
- NG3: No automatic refresh daemon.

4) Success metrics (quantified)
- SM1: 100% of session files under `~/.openclaw/agents/*/sessions.json` appear in UI within one refresh.
- SM2: UI renders merged list <= 2 seconds for <= 500 sessions (existing UI target).
- SM3: Zero duplicate IDs in the merged list.

5) Current repo state (repo‑grounded)
- Session loading is in `ops_board/lib/agents.js`.
  - `detectOpenClawSessionsPath()` returns **one** agent path, not all.
  - `loadFileSessions()` loads a single file and applies `inferAgentNameFromPath()`.
- UI renders `agent` if present in `ops_board/public/app.js`.

6) Architecture/system impact diagram (ASCII)
```
~/.openclaw/agents/*/sessions(.json)
          │
          ▼
  agents.js (multi‑scan + normalize + merge)
          │
          ▼
      /api/agents
          │
          ▼
      UI session list
```

7) Assumptions & constraints
- `~/.openclaw/agents/<agent>/sessions.json` exists for each agent (or `sessions/` directory).
- The per‑agent session records are JSON objects or `{ sessions: [...] }`.
- Path assumptions: use `os.homedir()` in `ops_board/lib/agents.js`.
- Error states: if a single agent file fails to parse, return a warning but include other agents.

8) Work breakdown `E1..En` mapping to `R*`
- E1 (R1): Add a multi‑agent discovery helper that returns all session paths + agent names.
  - Touchpoints: `ops_board/lib/agents.js`.
  - Owner: TBD. Window: by 2026-02-06.
- E2 (R2, R4): Normalize sessions with `{ id, agent, source }` and safe ID strategy.
  - Touchpoints: `ops_board/lib/agents.js`.
  - Owner: TBD. Window: by 2026-02-06.
- E3 (R3): Merge + order sessions deterministically.
  - Touchpoints: `ops_board/lib/agents.js`, `ops_board/public/app.js` (only if display tweaks needed).
  - Owner: TBD. Window: by 2026-02-07.

9) Validation plan `V1..Vn` mapping to `R*` + success metrics
- V1 (R1, SM1): Create two agent directories with sessions and verify `/api/agents` returns both.
  - Steps: set `OPENCLAW_GATEWAY_ENABLED=0`, hit `/api/agents`.
  - Pass if: sessions from both agents are returned with correct `agent` label.
- V2 (R3, SM3): Validate no duplicate IDs.
  - Steps: log `new Set(sessions.map(s => s.id)).size`.
  - Pass if: set size equals sessions length.
- V3 (NFR1): Corrupt one agent’s JSON and verify others still load with error warning.
  - Pass if: `/api/agents` includes `error` but still includes other agents.

10) Risks & mitigations
- Risk: ID collisions across agents (same `id` reused).
  - Mitigation: namespace IDs with `agent` when collision detected (decision contract below).
- Risk: Mixed session file shapes.
  - Mitigation: keep existing tolerant parsing (`parseFirstJsonObject`) and add per‑file error isolation.

11) Top 10 reader questions (with answers or explicit follow‑up)
1. Will this change any OpenClaw files? → No, read‑only.
2. How do we avoid duplicate IDs? → See Decision Contract A.
3. What if an agent has no sessions file? → Skip with warning; continue.
4. Will this be slower? → Target <= 300ms for <= 500 sessions.
5. How is ordering decided? → `last_active` desc, then `id`.
6. Does this affect Gateway mode? → No, only file‑based load path.
7. Can we include custom paths too? → Out of scope here; see Issue #36 plan.
8. Will UI changes be required? → Minimal; existing UI already shows `agent`.
9. What if file contains multiple JSON objects? → Existing parser extracts first JSON object.
10. Can we disable multi‑agent merging? → If needed, add env flag (TBD).

12) Open questions
- Q1: Should we namespace **all** IDs with `agent:` or only on collisions?
- Q2: Should the discovery search only `~/.openclaw/agents/*` or also support extra roots?

13) Core PR vs Optional follow‑ups
**Core PR (must‑do)**
- Multi‑agent discovery and merged session list.
- Deterministic ordering and ID collision policy.
- Error isolation per agent file.

**Optional follow‑ups**
- Add per‑agent summary counts in UI.
- Add a `source` badge for file‑based sessions.

14) Recommendation
- Namespace IDs only on collision (minimizes disruption), and keep ordering by `last_active` desc.

15) Next steps
- Thupten: confirm ID collision policy and discovery scope by **2026-02-04**.
- Clawd: draft implementation once confirmed.

## Decision contracts
- Contract A (ID semantics): session IDs remain unchanged unless a collision is detected; collisions are resolved by prefixing `${agent}:`.
- Contract B (ordering): sessions ordered by `last_active` desc, then `id` asc.
- Contract C (scope): only `~/.openclaw/agents/*` is scanned in v1 unless explicitly expanded.

## Current vs proposed schema/interface
- Current: `/api/agents` returns sessions from a **single** detected agent path.
- Proposed: `/api/agents` returns a merged list across all detected agent paths, with `agent` set for each session.

## State machine semantics (when applicable)
Not applicable (read‑only list aggregation).

## WAF‑lite non‑functional posture
- Principals/auth boundary: local filesystem only; no external auth.
- Security/privacy/compliance: read‑only access to `~/.openclaw/agents`.
- Reliability: per‑file error isolation; never crash on one bad file.
- Ops/observability: surface a warning string in `/api/agents` when a file fails.
- Performance: O(n) scan; <= 300ms for <= 500 sessions.
- Cost posture: zero external cost.

## Best‑practice references
- Node.js FS API (file reads): https://nodejs.org/api/fs.html
- Node.js Path API: https://nodejs.org/api/path.html
- Node.js Errors (error handling): https://nodejs.org/api/errors.html

## Ready for Execution
- [ ] ID collision policy confirmed (namespace on collision vs always).
- [ ] Discovery scope confirmed (only `~/.openclaw/agents/*` vs expanded roots).
- [ ] Performance target accepted (<= 300ms for <= 500 sessions).
