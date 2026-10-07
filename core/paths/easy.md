# Easy/Medium path — 2 steps, 1 gate

For contained, low-risk work that `/adlc` classified Easy/Medium. No gate before code: anything risky was already routed to Hard, and nothing ships without the one gate at the end.

## Step 1 — Do

1. **Write the plan** to `.adlc/<REQ_PATH>/requirement.md` with `kind:` and `path: easy` in frontmatter:
   - **Feature:** Goal (1–2 sentences) · 1–3 testable acceptance criteria · Non-goal (one line) · Approach (2–4 bullets naming the files) · Related (vault links from the quick look).
   - **Bug:** `bug.md` from `templates/bug-template.md` instead — symptom, runnable repro, expected vs actual, environment, then root cause (`file:line`) and fix approach once found. **No runnable repro → upgrade**, don't guess.
2. **Open the work path** (PREFLIGHT §4), set `step: 1`, `gateState: "working"`.
3. **Make the change** inside the blast radius (PREFLIGHT §5). Do it yourself; if it has 2–3 separable pieces, dispatch one `task-implementer` with the plan path. Add or update tests — **a bug always gets a regression test that fails before the fix and passes after**; re-run the repro. Draft the commit to `commits-draft.md` (≤10 body lines). Run the tests; they must pass. Note anything surprising as a candidate in `lesson-candidates.md`.

Then go straight to step 2. No gate.

## Step 2 — Check & ship (gate)

1. **Review** per `$TOOLKIT_PATH/core/paths/review.md` with the Easy reviewer set.
2. **Ship** per `$TOOLKIT_PATH/core/paths/ship.md` (§1–3; skip §2.6).
3. **Open the gate** (GATE-PROTOCOL → Open a gate), `gate: "ship"`, step 2/2. The card:

```
GATE 2/2 · Ship · REQ-NNN-<slug>  (easy)
   clean — recommend approve

FINDINGS  (none)            ← or one line each: crit/maj/min · reviewer · what
READY     4 files +80/-12 · tests 12 passed / 2 added · commit drafted
          reviewed by correctness · UI: n/a
          knowledge: nothing to keep — confirmed · PR + merge checklist drafted
CHECKS    ✓ criteria met · ✓ tests pass · ✓ no leftovers · ✓ docs swept

MY READ   approve — small, clean, covered

Decision →  approve (run the merge checklist) · fix <ids|all> ·
            upgrade (re-plan as Hard) · revise <what> · merged · abort
```

Never recommend approve while a Critical stands. Replies: GATE-PROTOCOL → Close a gate; `fix …` → review.md → Fix rounds; `merged` → ship.md → On merged.

## Upgrade to Hard — any time, never loses work

Upgrade when the user says so, or **stop and offer it** the moment any Hard signal from `/adlc` → Classify appears mid-step: a sensitive area, a new decision, the change spreading past ~5 files or 2 modules, a bug with no repro or no clear cause.

```
This grew past Easy: <signal, e.g. "the fix needs a schema migration">.
Recommend Hard. Work so far stays on <branch>.
→ upgrade (Recommended) · continue as Easy (you accept less review) · abort
```

On upgrade: set `path: "hard"`, `step: 1`, `gateState: "working"`; log `path-upgraded | <ID> | <reason>` to `hot.md`; run `$TOOLKIT_PATH/core/paths/hard.md` from step 1. The plan file becomes Hard's seed and any code already written stays on the branch.
