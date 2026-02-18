# AgentDeck Mission Control Phase 1 Implementation (Next.js + Convex)

Plan level: L1  
Domains: frontend/UI, backend/API/DB, E2E/browser automation, AI-agent orchestration  
Skill hooks: `$planning`  
Hook rationale: scope request was to "make the plan for the next part" immediately after merging planning/test-gate work, so this plan defines the next executable implementation slice.

0) Executive summary (context, problem, proposal, benefits, ask)
Objective: implement the first executable migration slice from legacy Express + SQLite into a Next.js + Convex Mission Control while preserving current daily operability.  
Problem: the repo now has planning + UI test gates, but no Next.js/Convex runtime yet; the article-style Mission Control cannot run from current code alone.  
Proposal: deliver a Phase 1 implementation PR that introduces a `web/` Next.js + Convex app with four core surfaces (`/tasks`, `/scheduler`, `/memory`, `/activity`), schema/contracts, and legacy-safe coexistence.  
Benefits: unlocks article-aligned Mission Control foundation with typed contracts, real-time data model, and migration safety.  
Decision/ask: approve this Phase 1 implementation scope and execution order for the next coding PR.

1) End-user context
- Primary user: Thupten (single-operator, high-agency workflow, fast verification loops).
- Operating style: uses OpenClaw as a proactive operator; needs visibility over tasks, scheduling, and memory traceability.
- UX priority: operational correctness > polish for this phase.
- Working mode: local-first dev, with acceptance gates before cutover.

2) Requirements (`R1..Rn`)
### User requirements
- UR1: launch a Next.js Mission Control app locally without breaking current ops-board flow.
- UR2: track work by canonical task IDs and deterministic task states.
- UR3: verify scheduled work and run outcomes in one scheduler surface.
- UR4: search memory with source citations.
- UR5: see cross-entity mutation history in an activity timeline.

### Functional requirements
- R1: scaffold `web/` Next.js App Router + TypeScript + Convex integration.
- R2: create Convex schema and typed functions for `tasks`, `taskEvents`, `jobs`, `jobRuns`, `memoryDocs`, `memoryChunks`, `activityLog`.
- R3: implement `/tasks` CRUD + state transitions with server-side guardrails.
- R4: implement `/scheduler` CRUD + run history + run-now trigger contract.
- R5: implement `/memory` list/search (text-first in Phase 1, semantic hook point for next increment).
- R6: implement `/activity` unified mutation log.
- R7: add legacy-to-new data bridge action (read-only import path from SQLite snapshot data where applicable).
- R8: preserve current Express app runnable during migration (strangler path).
- R9: enforce UI gates on changed surfaces with Playwright and browser smoke automation.

### Non-functional requirements
- NFR1 Reliability: no silent write failures; errors are surfaced with actionable messages.
- NFR2 Auditability: all write mutations produce an activity row with actor + timestamp + summary.
- NFR3 Consistency: constrained state transitions only (no ad hoc statuses).
- NFR4 Performance: list views load p95 <= 1.5s in local dev with representative seed data.
- NFR5 Safety: destructive actions require explicit confirmation + server authorization checks.
- NFR6 Operability: health panel indicators for failed jobs, stale memory index, and blocked tasks.

2.1) Goals
- G1: stand up a working `web/` Next.js + Convex runtime in this repo.
- G2: deliver core Mission Control routes (`/tasks`, `/scheduler`, `/memory`, `/activity`) with typed server contracts.
- G3: maintain legacy UI operability until acceptance-based cutover.
- G4: enforce deterministic verification using Playwright + browser smoke automation.

3) Non-goals
- NG1: content-pipeline UI (Phase 2).
- NG2: team-structure UI (Phase 2).
- NG3: digital office/avatar simulation (Phase 3).
- NG4: multi-tenant org/auth model beyond single-operator scope.
- NG5: replacing every legacy script in this phase.

4) Success metrics (quantified)
- SM1: local startup for `web/` app succeeds in <= 60s on warm deps.
- SM2: 100% of task/job/memory mutations emit activity records (validated by audit script).
- SM3: scheduler run writes exactly one terminal status row per attempt.
- SM4: >= 95% of memory search acceptance queries return source path/snippet citation.
- SM5: UI verification gates pass on PR (`test:e2e` + `test:browser:smoke`).

5) Current repo state (repo-grounded)
- `package.json` currently runs legacy server/scripts and now includes UI verification scripts (`test:e2e`, `test:browser:smoke`), but has no Next.js/Convex scripts yet.
- `ops_board/server.js` is the active Express API+static host with task status updates and agent send action logging.
- `ops_board/public/app.js` contains current board UI logic (Today/Next/Done + agents list/filter/send).
- `playwright.config.js` and `tests/e2e/ops-board.spec.js` validate the legacy UI path.
- `dev_plans/agentdeck-mission-control-nextjs-convex-v1.md` defines v1 architecture/scope and now includes UI quality gates.

6) Architecture/system impact diagram (ASCII)
### Runtime dataflow (logical)
```text
OpenClaw events / file memory / scheduler triggers
                │
                ▼
        Next.js app (`web/`)
  /tasks  /scheduler  /memory  /activity
                │
                ▼
       Convex functions (queries/mutations/actions)
                │
                ▼
      Convex DB collections + derived read models
                │
                ├── activity log timeline
                └── health indicators

Legacy path retained in parallel:
Express (`ops_board/server.js`) + SQLite (`ops_board/ops_board.sqlite`)
```

### Provisioning/deployment (resource)
```text
Developer machine
  ├─ repo worktree
  ├─ Node runtime
  ├─ Next.js dev server (`web/`)
  └─ browser test runners (Playwright + agent-browser)

Convex project (dev)
  ├─ schema/functions
  ├─ env/config secrets
  └─ cloud-hosted data
```

Resource checklist
- Compute runtime: local Node + Next.js dev runtime.
- Ingress: local HTTP for dev; Convex endpoint for function calls.
- Auth/identity: single-operator auth boundary for mutations.
- Secrets/config: `.env.local` in `web/` for Convex/project config.
- Data store: Convex collections; SQLite as migration source only.
- Observability: activity log + test artifacts + browser smoke screenshot.
- Permissions/RBAC: mutation authorization gate in Convex functions.

7) Assumptions and constraints
- Stack is fixed: Next.js App Router + Convex + TypeScript for new Mission Control work.
- Legacy Express app must stay runnable through this phase.
- `REPO_ROOT` is derived via `git rev-parse --show-toplevel`; all commands use repo-relative paths.
- New app root will be `web/` to avoid disruptive in-place conversion of legacy root scripts.
- Semantic search provider remains deferred; Phase 1 delivers text search + citation contract first.
- No secrets committed to repo.

8) Stateful decision contracts and schema/interface posture
### 8.1 Decision contract (terminal vs non-terminal outcomes)
- Task states:
  - Non-terminal: `backlog`, `ready`, `in_progress`, `blocked`
  - Terminal: `done`, `archived`
- Job run states:
  - Non-terminal: `queued`, `running`
  - Terminal: `success`, `failed`, `timeout`, `canceled`
- Memory ingest states:
  - Non-terminal: `discovered`, `indexing`
  - Terminal: `indexed`, `ingest_failed`

### 8.2 State transition matrix (invalid-transition behavior)
- `backlog -> ready|in_progress|archived` allowed.
- `ready -> in_progress|blocked|archived` allowed.
- `in_progress -> blocked|done|archived` allowed.
- `blocked -> ready|in_progress|archived` allowed.
- `done -> in_progress` allowed only with `reopenedReason`.
- Any other transition: rejected by mutation with structured error payload.

### 8.3 Current vs proposed schema/interface differences
- Current:
  - Express endpoints: `/api/items`, `/api/items/:id/status`, `/api/agents`, `/api/agents/:id/send`.
  - SQLite-backed storage + static UI.
- Proposed (Phase 1):
  - Next.js routes: `/tasks`, `/scheduler`, `/memory`, `/activity`.
  - Convex schema: `tasks`, `taskEvents`, `jobs`, `jobRuns`, `memoryDocs`, `memoryChunks`, `activityLog`.

### 8.4 Idempotency and conflict handling
- Idempotency scope: all ingest and scheduler-run creation mutations.
- Contract: retries must reuse idempotency key and avoid duplicate terminal rows.
- Conflict handling: return canonical existing record when same key is replayed.
- Retention window: keep idempotency keys for at least 30 days in Phase 1.

### 8.5 Source-of-truth vs projection model
- Source of truth (post-cutover target): Convex collections.
- Projections: dashboard list summaries and health counts derived from canonical collections.
- Deterministic rebuild: projection recomputed from canonical events/rows, not manual edits.

### 8.6 DB-level constraints (Convex schema expectations)
- Required fields for all core entities (`createdAt`, `updatedAt`, status enums where applicable).
- Uniqueness:
  - `tasks`: unique logical ID.
  - `jobRuns`: uniqueness on (`jobId`, `attempt`) to prevent duplicate attempt rows.
- Index strategy:
  - `tasks` by status/updatedAt.
  - `jobs` by enabled/nextRunAt.
  - `memoryChunks` by docId/chunkIndex.
  - `activityLog` by createdAt/entityType.

### 8.7 Identity trust boundary and governance posture
- UI display identity (agent labels/session titles) is not authoritative.
- Authoritative principal for mutations is server-validated actor context.
- Data minimization: store only required task/schedule/memory metadata + citations.
- Redaction: prevent secret/token values from being persisted in memory/activity payloads.
- Access boundary: single-operator scope in this phase.

### 8.8 Schema-presence gate (required before functional coding)
- First check (to be added in this PR): `cd "$(git rev-parse --show-toplevel)/web" && npm run convex:schema:check`
- Expected output: confirms all required collections exist.
- Blocked path if missing: do not proceed with UI mutation wiring; finish schema setup first.

9) Work breakdown (`E1..En`) mapped to `R*`
- E1 (R1, R8): scaffold `web/` Next.js + TS + Convex baseline and keep legacy root scripts intact.
  - Owner: Clawd.
  - Target: 2026-02-19.
- E2 (R2, R3, R6): implement Convex schema + tasks/activity functions + `/tasks` route.
  - Owner: Clawd.
  - Target: 2026-02-20.
- E3 (R2, R4, R6): implement jobs/jobRuns schema + `/scheduler` route + run-now mutation contract.
  - Owner: Clawd.
  - Target: 2026-02-21.
- E4 (R2, R5, R6): implement memory docs/chunks + `/memory` route with citation-first search.
  - Owner: Clawd.
  - Target: 2026-02-21.
- E5 (R6, R7): implement `/activity` route and legacy ingest/backfill bridge action.
  - Owner: Clawd.
  - Target: 2026-02-22.
- E6 (R9, NFR1-6): extend Playwright and browser-smoke flows for new `web/` routes and health paths.
  - Owner: Clawd.
  - Target: 2026-02-22.

10) Validation plan (`V1..Vn`) mapped to `R*`
- V1 (R1, R8): scaffold sanity.
  - Command (to be added in this PR): `cd "$(git rev-parse --show-toplevel)/web" && npm run dev`
  - Pass: app boot succeeds; legacy `npm start` still works from repo root.
- V2 (R2, R3, R6): tasks transitions + activity log coupling.
  - Command (to be added in this PR): `cd "$(git rev-parse --show-toplevel)/web" && npm run test:tasks`
  - Pass: each task mutation writes exactly one corresponding activity row.
- V3 (R2, R4): scheduler lifecycle/run semantics.
  - Command (to be added in this PR): `cd "$(git rev-parse --show-toplevel)/web" && npm run test:scheduler`
  - Pass: one terminal row per run attempt; retry increments attempt index.
- V4 (R2, R5): memory search + citation coverage.
  - Command (to be added in this PR): `cd "$(git rev-parse --show-toplevel)/web" && npm run test:memory`
  - Pass: citation path/snippet present for >=95% acceptance queries.
- V5 (R9): UI gate enforcement.
  - Commands:
    - Existing: `cd "$(git rev-parse --show-toplevel)" && npm run test:e2e`
    - Existing: `cd "$(git rev-parse --show-toplevel)" && npm run test:browser:smoke`
    - To be added for `web/`: `cd "$(git rev-parse --show-toplevel)/web" && npm run test:e2e && npm run test:browser:smoke`
  - Pass: all changed-surface UI checks pass and artifacts are captured on failure.

11) Issue/PR test suite (ad hoc, exact commands, confidence-oriented)
### Pre-change baseline (already available)
- `cd "$(git rev-parse --show-toplevel)" && npm run test:e2e`
- `cd "$(git rev-parse --show-toplevel)" && npm run test:browser:smoke`

### Post-change gates (to be added in implementation PR)
- `cd "$(git rev-parse --show-toplevel)/web" && npm run lint`
- `cd "$(git rev-parse --show-toplevel)/web" && npm run test:unit`
- `cd "$(git rev-parse --show-toplevel)/web" && npm run test:e2e`
- `cd "$(git rev-parse --show-toplevel)/web" && npm run test:browser:smoke`
- `cd "$(git rev-parse --show-toplevel)/web" && npm run convex:schema:check`

External API testability strategy
- Convex interactions: integration-tested against dev Convex project.
- Embedding/semantic provider: mock in unit tests; integration deferred until provider is chosen.

12) Risks and mitigations
- Risk: dual-runtime confusion (legacy root + new `web/`).
  - Mitigation: explicit scripts/docs naming (`start:legacy`, `dev:web`, etc.) and migration notes.
- Risk: state-machine drift between UI and server mutations.
  - Mitigation: centralized transition validator in Convex mutations; no client-only transitions.
- Risk: scheduler duplicate/ghost runs.
  - Mitigation: idempotency keys + uniqueness on (`jobId`, `attempt`) + replay tests.
- Risk: memory search relevance regressions.
  - Mitigation: fixed acceptance query set + citation coverage threshold.

13) Top 10 reader questions
1. Why not replace Express in place immediately?  
   To preserve operator continuity and allow rollback while Next.js/Convex stabilizes.
2. Why create `web/` instead of changing root app now?  
   It de-risks migration by isolating new runtime from legacy scripts.
3. Is semantic search included in this exact phase?  
   Text search + citation contract is in scope; semantic provider integration is next increment.
4. How do we prevent fake status transitions?  
   Server-side state machine guardrails reject invalid transitions.
5. What proves scheduler correctness?  
   Run-attempt terminal-row tests plus idempotency/retry checks.
6. What guarantees mutation auditability?  
   Mutation-layer activity writes with test assertions for one-to-one coupling.
7. How do we avoid breaking the current UI?  
   Keep legacy server intact and maintain existing root UI test gates.
8. What is the cutover trigger?  
   Acceptance-based only after Phase 1 validation gates pass.
9. How do we validate schema presence in Convex?  
   Add `convex:schema:check` command and block mutation wiring until it passes.
10. When is this phase done?  
   When E1-E6 are complete and V1-V5 pass with evidence in PR.

14) Open questions
- OQ1: which Convex project/environment naming convention should be standard for this repo (`dev`/`staging` split vs single dev for now)?
- OQ2: should legacy Express API remain read-only after initial cutover, or fully disabled?
- OQ3: when semantic provider is selected, do we require local fallback embeddings for offline mode?

15) Core PR vs Optional follow-ups
### Core PR (must-do)
- `web/` Next.js + Convex scaffold.
- Schema/contracts + core routes (`/tasks`, `/scheduler`, `/memory`, `/activity`).
- Legacy coexistence + migration bridge.
- Expanded UI verification gates for new runtime.

### Optional follow-ups
- Content pipeline UI.
- Team roster/subagent accountability board.
- Office simulation layer.
- Advanced analytics and trend reporting.

16) Rollback plan (exact undo + verification)
Rollback trigger examples
- Invalid state transitions in production-like usage.
- Scheduler run duplication not resolved in hotfix window.
- Critical regression in mutation/audit coupling.

Rollback steps
1. Switch operator traffic to legacy app runtime only.
2. Stop Next.js `web/` runtime and disable new route exposure.
3. Continue operations via `cd "$(git rev-parse --show-toplevel)" && npm start`.
4. Freeze new Convex writes while triaging defects.

Verification commands
- `cd "$(git rev-parse --show-toplevel)" && curl -fsS http://127.0.0.1:3333/api/items | head`
- `cd "$(git rev-parse --show-toplevel)" && npm run test:e2e`
- `cd "$(git rev-parse --show-toplevel)" && npm run test:browser:smoke`

17) Recommendation
Proceed with this Phase 1 implementation plan as the immediate next coding PR, using `web/` isolation plus strict state contracts and UI verification gates to keep migration risk controlled.

18) Next steps
1. Approve this Phase 1 plan.
2. Open implementation PR from this branch and start E1 scaffold (`web/` + Convex setup).
3. Add missing `web/` scripts called out as "to be added in this PR" before feature work.

## Ready for Execution
- [ ] Phase 1 scope approved (`/tasks`, `/scheduler`, `/memory`, `/activity`).
- [ ] `web/` isolation approach approved.
- [ ] Convex schema/state contracts approved.
- [ ] UI verification gates accepted for both legacy and `web/` paths.
- [ ] Rollback trigger/steps accepted.

## Best-practice references
- Next.js App Router docs: https://nextjs.org/docs/app
- Convex Next.js quickstart: https://docs.convex.dev/quickstart/nextjs
- Convex schema/modeling: https://docs.convex.dev/database/schemas
- Playwright docs: https://playwright.dev/docs/intro
- TypeScript handbook: https://www.typescriptlang.org/docs/
