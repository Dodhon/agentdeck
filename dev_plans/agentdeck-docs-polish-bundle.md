# AgentDeck Plan: Docs polish bundle (dev workflow + screenshots/GIF + snapshot contract)

0) Executive Summary (5–10 lines)
Objective: improve developer onboarding and user understanding by updating the README with a clear dev workflow, adding screenshots/GIF demo, and documenting the snapshot data contract with a sample JSON file. Decision needed: confirm the demo asset format (GIF vs MP4) and preferred screenshot locations by **2026-02-04**. Problem: the current README is minimal and does not show how to develop, what Node version to use, or what the snapshot output format looks like; there are no visuals of the UI. Proposal: add a “Development” section (node version, scripts, validate), a “UI preview” section with screenshots + GIF, and a “Snapshot contract” section linking to `ops_board/schema.md` and a sample JSON under `reports/ops-board/`. Benefits: faster setup, fewer support questions, and better project credibility. Ask: approve scope + demo asset format so the PR can be merged.

1) End‑user context
- Primary users: contributors (setup/dev) and readers evaluating AgentDeck.
- Goals: quick local setup, clear UI expectations, and known snapshot schema.
- Constraint: README should remain concise; deeper details can live in docs or sample files.

2) Requirements `R1..Rn`
**User requirements**
- UR1: A developer can get to “UI running” with a clear set of commands.
- UR2: README shows what the UI looks like.
- UR3: Snapshot schema is documented with an example JSON file.

**Functional requirements**
- R1: Add a “Development” section (Node version, install, run, validate) to README.
- R2: Add screenshots + demo GIF (or MP4) stored in repo (e.g., `docs/media/`).
- R3: Add a “Snapshot contract” section referencing `ops_board/schema.md` and linking a sample JSON.

**Non‑functional requirements**
- NFR1: Assets should be lightweight (<= 10 MB total) to keep clone size reasonable.
- NFR2: README remains concise (prefer links for deep details).

3) Non‑goals
- NG1: No UI redesign.
- NG2: No changes to runtime behavior.
- NG3: No external hosting of assets.

4) Success metrics (quantified)
- SM1: README contains explicit dev steps and a Node version requirement.
- SM2: README shows at least 2 screenshots + 1 short demo (GIF/MP4).
- SM3: Sample snapshot JSON exists at `reports/ops-board/sample.json` (or equivalent) and matches schema.

5) Current repo state (repo‑grounded)
- README includes basic setup and env vars but lacks dev workflow details and visuals.
- Snapshot schema is documented in `ops_board/schema.md` but not referenced in README.
- Snapshots are written to `reports/ops-board/YYYY-MM-DD.json` per README.

6) Architecture/system impact diagram (ASCII)
```
README.md
  ├─ Development (node version + commands)
  ├─ UI preview (screenshots/GIF)
  └─ Snapshot contract -> ops_board/schema.md + reports/ops-board/sample.json
```

7) Assumptions & constraints
- Node version: README currently states Node.js 18+; we’ll align with Node LTS guidance.
- Snapshot sample JSON should be derived from an actual run or a curated minimal example.
- Asset storage path: `docs/media/` or `reports/media/` (decision needed).

8) Work breakdown `E1..En` mapping to `R*`
- E1 (R1): Expand README with “Development” section and scripts list (`npm start`, `npm run ingest:dry`, `npm run snapshot`, `npm run validate`).
  - Touchpoints: `README.md`.
  - Owner: TBD. Window: by 2026-02-06.
- E2 (R2): Capture 2 screenshots + 1 short demo GIF (or MP4) and add to README.
  - Touchpoints: `docs/media/` (new), `README.md`.
  - Owner: TBD. Window: by 2026-02-06.
- E3 (R3): Add “Snapshot contract” section linking `ops_board/schema.md` and sample JSON file.
  - Touchpoints: `README.md`, `reports/ops-board/sample.json`.
  - Owner: TBD. Window: by 2026-02-06.

9) Validation plan `V1..Vn` mapping to `R*` + success metrics
- V1 (R1, SM1): README includes explicit Node version and dev commands.
  - Pass if: “Development” section lists Node version + install/run/validate commands.
- V2 (R2, SM2): README renders screenshots and demo asset.
  - Pass if: images render on GitHub; assets are in repo.
- V3 (R3, SM3): Sample snapshot JSON validates against schema fields.
  - Pass if: JSON includes required fields from `ops_board/schema.md` and matches documented structure.

10) Risks & mitigations
- Risk: Assets are too large.
  - Mitigation: compress GIF/MP4, keep total <= 10 MB.
- Risk: Snapshot sample diverges from schema.
  - Mitigation: generate sample from actual snapshot output and trim.

11) Top 10 reader questions (with answers or explicit follow‑up)
1. What Node version do I need? → Document Node LTS (18+ or specific LTS).
2. How do I run the UI? → `npm install` + `npm start` with `PORT` default.
3. What does the UI look like? → Screenshots + demo.
4. Where are snapshots stored? → `reports/ops-board/`.
5. What’s the snapshot schema? → Link to `ops_board/schema.md` + sample JSON.
6. Are there tests? → `npm run validate` (documented).
7. Can I use a different DB path? → Already documented env var `DB_PATH`.
8. Does this require Gateway? → No; file sessions supported.
9. Where do I put images? → `docs/media/` (decision needed).
10. Are assets hosted externally? → No; stored in repo.

12) Open questions
- Q1: Prefer GIF or MP4 for demo? (GitHub supports both.)
- Q2: Preferred asset path: `docs/media/` or `reports/media/`?
- Q3: Should README pin exact Node version or keep “18+”?

13) Core PR vs Optional follow‑ups
**Core PR (must‑do)**
- README Development section (Node version + commands).
- README UI preview (2 screenshots + 1 demo asset).
- Snapshot contract section + sample JSON file.

**Optional follow‑ups**
- Add a “Troubleshooting” section for common env var issues.
- Add `CONTRIBUTING.md` with workflow and style notes.

14) Recommendation
- Use `docs/media/` for assets and a short MP4 (smaller than GIF) unless you explicitly want GIF.

15) Next steps
- Thupten: confirm demo asset format and asset path by **2026-02-04**.
- Clawd: update README + add assets + sample JSON.

## Decision contracts
- Contract A (asset storage): assets live in `docs/media/` and are referenced in README.
- Contract B (node version): README states Node LTS and matches `package.json` engines if added.
- Contract C (snapshot example): sample JSON must include required schema fields from `ops_board/schema.md`.

## Current vs proposed schema/interface
- Current: README does not reference `ops_board/schema.md` or provide a sample snapshot JSON.
- Proposed: README includes a Snapshot Contract section linking schema + sample JSON; dev workflow section added.

## State machine semantics (when applicable)
Not applicable (documentation only).

## WAF‑lite non‑functional posture
- Principals/auth boundary: no change.
- Security/privacy/compliance: sample JSON should contain scrubbed data.
- Reliability: doc changes only.
- Ops/observability: doc changes only.
- Performance: asset sizes kept <= 10 MB.
- Cost posture: zero external cost.

## Best‑practice references
- GitHub Docs on README content: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
- Node.js FS API (if referencing local file paths in docs): https://nodejs.org/api/fs.html
- Node.js release guidance: https://nodejs.org/en/about/previous-releases

## Ready for Execution
- [ ] Demo asset format confirmed (GIF vs MP4).
- [ ] Asset directory confirmed.
- [ ] Node version policy confirmed (exact vs “18+”).
