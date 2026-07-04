# Codex Practices For This Build

This guide explains how to run Design Desk as a long-horizon Codex build and why the control system exists.

## Why Start With Control Files

Long-horizon work fails when the agent relies on thread memory alone. Context can compact, sessions can resume later, and future runs may start from a different surface. Repo-tracked docs make the workflow durable:

- `AGENTS.md` loads automatically as project guidance.
- `docs/prompt.md` preserves the original product request.
- `docs/plans.md` gives Codex a milestone contract.
- `docs/implement.md` gives Codex the execution loop.
- `docs/documentation.md` gives Codex and the user a live handoff ledger.

The rule of thumb: put requirements that must always apply in repo docs, not only in chat history or local memory.

## Why Use `/goal`

Goal mode is appropriate because Design Desk is not a one-shot task. It has many milestones, verification steps, and decisions that Codex must keep checking against a definition of done.

A good goal for this repo names:

- the exact working directory
- `AGENTS.md`
- `docs/prompt.md`
- `docs/plans.md`
- `docs/implement.md`
- `docs/documentation.md`
- the forbidden external repository rule
- the per-milestone verification and commit loop

Use the goal prompt in `docs/plans.md` or `docs/implement.md` after the control-system commit.

## Why Commit Every Milestone

Milestone commits give the run a recovery structure:

- The user can review coherent chunks.
- Codex can resume from the ledger and git history.
- Bad changes can be isolated without discarding unrelated work.
- Verification evidence can be tied to a specific commit.

Do not let Codex accumulate many milestones in one uncommitted diff.

## Why Deterministic Spine First

Design Desk has replay, multiplayer, version history, and export. If those systems are added after a UI-first prototype, they will compete for authority over state.

The intended spine is:

1. canonical scene model
2. deterministic IDs
3. typed ops
4. canonical serialization
5. local persistence
6. replay and export from the same model

Then UI features can emit ops into that spine.

## How To Steer Codex During The Run

Use direct steering messages when you need a constraint changed:

```text
Keep the current milestone scope, but use Playwright for the two-tab smoke test.
```

Use status messages when you want visibility without stopping the main task:

```text
Give me a brief status update and continue.
```

Use pause or stop language only when you want Codex to halt:

```text
Pause after this milestone and wait for review.
```

## Recommended Reasoning Profile

Use High reasoning for normal milestones. Use Extra High for:

- scene model and ops architecture
- collaboration conflict handling
- replay determinism
- code generation and export
- difficult verification failures

Use lower reasoning only for narrow mechanical edits after the architecture is stable.

## What To Watch In Reviews

Look for these failure patterns:

- app code starts before the plan is coherent
- UI state bypasses the ops engine
- random IDs appear in snapshots or tests
- multiplayer sync and replay use different event formats
- export code duplicates renderer logic without a shared model contract
- milestone commits contain unrelated refactors
- `docs/documentation.md` is stale

When a pattern repeats, update `AGENTS.md` or `docs/implement.md` so future Codex runs do not rely on memory.
