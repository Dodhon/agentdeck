---
name: planning-phase
description: Create development plans for this repo. Use when the user asks for a plan or when switching into planning mode; ensures plans are written to dev_plans/ and include required sections + best-practice references.
---

# Planning Skill

Create development plans for this repo.

## Instructions
When this skill is invoked:
1. **Write plans to `dev_plans/`** (repo-relative).
2. **Explore the repo for relevant code/docs** before drafting (read nearby code, plans, prompts, and docs to ground the plan).
3. **Research best practices** relevant to the feature and include **exact references (links)** from credible sources (official docs, reputable engineering blogs, high-quality GitHub repos).
4. **Ensure every new plan includes**:
   1) **End user context** — who the feature is for (role, technical level, goals)
   2) **User requirements** — what the end user needs to accomplish and why
   3) **Architecture diagram** — ASCII art showing how the feature fits into the existing system
   4) **Goals** — what the plan intends to achieve
   5) **Non-goals** — what is explicitly out of scope
   6) **Success metrics** — how we’ll know it worked (measurable where possible)
   7) **Decision contracts** — explicitly lock the coupled decisions that define the system’s semantics.
      - Example (generic): A) workflow/decision semantics, B) storage truth + projections, C) release/deploy/rollback semantics.
   8) **Current vs proposed schema/interface** — if any interface/schema/protocol is changing, state what exists today vs what’s proposed.
   9) **State machine semantics (when applicable)** — explicitly distinguish terminal outcomes vs non-terminal states; define correction/supersede rules.
   10) **WAF-lite non-functional posture** — a short section aligned to the AWS Well-Architected Framework pillars, covering: principals/authorization boundary, security/privacy/compliance, reliability, ops/observability, performance assumptions, and cost posture (TBDs allowed).
5. When the plan includes local filesystem access or API endpoints, **document path assumptions, record schema (if any), ID generation, and minimal error/empty states**. If the app runs in a subdirectory (e.g., `web/`), explicitly document how `REPO_ROOT` is derived from `process.cwd()` and how data paths are derived from it. Also note whether required data directories are created vs read-only, and how run/status IDs are retained for follow-up fetches.
6. When scope is sizable or requested, add a **Core PR** section (must‑do work) and an **Optional follow‑ups** section (nice‑to‑have tasks) to make sequencing clear.
7. Use the **web dev** and **react** skills ad hoc when relevant (especially for UI/React/Next.js planning).

## Hard rules
- Do **not** implement code changes.
- Prefer repo grounding: if you can read files, cite paths/symbols.
- Output must be ready to write to `dev_plans/<slug>.md`.
- Use precise language: replace vague qualifiers with data or a statement of intent.

## Document quality rules (non-negotiable)
These are not “style”; they are **decision-making affordances**.

### Objective-first
- State the **objective** and the **decision/ask** in the **first paragraph**.
- Make the intended audience clear (who decides vs who executes).

### End with recommendation + next steps
- End the narrative with a clear **Recommendation** and explicit **Next Steps**.

### Define who and when
- Name an **owner** for each major work item (or mark **TBD** explicitly).
- If committing to dates, use this precision standard:
  - within **3 months**: specify the **day**
  - within **3–6 months**: specify the **month**
  - beyond **6 months**: specify the **quarter**

### Start before all data is in
- Use placeholders like `TK` / `[TODO]` for missing info.
- Let gaps in the plan drive evidence collection and open questions.

### Preempt reader questions
- List the **top 10 questions** a skeptical reader will ask.
- Ensure each is answered either **in-doc** or explicitly “handled verbally / follow-up”.

## Workflow conventions (VMRS-specific, but safe defaults)
When planning work in repos that use these conventions:
- **Repo recon first:** scan `README.md`, relevant existing `dev_plans/`, relevant `mcp/` servers, and existing `.claude/agents/` before writing the plan.
- **Prompt versioning:** if changing versioned prompt files (e.g., under `interface prompts/`), do **not** edit old versions in place; create a new versioned file (e.g., `main_v5.txt`) and update references.
- **MCP stdio rule:** MCP servers must not write to **stdout** (it breaks the protocol). Logs go to **stderr**; ensure repo root is on `PYTHONPATH`/`sys.path` when servers may start from non-repo working directories.
- **PR issue closing keywords:** only include `Closes/Fixes #…` when you explicitly want auto-closing. Otherwise, plan to close issues manually after verification.
- **CLI hygiene:** when drafting PR/issue bodies that include backticks/braces, prefer `--body-file` to avoid shell interpolation.
- **No reward-hacking:** be high-agency, but don’t skip tests/guidelines/best practices to rush completion; if blocked, problem-solve around limitations first.

## Required plan structure (must include all)
Use this order unless the user explicitly requests another.

## Gap review (post-draft)
After drafting the plan, perform a quick gap check:
- Are validation commands explicit and runnable?
- Are tests-first expectations captured when required?
- Are key path assumptions (input locations) explicit?
If gaps exist, update the plan before proceeding.

0) Executive Summary (5–10 lines)
- Context (why now)
- Problem (what hurts)
- Proposal (what changes)
- Benefits (measurable outcomes)
- **Ask** (decision needed + by when)

1) End‑user context
2) Requirements `R1..Rn`
3) Non‑goals
4) Success metrics (quantified)
   - Prefer measurable targets (e.g., "<= 2 minutes", ">= 3x", "top-3 contains >=2 hook signals").
   - If subjective (e.g., “looks good”), define a proxy metric or a forced-choice review step.
5) Current repo state (repo-grounded)
   - Cite concrete file paths and what they imply.
6) Architecture/system impact diagram (ASCII)
7) Assumptions & constraints
8) Work breakdown `E1..En` mapping to `R*`
   - For each `E*`: expected artifacts + likely file/module touchpoints.
   - Include owner + time window (or `TBD`).
9) Validation plan `V1..Vn` mapping to `R*` + success metrics
   - Each `V*` must be explicitly pass/fail and include:
     - exact command(s) to run (or manual steps)
     - expected artifacts (files/URLs/UI state)
     - expected numeric thresholds when applicable (timing, sizes, counts)
     - what constitutes failure
   - Avoid “works/looks good” unless paired with a concrete check.
10) Risks & mitigations
11) Top 10 reader questions (with answers or explicit follow-up)
12) Open questions
13) Core PR vs Optional follow‑ups
14) Recommendation
15) Next steps

## Ready‑for‑Execution gate
End with a checklist titled **Ready for Execution**. Every checklist item must be checkable without interpretation.

## Output discipline
- If you reference the repo, cite **file paths** and (when possible) **symbols/line ranges**.
- If constraints are missing (runtime, deployment, data storage, backward compatibility), state explicit assumptions and list questions.
- Replace weasel words (e.g., “significant”, “soon”, “better”, “many”, “might”) with data or intent.
