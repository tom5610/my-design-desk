# Design Desk Long-Horizon Codex Run

Design Desk is a local-first design editor built as a long-horizon Codex exercise. The application is useful on its own, but the repo is also a teaching artifact: it shows how to start with a product prompt, build a durable control system, run Codex milestone by milestone, and preserve enough evidence that a later builder can resume or audit the work.

The fastest way to understand this repo is to read it in this order:

1. `docs/prompt.md` - the frozen product spec.
2. `METHOD.md` - the conversation method that shaped the run.
3. `AGENTS.md` - hard rules Codex must follow in this repo.
4. `docs/plans.md` - the architecture, risks, demo script, and 21 milestone contract.
5. `docs/implement.md` - the milestone execution loop.
6. `docs/documentation.md` - the live ledger of milestone evidence.
7. `docs/codex-practices.md` - the practice guide for repeating this workflow.
8. `docs/architecture.md` - the final implemented architecture.

## Run The App

Use Node `>=20.19`.

```bash
npm install
npm run dev
```

The dev command starts both local processes:

- Web app: `http://127.0.0.1:5173/`
- Collaboration server health: `http://127.0.0.1:8787/health`

Useful verification commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Export a serialized design to a deterministic React/Tailwind package:

```bash
npm run export -- --input <design.json> --out <dir>
```

## What Was Built

Design Desk is a Vite, React, TypeScript, and Tailwind app with a local Node WebSocket server. The final app includes:

- SVG-based editable canvas with selection, creation tools, snapping guides, comments, and overlays.
- A deterministic scene model, branded IDs, canonical serialization, typed operations, undo/redo, snapshots, and replay.
- Professional editor UI with layers, assets, inspector, components, context menu, shortcut help, demo picker, and status panels.
- Local multiplayer presence and live edit sync through a server-sequenced WebSocket protocol.
- Prototype links and preview navigation.
- Deterministic export codegen for React/Tailwind output.
- Unit, snapshot, server, export, and Playwright smoke coverage.

The key source areas are:

- `src/model`, `src/serialization`, `src/ops`, `src/store` - deterministic document spine.
- `src/canvas`, `src/render`, `src/geometry`, `src/selection`, `src/commands` - editor canvas behavior.
- `src/layout`, `src/app`, `src/panels`, `src/ui` - workspace UI.
- `src/collab`, `server` - local collaboration and persistence.
- `src/history`, `src/replay`, `src/prototype`, `src/preview` - advanced demo flows.
- `src/export`, `scripts/export.ts` - deterministic package export.
- `tests` - proof that the model, UI flows, server, replay, and export stay working.

## The Long-Horizon Method

The main lesson is that a long Codex run should not begin with app code. It should begin with a control system that survives context compaction, model handoff, and later continuation.

This repo used five durable control surfaces:

- `AGENTS.md` defines hard boundaries, engineering defaults, verification expectations, and source restrictions.
- `docs/prompt.md` preserves the original product request and is treated as frozen.
- `docs/plans.md` turns the prompt into architecture, risks, demo criteria, and milestone commits.
- `docs/implement.md` defines the exact loop Codex must follow for every milestone.
- `docs/documentation.md` records current state, verification evidence, decisions, blockers, and handoff notes.

`METHOD.md` complements those files. It records the human/Codex conversation: the prompts, Codex questions, builder answers, why each decision mattered, the `/goal` execution, final verification, and goal usage summary.

## How We Began

The build started with one rich product prompt in `docs/prompt.md`. Before scaffolding a Vite app, Codex and the builder clarified the operating model:

1. Keep the source product prompt frozen.
2. Use repo-tracked docs as durable memory rather than relying on chat history.
3. Build the full prompt contract rather than a reduced MVP.
4. Use git commits as milestone checkpoints.
5. Make SVG the authoritative editable surface, with canvas reserved for previews or future performance work.
6. Use a custom deterministic operations journal instead of treating UI state as the source of truth.
7. Persist local sessions through a local server JSON store.
8. Target a professional design-tool workspace.
9. Keep dependencies lean and own the scene, ops, replay, sync, and export logic in this repo.
10. Require full verification once scaffolding exists.
11. Auto-continue milestone by milestone, but commit after each verified slice.

Those choices were then written into the control docs. Only after the control system was committed did implementation begin.

## Step-By-Step: Starting A Similar Build

Use this sequence when practicing a long-horizon Codex run on another app.

### 1. Create The Frozen Prompt

Put the product request in `docs/prompt.md`. Make it specific enough to drive architecture and demo expectations. Do not keep the only copy in chat.

Good prompt content includes:

- product goal and target user
- major features
- technical constraints
- demo expectations
- local/runtime requirements
- source restrictions
- quality bar

### 2. Interview For Decisions

Ask Codex to behave like a builder or forward deployed engineer and ask one question at a time. Use the answers to remove ambiguity before code exists.

The important questions are not cosmetic. They should decide:

- scope: full spec, MVP, or architecture lab
- persistence model
- rendering approach
- collaboration model
- operation/replay/export authority
- dependency policy
- verification gate
- review cadence
- milestone granularity

`METHOD.md` shows the exact interview pattern used for Design Desk.

### 3. Write The Control System

Create the repo files that Codex will reread later:

```text
AGENTS.md
docs/plans.md
docs/implement.md
docs/documentation.md
docs/codex-practices.md
```

The control system should answer these questions:

- What must never happen?
- What is the source spec?
- What is the milestone contract?
- How does each milestone start?
- What verification must run?
- When should Codex stop and ask the user?
- What evidence must be recorded?
- What commit message belongs to each milestone?

This is the step that makes the run durable.

### 4. Commit The Baseline

Initialize git before app scaffolding. Commit the control docs as the first checkpoint.

For this repo, the first commit was:

```text
55d4ad0 chore: establish design desk control system
```

That baseline made later progress reviewable. Each feature milestone then had its own commit.

### 5. Launch `/goal`

Start the long run from the repo root and point Codex back to the durable files. The goal should be specific, but the long instructions should live in files.

The Design Desk goal used this structure:

```text
/goal Continue the Design Desk build in <repo path>. Follow AGENTS.md and docs/implement.md exactly. Treat docs/prompt.md as the frozen product spec and docs/plans.md as the milestone contract. Start from the current milestone recorded in docs/documentation.md.

Use the repo control system as durable memory. For each milestone: reread the control docs, inspect git status, update docs/documentation.md before work, implement only that milestone scope, run required verification, fix failures, record evidence and decisions, review the diff for scope creep, commit with the milestone message from docs/plans.md, then continue unless blocked.

Done when all milestones are complete, verification passes, docs/documentation.md has final evidence, the app runs locally with one command, and the final demo/export/replay/multiplayer flow works.
```

### 6. Execute One Milestone At A Time

For each milestone, Codex should:

1. Reread `AGENTS.md`, the active milestone in `docs/plans.md`, `docs/implement.md`, and `docs/documentation.md`.
2. Run `git status --short`.
3. Update `docs/documentation.md` before implementation with scope and verification plan.
4. Implement only the active milestone.
5. Run the milestone verification.
6. Fix failures and rerun affected checks.
7. Record exact evidence and decisions in `docs/documentation.md`.
8. Review `git diff --stat` for scope creep.
9. Commit with the planned milestone message.
10. Continue to the next milestone unless a stop condition is hit.

This repo completed 21 milestones that way, from control docs to final hardening.

### 7. Preserve The Ledger

`docs/documentation.md` is the live handoff file. It should always say:

- current milestone
- completed milestone evidence
- verification commands and outcomes
- known limitations
- decisions made during implementation
- blockers, if any
- next step

Do not treat the ledger as a retrospective-only document. Update it before work and after verification.

### 8. Use Git As Durable Memory

The commit history should read like a build story:

```text
chore: establish design desk control system
chore: scaffold app tooling and local server
feat: add deterministic scene model
feat: add deterministic ops engine
feat: add local collaboration server
feat: add editor workspace shell
...
feat: add deterministic export pipeline
feat: finalize demo projects and hardening
docs: capture design desk build method
```

This gives future Codex runs and human reviewers a recovery path.

## How The Application Build Unfolded

The milestone order was deliberate:

1. Control system first, so Codex had durable rules.
2. Tooling and local server scaffold.
3. Scene model, deterministic IDs, and canonical serialization.
4. Operations, transactions, undo, and redo.
5. Local server sequencing and WebSocket protocol.
6. Professional workspace shell.
7. SVG rendering, viewport, and hit testing.
8. Selection, transforms, and keyboard basics.
9. Node creation tools.
10. Layers, assets, search, visibility, lock, and reorder.
11. Properties inspector and constraints.
12. Grouping, ordering, context menu, and shortcuts.
13. Components, instances, overrides, and detach.
14. Snapping and layout guides.
15. Comments, pins, threads, resolve, and reopen.
16. Multiplayer presence and live edits.
17. Version history and snapshots.
18. Replay journal and branch from here.
19. Prototype links and preview navigation.
20. Deterministic React/Tailwind export CLI.
21. Demo projects, polish, performance guardrails, and final architecture docs.

The pattern is the important part: build the deterministic spine before relying on UI interactions. In this repo, replay, sync, version history, comments, prototype links, and export all share the same model and operation path instead of becoming separate systems.

## How To Study `METHOD.md`

Read `METHOD.md` as a transcript of the build method, not as product documentation.

Pay attention to:

- how the first prompt framed Codex as an AI Builder partner
- how Codex asked decision-making questions one by one
- how each answer became a control-doc rule
- how `/goal` referenced durable files instead of restating the full plan
- how model handoff was handled by verifying the current repo state
- how final completion required tests, export smoke, local runtime checks, and documentation evidence

The final `/goal` execution summary recorded:

```text
Goal usage: 44,410,080 tokens, about 3h 51m elapsed.
```

That number is useful as a scale signal: long-horizon runs can consume a lot of context and time, so durable files, commits, and verification evidence are not optional process overhead.

## Practice Checklist For Builders

Before implementation:

- Write `docs/prompt.md`.
- Interview for architectural decisions.
- Create `AGENTS.md` and the `docs` control files.
- Initialize git.
- Commit the control baseline.

During `/goal` execution:

- Keep the run anchored to `docs/plans.md` and `docs/implement.md`.
- Update `docs/documentation.md` before and after each milestone.
- Verify every milestone.
- Commit every completed milestone.
- Preserve unrelated user work in dirty trees.
- Stop only for real blockers.

After completion:

- Run the full verification suite.
- Prove the app starts with one command.
- Prove export or other critical CLI flows.
- Confirm the final ledger is current.
- Capture the method in a durable artifact such as `METHOD.md`.

## Common Failure Modes

Avoid these patterns when practicing long-horizon Codex work:

- Starting app code before the plan and runbook are coherent.
- Leaving important constraints only in chat.
- Letting UI state bypass the deterministic model or operation system.
- Skipping verification because the app appears to work.
- Accumulating many milestones in one uncommitted diff.
- Failing to update the live ledger after fixes.
- Treating a model handoff summary as authoritative without checking the repo.
- Adding remote services or assets when the product requires local behavior.

## Current Final State

All 21 planned milestones are complete. The final ledger is in `docs/documentation.md`, the architecture summary is in `docs/architecture.md`, and the conversation/run method is in `METHOD.md`.

For builders, the repo is best used in two passes:

1. Study the control system and METHOD to learn the long-horizon practice.
2. Study `src` and `tests` to see how the practice produced a deterministic local-first editor.
