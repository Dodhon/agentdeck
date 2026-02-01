# Repository Guidelines

## Commit & Pull Request Guidelines
- Commits follow short, imperative summaries (e.g., “Add …”, “Remove …”, “Clarify …”).
- PRs should include a concise description, link related issues or plans in `dev_plans/`.

## Agent Control Rules
- Always list sessions before sending a task.
- Require a confirmation step before sending any task.
- Never send tasks that can cause destructive or external actions without explicit user approval.
- Log each agent action with timestamp + target session id.

## Agent Maintenance
- Update this file ad hoc when new tooling, scripts, or workflows are added so future runs stay optimal.

## Workflow & Agency
- Default to executing requested work end-to-end unless a decision requires explicit approval.
- Use issue/PR feature branches for all development; merge only when requested by the user.
- When merging a PR, evaluate whether the related issue should be closed.
- Ask only for missing credentials or irreversible actions (billing changes, paid plan upgrades, destructive ops).
- Prefer minimal, base functionality first; expand only when asked.
