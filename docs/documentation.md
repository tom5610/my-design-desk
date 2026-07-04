# Design Desk Live Ledger

## Current State

- Current milestone: 5 - Local Server, Session Store, And WebSocket Protocol
- Previous milestone: 4 - Deterministic Ops Engine And Undo/Redo
- Status: ready for local server persistence and protocol after verified ops engine
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

### 2. Repo Scaffold And Tooling

Status: complete

Scope completed:

- Added Vite + React + TypeScript app scaffold.
- Added Tailwind, PostCSS, ESLint flat config, TypeScript project references, Vitest, and Playwright config.
- Added scripts: `dev`, `build`, `test`, `lint`, `typecheck`, and `export`.
- Added a TypeScript local WebSocket server skeleton at `server/index.ts` with `/health` and `/collaboration`.
- Added a professional editor shell with top toolbar, layers/assets area, canvas center, inspector, comments/replay/export panel affordances, and local-session status.
- Added a scaffold test that verifies required package scripts.
- Preserved existing untracked `METHOD.md`; it was inspected and left outside the Milestone 2 commit scope.

Verification:

- `npm run lint` initially failed because type-aware ESLint parsing included JS config files and WebSocket raw message decoding used unsafe stringification. Fixed both issues.
- `npm run typecheck` initially failed on WebSocket `RawData` conversion. Fixed explicit ArrayBuffer handling.
- `npm install` initially reported 5 vulnerabilities in the Vite/esbuild toolchain. Upgraded to Vite `8.1.3`, Vitest `4.1.9`, and `@vitejs/plugin-react` `6.0.3`; `npm audit` then reported `found 0 vulnerabilities`.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 1 test file, 1 test.
- `npm run build` passed with Vite `8.1.3`.
- `npm run dev` started Vite at `http://127.0.0.1:5173/` and the collaboration server at `http://127.0.0.1:8787`, then was stopped with `Ctrl-C`.

Notes:

- Full Playwright browser smoke coverage begins when browser-visible flows are introduced in later milestones; this milestone configures Playwright only.
- The `export` script is a CLI scaffold. Deterministic export implementation is Milestone 20.

### 3. Core Scene Types And Canonical Serialization

Status: complete

Scope completed:

- Added branded ID types and a seeded deterministic ID factory.
- Added typed style tokens, fills, strokes, shadows, text styles, node styles, and empty/default style helpers.
- Added scene graph types for all required node kinds: Frame, Group, Rectangle, Ellipse, Line, Text, Image, Button, Icon, ChartPlaceholder, ComponentRoot, and ComponentInstance.
- Added validation for roots, parent/child consistency, component roots, and component definitions.
- Added canonical serialization with stable object-key ordering, undefined omission, finite-number enforcement, and deterministic numeric normalization.
- Added a deterministic AI Builder Suite starter design seed.
- Added tests for ID determinism, required node kind coverage, starter seed validation, and canonical serialization stability.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 3 commit scope.

Verification:

- `npm run lint` passed.
- `npm run typecheck` initially failed because validation imported `NodeId` from the wrong module and used a broad container type guard. Fixed the import and narrowed the guard to scene union container nodes.
- `npm run typecheck` passed after the fix.
- `npm test` passed: 2 test files, 7 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run lint` was rerun after the validation fix and passed.

Notes:

- Scene, validation, serialization, and seed modules are independent from React.
- Canonical serialization currently normalizes numbers to 4 decimal places; this can be tightened later if transform precision demands it.

### 4. Deterministic Ops Engine And Undo/Redo

Status: complete

Scope completed:

- Added typed operation metadata and operation unions for create, update geometry, update style, reparent, reorder, delete, and internal restore.
- Added immutable operation apply logic with validation after each scene mutation.
- Added operation inversion and transaction inversion.
- Added transaction creation helpers.
- Added React-independent history state with commit, undo, and redo.
- Added tests proving deterministic replay bytes, geometry undo/redo, and compound transaction undo behavior.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 4 commit scope.

Verification:

- `npm run lint` initially failed on branded node ID inference in operation apply code and a broad test helper return type. Added explicit `Record<NodeId, SceneNode>` and narrowed the helper to `NodeCreateOperation`.
- `npm run lint` passed after the fix.
- `npm run typecheck` passed.
- `npm test` initially failed because undo restored scene state but kept the operation timestamp in `updatedAt`. Changed inverse operations to carry the pre-operation timestamp.
- `npm test` passed: 3 test files, 10 tests.
- `npm run lint` passed after the undo timestamp fix.
- `npm run typecheck` passed after the undo timestamp fix.
- `npm run build` passed with Vite `8.1.3`.

Notes:

- Ops and history logic are independent from React.
- Undo currently relies on inverse transactions stored in memory; persistent history and server sequencing start in Milestone 5.

## Next Milestone

### 5. Local Server, Session Store, And WebSocket Protocol

Planned scope:

- Implement a local server session store.
- Assign canonical sequence numbers to operations.
- Expose a shared WebSocket protocol for operations and presence.
- Keep presence ephemeral and persisted ops canonical.

Planned verification:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Server unit tests.
- WebSocket smoke test.

Known risks:

- Runtime session data must stay local and gitignored under `data/`.
- Server protocol types must stay shared with the client to avoid divergence.
- Existing untracked `METHOD.md` remains outside milestone scope and will not be staged.

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
| 2026-07-04 | Use Vite 8, Vitest 4, and Node >=20.19 for the scaffold. | Current Vite tooling resolves the esbuild audit finding and is compatible with the local Node runtime. |
| 2026-07-04 | Normalize canonical serialized numbers to 4 decimal places. | It keeps snapshot bytes stable while retaining sufficient precision for early geometry and style data. |
| 2026-07-04 | Store undo as inverse transactions computed before applying the original transaction. | This makes compound user actions undo as one step while preserving deterministic operation replay. |

## Blockers

None.

## Handoff

Start Milestone 5 by following `docs/implement.md`. Reread the active milestone, implement local server persistence and shared protocol types, and preserve the untracked `METHOD.md` unless the user explicitly asks to include it.
