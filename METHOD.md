# Design Desk AI Builder Method Log

This file captures the conversation method used to set up the Design Desk long-horizon build. It focuses on exact AI Builder prompts, Codex questions, AI Builder answers, Codex responses, and the explanation for why each exchange mattered.

## Turn 1 - Initial Long-Horizon Build Request

**AI Builder Prompt:**

```markdown
Act as a Forward Deployed Engineer, focused on using Codex as a AI Builder, please refer to [Run long horizon tasks with Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex#try-codex-on-your-own-long-running-task) blog, and coach me on how to run long horizon task to build a sample Design Desk application. 

### Rules
- Do NOT read / refer any codes from GitHub project: [design-desk](https://github.com/derrickchoi-openai/design-desk)
- Create a control system with durable memory files first, starting with [Design Desk prompt](./docs/prompt.md).
- Grill me as many questions (one by one) as you need so as to build common understanding / knowledge on the application. 
- Help me learn most on Codex engineering practices and explain "why" whenever clarifying questions / making decisions.
```

**Codex Response:**

Codex used the `openai-docs` skill, inspected local repo state, read `docs/prompt.md`, confirmed the repo only contained the prompt, confirmed it was not yet a git repo, and avoided the forbidden external GitHub project.

**Explanation:**

This set the operating frame: Codex should behave like a Forward Deployed Engineer, use official Codex long-horizon guidance, build common understanding before implementation, and create durable repo-level control files before app code.

## Turn 2 - Control Surface Decision

**Codex Question:**

Where should the durable control system for Design Desk live?

Options presented:

- Repo docs (Recommended): Create repo-tracked control files such as AGENTS.md, docs/plans.md, docs/implement.md, and docs/documentation.md so every future Codex run can reload the workflow.
- Codex memory: Use local ~/.codex memory-style notes as the main control surface, which helps this machine but is weaker for repo portability and repeatability.
- Both layers: Use repo docs as source of truth and add a small memory note later only for personal recall after the control docs are stable.

**AI Builder Answer:**

```text
Repo docs (Recommended)
```

**Explanation:**

Repo docs were chosen because long-horizon Codex work needs durable, portable, reviewable instructions. Codex local memory can help recall prior context, but it should not be the only source of rules that must always apply.

## Turn 3 - Success Bar Decision

**Codex Question:**

What should the long-horizon Design Desk run optimize for?

Options presented:

- Full prompt (Recommended): Treat docs/prompt.md as the contract and build all listed systems through milestones, with demo slices early but no intentional feature omissions.
- Demo MVP: Prioritize a polished sample app that demonstrates core interactions, while documenting deferred engineering-heavy systems.
- Architecture lab: Focus on deterministic ops, sync, replay, export, and tests, with lighter UI polish and fewer editor affordances.

**AI Builder Answer:**

```text
Full prompt (Recommended)
```

**Explanation:**

This locked the scope to the complete `docs/prompt.md` contract rather than a reduced prototype. That matters because the milestone plan must cover canvas editing, layers, inspector, components, prototype mode, comments, multiplayer, history, replay, export, and tests.

## Turn 4 - Git Policy Decision

**Codex Question:**

Should the plan require initializing git and committing every completed milestone?

Options presented:

- Yes, per milestone (Recommended): Initialize git before scaffolding and require a clean, verified commit after each milestone so progress is resumable and reviewable.
- Git later: Create control docs first but delay git initialization and commits until the app scaffold exists.
- No commits: Keep all work uncommitted, which is simpler initially but weaker for long-horizon recovery and review.

**AI Builder Answer:**

```text
Yes, per milestone (Recommended)
```

**Explanation:**

Milestone commits create recovery points. For a task intended to run for hours, commits make it possible to review, resume, and roll back individual slices without losing unrelated work.

## Turn 5 - Rendering Approach Decision

**Codex Question:**

Which rendering approach should the Design Desk plan use for the editor canvas?

Options presented:

- SVG-first (Recommended): Use SVG for scene nodes, handles, guides, and hit-testing; it is easier to inspect, serialize, test, and export deterministically for this sample app.
- Canvas-first: Use HTML canvas for rendering performance, but accept more custom hit-testing, accessibility, and export complexity.
- Hybrid: Use SVG for editable vector/UI nodes and canvas only for heavier previews or future perf hotspots.

**AI Builder Answer:**

```text
Hybrid
```

**Explanation:**

This identified that the product should not be purely SVG or purely canvas. Codex then narrowed the ambiguity because "hybrid" can mean several very different architectures.

## Turn 6 - Hybrid Rendering Split Decision

**Codex Question:**

What should "hybrid rendering" mean in the plan?

Options presented:

- SVG editor, canvas previews (Recommended): Use SVG as the authoritative editable surface, with canvas reserved for thumbnails, minimap, replay preview, or future perf experiments.
- Canvas editor, SVG overlays: Render nodes on canvas and use SVG/HTML only for selection handles and guides, improving perf but making hit-testing and export harder.
- Dual renderer: Build both SVG and canvas renderers from the same scene model, increasing engineering impressiveness but adding high maintenance risk.

**AI Builder Answer:**

```text
SVG editor, canvas previews (Recommended)
```

**Explanation:**

This made SVG the source of truth for editing while preserving room for canvas where it is useful. That avoids maintaining two full renderers and keeps hit-testing, snapshots, and export more deterministic.

## Turn 7 - Ops And Sync Architecture Decision

**Codex Question:**

Which ops and collaboration architecture should the plan specify?

Options presented:

- Custom ops journal (Recommended): Use a typed deterministic operation log as the source for undo, replay, snapshots, export, and WebSocket sync with documented last-writer conflict rules.
- Yjs CRDT: Use a proven CRDT for realtime collaboration, but add extra mapping work to keep deterministic replay and export from diverging.
- Document patches: Sync whole-document or JSON patch updates, simpler to build but weaker for replay determinism and engineering credibility.

**AI Builder Answer:**

```text
Custom ops journal (Recommended)
```

**Explanation:**

The custom ops journal became the core engineering spine. It lets undo/redo, replay, version history, sync, and export share one deterministic representation.

## Turn 8 - Persistence Model Decision

**Codex Question:**

Where should active Design Desk files and ops journals persist during local development?

Options presented:

- Server JSON store (Recommended): Use the local Node server as the durable store, writing sessions/designs to a gitignored data directory while keeping demo starter files tracked.
- Browser IndexedDB: Keep persistence entirely in the browser, simpler for offline UI but weaker for CLI export and cross-tab/server recovery.
- Server plus IndexedDB: Mirror data in both places for resilience, but add reconciliation complexity that may distract from the core app.

**AI Builder Answer:**

```text
Server JSON store (Recommended)
```

**Explanation:**

Server-side local JSON storage supports multiplayer, local persistence, and CLI export without relying only on browser state.

## Turn 9 - UX Direction Decision

**Codex Question:**

What visual/product direction should the sample Design Desk app use?

Options presented:

- Professional editor (Recommended): A dense, polished Figma-like workspace with restrained styling, strong panels, and practical controls for repeated use.
- Showcase demo: A more cinematic demo surface with bigger visuals and heavier motion, optimized for non-engineer wow factor over day-to-day editor density.
- Engineer-first: A utilitarian tool with visible ops/replay/export/debug panels, prioritizing transparency and correctness over visual polish.

**AI Builder Answer:**

```text
Professional editor (Recommended)
```

**Explanation:**

This guided the UI toward a practical design-tool workspace rather than a marketing page or debug console.

## Turn 10 - Demo Content Decision

**Codex Question:**

What should the built-in demo projects depict?

Options presented:

- AI builder suite (Recommended): Use sample designs for an AI product landing page, analytics dashboard, and mobile assistant flow, matching the Codex AI Builder theme.
- Generic SaaS: Use neutral marketing, dashboard, and mobile app examples that feel broadly professional.
- Creative studio: Use portfolio, e-commerce, and event poster examples with more visual flair and less operational UI.

**AI Builder Answer:**

```text
AI builder suite (Recommended)
```

**Explanation:**

This made the demo content match the learning goal: using Codex as an AI Builder to produce a serious sample application.

## Turn 11 - Dependency Policy Decision

**Codex Question:**

How much should the plan rely on open-source dependencies beyond React, Vite, and Tailwind?

Options presented:

- Lean curated (Recommended): Use small focused libraries for state, icons, drag lists, WebSocket server, tests, and property checks, while custom-building scene/ops/export logic.
- Minimal deps: Avoid most extra libraries and hand-build more UI mechanics, reducing dependency surface but increasing implementation time and risk.
- Use more libs: Adopt more specialized editor/collab libraries, moving faster in places but risking less coherent custom determinism and replay behavior.

**AI Builder Answer:**

```text
Lean curated (Recommended)
```

**Explanation:**

This kept the core intellectual property in the repo while still allowing pragmatic libraries for commodity concerns.

## Turn 12 - Verification Gate Decision

**Codex Question:**

What verification level should each milestone require?

Options presented:

- Full gate (Recommended): Require lint, typecheck, unit tests, deterministic snapshots, and targeted Playwright smoke tests once UI flows exist.
- Core gate: Require lint, typecheck, unit tests, and snapshots, but keep browser automation optional until late milestones.
- Fast gate: Prioritize quick lint/typecheck/unit tests only, reducing wait time but increasing demo regression risk.

**AI Builder Answer:**

```text
Full gate (Recommended)
```

**Explanation:**

The product includes rich browser interactions, multiplayer, replay, and export. Full verification reduces the chance of an impressive-looking demo hiding broken core behavior.

## Turn 13 - Review Cadence Decision

**Codex Question:**

What review cadence should the control docs enforce during implementation?

Options presented:

- Auto-continue with commits (Recommended): Codex completes each milestone, verifies, records evidence, commits, and continues until blocked or the goal is done.
- Stop every milestone: Codex completes and commits one milestone, then waits for your review before starting the next.
- Stop at phase gates: Codex auto-continues within phases but pauses after control docs, scaffold, core editor, collaboration, and export/replay.

**AI Builder Answer:**

```text
Auto-continue with commits (Recommended)
```

**Explanation:**

This selected the true long-horizon workflow. Codex should keep momentum but leave commits and documentation evidence behind for review.

## Turn 14 - Control File Layout Decision

**Codex Question:**

Which control-file layout should the plan use?

Options presented:

- Root plus docs (Recommended): Create root AGENTS.md and root plans.md to honor the prompt, plus docs/implement.md and docs/documentation.md for the runbook and live evidence log.
- All under docs: Keep plans.md as docs/plans.md with docs/implement.md and docs/documentation.md, cleaner docs folder but less literal to the prompt.
- plans.md only: Put all planning, runbook, decisions, and evidence in one root plans.md, simpler but harder to maintain over long runs.

**AI Builder Answer:**

```text
None of the above
user_note: Root plus docs (Recommended) option, but plans.md should be in 'docs/' folder.
```

**Explanation:**

This set the final control layout: root `AGENTS.md` plus `docs/plans.md`, `docs/implement.md`, `docs/documentation.md`, and `docs/codex-practices.md`. The important correction was that the canonical plan should live under `docs/`.

## Turn 15 - Milestone Granularity Decision

**Codex Question:**

How granular should the milestone plan be?

Options presented:

- 18-22 milestones (Recommended): Use smaller milestones than the prompt minimum so each commit has a focused scope, verification block, and clear rollback point.
- 14 milestones: Use the minimum required count, reducing planning overhead but making each implementation chunk larger.
- 30+ milestones: Make very small increments, improving reviewability but increasing control-log overhead during a long run.

**AI Builder Answer:**

```text
18-22 milestones (Recommended)
```

**Explanation:**

This balanced autonomy and reviewability. The final contract used 21 milestones.

## Turn 16 - Asset Policy Decision

**Codex Question:**

What asset policy should the plan use for built-in demo projects?

Options presented:

- Local generated assets (Recommended): Create checked-in local SVG/PNG demo assets and reference them by local paths so demos work offline and look intentional.
- Vector-only assets: Use only shapes, text, icons, and charts; simpler and deterministic but less visually rich.
- Remote image URLs: Use remote image URLs for image nodes, fastest to build but weaker for offline reliability and violates the fully-local spirit.

**AI Builder Answer:**

```text
Local generated assets (Recommended)
```

**Explanation:**

This supports the fully local requirement and makes the demo reliable without network access.

## Turn 17 - Server Authority Decision

**Codex Question:**

How should the local collaboration server order and resolve edits?

Options presented:

- Server sequencer (Recommended): Clients send optimistic ops, the server assigns canonical sequence numbers, broadcasts them, and resolves conflicts with documented last-writer rules.
- Client timestamps: Clients assign timestamps and resolve locally, simpler server but more risk of divergent replay between tabs.
- Lock on edit: Avoid conflicts by locking selected nodes while users edit, easier consistency but less realistic collaborative behavior.

**AI Builder Answer:**

```text
Server sequencer (Recommended)
```

**Explanation:**

This prevents divergent client histories and gives replay a canonical order.

## Turn 18 - ID Strategy Decision

**Codex Question:**

Which ID strategy should the plan require?

Options presented:

- Seeded deterministic IDs (Recommended): Generate IDs from design/session seed plus typed counters, and persist allocated IDs inside ops so replay reconstructs the same graph.
- Random IDs in ops: Use random IDs when creating nodes but store them in the operation log, simpler but less elegant for deterministic test fixtures.
- Server-assigned IDs: Let the local server assign creation IDs, improving multiplayer order but making offline/client-only creation more coupled to the server.

**AI Builder Answer:**

```text
Seeded deterministic IDs (Recommended)
```

**Explanation:**

Stable IDs make snapshots, replay, export, and tests deterministic.

## Turn 19 - Export Shape Decision

**Codex Question:**

What should `npm run export -- --input <design.json> --out <dir>` generate?

Options presented:

- Component package (Recommended): Generate deterministic React component files, shared style tokens, assets, and an index export that can be imported into another app.
- Runnable mini app: Generate a standalone Vite app preview for the design, easier to open immediately but heavier and noisier as codegen output.
- Single component file: Generate one TSX file for simplicity, but lose clean component structure when Design Desk components exist.

**AI Builder Answer:**

```text
Component package (Recommended)
```

**Explanation:**

This gives the export feature engineering credibility: reusable generated components rather than a one-off preview.

## Turn 20 - Codex Run Surface Decision

**Codex Question:**

How should the plan tell you to run the long-horizon build?

Options presented:

- Local /goal (Recommended): Use Codex locally in this workspace with a persistent /goal, one repo, one branch, verified commits, and no dependency on GitHub push setup.
- Local milestone prompts: Run one normal Codex prompt per milestone, easier to supervise but less autonomous.
- Cloud tasks later: After git setup and first commits, push to GitHub and offload milestone branches to Codex cloud for parallel work.

**AI Builder Answer:**

```text
Local /goal (Recommended)
```

**Explanation:**

This selected local goal mode for the long run. The repo stays on one branch with direct access to local files and verification commands.

## Turn 21 - Learning Artifact Decision

**Codex Question:**

Should the control system include a Codex practice guide for you?

Options presented:

- Add practice guide (Recommended): Create docs/codex-practices.md with the long-horizon workflow, /goal prompt, control-file roles, checkpoint habits, and why each exists.
- Fold into runbook: Put the coaching notes inside docs/implement.md only, fewer files but less focused as a learning reference.
- No guide: Keep the repo focused on implementation control files and leave coaching in this thread only.

**AI Builder Answer:**

```text
Add practice guide (Recommended)
```

**Explanation:**

This created a durable learning artifact, not just implementation instructions.

## Turn 22 - Milestone Order Decision

**Codex Question:**

Which implementation order should the milestone plan follow?

Options presented:

- Deterministic spine first (Recommended): Build data model, ops, serialization, persistence, and a simple renderer early, then layer UI features on a stable foundation.
- Demo UI first: Build the visible editor shell and interactions early, then retrofit ops/replay/export architecture later.
- Collab first: Build WebSocket sessions and presence around a minimal scene first, then expand editor features.

**AI Builder Answer:**

```text
Deterministic spine first (Recommended)
```

**Explanation:**

This prevents replay, export, sync, and undo/redo from becoming separate systems bolted onto UI state later.

## Turn 23 - Plan Depth Decision

**Codex Question:**

How broad should the final proposed plan be?

Options presented:

- Control plus build plan (Recommended): Specify the control files to create first and the app milestone architecture they will govern, so implementation can start immediately after plan approval.
- Control files only: Plan only AGENTS.md and docs control artifacts, then run a second planning pass for the app itself.
- Full spec deep dive: Produce a very detailed app implementation spec, useful for handoff but heavier than needed before the control files exist.

**AI Builder Answer:**

```text
Control files only
```

**Explanation:**

This kept the first implementation step focused: create the control system, not the app.

## Turn 24 - `docs/plans.md` Completeness Decision

**Codex Question:**

What should `docs/plans.md` contain in the first control-system pass?

Options presented:

- Complete contract (Recommended): Write the 18-22 milestone plan, architecture choices, risk register, demo script, and verification expectations before any scaffold work.
- Template only: Create headings and required fields now, then ask Codex to fill the actual milestones in a later planning task.
- Phase 1 only: Plan only through scaffold and core deterministic spine, leaving later milestones to be planned after implementation feedback.

**AI Builder Answer:**

```text
Complete contract (Recommended)
```

**Explanation:**

This reconciled "control files only" with the need for a real long-horizon contract. The control pass would create the complete milestone plan, but no app code.

## Turn 25 - Reasoning Profile Decision

**Codex Question:**

What Codex reasoning profile should the control docs recommend for this build?

Options presented:

- High or Extra High (Recommended): Use high reasoning for normal milestones and extra high for architecture, sync, replay, export, and difficult debugging.
- Medium default: Use medium reasoning for speed and only escalate manually when Codex gets stuck.
- Extra High always: Maximize deliberation throughout the run, useful for complex work but slower for routine UI milestones.

**AI Builder Answer:**

```text
High or Extra High (Recommended)
```

**Explanation:**

This created a practical reasoning policy: spend more reasoning where architectural mistakes are expensive, but avoid unnecessary slowness for routine work.

## Turn 26 - Proposed Control-System Plan

**Codex Response:**

Codex produced a proposed plan with the title `Design Desk Control System Plan`. The plan specified:

- create only the durable control layer first
- initialize git
- create `AGENTS.md`
- create `docs/plans.md`
- create `docs/implement.md`
- create `docs/documentation.md`
- create `docs/codex-practices.md`
- encode all decisions from the interview
- define a 21-milestone skeleton
- verify the control docs

**AI Builder Answer:**

```text
No direct answer in this turn. The proposed plan became the implementation target for the next prompt.
```

**Explanation:**

This was the handoff from planning to execution. It was intentionally decision-complete so the next step could be "implement the plan" without reopening major choices.

## Turn 27 - Implement The Control-System Plan

**AI Builder Prompt:**

```text
Implement the plan.
```

**Codex Response:**

Codex implemented the control-system baseline and reported:

```text
Implemented the control-system baseline and committed it.

Created AGENTS.md, .gitignore, docs/plans.md, docs/implement.md, docs/documentation.md, and docs/codex-practices.md. The plan includes 21 milestones, architecture overview, risk register, demo script, verification matrix, and the local /goal prompt.

Git is initialized and the baseline commit is 55d4ad0 chore: establish design desk control system. Final checks passed: worktree is clean, required guardrails are present, and docs/prompt.md was committed as the original source spec without edits. The ledger now points to Milestone 2, Repo Scaffold And Tooling.
```

**Explanation:**

This created the durable control system as a real repo baseline. The important outcomes were a clean git checkpoint, a live ledger, and a next milestone.

## Turn 28 - Ask For `/goal` Coaching

**AI Builder Prompt:**

```text
Next, I want to run a long-horizon task to build the application. Please coach me how to use `/goal` to kick off the task, focus on using control-system files, providing rich context, and sample prompt(s) with explanation.
```

**Codex Response:**

Codex recommended launching from the repo root:

```bash
codex --cd /Users/tomliu/workspace/codex/my-design-desk-2
```

Codex recommended confirming a clean repo:

```bash
git status --short
```

Codex then provided this recommended `/goal` prompt:

```text
/goal Continue the Design Desk build in /Users/tomliu/workspace/codex/my-design-desk-2. Follow AGENTS.md and docs/implement.md exactly. Treat docs/prompt.md as the frozen product spec and docs/plans.md as the milestone contract. Start from the current milestone recorded in docs/documentation.md. Do not read, fetch, clone, browse, summarize, inspect, or refer to https://github.com/derrickchoi-openai/design-desk or any of its code.

Use the repo control system as durable memory:
- AGENTS.md defines hard boundaries and engineering defaults.
- docs/prompt.md defines the frozen product requirements.
- docs/plans.md defines the architecture, risk register, demo script, and 21 milestone contract.
- docs/implement.md defines the milestone execution loop.
- docs/documentation.md is the live ledger for current state, decisions, verification evidence, blockers, and handoff notes.
- docs/codex-practices.md explains the long-horizon Codex practices to preserve.

For each milestone: reread the control docs, inspect git status, update docs/documentation.md before work, implement only that milestone scope, run required verification, fix failures, record exact evidence and decisions, review the diff for scope creep, commit with the milestone message from docs/plans.md, then continue milestone-by-milestone unless blocked by a required product decision, denied access, or unrecoverable verification issue.

Done when all 21 milestones in docs/plans.md are complete, verification passes, docs/documentation.md has final evidence, the app runs locally with one command, and the final Design Desk demo/export/replay/multiplayer flow is working.
```

Codex also provided this safer one-milestone variant:

```text
/goal Execute exactly Milestone 2, Repo Scaffold And Tooling, from docs/plans.md. Follow AGENTS.md and docs/implement.md. Treat docs/prompt.md as frozen and docs/documentation.md as the live ledger. Do not read or refer to the external design-desk GitHub project. Update docs/documentation.md before and after work, scaffold only the tooling/server/editor shell scope for Milestone 2, run the required verification, fix failures, commit with the Milestone 2 commit message, then stop for my review.
```

Codex also suggested steering prompts:

```text
Give me a brief status update, then continue from docs/documentation.md.
```

```text
Pause after the current milestone commit and wait for review.
```

```text
Keep going, but use Extra High reasoning for the sync, replay, and export milestones.
```

```text
Before continuing, review the last commit against docs/plans.md for scope creep and summarize any risks.
```

**Explanation:**

This turned the control system into an executable long-horizon prompt. The key practice is to keep the `/goal` short enough to be usable but rich enough to route Codex to the durable files and completion criteria.

## Turn 29 - Ask To Capture The Method

**AI Builder Prompt:**

```text
I want to review our conversation from the very beginning, focus on capturing the exact prompts, questions & answers in our conversations. For each turn, please mark mine with "AI Builder Prompt (or Answer):", and your response with "Codex Response (or Question):". For my prompts/answers, please put them as proper notes using ```...``` in markdwon format. In addition, please capture the explanation on each. Last, save them into METHOD.md.
```

**Codex Response:**

Codex created this `METHOD.md` file as a structured method log with exact AI Builder prompts, exact Codex interview questions, exact AI Builder answers, and explanations.

**Explanation:**

This file is now a reusable learning artifact. It shows how the project moved from an initial fuzzy long-horizon request into durable controls, implementation constraints, a baseline commit, and an actionable `/goal`.

## Practical Pattern Extracted

**AI Builder Prompt:**

```text
Use Codex as an AI Builder by first creating durable control files, then running a local /goal that points Codex back to those files every milestone.
```

**Codex Response:**

The reusable pattern is:

1. Start with a rich product prompt in `docs/prompt.md`.
2. Create durable control files before app code.
3. Ask product and architecture questions until the plan is decision-complete.
4. Encode decisions in `AGENTS.md`, `docs/plans.md`, `docs/implement.md`, and `docs/documentation.md`.
5. Initialize git and commit the control baseline.
6. Start a long-horizon `/goal` that names the control files and defines done.
7. Let Codex implement milestone by milestone with verification and commits.
8. Steer with short messages that preserve the control system.

**Explanation:**

This is the core method to reuse for future AI Builder projects. The value is not just the prompt; it is the control loop around the prompt.

## Turn 30 - Start The Full `/goal` Execution

**AI Builder Prompt:**

```text
/goal Continue the Design Desk build in /Users/tomliu/workspace/codex/my-design-desk-2. Follow AGENTS.md and docs/implement.md exactly. Treat docs/prompt.md as the frozen product spec and docs/plans.md as the milestone contract. Start from the current milestone recorded in docs/documentation.md. Do not read, fetch, clone, browse, summarize, inspect, or refer to https://github.com/derrickchoi-openai/design-desk or any of its code.

Use the repo control system as durable memory:
- AGENTS.md defines hard boundaries and engineering defaults.
- docs/prompt.md defines the frozen product requirements.
- docs/plans.md defines the architecture, risk register, demo script, and 21 milestone contract.
- docs/implement.md defines the milestone execution loop.
- docs/documentation.md is the live ledger for current state, decisions, verification evidence, blockers, and handoff notes.
- docs/codex-practices.md explains the long-horizon Codex practices to preserve.

For each milestone: reread the control docs, inspect git status, update docs/documentation.md before work, implement only that milestone scope, run required verification, fix failures, record exact evidence and decisions, review the diff for scope creep, commit with the milestone message from docs/plans.md, then continue milestone-by-milestone unless blocked by a required product decision, denied access, or unrecoverable verification issue.

Done when all 21 milestones in docs/plans.md are complete, verification passes, docs/documentation.md has final evidence, the app runs locally with one command, and the final Design Desk demo/export/replay/multiplayer flow is working.
```

**Codex Response:**

Codex accepted the `/goal` and treated it as the durable execution objective. It followed the repo control system rather than chat memory alone, inspected `git status`, preserved the untracked `METHOD.md`, and continued from the milestone recorded in `docs/documentation.md`.

**Explanation:**

This was the shift from planning/coaching into autonomous milestone execution. The prompt was effective because it named the authoritative files, the forbidden external repository rule, the per-milestone loop, and the exact final definition of done.

## Turn 31 - Resume From Another Model Handoff

**AI Builder Prompt:**

```text
Another language model started to solve this problem and produced a summary of its thinking process. You also have access to the state of the tools that were used by that language model. Use this to build on the work that has already been done and avoid duplicating work.
```

**Codex Response:**

Codex used the handoff as a guide but treated the current worktree as authoritative. It checked `git status`, reread the active milestone, reread the implementation runbook, reread the live ledger, and confirmed that M19 was in progress with partial prototype work and a known type/lint issue.

**Explanation:**

This demonstrates a key long-horizon practice: use summaries to orient quickly, but verify against the actual repository before acting. That prevents duplicated work and protects user changes.

## Turn 32 - Complete Milestone 19: Prototype Links And Preview Navigation

**Codex Response:**

Codex fixed the M19 compile issue by threading the preview back-stack count through `WorkspaceLayout` and `CanvasShell`. It then improved the milestone implementation so preview navigation was not only a panel state change:

- Added deterministic prototype link helpers and tests.
- Added frame lookup and hotspot extraction.
- Added a second root frame, `AI Builder dashboard frame`, so the demo had real frame-to-frame navigation.
- Added a prototype panel for selecting a hotspot, linking it to a target frame, starting preview, and going back.
- Added a preview overlay that lists clickable hotspots and navigates using serialized prototype links.
- Added validation that prototype link targets must be frames.
- Updated Playwright to create a prototype link, start preview, click the hotspot, navigate to the dashboard frame, and back out.

**Verification Captured:**

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e -- --workers=1
```

Final M19 browser verification passed with 14 Playwright tests after fixing prototype panel pointer interception over existing canvas flows.

**Commit:**

```text
7e0f64d feat: add prototype preview navigation
```

**Explanation:**

M19 showed why acceptance criteria should be interpreted as user-visible behavior, not only internal state. The first version technically stored links, but the final version made preview navigation demo-ready and kept preview state transient so it did not pollute the canonical design file.

## Turn 33 - Complete Milestone 20: Deterministic React/Tailwind Export CLI

**Codex Response:**

Codex replaced the export scaffold with a real local CLI and pure deterministic codegen:

- `npm run export -- --input <design.json> --out <dir>` reads and validates a serialized design.
- Export emits canonical `design.json`, `package.json`, `tailwind.config.js`, `index.html`, `src/App.tsx`, `src/main.tsx`, `src/index.css`, frame components, reusable component files, and an asset manifest.
- Codegen is independent from the browser/editor UI.
- Image assets are copied locally when present and recorded in the manifest when missing.
- Generated TSX is parsed in tests.
- Export snapshots prove deterministic output.

**Verification Captured:**

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run export -- --input /tmp/design-desk-export-smoke/input.json --out /tmp/design-desk-export-smoke/out-a
npm run export -- --input /tmp/design-desk-export-smoke/input.json --out /tmp/design-desk-export-smoke/out-b
diff -ru /tmp/design-desk-export-smoke/out-a /tmp/design-desk-export-smoke/out-b
```

Some `tsx` commands needed elevated execution because the sandbox blocked the local IPC pipe. After approval, the export smoke passed and the two output directories were identical.

**Commit:**

```text
b607d61 feat: add deterministic export pipeline
```

**Explanation:**

M20 validated the earlier architecture choice to keep the canonical model independent from React. The CLI could generate React/Tailwind output from serialized JSON without opening the UI because scene state, serialization, component resolution, and export logic were not tied to browser state.

## Turn 34 - Complete Milestone 21: Demo Projects, Polish, Performance, Final Hardening

**Codex Response:**

Codex finished the final hardening milestone:

- Added `docs/architecture.md` describing the implemented data model, rendering pipeline, operations/history, sync, replay, prototype preview, export, and performance guardrails.
- Added a tracked local SVG demo asset at `public/assets/demo-preview-placeholder.svg`.
- Updated the starter design to reference the tracked local asset.
- Added demo project metadata for AI Builder Suite, Ops Dashboard, and Mobile Assistant.
- Added demo-mode banner and a session-aware local share link.
- Expanded local toast and shortcut modal affordances.
- Added performance guardrail helpers and tests for node/root/operation thresholds.
- Updated export snapshots for the tracked SVG asset.

**Verification Captured:**

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e -- --workers=1
npm run export -- --input /tmp/design-desk-export-smoke/input-m21.json --out /tmp/design-desk-export-smoke/out-m21
curl -fsS http://127.0.0.1:5173/
curl -fsS http://127.0.0.1:8787/health
```

Final test state:

```text
21 Vitest files passed, 51 tests passed.
14 Playwright tests passed.
Export smoke copied public/assets/demo-preview-placeholder.svg and recorded copied: true.
Vite responded at http://127.0.0.1:5173/.
Collaboration server health responded at http://127.0.0.1:8787/health.
```

**Commit:**

```text
c998577 feat: finalize demo projects and hardening
```

**Explanation:**

M21 was intentionally additive. It improved the demo surface, tracked assets, documentation, and guardrails without changing the deterministic scene/ops/replay/sync/export spine late in the build.

## Turn 35 - Final `/goal` Completion Summary

**Codex Response:**

Codex marked the long-running goal complete after proving the requested final state:

- All 21 milestones in `docs/plans.md` were implemented.
- Milestones were documented in `docs/documentation.md`.
- The final app ran locally with `npm run dev`.
- The web app responded on `http://127.0.0.1:5173/`.
- The collaboration server responded on `http://127.0.0.1:8787/health`.
- The final demo/export/replay/multiplayer flows were covered by Playwright, unit tests, and export smoke.
- `docs/prompt.md` remained untouched.
- The existing untracked `METHOD.md` was preserved outside milestone commits.

**Goal Usage Summary:**

```text
Goal usage: 44,410,080 tokens, about 3h 51m elapsed.
```

**Final Commit Set From This Execution Slice:**

```text
7e0f64d feat: add prototype preview navigation
b607d61 feat: add deterministic export pipeline
c998577 feat: finalize demo projects and hardening
```

**Explanation:**

This was the completion audit for the long-horizon run. Codex did not mark the goal complete merely because work looked plausible; it checked commits, verification commands, docs, local runtime, server health, and worktree state before closing the goal.

## Turn 36 - Capture The Rest Of The Conversation

**AI Builder Prompt:**

```text
capture the rest of conversation into METHOD.md, and please put a summary section to mention the `/goal` execution - Goal usage: 44,410,080 tokens, about 3h 51m elapsed.
```

**Codex Response:**

Codex appended this continuation section to `METHOD.md`, covering the `/goal` execution, the handoff, Milestones 19 through 21, final verification, final commits, local runtime checks, and the requested goal usage summary.

**Explanation:**

This keeps the method log current after the long-horizon build completed. The file now documents both the initial AI Builder coaching method and the execution method that carried the app through the final milestones.

## Post-Goal UI/UX Hardening Notes

This section captures the follow-up learning after the long-horizon build completed. The purpose is to show how an AI Builder can use a direct one-shot intelligence prompt to discover product UX gaps, then use Plan Mode to turn those gaps into a decision-complete UX testing and fixing plan.

## Turn 37 - Discover A UX Gap From An App-Usage Question

**AI Builder Prompt:**

```text
Help me understand how to use the application. Why I can NOT close small windows, e.g. 'Comments', 'Version History', 'Replay', etc.
```

**Codex Response:**

Codex inspected the workspace layout and panel components, then explained that the issue was not user error. `Comments`, `Version history`, and `Replay` were implemented as always-mounted workspace panels. They had no `open`, `onClose`, or collapsed-state props, so there was no UI state that could close them.

Codex also explained how the panels were intended to be used:

- `Comments`: enable comment mode, click the canvas to create a pin, then reply, resolve/reopen, or jump back to the pin.
- `Version history`: create named snapshots and restore them.
- `Replay`: scrub operation history, step through edits, play/pause, and branch from a replay step.

**Explanation:**

This was a useful example of one-shot intelligence prompting after a long-horizon run. The AI Builder did not file a formal bug or provide implementation details. A simple product-usage question surfaced a real UX gap: the app had demo-ready advanced features, but the panels behaved like permanent overlays rather than controllable tools.

The important lesson is that long-horizon verification can prove many engineering properties while still missing everyday usability problems. Playwright covered comments, version history, and replay flows, but it did not ask whether a user could dismiss those panels after using them.

## Turn 38 - Use Plan Mode For A UX/UI Audit And Fix Strategy

**AI Builder Prompt:**

```text
Act as UX and UI designer, think about critical 5 use cases for the application, then, conduct the UX testing. When issues found, please conduct investigation, make informed decision per durable control system files, and implement fix, then execute the related verification. In addition, please fix the UX gap - close behavior was not implemented.
```

**Codex Response:**

Codex was in Plan Mode, so it did not immediately mutate files. It first grounded the task in the repo:

- Read the durable control files: `AGENTS.md`, `docs/plans.md`, `docs/implement.md`, and `docs/documentation.md`.
- Inspected current UI implementation and tests.
- Ran existing Playwright coverage to understand what was already verified.
- Captured desktop and mobile screenshots for visual UX evidence.
- Noted a second issue during testing: a malformed local `data/sessions/local-demo.json` could crash the collaboration server.

Codex identified five critical use cases for the UX audit:

1. First open and orientation.
2. Canvas creation and editing.
3. Comments review.
4. Version history and replay recovery.
5. Local collaboration and demo handoff.

The audit found these issues:

- Advanced panels were always visible and not closeable.
- Desktop and mobile layouts were cluttered by simultaneous comments, history, replay, and creation controls.
- Top-toolbar creation icons looked interactive but were not wired to the actual canvas creation state.
- Mobile bottom controls were visually present but not functionally meaningful.
- The collaboration server could fail hard on malformed local session JSON.

Codex then asked one product-tradeoff question and the AI Builder chose:

```text
Canvas first (Recommended)
```

That choice became the UX direction: advanced panels should be closed by default, opened intentionally, closeable, and rendered one at a time.

**Proposed Plan Summary:**

```text
Add canvas-first panel state in WorkspaceLayout.
Add open/close controls for Comments, Version history, and Replay.
Add Escape dismissal.
Wire toolbar creation controls to the actual canvas active tool state.
Make mobile show one advanced panel sheet at a time.
Harden local session loading and WebSocket message parsing.
Add Playwright and server tests.
Run lint, typecheck, unit tests, build, e2e, local runtime smoke, and screenshots.
```

**Explanation:**

Plan Mode changed the quality of the work. Without Plan Mode, Codex could have simply added close buttons. That would have fixed the symptom but missed the broader workspace-density and mobile-usability problems.

Plan Mode forced the task through a better sequence:

1. Read the control system.
2. Inspect current behavior.
3. Define critical UX use cases.
4. Gather visual and test evidence.
5. Identify issues beyond the named symptom.
6. Ask for the key product direction.
7. Produce a decision-complete implementation plan.

For AI Builders, the pattern is: use a one-shot intelligence prompt to surface a problem, then use Plan Mode when the fix has product, UX, testing, or architecture tradeoffs.

## Turn 39 - Implement The UX Hardening Plan

**AI Builder Prompt:**

```text
Implement the plan.
```

**Codex Response:**

Codex returned to Default mode and implemented the planned UX hardening. It followed the durable control system by checking the worktree, updating `docs/documentation.md` before implementation, making scoped changes, running verification, recording evidence, reviewing the diff, and committing the result.

The implementation changed the app behavior:

- `Comments`, `Version history`, and `Replay` are now closed by default.
- Each advanced panel opens intentionally from the toolbar or mobile bottom controls.
- Each advanced panel has a close button.
- `Escape` closes the active advanced panel.
- Mobile shows one advanced panel sheet at a time.
- The top toolbar creation controls now drive the real canvas active tool state.
- Less common creation tools moved into a compact `More` menu.
- The collaboration server now quarantines malformed local session JSON and creates a fresh starter session.
- Invalid WebSocket JSON is rejected without crashing the local server.

**Verification Captured:**

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e -- --workers=1
curl -fsS http://127.0.0.1:5173/
curl -fsS http://127.0.0.1:8787/health
```

Final test state:

```text
21 Vitest files passed, 53 tests passed.
14 Playwright tests passed.
Web app responded at http://127.0.0.1:5173/.
Collaboration server health responded at http://127.0.0.1:8787/health.
Desktop screenshot: /tmp/design-desk-ux-final-desktop-3.png
Mobile screenshot: /tmp/design-desk-ux-final-mobile-2.png
```

**Commit:**

```text
4922d77 fix: improve workspace panel usability
```

**Explanation:**

This follow-up showed a mature long-horizon workflow after the main build was already complete. The durable control system still mattered: it guided the fix toward local-first behavior, transient UI state for panels/tools, no changes to the frozen prompt, updated evidence in `docs/documentation.md`, and full verification before committing.

The bigger learning is that long-horizon task result notes should include post-build UX findings, not only milestone completion. A completed app can pass tests and still need product-quality review. The AI Builder's job is to keep asking: can a real user understand, control, recover, and continue?

## Pattern Extracted - One-Shot Prompt Plus Plan Mode

**AI Builder Prompt Pattern:**

```text
First, ask a direct product-usage question to trigger one-shot diagnosis.
Then, when the issue affects UX, product behavior, or testing strategy, switch to Plan Mode.
Ask Codex to act as a UX/UI expert, identify critical use cases, test the experience, investigate issues, ground decisions in durable control files, propose a decision-complete plan, and only then implement.
```

**Reusable Workflow:**

1. Use the app as a user and ask a natural question about confusion or friction.
2. Let Codex inspect the actual implementation and explain whether the issue is user error, missing UX, or a real bug.
3. Use Plan Mode for broader UX/UI testing instead of immediately patching the first symptom.
4. Define 5 critical use cases before deciding what to fix.
5. Gather evidence from code, tests, screenshots, and runtime checks.
6. Make one explicit product-direction choice when tradeoffs exist.
7. Implement only after the plan is decision-complete.
8. Verify with static checks, unit tests, Playwright, runtime smoke checks, and screenshots.
9. Record the result in durable notes so future AI Builders learn from both the success and the gap.

**Why This Matters:**

The original long-horizon run proved Codex could build a complex local-first app through milestones. The UX hardening follow-up proved a second lesson: long-horizon completion is not the end of product judgment. One-shot intelligence is useful for quickly discovering gaps, while Plan Mode is useful for turning those gaps into structured UX testing, informed decisions, implementation, and verification.
