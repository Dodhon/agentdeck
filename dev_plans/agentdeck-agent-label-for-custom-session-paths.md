# AgentDeck Plan: Agent label for custom sessions paths

0) Executive Summary (5–10 lines)
Objective: ensure sessions loaded from **custom `AGENT_SESSIONS_PATH`** are labeled with a stable agent name in the UI. Decision needed: confirm labeling strategy (explicit env var vs path inference) and whether the label should be required when a custom path is used, by **2026-02-04**. Problem: `ops_board/lib/agents.js` only infers agent names from the default `~/.openclaw/agents/<agent>` path; custom paths show no agent label, which degrades clarity in the sessions list. Proposal: add an explicit `AGENT_SESSIONS_LABEL` env var and expand path inference rules (parent directory name, `agents/<name>` patterns) to set `session.agent` consistently. Benefits: clearer UI, fewer ambiguous sessions, and more reliable filtering. Ask: approve the labeling policy so implementation can proceed.

1) End‑user context
- Primary user: Thupten (technical; sometimes points AgentDeck at non‑default session paths).
- Goal: always know which agent a session belongs to.
- Constraint: local‑only; minimal extra configuration.

2) Requirements `R1..Rn`
**User requirements**
- UR1: Sessions loaded from custom paths show a stable agent label.
- UR2: Labeling is deterministic and does not change between runs.

**Functional requirements**
- R1: Support an explicit `AGENT_SESSIONS_LABEL` env var that overrides inference.
- R2: If no explicit label is provided, infer label from path heuristics.
- R3: Propagate label to every session returned by `/api/agents`.

**Non‑functional requirements**
- NFR1: Backward compatible: default detection behavior remains for `~/.openclaw/agents/*`.
- NFR2: Clear error/warning when label cannot be inferred and no override is provided.

3) Non‑goals
- NG1: No new UI controls for editing labels.
- NG2: No changes to OpenClaw session schema.

4) Success metrics (quantified)
- SM1: 100% of sessions loaded from a custom path show a non‑empty `agent` label.
- SM2: Zero regressions in default detection path (existing `main`/`main2`).

5) Current repo state (repo‑grounded)
- `inferAgentNameFromPath()` only recognizes `~/.openclaw/agents/<agent>` in `ops_board/lib/agents.js`.
- `loadFileSessions()` uses `detectedAgentName` or `inferAgentNameFromPath()` and does **not** support an explicit override.
- UI in `ops_board/public/app.js` displays `session.agent` if present.

6) Architecture/system impact diagram (ASCII)
```
AGENT_SESSIONS_PATH + AGENT_SESSIONS_LABEL (env)
            │
            ▼
 agents.js (label inference/override)
            │
            ▼
     /api/agents -> UI
```

7) Assumptions & constraints
- `AGENT_SESSIONS_PATH` may point to a file or directory.
- Custom paths may be outside `~/.openclaw/agents` and may not encode agent name.
- Error state: if no label can be inferred and no override is set, return sessions with `agent: null` and `error` message.

8) Work breakdown `E1..En` mapping to `R*`
- E1 (R1): Add `AGENT_SESSIONS_LABEL` env override in `loadFileSessions()`.
  - Touchpoints: `ops_board/lib/agents.js`.
  - Owner: TBD. Window: by 2026-02-06.
- E2 (R2): Expand `inferAgentNameFromPath()` heuristics.
  - Heuristics: match `/.openclaw/agents/<name>`, `/agents/<name>/`, or parent dir name for `.../<agent>/sessions.json`.
  - Owner: TBD. Window: by 2026-02-06.
- E3 (R3): Ensure label is applied uniformly across all session objects.
  - Owner: TBD. Window: by 2026-02-06.

9) Validation plan `V1..Vn` mapping to `R*` + success metrics
- V1 (R1, SM1): Set `AGENT_SESSIONS_PATH=/tmp/custom/sessions.json` and `AGENT_SESSIONS_LABEL=custom`.
  - Pass if: `/api/agents` returns sessions with `agent: "custom"`.
- V2 (R2): Remove label env var and place file at `/tmp/agents/alpha/sessions.json`.
  - Pass if: `/api/agents` returns `agent: "alpha"`.
- V3 (NFR2): Use a custom path without label or inferable directory.
  - Pass if: sessions load and `error` contains a label warning.

10) Risks & mitigations
- Risk: Incorrect path heuristics label the wrong agent.
  - Mitigation: explicit override env var always wins.
- Risk: Multiple agents in a single sessions file.
  - Mitigation: out of scope; maintain label uniform per file.

11) Top 10 reader questions (with answers or explicit follow‑up)
1. Why not require a label for all custom paths? → Optional to keep setup minimal; warning if missing.
2. Will this affect default detection? → No; default detection remains unchanged.
3. What if I want multiple labels in one file? → Out of scope for this issue.
4. How is label chosen if both env + path exist? → Env var wins.
5. Does UI need updates? → No; it already displays `agent`.
6. Can I override per session? → Not in this scope.
7. Will this change Gateway behavior? → No; only file‑based sessions.
8. Where is the label stored? → In the session object returned by `/api/agents`.
9. Does this touch SQLite? → No.
10. Can we add docs? → Yes, in README (optional follow‑up).

12) Open questions
- Q1: Should we **require** `AGENT_SESSIONS_LABEL` when a custom path is used?
- Q2: Should we add a CLI flag instead of env var?

13) Core PR vs Optional follow‑ups
**Core PR (must‑do)**
- `AGENT_SESSIONS_LABEL` override.
- Path‑based inference improvements.
- Error messaging when label missing.

**Optional follow‑ups**
- README updates documenting the label override.
- UI badge styling for agent labels.

14) Recommendation
- Add `AGENT_SESSIONS_LABEL` override and keep inference as a best‑effort fallback.

15) Next steps
- Thupten: confirm whether `AGENT_SESSIONS_LABEL` is required for custom paths by **2026-02-04**.
- Clawd: implement once confirmed.

## Decision contracts
- Contract A (label precedence): `AGENT_SESSIONS_LABEL` overrides all inference.
- Contract B (inference scope): only filesystem path heuristics are used; no content sniffing.
- Contract C (error signaling): missing label triggers a warning but does not block session load.

## Current vs proposed schema/interface
- Current: `/api/agents` returns sessions with `agent` set only when inferred from `~/.openclaw/agents/<agent>`.
- Proposed: `/api/agents` sets `agent` from `AGENT_SESSIONS_LABEL` or path heuristics for any custom path.

## State machine semantics (when applicable)
Not applicable (label inference only).

## WAF‑lite non‑functional posture
- Principals/auth boundary: local filesystem; no external auth.
- Security/privacy/compliance: read‑only access to session files.
- Reliability: safe fallback if label missing.
- Ops/observability: warning string in `/api/agents` if label missing.
- Performance: O(n) per session list.
- Cost posture: zero external cost.

## Best‑practice references
- Node.js FS API (path + file checks): https://nodejs.org/api/fs.html
- Node.js Path API: https://nodejs.org/api/path.html
- GitHub Docs (README configuration guidance): https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes

## Ready for Execution
- [ ] Label policy confirmed (required vs optional).
- [ ] Env var name confirmed (`AGENT_SESSIONS_LABEL`).
- [ ] Inference heuristics accepted.
