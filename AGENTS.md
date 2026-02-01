# AGENTS.md — AgentDeck

## Purpose
AgentDeck is a local‑first personal ops board + OpenClaw agent control surface. This file defines how agents should work in this repo.

## Scope (v1)
- Local‑only app; no external posting without explicit user request.
- Read from local sources (configured paths), normalize, render dashboard, and log actions.
- Agent control actions must be explicit and auditable.

## Core Principles
- Be explicit: every agent action is user‑triggered and confirmed.
- Be auditable: log each action with timestamp + target session.
- Be deterministic: ingestion is idempotent and repeatable.
- Be safe: no background execution without explicit approval.

## Repo Conventions
- Plans live under `dev_plans/`.
- Daily snapshots live under `reports/ops-board/` (or configured path).
- Avoid hard‑coding the clawd workspace path; use config/env.

## Agent Control Rules
- Always list sessions before sending a task.
- Require a confirmation step before sending any task.
- Never send tasks that can cause destructive or external actions without explicit user approval.

## Testing Expectations
- Provide a dry‑run ingestion mode for safe testing.
- Keep validation scripts in a `scripts/` or `ops_board/scripts/` directory.

## Open Questions
- Storage choice (SQLite vs JSON) should be configurable.
- UI choice (web app vs TUI) should be configurable.
