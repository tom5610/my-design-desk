# Design Desk Implementation Runbook

This runbook controls every Design Desk milestone after the control system exists. It is written for long-horizon Codex execution.

## Source Of Truth

- `docs/prompt.md` is the frozen product spec.
- `docs/plans.md` is the milestone contract.
- `docs/documentation.md` is the live state and evidence ledger.
- `AGENTS.md` is the repo-level instruction surface Codex loads automatically.

If files disagree, follow this order: direct user instruction, `AGENTS.md`, `docs/prompt.md`, `docs/plans.md`, `docs/implement.md`, then `docs/documentation.md`.

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

## Documentation Updates

Before work:

- Set the current milestone and planned verification.

After work:

- Mark the milestone complete only after verification passes or a limitation is explicitly accepted by the user.
- Record exact commands run and outcome.
- Record important decisions and tradeoffs.
- Record known limitations and follow-up work.
- Set the next milestone.

## Diff Review

Before every commit:

1. Run `git diff --stat`.
2. Review the diff for files outside the milestone scope.
3. If scope creep exists, either revert only your own unrelated changes or document why the change is required.
4. Confirm `docs/documentation.md` has current evidence.
5. Confirm `docs/prompt.md` was not edited unless explicitly requested.

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
- The user changes scope or asks Codex to pause.
- Continuing would require reading the forbidden external Design Desk repository.

Otherwise continue automatically after each verified milestone commit.

## Recommended Local Goal

```text
/goal Continue the Design Desk build in /Users/tomliu/workspace/codex/my-design-desk-2. Follow AGENTS.md and docs/implement.md exactly. Treat docs/prompt.md as the frozen product spec and docs/plans.md as the milestone contract. Start from the current milestone recorded in docs/documentation.md. Do not read or refer to https://github.com/derrickchoi-openai/design-desk or any of its code. For each milestone: reread the control docs, inspect git status, update docs/documentation.md before work, implement only that milestone scope, run required verification, fix failures, record evidence and decisions, review the diff for scope creep, commit with the milestone message, then continue milestone-by-milestone unless blocked by a required product decision or unrecoverable verification issue.
```
