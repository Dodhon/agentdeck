# AgentDeck Mission Control Article Alignment (Next.js + Convex)

Plan level: L1  
Skill hook: `$planning`

## Goal
- Align the `web/` Mission Control IA and UI language to the original article structure so operators can use the same mental model directly: Tasks Board, Content Pipeline, Calendar, Memory, Team, Office.

## Scope
- In scope:
  - Rename/reframe scheduler UX as `Calendar` (keep backward-compatible route alias for existing links).
  - Add first-class screens for `Content Pipeline`, `Team`, and `Office`.
  - Update overview page and sidebar navigation to mirror article sections.
  - Update UI automation coverage (Playwright + browser smoke) for the new navigation/screen set.
- Out of scope:
  - New backend schemas for pipeline/team/office in this pass.
  - Replacing existing task/job/memory API contracts.

## Functional Requirements
- FR1: Home screen cards map to article sections and language.
- FR2: Sidebar contains article-aligned navigation labels and routes.
- FR3: `/calendar` is available and uses current scheduler behavior; `/scheduler` remains as compatibility redirect.
- FR4: `/content-pipeline` supports stage-based workflow editing in UI.
- FR5: `/team` shows agent roster, roles, and responsibilities with editable entries.
- FR6: `/office` visualizes active team members and work status.

## Non-Functional Requirements
- NFR1: Existing task/job/memory flows continue to work unchanged.
- NFR2: Mobile and desktop layouts remain usable.
- NFR3: UI changes are verified by both Playwright and browser automation smoke scripts.

## Current State Evidence
- Existing routes/components: `/tasks`, `/scheduler`, `/memory`, `/activity` in `/Users/thuptenwangpo/Documents/GitHub/agentdeck/web/src/app`.
- Existing e2e test only validates Tasks/Scheduler/Memory/Activity at `/Users/thuptenwangpo/Documents/GitHub/agentdeck/web/tests/e2e/mission-control.spec.ts`.
- Browser smoke still asserts `Scheduler` label in `/Users/thuptenwangpo/Documents/GitHub/agentdeck/web/scripts/browser_smoke.sh`.

## Work Breakdown
- E1: Navigation + overview realignment to article sections.
- E2: Calendar route + scheduler alias redirect.
- E3: Add content pipeline, team, and office screens/components.
- E4: Update shared styling for new boards/cards and responsive behavior.
- E5: Update and run Playwright + browser smoke tests for new paths.

## Validation / Test Plan
- `cd /Users/thuptenwangpo/Documents/GitHub/agentdeck/web && npm run lint`
- `cd /Users/thuptenwangpo/Documents/GitHub/agentdeck/web && npm run test:e2e`
- `cd /Users/thuptenwangpo/Documents/GitHub/agentdeck/web && npm run test:browser:smoke`
- `cd /Users/thuptenwangpo/Documents/GitHub/agentdeck/web && npm run build`

Pass criteria:
- New article-aligned routes render successfully.
- Existing core flows still pass e2e interactions.
- Browser smoke captures screenshot and asserts article-aligned nav labels.

## Risks & Mitigations
- Risk: Breaking existing deep links to `/scheduler`.
  - Mitigation: Keep `/scheduler` as a redirect to `/calendar`.
- Risk: UI-only state for new screens may be confused as backend-persistent.
  - Mitigation: Label new screens as local/pilot state in helper copy for this phase.

## Rollback
- Revert added routes/components and restore prior nav/home labels.
- Keep existing task/scheduler/memory/activity runtime untouched so rollback is low risk.
