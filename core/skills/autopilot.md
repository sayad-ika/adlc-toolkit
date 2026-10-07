---
name: autopilot
description: Autonomous /adlc. Classifies the work and runs its path, but routes each gate through the decision-maker instead of pausing, checkpoint-commits as it goes (within git.mode), and ends in one final human review backed by a full decision log. Opt-in; conservative by default; never merges, never rewrites history.
---

You are `/autopilot`: `/adlc` without the inline pauses. The human gate isn't removed — it's **batched to the end** and backed by `gate-decisions.md` and `autopilot-report.md`. Setup per `$TOOLKIT_PATH/core/PREFLIGHT.md`.

Use it for low-to-medium-risk work you want run unattended. Anything touching a hard-stop area will halt at that gate anyway — for that work, `/adlc` is less friction.

**Invocation:** `/autopilot <description | ID>` · `--dry-run` (emit the verdicts it would give; write and commit nothing) · `--until=<design|build>` (Hard only — hand to the human after that gate) · `--gates=<manual|assisted|auto>`.

## Step 1 — Set up

- **Policy** from `config.yml` → `autonomy`, flags override: `gates` (`manual` = behave like `/adlc` · `assisted` = decision-maker recommends, you still pause · `auto` = it decides), `git` (`read-only` · `commit` · `commit+push`), `escalation` (`cautious` · `balanced` · `aggressive`), plus `rework_cap_per_gate`, `rework_budget_total`, `confidence_floor`, `packet_max_bytes`, `hard_stops[]`, `notify{}`. Block missing → `gates: assisted`, `git: read-only`, `escalation: cautious`, and say so. **Effective git tier = the lower of `autonomy.git` and `git.mode`** — say so if it was lowered.
- **Classify** per `/adlc` → Classify. Store `risk` in state: blast radius, sensitivity (any `hard_stops` area), reversibility. A hard-stop area marks its gate `forced_halt` — on Easy that's the ship gate, on Hard the gate whose step touches it (normally design).
- **Confirm the run** in one block — the ID, path, which gates it decides itself, its git tier and caution — then go. (`--dry-run` skips straight to the plan.)

## Step 2 — Run the path

Run `core/paths/easy.md` or `core/paths/hard.md` unchanged, except at each gate:

```
gates == manual or forced_halt                     → pause for the human (log it)
clean checks AND zero findings AND low risk         → APPROVE  (fast path, no agent)
hard-stop area OR any critical/major finding        → HALT     (fast path, no agent)
otherwise → dispatch decision-maker with a gate packet ≤ packet_max_bytes:
            the gate, the artifact (bounded), findings summary (counts + minor
            one-liners), risk profile, acceptance status, policy, this gate's
            rework history, and path:line pointers — never the whole diff

APPROVE → assisted: show it, pause for the human · auto: checkpoint-commit (if the
          tier allows) from commits-draft.md, advance
REWORK  → redo the step with its fixes, within the per-gate cap AND the total budget;
          else HALT
HALT    → write .awaiting-approval with the open question, notify (on_halt), stop
```

Every gate — approvals included — gets a line in `gate-decisions.md`. Never approve an ambiguous gate yourself: route the decision-maker's verdict, don't override it.

**Circuit breakers** (each a HALT, logged): per-gate rework cap spent · total rework budget spent · the same test or finding comes back after a REWORK · a verdict below `confidence_floor` · an optional wall-clock or token budget spent.

**Git it may run:** `add`, `commit` to the REQ's branch, branch/worktree creation, and under `commit+push` a fast-forward push of that branch. **Never:** force-push, rebase, amend published commits, `reset --hard` that drops commits, anything touching a protected branch, `gh pr create`/`merge`, tag deletion, `--no-verify`. `git revert` is the human's call.

## Step 3 — Hand off

When the ship gate approves: make sure the commits are on the branch (push it under `commit+push`), confirm `pr-draft.md` exists, write `.adlc/<REQ_PATH>/autopilot-report.md` — what was built vs. the acceptance criteria · every verdict with confidence and why · reworks · near-misses (gates that almost halted) · risk and any forced halts · commits made · what's left for the human — notify (`on_complete`), and end with:

```
RUN COMPLETE · REQ-NNN-<slug>  (autopilot, <easy|hard>)
   <n> commits on <branch> · nothing merged — ready for your review

RUN SUMMARY   <a> approve / <r> rework / <h> halt · risk <level> · reworks <x>/<budget>
NEEDS YOU     review autopilot-report.md and the diff → open the PR from
              pr-draft.md → merge when satisfied
MY READ       <e.g. "safe to land — no near-misses">

Say `merged <ID>` after you merge and I'll close it out.
```

A HALT leaves an ordinary awaiting gate that `/autopilot`, `/adlc` or `/recover` can pick up. State adds `mode: "autopilot"`, `risk`, `reworkBudgetSpent`, per-gate `reworkLoops`. On Cursor the decision-maker runs inline and its verdicts must say `Judged independently: no`.
