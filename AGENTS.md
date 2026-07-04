# Design Desk Agent Instructions

## Mission

Build Design Desk as a local-first, demo-ready design editor while preserving engineering rigor. Treat [docs/prompt.md](docs/prompt.md) as the frozen product specification and [docs/plans.md](docs/plans.md) as the milestone contract.

## Hard Boundaries

- Do not read, fetch, clone, browse, summarize, or refer to code or implementation details from `https://github.com/derrickchoi-openai/design-desk`.
- Do not start app scaffolding or feature implementation unless [docs/plans.md](docs/plans.md), [docs/implement.md](docs/implement.md), and [docs/documentation.md](docs/documentation.md) exist and are coherent.
- Do not edit [docs/prompt.md](docs/prompt.md) unless the user explicitly asks to change the source prompt.
- Use only open-source dependencies for the app.
- Keep all runtime behavior fully local. No hosted services are allowed.
- Preserve user work. If the worktree is dirty, inspect changed files first and avoid reverting unrelated changes.

## Control Files

- `docs/prompt.md`: frozen source specification.
- `docs/plans.md`: complete architecture, risk register, demo script, and milestone contract.
- `docs/implement.md`: execution runbook for each milestone.
- `docs/documentation.md`: live milestone ledger, decisions, blockers, and verification evidence.
- `docs/codex-practices.md`: learning guide for long-horizon Codex engineering practice.

## Execution Rules

- Start every milestone by reading the active milestone in `docs/plans.md`, the runbook in `docs/implement.md`, and the current state in `docs/documentation.md`.
- Implement exactly one active milestone scope at a time.
- Update `docs/documentation.md` before implementation with the current milestone, expected scope, and verification plan.
- Run the verification commands listed for the milestone. Fix failures before marking the milestone complete.
- Record verification evidence, important decisions, and known limitations in `docs/documentation.md`.
- Review the diff for scope creep before committing.
- Commit every completed milestone with a clear message, then continue automatically unless blocked by a required product decision, unavailable dependency, or unrecoverable verification failure.

## Engineering Defaults

- Prefer correctness, determinism, and reviewability over feature breadth.
- Use TypeScript strictness and strong domain types for scene graph, operations, collaboration messages, serialization, and export.
- Keep the scene model and operations engine independent from React so tests can verify determinism without the UI.
- Use SVG as the authoritative editable rendering surface. Canvas may be used for previews, thumbnails, minimap, replay preview, or future performance experiments.
- Use a custom deterministic operations journal, server-sequenced WebSocket collaboration, and canonical serialization.
- Keep dependencies lean and focused. Commodity libraries are acceptable for UI primitives, icons, WebSocket transport, drag lists, tests, and property-based checks; core scene, ops, replay, and export logic stay in this repo.

## Verification Expectations

- After app scaffolding exists, normal milestone verification should include `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Add deterministic snapshot checks for serialization, ops replay, and codegen as soon as those systems exist.
- Add Playwright smoke tests once browser-visible flows exist.
- For UI work, verify desktop and mobile-size screenshots when layout risk is high.
