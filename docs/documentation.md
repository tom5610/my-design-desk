# Design Desk Live Ledger

## Current State

- Current milestone: 14 - Snapping, Alignment, And Spacing Guides
- Previous milestone: 13 - Components, Instances, Overrides, Detach
- Status: ready for snapping and guide work after verified component system
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

### 5. Local Server, Session Store, And WebSocket Protocol

Status: complete

Scope completed:

- Added shared collaboration message types for presence, operation submission, server readiness, operation commits, and operation rejection.
- Added a minimal browser collaboration client wrapper.
- Added a local JSON session store under gitignored `data/sessions`.
- Added atomic session writes and persisted canonical operation ordering.
- Added server-side operation sequencing with duplicate op ID rejection.
- Refactored the local server entry point to export a reusable testable server and keep `npm run dev` behavior.
- Added WebSocket handling for `server.ready`, ephemeral presence, and committed operation broadcasts.
- Added server unit tests and a real WebSocket smoke test.
- Added a dedicated TypeScript test project so Node/server tests and browser app code can share types without weakening either project.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 5 commit scope.

Verification:

- `npm run lint` initially failed on an unnecessary sequence type assertion, an unused type import, and unsafe WebSocket test message stringification. Fixed all three.
- `npm run lint` passed.
- `npm run typecheck` initially failed because tests were in the browser TS project while importing server files. Added `tsconfig.test.json`, moved tests out of `tsconfig.app.json`, and added the test project to `tsconfig.json` and ESLint.
- `npm run typecheck` passed after the TS project split.
- `npm test` in the sandbox timed out because the WebSocket smoke test requires localhost binding. Reran with approved elevated `npm test`; it passed: 4 test files, 12 tests.
- `npm run lint` passed after the WebSocket smoke fixes.
- `npm run typecheck` passed after the WebSocket smoke fixes.
- `npm run build` passed with Vite `8.1.3`.
- `npm run dev` started Vite at `http://127.0.0.1:5173/` and the collaboration server at `http://127.0.0.1:8787`, then was stopped with `Ctrl-C`.

Notes:

- Presence is intentionally ephemeral and is not written to the session store.
- Runtime session files are under gitignored `data/`.
- WebSocket tests may require elevated localhost permissions in this environment.

### 6. App Shell And Professional Workspace UI

Status: complete

Scope completed:

- Refactored the one-file shell into `src/app`, `src/layout`, and `src/ui` modules.
- Added a responsive professional workspace with top toolbar, left layers/assets panel, canvas center, right inspector, bottom/status areas, mobile panel controls, and stable test IDs.
- Added demo project picker shell.
- Added toast stack and modal foundation shells.
- Removed the global minimum body width so mobile-width layouts can render without horizontal overflow.
- Added `npm run test:e2e` and Playwright shell smoke coverage for desktop and mobile widths.
- Configured Playwright to use the local Chrome channel.
- Kept editor behavior implementation out of scope for later milestones.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 6 commit scope.

Verification:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` initially failed because Vitest collected the Playwright spec and the scaffold script assertion did not include `test:e2e`. Excluded `tests/e2e/**` from Vitest and updated the script assertion.
- `npm test` passed: 4 test files, 12 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` failed in the sandbox because Playwright could not start the local web server.
- Reran approved elevated `npm run test:e2e`; it passed: 2 Playwright tests across desktop and mobile-width shell checks.
- `npm run lint` passed after e2e fixes.
- `npm run typecheck` passed after e2e fixes.
- `npm run build` passed after e2e fixes.

Notes:

- The shell is responsive at the tested 1440x900 and 390x844 viewports.
- Playwright local server/browser checks may require elevated permissions in this environment.

### 7. SVG Renderer, Pan, Zoom, And Hit Testing

Status: complete

Scope completed:

- Added viewport coordinate conversion, zoom clamping, and zoom-at-point helpers.
- Added hit-testing for topmost visible unlocked nodes with reverse z-order traversal.
- Added SVG scene renderer with stable `data-node-*` selectors.
- Added SVG canvas shell rendering the deterministic starter design.
- Added zoom controls and stable canvas test IDs.
- Replaced the static canvas mock with model-driven SVG rendering.
- Added geometry tests, hit-testing tests, and renderer snapshot coverage.
- Extended Playwright smoke tests to assert SVG canvas and starter nodes render on desktop and mobile widths.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 7 commit scope.

Verification:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` initially failed on exact floating-point equality in a viewport round-trip test. Switched that assertion to `toBeCloseTo`.
- `npm test` passed: 6 test files, 17 tests. One renderer snapshot was written.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` passed: 2 Playwright tests covering desktop and mobile canvas load.
- `npm run lint` passed after the viewport test fix.
- `npm run typecheck` passed after the viewport test fix.

Notes:

- Hit-testing is currently axis-aligned for rotated geometry; rotation-sensitive transforms start in later milestones.
- Image nodes render as local SVG placeholders until tracked visual assets are introduced.

### 8. Selection, Handles, Transforms, And Keyboard Basics

Status: complete

Scope completed:

- Added deterministic selection state helpers for select-one, toggle multi-select, and clear selection.
- Added move transaction command that emits `node.updateGeometry` operations.
- Added SVG selection overlay with outline, resize handles, and rotation handle.
- Wired canvas clicks to selection and shift-click multi-selection.
- Added keyboard basics for arrow-key nudging, delete/backspace, undo/redo, duplicate, and copy/paste placeholder behavior.
- Routed nudge/delete/duplicate changes through operations and history rather than direct model mutation.
- Added selection tests and transform command tests.
- Added Playwright interaction smoke for selecting and nudging a rendered node.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 8 commit scope.

Verification:

- `npm run lint` passed.
- `npm run typecheck` initially failed because DOM attributes return strings while selection expects branded `NodeId`. Cast selected DOM node IDs at the canvas boundary.
- `npm run typecheck` passed after the fix.
- `npm test` passed: 8 test files, 21 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` passed: 3 Playwright tests including selection and nudge smoke.
- `npm run lint` passed after the selection boundary fix.
- `npm run typecheck` passed after the selection boundary fix.

Notes:

- Resize and rotation handles are visual foundations in this milestone; full pointer resize/rotate behavior can be deepened in later transform work.
- Copy/paste currently duplicates the active selection locally; richer clipboard serialization can build on the same command path.

### 9. Node Creation And Editing

Status: complete

Scope completed:

- Added deterministic node creation tool definitions for Frame, Group, Rectangle, Ellipse, Line, Text, Image, Button, Icon, and ChartPlaceholder.
- Added `createNodeOperation` to generate `node.create` operations with stable defaults.
- Added a compact canvas creation palette with select and creation tool modes.
- Wired canvas clicks in creation mode to commit `node.create` operations, select the new node, and return to select mode.
- Added creation op tests proving every Milestone 9 node kind can be created, serialized, and replayed through the ops engine.
- Added deterministic ID tests for creation sequences.
- Added Playwright creation smoke for creating and selecting a rectangle from the canvas tools.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 9 commit scope.

Verification:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 9 test files, 23 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` passed: 4 Playwright tests including rectangle creation smoke.

Notes:

- Created image nodes render as local SVG placeholders until tracked asset handling is added.
- Component creation remains reserved for the component-system milestone.

### 10. Layers Tree, Assets, Search, And Reorder

Status: complete

Scope completed:

- Lifted scene history and selection state to the workspace so the canvas and left panel share the same model.
- Added a model-backed layers panel with nesting depth, search, jump-to-layer selection, visibility toggle, lock toggle, drag/drop hook, and move-up reorder control.
- Added layer tree flattening and reorder helpers.
- Added assets tab shell for color styles, text styles, and components.
- Added `node.updateMeta` operations for name, lock, and visibility updates, with inversion support.
- Ensured visibility toggles affect SVG rendering and hit-testing through the shared scene model.
- Added layers unit tests for flattening, filtering, metadata updates, and reorder ops.
- Added Playwright layers smoke for filtering and toggling node visibility.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 10 commit scope.

Verification:

- `npm run lint` initially failed on inferred sibling array typing in the reorder helper. Added explicit typed sibling resolution.
- `npm run lint` passed after the fix.
- `npm run typecheck` passed.
- `npm test` passed: 10 test files, 27 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` passed: 5 Playwright tests including layers filter/visibility smoke.

Notes:

- Layer rename operation support exists in `node.updateMeta`; editable rename UI can be deepened with the inspector/command work.
- Drag/drop currently routes through the same reorder helper as the move-up control.

### 11. Properties Inspector And Constraints

Status: complete

Scope completed:

- Replaced the static inspector with a selected-node inspector backed by the shared scene model.
- Added inspector controls for geometry, fill, opacity, and constraints.
- Routed inspector edits through `node.updateGeometry`, `node.updateStyle`, and `node.updateConstraints` operations.
- Added `node.updateConstraints` operation support with inversion.
- Added deterministic constraint math for right, left-right, center, and scale behaviors.
- Added inspector and constraints unit tests.
- Added Playwright inspector smoke for editing selected node geometry.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 11 commit scope.

Verification:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 12 test files, 30 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` passed: 6 Playwright tests including inspector geometry edit smoke.

Notes:

- Inspector fill support currently writes solid fills; richer gradient UI can build on the same style operation path.
- Constraint helpers are deterministic and React-independent.

### 12. Grouping, Locking, Ordering, Context Menu, Shortcuts

Status: complete

Scope completed:

- Added ordering commands for bring forward/backward and send front/back.
- Added lock command using `node.updateMeta`.
- Added grouping command that creates a Group and reparents same-parent selected nodes while preserving parent relationships.
- Added canvas context menu for ordering, lock, and group actions.
- Added keyboard shortcut help overlay.
- Added command tests for ordering, locking, and grouping parent-child integrity.
- Added Playwright context menu and shortcut help smoke.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 12 commit scope.

Verification:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 13 test files, 33 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` initially failed because shortcut help is scoped to the focused canvas. Focused the canvas before pressing `?`.
- `npm run test:e2e` passed after the fix: 7 Playwright tests including context menu and shortcut help smoke.
- `npm run lint` passed after the e2e fix.
- `npm run typecheck` passed after the e2e fix.
- `npm test` passed after the e2e fix: 13 test files, 33 tests.
- `npm run build` passed after the e2e fix.

Notes:

- Ungroup UI is not yet exposed; grouping command infrastructure is in place and can be extended with ungroup in later command polish.
- Shortcut help reflects the keyboard shortcuts currently implemented in the shell.

## Next Milestone

### 13. Components, Instances, Overrides, Detach

Status: complete

Scope completed:

- Added deterministic component model helpers for resolving instances from master component roots.
- Added `component.create`, `component.delete`, and `node.updateInstanceOverrides` operations with inversion support.
- Added component command helpers for create-from-selection, insert-instance, text/fill overrides, go-to-main selection, and detach.
- Rendered component instances from their master nodes so master changes inherit through instances unless an override is present.
- Added assets-panel component controls for create, insert, and go-to-main.
- Added inspector controls for instance text/fill overrides, go-to-main, and detach.
- Seeded the starter design with a real hidden master button and visible overridden instance.
- Added component inheritance, serialization/replay, and detach unit tests.
- Added Playwright component smoke for inserting, overriding, and detaching an instance.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 13 commit scope.

Verification:

- `npm run lint` initially failed on unused component-delete destructuring and redundant test casts.
- `npm run typecheck` initially failed on component helper type imports, color typing, container narrowing, and one test fallback.
- `npm test -- -u` passed and updated the intentional SVG renderer snapshot for inherited component rendering.
- `npm run lint` passed after removing unused component-delete destructuring and redundant test casts.
- `npm run typecheck` passed after tightening component helper types.
- `npm test` passed: 14 test files, 36 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` passed: 8 Playwright tests including component insert/override/detach smoke.

Notes:

- Component override keys currently support generic `text`, `label`, and `fill`, plus targeted `text:<nodeId>` and `fill:<nodeId>` forms for future richer inspectors.
- Detach materializes resolved component output as normal nodes through `node.create` operations, so replay and serialization stay deterministic.

### 14. Snapping, Alignment, And Spacing Guides

Planned scope:

- Snap-to-grid.
- Alignment guides.
- Spacing distribution guides.
- Toggle controls.
- Visual guide overlays.

Planned verification:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- Snapping tests.
- Playwright drag guide smoke.

Known risks:

- Drag and resize behavior is still shallow, so guide smoke may need to exercise keyboard or command-driven movement if pointer dragging is not yet implemented.
- Guide overlays must not interfere with SVG hit-testing or selection.
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
| 2026-07-04 | Keep presence ephemeral and persist only canonical sequenced operations. | Presence should not pollute replay, export, or version history state. |
| 2026-07-04 | Keep shell UI behavior shallow in Milestone 6. | Interaction-heavy canvas behavior starts in the SVG renderer and selection milestones. |
| 2026-07-04 | Keep Milestone 7 hit-testing axis-aligned. | Rotation-aware transform math belongs with the transform milestone rather than the first renderer slice. |
| 2026-07-04 | Route keyboard transforms through operations and history. | Selection UI must not become a parallel state mutation path. |
| 2026-07-04 | Add creation tools as deterministic `node.create` operations. | Creation, selection, replay, and serialization should all share the same operation path. |
| 2026-07-04 | Lift workspace scene state above canvas and panels. | Layers, canvas rendering, selection, and future inspector controls must operate on one shared scene model. |
| 2026-07-04 | Route inspector edits through existing operation families. | Inspector UI should be another command surface over the deterministic scene model. |
| 2026-07-04 | Keep context menu actions on command helpers. | Context UI must not mutate scene state outside the operation path. |
| 2026-07-04 | Resolve instances from hidden component masters at render time. | Master inheritance, overrides, detach, serialization, and future export should share one deterministic component model. |

## Blockers

None.

## Handoff

Start Milestone 14 by following `docs/implement.md`. Reread the active milestone, add snapping and guide math over the existing geometry/selection paths, and preserve the untracked `METHOD.md` unless the user explicitly asks to include it.
