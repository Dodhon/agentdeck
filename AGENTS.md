# Repository Guidelines

## Project Structure & Module Organization
- `web/` contains the Next.js app (if/when added). App Router pages live in `web/src/app` (e.g., `page.tsx`, `layout.tsx`), and API routes live in `web/src/app/api/*/route.ts`.
- Shared utilities belong in `web/src/lib`, global styles live in `web/src/app/globals.css`, and static assets go in `web/public`.
- Data/ops scripts live in `scripts/` or `web/scripts` (choose one and document in this file).
- `docs/` holds product/architecture notes, while `dev_plans/` stores planning documents.
- `skills/` contains local Codex skills for this repo.

## Build, Test, and Development Commands
Run these from `web/` (once it exists):
- `npm install` installs dependencies.
- `npm run dev` starts the local dev server (http://localhost:3000).
- `npm run build` creates a production build.
- `npm run start` runs the production build locally.
- `npm run lint` runs ESLint checks.

## Coding Style & Naming Conventions
- TypeScript + React (Next.js App Router).
- Use Next.js file conventions: `page.tsx` for routes, `layout.tsx` for layouts, and `route.ts` for API handlers.
- Prefer small, functional components and keep shared logic in `web/src/lib`.
- Styling should be Tailwind utility classes with globals in `web/src/app/globals.css`.

## Testing Guidelines
- No automated test runner is configured yet.
- Use `npm run lint` as the current quality gate before opening a PR.
- If you add tests, document the framework and add scripts to `web/package.json`.

## Commit & Pull Request Guidelines
- Commits follow short, imperative summaries (e.g., “Add …”, “Remove …”, “Clarify …”).
- PRs should include a concise description, link related issues or plans in `dev_plans/`, and include screenshots/GIFs for UI changes.
- Update `docs/` when behavior, configuration, or architecture changes.

## Configuration & Security
- Keep secrets out of git. Use `.env.local` at repo root if needed.
- If using Vercel later, document env sync in `docs/`.

## Agent Control Rules
- Always list sessions before sending a task.
- Require a confirmation step before sending any task.
- Never send tasks that can cause destructive or external actions without explicit user approval.
- Log each agent action with timestamp + target session id.

## Agent Maintenance
- Update this file ad hoc when new tooling, scripts, or workflows are added so future runs stay optimal.

## Workflow & Agency
- Default to executing requested work end-to-end unless a decision requires explicit approval.
- Use feature branches + PRs for meaningful changes; merge only when requested by the user.
- Ask only for missing credentials or irreversible actions (billing changes, paid plan upgrades, destructive ops).
- Prefer minimal, base functionality first; expand only when asked.
