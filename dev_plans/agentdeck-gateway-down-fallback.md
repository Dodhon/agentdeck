# AgentDeck Plan: Gateway down fallback (optional)

0) Executive Summary (5–10 lines)
Objective: make Gateway‑down behavior explicit and safe by providing an **optional file‑based fallback** with clear UI messaging and predictable error semantics. Decision needed: confirm whether fallback should be **opt‑in** via `OPENCLAW_GATEWAY_FALLBACK` (current env) or enabled by default when Gateway is unreachable, by **2026-02-04**. Problem: when the Gateway is enabled but unavailable, the UI can show empty sessions; the fallback path exists in code but requires clearer semantics, UI messaging, and validation coverage. Proposal: formalize fallback behavior, surface error state in UI, and document the expected env flags. Benefits: fewer “blank session list” failures, safer offline operation, and clearer debugging. Ask: approve fallback semantics so implementation can proceed.

1) End‑user context
- Primary user: Thupten (technical; may run AgentDeck while Gateway is down or restarting).
- Goal: still see sessions if possible and understand when data is stale or fallback.
- Constraint: local‑only; avoid surprising auto‑switches unless explicitly enabled.

2) Requirements `R1..Rn`
**User requirements**
- UR1: When Gateway is down, the UI shows a clear warning.
- UR2: If fallback is enabled, file‑based sessions appear instead of an empty list.
- UR3: The session list indicates its data source (gateway vs file).

**Functional requirements**
- R1: Preserve current env flag `OPENCLAW_GATEWAY_FALLBACK` as the toggle.
- R2: When Gateway errors occur, return `{ sessions, error }` with error text and source metadata.
- R3: Ensure fallback sessions are labeled `source: "file"` and include `agent` where possible.
- R4: Update README with fallback behavior and env description.

**Non‑functional requirements**
- NFR1: No additional Gateway calls when fallback is enabled (avoid retries loops).
- NFR2: Failure modes are explicit (HTTP 200 with error message and sessions list).

3) Non‑goals
- NG1: No automatic reconnection loop.
- NG2: No multi‑gateway support.
- NG3: No UI polling changes.

4) Success metrics (quantified)
- SM1: When Gateway is down and fallback enabled, sessions list is non‑empty within one refresh.
- SM2: When Gateway is down and fallback disabled, sessions list is empty and UI shows an error.
- SM3: 100% of fallback sessions include `source: "file"`.

5) Current repo state (repo‑grounded)
- `ops_board/lib/agents.js` already checks `OPENCLAW_GATEWAY_FALLBACK` and returns file sessions on error.
- `ops_board/public/app.js` displays `Gateway error: ...` when `error` is present.
- README documents `OPENCLAW_GATEWAY_FALLBACK` but does not define explicit behavior or UI semantics.

6) Architecture/system impact diagram (ASCII)
```
Gateway enabled?
   ├─ yes → sessions.list → normalize → (error?)
   │                     └─ if fallback → file sessions
   └─ no  → file sessions only

/api/agents -> UI warning + sessions list
```

7) Assumptions & constraints
- `OPENCLAW_GATEWAY_FALLBACK` already exists and is used as a boolean.
- File sessions are available via `AGENT_SESSIONS_PATH` or default path.
- Error states should not crash server; only adjust response payload.

8) Work breakdown `E1..En` mapping to `R*`
- E1 (R1–R3): Normalize fallback sessions with `source: "file"` and include `agent` label from file loader.
  - Touchpoints: `ops_board/lib/agents.js`, `ops_board/public/app.js` (display label if needed).
  - Owner: TBD. Window: by 2026-02-06.
- E2 (R2): Ensure API response always includes `error` text when fallback is used due to Gateway failure.
  - Touchpoints: `ops_board/lib/agents.js`.
  - Owner: TBD. Window: by 2026-02-06.
- E3 (R4): Update README with explicit fallback semantics and example env usage.
  - Touchpoints: `README.md`.
  - Owner: TBD. Window: by 2026-02-06.

9) Validation plan `V1..Vn` mapping to `R*` + success metrics
- V1 (SM1): Set `OPENCLAW_GATEWAY_ENABLED=1` and `OPENCLAW_GATEWAY_FALLBACK=1`, point Gateway URL to a closed port.
  - Pass if: `/api/agents` returns `error` plus file sessions with `source: "file"`.
- V2 (SM2): Same as V1 but `OPENCLAW_GATEWAY_FALLBACK=0`.
  - Pass if: `/api/agents` returns `error` and `sessions: []`.
- V3 (SM3): Inspect sessions list and verify all fallback sessions have `source: "file"`.

10) Risks & mitigations
- Risk: Users assume fallback data is live Gateway data.
  - Mitigation: UI warning + `source` label in metadata.
- Risk: Error message is noisy during normal operations.
  - Mitigation: only show error when Gateway fails and fallback is used/disabled.

11) Top 10 reader questions (with answers or explicit follow‑up)
1. Do we already have fallback? → Partial; this plan formalizes UI + docs + labels.
2. Will this change Gateway mode? → Only error handling.
3. Is fallback enabled by default? → Decision needed.
4. How do I know I’m seeing fallback data? → Error banner + `source: file` label.
5. Can I disable fallback? → Yes via `OPENCLAW_GATEWAY_FALLBACK=0`.
6. Will it retry automatically? → No (out of scope).
7. Is any data written? → No.
8. Does this affect send actions? → No change to `/api/agents/:id/send`.
9. What if file sessions are missing too? → Show empty list + error.
10. Does this require new env vars? → No.

12) Open questions
- Q1: Should fallback be opt‑in (current) or opt‑out?
- Q2: Should we surface a persistent UI badge indicating fallback mode?

13) Core PR vs Optional follow‑ups
**Core PR (must‑do)**
- Formalize fallback response semantics.
- Ensure source labeling for fallback sessions.
- Update README with explicit behavior.

**Optional follow‑ups**
- Add a persistent UI badge (e.g., “Fallback mode”).
- Add a manual “Retry Gateway” button.

14) Recommendation
- Keep fallback **opt‑in** via `OPENCLAW_GATEWAY_FALLBACK=1` to avoid silent mode switching.

15) Next steps
- Thupten: confirm fallback default behavior by **2026-02-04**.
- Clawd: implement once confirmed.

## Decision contracts
- Contract A (fallback default): fallback is opt‑in unless explicitly enabled.
- Contract B (error signaling): Gateway failure always returns `error` string in `/api/agents` response.
- Contract C (source labeling): fallback sessions must set `source: "file"`.

## Current vs proposed schema/interface
- Current: `/api/agents` may return `error` and either empty or fallback sessions depending on env; session `source` is not guaranteed for file fallback.
- Proposed: `/api/agents` always returns `error` on Gateway failure; fallback sessions are labeled `source: "file"` with agent label if available.

## State machine semantics (when applicable)
- Non‑terminal: `gateway_attempt` → `fallback_applied`.
- Terminal: `gateway_failed_no_fallback` or `gateway_failed_with_fallback`.
- Correction: user can enable fallback and re‑load to transition from `gateway_failed_no_fallback` to `gateway_failed_with_fallback`.

## WAF‑lite non‑functional posture
- Principals/auth boundary: unchanged (Gateway auth via env).
- Security/privacy/compliance: no new data paths.
- Reliability: explicit fallback mode improves resiliency.
- Ops/observability: UI warning and API error fields.
- Performance: no new polling or retries.
- Cost posture: zero external cost.

## Best‑practice references
- MDN WebSocket error/close events: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/error_event
- MDN WebSocket close event: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close_event
- OpenClaw Gateway docs (RPC over WS): https://docs.openclaw.ai/cli/gateway

## Ready for Execution
- [ ] Fallback default confirmed (opt‑in vs opt‑out).
- [ ] UI error messaging copy approved.
- [ ] Source labeling requirements accepted.
