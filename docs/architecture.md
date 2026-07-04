# Design Desk Architecture

Design Desk is a local-first React/Vite editor with a deterministic TypeScript model at its core. The browser UI, local WebSocket server, replay, version history, prototype preview, and export CLI all operate on the same serialized `DesignFile` shape.

## Data Model

- `DesignFile` stores root frames, normalized `nodes`, reusable `components`, threaded `comments`, `prototypeLinks`, named `snapshots`, style tokens, and operation history.
- Scene nodes are typed unions for frames, groups, primitive shapes, text, image placeholders, buttons, icons, charts, component roots, and component instances.
- IDs are deterministic branded strings from `createDeterministicIdFactory`, which keeps tests, snapshots, replay, and export stable.
- `serializeDesign` canonicalizes object keys, omits undefined values, and normalizes finite numbers so identical designs produce identical bytes.

## Operations And History

- User edits are represented as typed operations and grouped into transactions.
- `applyOperation` and `applyTransaction` are React-independent and validate the design after mutations.
- Undo/redo uses inverse transactions computed before applying the original operation.
- Replay reconstructs a design from the initial document plus committed history entries, and branch-from-here creates a clean history at the selected replay step.

## Rendering Pipeline

- SVG is the authoritative editable surface in `SvgCanvas`.
- `SvgScene` renders the normalized model with stable `data-node-*` selectors for selection, tests, and smoke automation.
- Selection, comments, snapping guides, prototype preview, and multiplayer cursors are overlays around the SVG scene rather than alternate scene stores.
- Component instances resolve from hidden component masters at render time so overrides, detach, export, and snapshots use the same component model.

## Collaboration And Persistence

- `npm run dev` starts Vite and a local WebSocket collaboration server.
- The server sequences submitted document operations and persists local JSON session files under gitignored `data/sessions`.
- Presence, cursors, and remote selections are ephemeral; only canonical operations are persisted or replayed.
- A `BroadcastChannel` fallback keeps same-browser local collaboration available when the WebSocket server is not attached to a reused page context.

## Version History And Comments

- Snapshots store deterministic document slices: roots, nodes, components, comments, prototype links, and styles.
- Snapshot restore writes through the operation path and creates a before-restore snapshot for recovery.
- Comment threads are canonical document data, while active comment focus is transient UI state.

## Prototype Preview

- Prototype links serialize as source node, target frame, and click trigger.
- Preview navigation uses transient `previewNodeId` and back-stack state, so previewing does not mutate the canonical document.
- The preview overlay reads hotspots from serialized links and the current frame.

## Export Pipeline

- `npm run export -- --input <design.json> --out <dir>` runs without opening the UI.
- The CLI validates the input design, emits canonical `design.json`, a Vite/React/Tailwind package, root-frame components, reusable component files, and an asset manifest.
- Local image assets are copied when present; missing local assets are recorded without fetching remote services.
- Codegen snapshot tests and generated TSX parse checks guard deterministic output.

## Performance Guardrails

- Drag state is kept in refs and committed as operations at pointer-up to avoid high-frequency document writes.
- Hot-path math for hit testing, snapping, bounds, replay, and export lives outside React components.
- `measurePerformanceGuardrails` tracks node, root-frame, and operation-journal thresholds for the demo starter file.
