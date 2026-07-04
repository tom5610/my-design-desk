# Design Desk Live Ledger

## Current State

- Current milestone: 2 - Repo Scaffold And Tooling
- Previous milestone: 1 - Control System And Git Baseline
- Status: ready for scaffold after the control-system baseline commit
- Source spec: `docs/prompt.md`
- Milestone contract: `docs/plans.md`
- Runbook: `docs/implement.md`

## Completed Milestones

### 1. Control System And Git Baseline

Status: complete

Scope completed:

- Created repo-level Codex instructions in `AGENTS.md`.
- Created `.gitignore`.
- Created `docs/plans.md` with 21 milestones, architecture overview, risk register, demo script, and verification expectations.
- Created `docs/implement.md` with the milestone execution loop.
- Created `docs/documentation.md` as the live ledger.
- Created `docs/codex-practices.md` as the learning guide.

Verification:

- Confirmed initial workspace contained only `docs/prompt.md`.
- Confirmed the directory was not a git repository before baseline setup.
- Manually reviewed generated control docs for the forbidden-source guardrail, milestone contract, and verification loop.

Notes:

- `docs/prompt.md` was not edited.
- The user chose `docs/plans.md` as the canonical plan location.
- App scaffolding and feature code intentionally have not started in Milestone 1.

## Next Milestone

### 2. Repo Scaffold And Tooling

Planned scope:

- Initialize Vite + React + TypeScript + Tailwind.
- Add lint, typecheck, Vitest, and Playwright tooling.
- Add a TypeScript Node WebSocket server skeleton.
- Ensure `npm run dev` starts the app and local collaboration server.
- Render the initial professional editor shell.

Planned verification:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Decisions Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-07-04 | Keep `docs/prompt.md` frozen. | It is the user-provided source specification. |
| 2026-07-04 | Use repo-tracked control docs as durable memory. | They are portable, reviewable, and loaded by future Codex runs. |
| 2026-07-04 | Use `docs/plans.md` as the canonical plan file. | User explicitly preferred the plan in `docs/`. |
| 2026-07-04 | Build the full prompt contract. | User selected full prompt over MVP. |
| 2026-07-04 | Use local `/goal` with auto-continue and commits. | Long-horizon work needs durable checkpoints and reviewable progress. |
| 2026-07-04 | Use SVG as authoritative editor surface with canvas previews only. | SVG improves inspectability, hit-testing, deterministic snapshots, and export mapping. |
| 2026-07-04 | Use a custom deterministic ops journal. | Replay, undo/redo, sync, snapshots, and export should share one source of truth. |
| 2026-07-04 | Use server-sequenced local WebSocket sync. | Canonical op order prevents divergent two-tab state. |
| 2026-07-04 | Store sessions in a local server JSON store. | It supports local persistence, export CLI, and multiplayer recovery. |

## Blockers

None.

## Handoff

Start Milestone 2 by following `docs/implement.md`. Do not scaffold until the Milestone 1 baseline commit exists.
