# AgentDeck Mission Control v1 (Next.js + Convex + TypeScript)

0) Executive Summary (5–10 lines)
Objective: migrate AgentDeck from the current Express + SQLite implementation to a Next.js + Convex + TypeScript Mission Control that reliably tracks tasks, schedules, and memory with auditable state changes. Ask/decision: approve this v1 scope and architecture so implementation can start on this issue branch immediately.

Problem: the current repo provides a local ops board, but it is not aligned to the desired Mission Control operating model (shared task contracts, schedule observability, memory search-first UX) and does not use the requested stack.

Proposal: build a lean v1 in Next.js App Router + Convex functions using TypeScript everywhere, with three core screens (Tasks, Scheduler, Memory), a shared activity log, and deterministic state-transition contracts. Use a phased migration so the existing app can remain usable until cutover.

Benefits: a single source of operational truth, lower coordination friction between human and agent, deterministic cron visibility, and searchable memory with source traceability.

Decision needed by: 2026-02-18 (today) to begin Phase 1 scaffolding and schema implementation.

1) End-user context
- Primary user: Thupten (technical founder/operator, prefers concise high-agency execution).
- Technical level: advanced; comfortable with GitHub, local dev servers, and architecture tradeoffs.
- User goals:
  - See what is being worked on now, by whom, and why.
  - Verify scheduled work exists and is running correctly.
  - Search prior memory/conversation artifacts quickly with source references.
- Workflow goal: treat OpenClaw + subagents as an operating system, not just a chat UI.

2) Requirements `R1..Rn`
### User requirements
- UR1: one board for all active tasks with ownership and status.
- UR2: one calendar/list view for scheduled jobs and run outcomes.
- UR3: one memory view with keyword + semantic search and source traceability.
- UR4: one audit timeline for all major mutations across tasks/jobs/memory.

### Functional requirements
- R1 (Tasks): create, edit, assign, reprioritize, and transition tasks through a constrained workflow.
- R2 (Tasks): auto-log task lifecycle events with actor + before/after summaries.
- R3 (Scheduler): create one-shot and recurring jobs with enabled/disabled state.
- R4 (Scheduler): show next run, last run, latest status, and per-job run history.
- R5 (Scheduler): support manual “run now”, pause/resume, edit, and delete.
- R6 (Memory): ingest configured memory documents into indexable chunks.
- R7 (Memory): expose global search (text + semantic) and render source snippets.
- R8 (Cross-cutting): maintain immutable activity log for all significant mutations.
- R9 (Contracts): any agent-created work item must map to a task ID; any scheduled action must map to a job ID.

### Non-functional requirements
- NFR1 Reliability: no silent failure states; failed jobs surface actionable errors.
- NFR2 Performance: memory search p95 <= 1.5s at 100k chunks on local/dev target assumptions.
- NFR3 Auditability: every mutation stores actor, timestamp, and diff summary.
- NFR4 Consistency: exactly one canonical status per task and one canonical schedule per job.
- NFR5 Safety: destructive operations require explicit confirmation and server-side authorization checks.
- NFR6 Operability: system health indicators for blocked tasks, failed runs, and stale memory index.

3) Non-goals
- NG1: no “digital office/avatar simulation” in v1.
- NG2: no automated thumbnail/media generation in v1.
- NG3: no broad third-party integrations beyond required OpenClaw/cron/memory sources.
- NG4: no multi-tenant org model; single-operator scope only.

3.1) Source inspiration alignment (article -> product scope)
- Article framing: “OpenClaw needs Mission Control” with Next.js + Convex stack.
- Component mapping:
  - Tasks Board -> v1 `/tasks` (core).
  - Calendar (scheduled tasks/cron visibility) -> v1 `/scheduler` (core).
  - Memory + global search -> v1 `/memory` (core).
  - Content Pipeline -> v2 after v1 acceptance.
  - Team (agent roster + role clarity) -> v2 after v1 acceptance.
  - Office (avatar simulation) -> v3/optional only.
- Rationale: this keeps the proactive-operating-system value from the article while avoiding v1 scope collapse.

4) Success metrics (quantified)
- SM1: 100% of newly created tasks appear in the Tasks view within 2 seconds.
- SM2: 100% of job runs are visible with status + summary in run history.
- SM3: search top results include source path citation for >= 95% of queries tested in acceptance set.
- SM4: 0 uncaptured mutations in audit checks (all writes emit activity rows).
- SM5: after app restart, scheduler/job definitions are unchanged (0 lost jobs in test set).

5) Current repo state (repo-grounded)
- `package.json`: Node app scripts (`start`, `snapshot`, `validate`) and dependencies (`express`, `better-sqlite3`, `ws`) indicate current architecture is Express + SQLite.
- `ops_board/server.js`: current HTTP server entrypoint for the existing local ops board.
- `ops_board/ops_board.sqlite`: persistent SQLite store for current implementation.
- `ops_board/public/`: existing static UI assets.
- `README.md`: documents local-first setup, source-path ingestion, and gateway/session configuration.
- `dev_plans/agentdeck-personal-ops-board.md`: prior plan establishes local-first operational goals, which this migration preserves while upgrading stack + contracts.

6) Architecture/system impact diagram (ASCII)
```text
Untrusted Inputs / Sources
  ├─ OpenClaw task/job events
  ├─ Cron/job outcomes
  ├─ Memory markdown/doc files
  └─ Existing AgentDeck data (SQLite backfill)
                 │
                 ▼
      Next.js (App Router, TypeScript)
  ├─ /tasks
  ├─ /scheduler
  ├─ /memory
  └─ /activity
                 │
                 ▼
         Convex Functions (TypeScript)
  ├─ queries (read models)
  ├─ mutations (write contracts)
  ├─ actions (ingest/index/backfill)
  └─ scheduler hooks + run recording
                 │
                 ▼
             Convex Data Model
  tasks, taskEvents, jobs, jobRuns,
  memoryDocs, memoryChunks, activityLog
```

7) Assumptions & constraints
- Stack is fixed for this project: Next.js + Convex + TypeScript.
- Existing Express app can remain during migration (strangler approach) until parity is reached.
- REPO_ROOT for this repo is `/Users/thuptenwangpo/Documents/GitHub/agentdeck`.
- File-backed memory sources are treated as read-only ingest sources.
- ID generation: Convex-generated IDs for primary entities; idempotency keys for ingest/backfill events.
- Minimal error/empty states required:
  - no tasks yet,
  - no jobs scheduled,
  - memory index empty/stale,
  - ingest error with retry action.

8) Decision contracts (locked semantics)
- DC1 Workflow semantics: task status transitions are explicit and constrained by a state machine; no ad hoc status values.
- DC2 Storage truth semantics: Convex is the canonical write/read store for v1 entities after cutover; SQLite is legacy/backfill source only.
- DC3 Scheduling semantics: a job definition is durable and restart-safe; each run writes exactly one terminal outcome record.
- DC4 Search semantics: memory search responses must include source references (path and snippet anchor) for trust and traceability.

9) Current vs proposed schema/interface
### Current
- SQLite tables and local scripts (implicit schema in `ops_board/*`).
- Express endpoints and static public UI.

### Proposed (Convex collections)
- `tasks`: title, description, ownerType, ownerId, status, priority, dueAt, createdAt, updatedAt, archivedAt.
- `taskEvents`: taskId, eventType, actorType, actorId, beforeJson, afterJson, createdAt.
- `jobs`: name, scheduleKind, scheduleExpr, timezone, payloadKind, payloadJson, enabled, nextRunAt, lastRunAt, createdAt, updatedAt.
- `jobRuns`: jobId, startedAt, endedAt, status, summary, error, attempt.
- `memoryDocs`: sourcePath, sourceType, title, checksum, createdAt, updatedAt.
- `memoryChunks`: docId, chunkIndex, text, embedding, tokenCount.
- `activityLog`: entityType, entityId, action, actorType, actorId, metadataJson, createdAt.

### Proposed app interfaces
- Next.js routes/pages: `/tasks`, `/scheduler`, `/memory`, `/activity`.
- Convex API surface (query/mutation/actions) aligned to the entities above.

10) State machine semantics (terminal vs non-terminal)
### Task state machine
- Non-terminal: `backlog`, `ready`, `in_progress`, `blocked`
- Terminal: `done`, `archived`
- Correction rules:
  - `done -> in_progress` allowed only with `reopenedReason`.
  - `archived` is terminal for active boards; unarchive requires explicit admin mutation.

### Job run state machine
- Non-terminal: `queued`, `running`
- Terminal: `success`, `failed`, `timeout`, `canceled`
- Correction/supersede rules:
  - terminal rows are immutable;
  - retries create new `jobRuns` row with incremented `attempt`;
  - latest terminal run is computed view, not in-place overwrite.

### Memory ingest state model
- Non-terminal: `discovered`, `indexing`
- Terminal: `indexed`, `ingest_failed`
- Supersede rules:
  - new checksum supersedes prior doc version via new ingest event;
  - stale chunks remain query-excluded once superseded.

11) WAF-lite non-functional posture
- Security/authorization boundary: server-side mutation authorization in Convex; no client-trusted writes.
- Privacy/compliance: memory sources stay local/project-scoped; no external exfiltration in v1.
- Reliability: idempotent ingest/backfill and explicit terminal run states reduce duplicate/ghost writes.
- Operational excellence/observability: activity log + health indicators + error surfaces with retry guidance.
- Performance: indexed query patterns for list views and bounded result windows for search.
- Cost posture: Convex usage expected low at v1 scale; monitor read/write hotspots before adding premium infra.

12) Work breakdown `E1..En` mapping to `R*`
- E1 (R1, R2, R8, R9): define Convex schema + status contracts + shared activity logging utilities.
  - Artifacts: `convex/schema.ts`, task/event mutations, shared log helper.
  - Owner: Clawd. Window: 2026-02-18.
- E2 (R1, R2): implement Tasks screen and CRUD/transition mutations.
  - Artifacts: `app/tasks/*`, typed hooks, state transition guards.
  - Owner: Clawd. Window: 2026-02-19.
- E3 (R3, R4, R5, R8): implement Scheduler screen, jobs CRUD, run history, run-now action.
  - Artifacts: `app/scheduler/*`, `convex/jobs.ts`, `convex/jobRuns.ts`.
  - Owner: Clawd. Window: 2026-02-20.
- E4 (R6, R7, R8): implement Memory ingest/index/search with source-cited results.
  - Artifacts: `app/memory/*`, `convex/memory*.ts`, ingest actions.
  - Owner: Clawd. Window: 2026-02-21.
- E5 (R8, NFR1-6): health indicators, migration/backfill utility, and acceptance validation suite.
  - Artifacts: migration action/script, `/activity`, test checklist.
  - Owner: Clawd. Window: 2026-02-22.

13) Validation plan `V1..Vn` mapping to `R*` + success metrics
- V1 (R1/R2, SM1, SM4): task create/update/transition integration test.
  - Command: `npm run test:tasks` (or equivalent once scaffolded).
  - Pass: task visible <=2s; matching activity rows emitted for each mutation.
- V2 (R3/R4/R5, SM2, SM5): job lifecycle + run history test.
  - Manual + scripted checks: create recurring + one-shot, run now, pause/resume.
  - Pass: each run produces terminal row; restart retains all job definitions.
- V3 (R6/R7, SM3): memory ingest/search acceptance set.
  - Command: `npm run test:memory` with fixed query set.
  - Pass: >=95% result rows include source citation path/snippet.
- V4 (R8, NFR3): activity completeness audit.
  - Command: `npm run audit:mutations`.
  - Pass: 0 write mutations missing corresponding activity records.
- V5 (NFR1/NFR6): failure-path test.
  - Simulate ingest and run failures.
  - Pass: UI shows failure state + actionable retry.

14) Risks & mitigations
- Risk: migration churn if old and new systems diverge during build.
  - Mitigation: freeze new feature work in Express app after E1; only parity fixes.
- Risk: memory search quality regressions due to poor chunking/indexing defaults.
  - Mitigation: define deterministic chunking strategy and acceptance query set before launch.
- Risk: scheduler duplication or ghost runs.
  - Mitigation: idempotent run keys + immutable terminal run rows + restart tests.
- Risk: scope creep into aesthetic/non-operational UI.
  - Mitigation: enforce v1 scope gate (Tasks/Scheduler/Memory/Activity only).

15) Top 10 reader questions (with answers or explicit follow-up)
1. Why migrate instead of patching Express + SQLite?  
   Because the requested stack is Next.js + Convex + TS, and v1 needs stronger real-time/state contracts than current scripts.
2. Will this break current usage immediately?  
   No. Strangler migration keeps current app usable until parity/cutover.
3. Is Convex overkill for single-user ops?  
   No for this case; it simplifies typed query/mutation consistency and live UI updates.
4. How do we prevent dashboard theater?  
   By enforcing event contracts and acceptance metrics tied to behavior, not visuals.
5. What is the canonical store after cutover?  
   Convex (locked by DC2).
6. How do we verify scheduler correctness?  
   Run lifecycle tests + restart durability checks (V2).
7. How do we trust memory search output?  
   Source-cited result requirement and acceptance set checks (V3).
8. Can we still use legacy snapshots?  
   Yes during migration; they are optional after Convex activity log is authoritative.
9. What if requirements expand mid-build?  
   Add to optional follow-ups unless they are critical defects.
10. When do we consider v1 complete?  
   When all acceptance criteria pass and scope-gated screens are stable.

16) Open questions
- OQ1: memory embedding provider/strategy for semantic search in local dev ([TODO] pick concrete provider).
- OQ2: cutover trigger: date-based or acceptance-criteria-based switch.
- OQ3: whether to preserve old SQLite read-only diagnostics page post-migration.

16.1) Resolved decisions (locked)
- RD1 (cutover): acceptance-criteria-based cutover only. No date-based cutover.
- RD2 (v1 scope): tasks + scheduler + memory + activity only; content/team/office remain post-v1 phases.
- RD3 (stack): Next.js App Router + Convex + TypeScript is mandatory for all new Mission Control surfaces.

17) Core PR vs Optional follow-ups
### Core PR (must-do)
- Next.js + TypeScript + Convex scaffold in this repo.
- Convex schema + contracts for tasks/jobs/memory/activity.
- UI screens: Tasks, Scheduler, Memory, Activity.
- Migration/backfill utility from existing SQLite where needed.
- Validation scripts/checklist for acceptance criteria.

### Optional follow-ups
- Content pipeline screen (idea -> script -> thumbnail -> filming -> published, with attachments).
- Team role map/subagent roster view (agent cards, roles, responsibilities, current load).
- Office/visual simulation layer.
- Advanced analytics (throughput, SLA, trend charts).

17.1) Phase roadmap (inspired by article sequence)
- Phase 1 (this plan): Tasks, Scheduler, Memory, Activity.
- Phase 2: Content Pipeline + Team.
- Phase 3: Office simulation and advanced visuals.
- Gate rule: each phase starts only after prior phase acceptance checks pass.

18) Recommendation
Proceed with a scope-locked v1 migration in this order: schema/contracts first, then Tasks, Scheduler, Memory, then migration hardening. Keep visuals intentionally plain until behavioral reliability passes acceptance.

19) Next steps
1. Approve this plan and branch as the execution base (today, 2026-02-18).
2. Start E1 scaffold and schema contracts.
3. Open a draft PR titled: `Plan: Mission Control v1 migration to Next.js + Convex + TypeScript` linking this plan.

20) Rollback plan (L1-required)
- Trigger conditions:
  - any critical data integrity defect in task/job status contracts;
  - scheduler run recording misses terminal rows in validation;
  - memory search fails traceability requirement repeatedly in acceptance set.
- Rollback mechanism:
  - keep existing Express + SQLite app runnable during migration;
  - gate new Next.js Mission Control routes behind an environment switch;
  - flip switch to legacy app as default if trigger conditions are met.
- Data posture:
  - Convex writes are append-first (events/logs) and kept for debugging;
  - SQLite remains read-only legacy source during rollback window;
  - no destructive backfill deletes during v1 rollout.
- Verification after rollback:
  - confirm legacy ops board loads;
  - confirm existing snapshots/tasks remain visible in legacy path;
  - record rollback incident in activity/log notes with root-cause owner.

## Ready for Execution
- [ ] Scope approved: Tasks + Scheduler + Memory + Activity only.
- [ ] Convex as canonical post-cutover store confirmed.
- [ ] Task/job state machine contracts accepted.
- [ ] Memory search citation requirement accepted.
- [ ] Validation gates (SM1–SM5, V1–V5) accepted.

## Best-practice references
- Next.js App Router docs: https://nextjs.org/docs/app
- Convex + Next.js quickstart: https://docs.convex.dev/quickstart/nextjs
- Convex data modeling: https://docs.convex.dev/database/schemas
- TypeScript handbook: https://www.typescriptlang.org/docs/
- React docs (state, rendering, architecture): https://react.dev/learn
- AWS Well-Architected Framework: https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html
