# Design Desk Implementation Runbook With UX Gate

This runbook controls every Design Desk milestone after the control system exists. It is written for long-horizon Codex execution with an added lightweight UX gate for browser-visible work.

## Source Of Truth

- `docs/prompt.md` is the frozen product spec.
- `docs/plans.md` is the milestone contract.
- `docs/documentation.md` is the live state and evidence ledger.
- `docs/implement-with-ux-fix.md` is the UX-hardened execution runbook.
- `AGENTS.md` is the repo-level instruction surface Codex loads automatically.

If files disagree, follow this order: direct user instruction, `AGENTS.md`, `docs/prompt.md`, `docs/plans.md`, `docs/implement-with-ux-fix.md`, then `docs/documentation.md`.

## Forbidden Source Rule

Do not read, fetch, clone, browse, summarize, inspect, or rely on code or implementation details from `https://github.com/derrickchoi-openai/design-desk`.

Allowed sources include this repository, official OpenAI Codex documentation, package documentation for chosen open-source dependencies, and original implementation work produced in this repo.

## Start Of Every Milestone

1. Read `AGENTS.md`.
2. Read the active milestone in `docs/plans.md`.
3. Read `docs/documentation.md` to confirm current state.
4. Read `docs/prompt.md` only as needed to confirm source requirements.
5. Run `git status --short`.
6. If the worktree is dirty, inspect changed files before editing. Preserve user work and avoid reverting unrelated changes.
7. Update `docs/documentation.md` with:
   - active milestone
   - intended scope
   - verification commands
   - UX gate items when the milestone changes browser-visible behavior
   - known risks or blockers

## Implementation Loop

- Implement only the active milestone.
- Prefer small, cohesive modules over broad unstructured changes.
- Keep deterministic model, ops, serialization, replay, and export logic independent from React.
- Keep UI work consistent with a professional editor: dense, predictable, restrained, and built for repeated use.
- Add tests in the same milestone as risky behavior.
- Do not defer verification to a later milestone unless `docs/plans.md` explicitly says the needed test surface does not exist yet.

## Verification Loop

Run the commands listed in the active milestone.

Expected baseline once scaffolding exists:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Add these when relevant:

```bash
npm run test:e2e
npm run export -- --input <design.json> --out <dir>
```

If a command fails:

1. Diagnose the failure.
2. Make the smallest compatible fix.
3. Re-run the failed command.
4. Re-run any dependent checks that could be affected.
5. Record the failure and final passing evidence in `docs/documentation.md`.

## UX Gate For Browser-Visible Work

Run this gate for any milestone that changes visible UI, interaction behavior, panels, modals, toolbars, canvas controls, mobile layout, workflow navigation, or the demo flow.

Before implementation:

- Identify the affected critical workflow: first open/orientation, canvas creation/editing, comments review, version/replay recovery, or local collaboration/demo handoff.
- Record the planned UX checks in `docs/documentation.md` alongside the normal verification plan.

During implementation and review:

- Verify control lifecycle: default state, open, close/dismiss, Escape behavior where applicable, mode exit, and switching between related tools or panels.
- Verify visible controls are real: every visible button, toolbar item, tab, menu, or mobile control is either wired to behavior or intentionally disabled or hidden.
- Verify layout ergonomics: no incoherent overlap, horizontal overflow, text clipping, or persistent panel obstruction on desktop and mobile viewports.
- Preserve canvas-first editing: advanced panels should not permanently cover the primary design surface unless the active workflow requires it.
- Keep transient UI state transient: panel visibility, active tool, modal state, preview navigation, and focus state should not pollute serialization, replay, export, or the deterministic operation journal.

Verification evidence:

- Add or update Playwright coverage for the UX behavior when it can be asserted reliably.
- Capture desktop and mobile screenshots for UI-affecting milestones.
- Record screenshot paths, Playwright coverage, manual UX findings, accepted limitations, and any product decisions in `docs/documentation.md`.

## Documentation Updates

Before work:

- Set the current milestone and planned verification.
- Include planned UX gate checks when the milestone changes browser-visible behavior.

After work:

- Mark the milestone complete only after verification passes or a limitation is explicitly accepted by the user.
- Record exact commands run and outcome.
- Record important decisions and tradeoffs.
- Record UX gate evidence for browser-visible work.
- Record known limitations and follow-up work.
- Set the next milestone.

## Diff Review

Before every commit:

1. Run `git diff --stat`.
2. Review the diff for files outside the milestone scope.
3. If scope creep exists, either revert only your own unrelated changes or document why the change is required.
4. Confirm `docs/documentation.md` has current evidence.
5. Confirm `docs/prompt.md` was not edited unless explicitly requested.
6. Confirm browser-visible work includes the UX gate evidence or a documented reason the gate did not apply.

## Commit Policy

- Commit every completed milestone.
- Use the commit message listed in `docs/plans.md`.
- Keep commits reviewable and tied to a single milestone.
- Do not commit broken verification unless the user explicitly accepts the failure and `docs/documentation.md` records it.

## Stop Conditions

Stop and ask the user only when:

- A product decision is required and reasonable defaults would create meaningful rework.
- Required network or filesystem access is denied and approval is needed.
- Verification is blocked by an external issue that cannot be fixed locally.
- UX verification exposes a product-direction tradeoff that reasonable defaults cannot settle.
- The user changes scope or asks Codex to pause.
- Continuing would require reading the forbidden external Design Desk repository.

Otherwise continue automatically after each verified milestone commit.

## Recommended Local Goal

```text
/goal Continue the Design Desk build in /Users/tomliu/workspace/codex/my-design-desk-2. Follow AGENTS.md and docs/implement-with-ux-fix.md exactly. Treat docs/prompt.md as the frozen product spec and docs/plans.md as the milestone contract. Start from the current milestone recorded in docs/documentation.md. Do not read or refer to https://github.com/derrickchoi-openai/design-desk or any of its code. For each milestone: reread the control docs, inspect git status, update docs/documentation.md before work, implement only that milestone scope, run required verification and the UX gate for browser-visible work, fix failures, record evidence and decisions, review the diff for scope creep, commit with the milestone message, then continue milestone-by-milestone unless blocked by a required product decision or unrecoverable verification issue.
```
