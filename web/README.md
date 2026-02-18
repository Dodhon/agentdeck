# AgentDeck Mission Control Web

Next.js + TypeScript Mission Control surface for phase-1 migration.

## Routes
- `/tasks` tasks board with constrained state transitions
- `/content-pipeline` stage board for ideas/scripts/thumbnail/filming/publish
- `/calendar` scheduled jobs + run-now flow
- `/memory` ingest + citation-first search
- `/team` agent roster (roles + responsibilities + focus)
- `/office` live status view of team members
- `/activity` immutable mutation timeline

## Run
```bash
npm install
npm run dev -- --port 4100
```

## Validation
```bash
npm run lint
npm run convex:schema:check
npm run test:tasks
npm run test:scheduler
npm run test:memory -- --query-set tests/acceptance/memory-query-set.json --report reports/memory/citation-coverage.json
npm run test:e2e
npm run test:browser:smoke
```

## Mode behavior
- If `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` is configured, API routes attempt Convex first.
- If Convex is unavailable or unauthorized, routes fall back to deterministic in-process mock mode for local verification.
