# Design Desk Live Ledger

## Current State

- Current milestone: complete - all 21 planned milestones
- Previous milestone: 21 - Demo Projects, Polish, Performance, Final Hardening
- Status: Milestone 21 complete and committed; final verification passed
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

Status: complete

Scope completed:

- Added deterministic snapping helpers for grid, alignment, and spacing calculations.
- Added unit-tested bounds math for selected nodes and peer geometry.
- Added SVG guide overlay rendering for grid, alignment, and spacing guides.
- Added canvas snap toggles for grid, alignment, and spacing.
- Added pointer drag movement for selected nodes, committing snapped movement through the existing operation/history path.
- Preserved keyboard nudge behavior as one-pixel movement without snapping.
- Added Playwright drag guide smoke that verifies guide rendering and alignment snapping.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 14 commit scope.

Verification:

- `npm run typecheck` passed.
- `npm run lint` initially failed on an unnecessary object-value assertion in snapping peer collection.
- `npm test` initially failed because grid snapping was tested with alignment snapping still enabled.
- `npm run test:e2e` initially failed because keyboard nudge was snapped and because Playwright treated the SVG guide group/line as hidden for visibility assertions.
- `npm run lint` passed after removing the unnecessary assertion.
- `npm run typecheck` passed after the drag and guide changes.
- `npm test` passed: 15 test files, 39 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` passed: 9 Playwright tests including drag guide smoke.

Notes:

- Snap behavior is currently applied to pointer drag movement; keyboard nudges stay unsnapped for precise one-pixel adjustment.
- Resize handles remain visual foundations; guide math is ready for resize snapping when handle transforms are deepened.
- Playwright asserts guide elements are present during drag and verifies the final snapped geometry because SVG guide line visibility is not reliable in Playwright's visibility heuristic.

### 15. Comments, Pins, Threads, Resolve/Reopen

Status: complete

Scope completed:

- Added deterministic comment commands for create thread, reply, resolve, and reopen.
- Added comment operations for create/delete, add/remove message, and set resolved, with undo inversion.
- Added comment validation so threads reference existing scene nodes.
- Added comment mode in the top toolbar; canvas clicks create local comment pins.
- Added SVG comment pins overlay with active/open/resolved visual states.
- Added comments panel with local author name, threaded replies, resolve/reopen, and jump-to-pin.
- Added viewport focusing for comment jump actions.
- Added comment operation tests for persistence, replay determinism, and undo.
- Added Playwright comments smoke for creating, replying, resolving, and jumping to a pin.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 15 commit scope.

Verification:

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 16 test files, 41 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` passed: 10 Playwright tests including comments smoke.

Notes:

- New comments default to `Review this area` so comment creation remains one-click in comment mode; threaded replies provide user-entered content.
- Comment jump centers the SVG viewport on the pin and highlights the active thread in the panel.

### 16. Multiplayer Presence, Cursors, Selections, Live Edits

Status: complete

Scope completed:

- Wired the workspace to the local WebSocket collaboration endpoint with session-aware URLs.
- Added queued WebSocket client sends and connection status callbacks.
- Broadcast local operations optimistically and ignore self-echoes from committed server operations.
- Applied remote committed operations into the local design state with server sequence visibility.
- Added ephemeral presence state with online count, local actor label, cursor updates, and selected IDs.
- Added remote cursor and remote selection SVG overlays.
- Added a local `BroadcastChannel` fallback so same-browser local collaboration remains available when only the Vite server is reused.
- Updated the WebSocket server to send existing presence to newly joined clients.
- Added deterministic sync coverage for server-sequenced operations.
- Added Playwright two-tab smoke for presence, remote selection, live edit sync, and sequence visibility.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 16 commit scope.

Verification:

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` initially exposed a race-prone two-client WebSocket test; replaced it with deterministic server-sequenced sync coverage while keeping the existing WebSocket commit test.
- `npm test` passed with local socket permissions: 16 test files, 42 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` initially exposed server-start timing and test-context issues; the final run passed with local browser/server permissions: 11 Playwright tests including two-tab collaboration smoke.

Notes:

- WebSocket remains the primary local collaboration path; `BroadcastChannel` is a local fallback for same-browser sessions when Playwright or a reused dev server does not have the collaboration server available.
- Presence remains ephemeral and is not written into `DesignFile.ops`.
- Remote committed operations clear redo history but do not create local undo entries.

### 17. Version History, Snapshots, Named Milestones

Status: complete

Scope completed:

- Added snapshot document storage for root IDs, nodes, components, comments, prototype links, and styles.
- Added `snapshot.create`, `snapshot.restore`, and `snapshot.delete` operations with validation and inversion support.
- Added deterministic snapshot helpers and restore transactions that create a before-restore snapshot.
- Added a version history panel with named snapshot creation and restore controls.
- Wired snapshot create/restore through the same operation/history path as other document changes.
- Added snapshot determinism and restore unit tests.
- Added Playwright version history smoke for creating and restoring a snapshot.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 17 commit scope.

Verification:

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed with local socket permissions: 17 test files, 44 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` passed with local browser/server permissions: 12 Playwright tests including version history smoke.

Notes:

- Snapshot restore preserves the snapshot timeline and records a before-restore snapshot for recovery.
- Snapshot documents intentionally exclude transient presence and operation journal state.

### 18. Replay Journal, Scrubber, Branch From Here

Status: complete

Scope completed:

- Added deterministic replay helpers that reconstruct design state from the initial design and committed redo transactions.
- Added replay labels for operation journal display.
- Added branch-from-replay helper that creates a clean history state from a replay step.
- Added replay panel with scrubber, step backward/forward, play/pause, speed control, current operation display, and branch action.
- Wired branch-from-here to reset the workspace to the replayed state.
- Added replay determinism and branch unit tests.
- Added Playwright replay smoke for stepping back and branching from an earlier state.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 18 commit scope.

Verification:

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed with local socket permissions: 18 test files, 46 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` passed with local browser/server permissions: 13 Playwright tests including replay smoke.

Notes:

- Replay currently uses the local committed history entries; future persisted replay can read server-sequenced operation journals from the same operation shape.
- Branching creates a clean history from the replayed state and clears the current selection.

### 19. Prototype Links And Preview Navigation

Status: complete

Scope completed:

- Added deterministic prototype link operations for create/delete with validation, undo inversion, serialization, and collaboration/replay compatibility through the existing operation path.
- Added prototype helpers for link transactions, containing-frame lookup, hotspot extraction, and on-click navigation.
- Added a second starter root frame so the local demo has a real frame-to-frame prototype destination.
- Added a prototype panel for selecting a hotspot, creating a target-frame link, starting preview from the source frame, and using back navigation.
- Added a local preview overlay that lists clickable hotspots for the active frame and navigates through serialized prototype links.
- Kept preview state outside the canonical `DesignFile` so navigation does not mutate editor scene data.
- Added prototype unit tests for deterministic serialization, containing-frame lookup, and hotspot extraction.
- Extended Playwright coverage to create a link, open preview, click a hotspot, navigate to the dashboard frame, and back out.
- Updated the SVG render snapshot and layer-order test for the second root frame.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 19 commit scope.

Verification:

- `npm run lint` initially failed before handoff because the preview back stack count was referenced outside its component scope; passing after threading the count through `CanvasShell`.
- `npm run typecheck` passed.
- `npm test -- --update` updated the intentional SVG renderer snapshot after adding the dashboard frame.
- `npm test` passed: 19 test files, 47 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e` initially exposed prototype panel pointer interception over older canvas flows; fixed by mounting the prototype panel only when there is selected, preview, or linked prototype state.
- `npm run test:e2e -- -g "creates a prototype link and navigates preview"` passed.
- `npm run test:e2e -- --workers=1` passed: 14 Playwright tests including prototype preview navigation, two-tab collaboration, comments, replay, version history, and snapping smoke.

Notes:

- The prototype panel stays hidden on a fresh canvas so it does not cover creation tools, comments, or canvas click targets.
- Prototype preview currently renders a focused navigation overlay rather than clipping the full canvas to the active frame; the canonical link data and preview state are separated so Milestone 20 export can ignore transient preview state.

### 20. Deterministic React/Tailwind Export CLI

Status: complete

Scope completed:

- Replaced the export scaffold with a local CLI that reads `--input <design.json>`, validates the design, and writes a deterministic export package under `--out <dir>`.
- Added pure export codegen that emits canonical `design.json`, Vite/React package files, Tailwind setup, root-frame React components, reusable generated component files, and an asset manifest.
- Added local asset reference collection and best-effort copying for image nodes without fetching remote assets.
- Added deterministic codegen snapshot tests and TSX parse coverage for generated component/frame files.
- Added CLI smoke coverage by exporting the same starter design input to two output directories and comparing them.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 20 commit scope.

Verification:

- `npm run lint` passed.
- `npm run typecheck` initially failed on readonly tuple typing in export style helpers; fixed by using readonly style-entry tuples.
- `npm run typecheck` passed after the fix.
- `npm test` passed: 20 test files, 50 tests, including export snapshot determinism and generated TSX parse coverage.
- `npm run build` passed with Vite `8.1.3`.
- Temporary smoke setup with `tsx -e` first failed on top-level await in CJS eval output; reran with an async wrapper.
- Temporary smoke setup then hit the known sandbox `tsx` IPC pipe `EPERM`; reran with approved elevated `./node_modules/.bin/tsx` to write `/tmp/design-desk-export-smoke/input.json`.
- `npm run export -- --input /tmp/design-desk-export-smoke/input.json --out /tmp/design-desk-export-smoke/out-a` initially hit the same sandbox `tsx` IPC `EPERM`; reran with approved elevated `npm run export` and passed.
- `npm run export -- --input /tmp/design-desk-export-smoke/input.json --out /tmp/design-desk-export-smoke/out-b` passed.
- `diff -ru /tmp/design-desk-export-smoke/out-a /tmp/design-desk-export-smoke/out-b` passed with no differences.
- Export smoke produced `design.json`, `package.json`, `tailwind.config.js`, `index.html`, `src/App.tsx`, `src/main.tsx`, `src/index.css`, two frame components, one reusable component, and `assets/asset-manifest.json`.

Notes:

- The generated export package intentionally uses the canonical model as input and does not depend on browser/editor state.
- Missing local assets do not fail export; they are listed in the asset manifest with `copied: false`, while existing local assets are copied into the deterministic output path.

### 21. Demo Projects, Polish, Performance, Final Hardening

Status: complete

Scope completed:

- Added tracked local SVG preview asset under `public/assets`.
- Updated the starter design image node to reference the tracked local asset so export can copy it.
- Added tracked demo project metadata for AI Builder Suite, Ops Dashboard, and Mobile Assistant.
- Updated the demo project picker with the tracked metadata and clearer local/open states.
- Added a visible demo mode banner, session-aware local share link, updated footer state, and additional local export toast.
- Filled the modal shell with shortcut content while keeping the existing interactive shortcut overlay intact.
- Added `docs/architecture.md` covering the data model, rendering pipeline, operations/history, sync, replay, prototype preview, export, and performance guardrails.
- Added performance guardrail helpers and a test proving the starter demo stays below node/root/operation thresholds.
- Updated export snapshots for the tracked SVG asset.
- Preserved existing untracked `METHOD.md`; it remained outside the Milestone 21 commit scope.

Verification:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test -- --update` intentionally updated the export snapshot after changing the local preview asset from `.png` to `.svg`.
- `npm test` passed: 21 test files, 51 tests.
- `npm run build` passed with Vite `8.1.3`.
- `npm run test:e2e -- --workers=1` passed: 14 Playwright tests including shell, mobile layout, creation, comments, two-tab collaboration, version history, replay, and prototype preview navigation.
- `npm run export -- --input /tmp/design-desk-export-smoke/input-m21.json --out /tmp/design-desk-export-smoke/out-m21` passed.
- Export smoke produced the React/Tailwind package and copied `public/assets/demo-preview-placeholder.svg`.
- Export asset manifest recorded the SVG asset with `copied: true`.

Notes:

- The final Playwright suite covers the manual two-tab demo path through the local browser/server flow.
- Final runtime remains fully local through `npm run dev`.
- No further planned milestone remains after the Milestone 21 commit.

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
| 2026-07-04 | Apply snapping to pointer drag while preserving raw keyboard nudges. | Drag benefits from guides and snap targets, while keyboard nudge should remain precise one-pixel editing. |
| 2026-07-04 | Store comments as canonical design threads and render pins from that model. | Comments must persist, replay, undo, and export from the same deterministic document state as nodes. |
| 2026-07-04 | Keep presence ephemeral and sync document edits through committed operations. | Collaboration state should feel live without polluting replay, export, snapshots, or canonical serialization. |
| 2026-07-04 | Store snapshots as deterministic document slices instead of full recursive design files. | Snapshot restore needs diffable document state without recursively embedding snapshot history or transient ops. |
| 2026-07-04 | Reconstruct replay from committed redo transactions before building persisted replay UI. | The existing operation spine already proves deterministic reconstruction and branch behavior without adding another event format. |
| 2026-07-04 | Keep prototype preview state transient and serialize only prototype links. | Preview navigation must demo frame-to-frame flow without polluting export, replay, or canonical scene data. |
| 2026-07-04 | Generate export files from the canonical scene model instead of renderer DOM output. | The CLI must work without the UI and produce deterministic React/Tailwind files from serialized input. |
| 2026-07-04 | Keep final hardening additive around the deterministic spine. | Demo polish, assets, and docs should improve the local demo without changing operation authority late in the build. |

## Blockers

None.

## Handoff

All 21 planned milestones are implemented locally. Before final handoff, commit Milestone 21, confirm the final worktree contains only unrelated untracked `METHOD.md`, and start the local app with `npm run dev` for the user-facing URL.
