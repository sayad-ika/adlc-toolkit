# Hard path — 3 steps, 3 gates

For work `/adlc` classified Hard: sensitive, needs a decision, spread wide, unclear in shape, or a bug that isn't contained. Every step ends at a gate (GATE-PROTOCOL → Open / Close a gate). Header: `GATE <n>/3 · <Gate> · <ID>-<slug>  (hard)`.

## Step 1 — Design (gate)

1. **Plan what and how, in parallel.** Dispatch `codebase-explorer` (fast tier) right away: `REQ · Spec path (or "from the request") · Work path: <repo> · Vault root: .adlc/ · write .adlc/<REQ_PATH>/exploration.md`. While it runs, write the **what**:
   - **Feature:** `requirement.md` from `templates/spec-template.md` (keep an Easy seed if one exists) — Problem, Goal, Non-goals (at least one), testable acceptance criteria, Assumptions (`STATUS: needs verification` when unproven), Open questions, Related (lessons, gotchas, ADRs found by grep). Too thin to fill? Ask the 2–3 highest-impact questions as options, not a questionnaire.
   - **Bug:** `bug.md` from `templates/bug-template.md` — runnable repro required (or the user's explicit "investigate from this trace"). Point the explorer at the repro's code path, existing tests and similar past bugs, and add the root cause (`file:line`) under "Investigation log".
   - A design source (`sources.design`, e.g. a Figma link) is fetched the same way as an issue ref and seeds UI structure.
2. **Write the how.** From the explorer's report, `architecture.md` from its template: Summary · Blast radius (including docs whose claims change) · Approach (a diagram only when it earns its place) · Task DAG with tiers · Test strategy (named test files) · Conventions · Risks · Open questions. One `tasks/TASK-NNN.md` per atomic, testable concern, each with Files to touch, 2–3 bullets of approach, acceptance checklist, `depends on:`. A new decision → `architecture/adr-NNN-<slug>.md` (`proposed`) + a `decisions.md` row. A major module with no page → a stub under `knowledge/components/`. If the explorer contradicts the spec, stop and surface it.
3. **Stress-test, then open the gate.** Check: every acceptance criterion has a task · no cycles · every blast-radius file is in a task · tests concrete · lessons/ADRs cited · no design in the spec. Then attack the plan — **dispatch `architecture-adversary`** (artifacts + trigger; writes `architecture-adversary.md`) when there's a new ADR, a sensitive area, 8+ files or 3+ modules, cross-repo, or a real UI surface; otherwise ask yourself the sharpest questions (unhandled failure, rollback, implicit decision, an unplanned screen state) in one paragraph. Each surviving finding is **fixed** in the plan or **accepted** in Risks with the reason. Open the gate, `gate: "design"`:

```
GATE 1/3 · Design · REQ-014-payment-retries  (hard)
   ready — 2 items need your call

READY       requirement: 4 criteria · architecture: 6 tasks, T1,T2 → T3,T4 → T5
            exploration.md · stress-test: full pass, 1 finding fixed
NEEDS YOU   ⚠ ADR-007 retry backoff — accept or reject
            ? how long should idempotency keys live?
CHECKS      ✓ criteria covered · ✓ no cycles · ✓ conventions · ✓ tests named

MY READ     approve — the fix is in Approach; the ADR is low-risk

Decision →  approve (move on to build) · revise <what> · abort
```

Never recommend approve with an unaddressed critical adversary finding. On approve, ask once whether to mark a proposed ADR `accepted`.

## Step 2 — Build & verify (gate)

1. **Build the task DAG.** Open the work path (PREFLIGHT §4). Sort tasks into tiers (tier 0 = no dependencies); a cycle → stop, back to design. Per tier, dispatch one `task-implementer` per task **in a single message**:

   ```
   Task: TASK-NNN · Task file: .adlc/<REQ_PATH>/tasks/TASK-NNN.md
   REQ folder: .adlc/<REQ_PATH>/ · Work path: <workPath>
   Edit posture: <workflow.edits>. Blast radius = this work path + files this task
   names; edit freely inside, STOP and report at the edge (unnamed file, new
   dependency, migration, auth/security/secrets).
   Append the commit to commits-draft.md (≤10 body lines). Run the tests.
   Lesson candidates → lesson-candidates.md (≤12, ≤4 lines). Report ≤15 lines.
   No git writes.
   ```

   Record each result in `taskStatus`. Tests failing, a blocker, or a deviation → **halt the tiers** and surface it; never start tier N+1 over a failure.
2. **Verify it.** Full test suite once; leftovers check (debug prints, unlinked TODOs, `.skip()`, commented-out code — flagged, not blocking); a summary table atop `commits-draft.md` (`# | subject | files | task`). Then review per `$TOOLKIT_PATH/core/paths/review.md` with the Hard reviewer set.
3. **Open the gate**, `gate: "build"`, leading with findings:

```
GATE 2/3 · Build · REQ-014-payment-retries  (hard)
   built, tests pass — 2 findings, 1 needs a call

FINDINGS    C1 critical · correctness — double charge on retry
               src/pay/retry.ts:88
            m1 minor · reflector — ADR-009 conflict — your call
READY       6 tasks in 3 tiers · 41 tests passed / 5 added · 6 commits drafted
            9 files +240/-37 · packet 96KB · 4 reviewers · UI: n/a
CHECKS      ✓ criteria 1–3 · ⚠ criterion 4 — safe retry unverified

MY READ     fix — C1 must not ship

Decision →  approve (move on to ship) · fix all (I fix, then re-check) ·
            fix <ids|all-major> · revise <what> · abort
```

Never recommend approve while a Critical stands. `fix …` → review.md → Fix rounds. In `manual` git mode, the card reminds the user to commit from `commits-draft.md` before approving; the ship step checks the commits landed.

## Step 3 — Ship (gate)

1. **Check the commits landed** — every draft subject is in `git -C <workPath> log <base>..<branch>`; if not, ask the user to finish committing.
2. **Ship** per `$TOOLKIT_PATH/core/paths/ship.md`, all parts.
3. **Open the gate**, `gate: "ship"`:

```
GATE 3/3 · Ship · REQ-014-payment-retries  (hard)
   PR + vault ready — run the checklist when you're set

READY       PR: feat(pay): retry with backoff · 9 files +240/-37
            knowledge: lesson L-REQ-014-1 · gotcha g14 · ADR-007 accepted
            dedup vs origin/main as of 2 days ago
NEEDS YOU   docs: README.md — "retries: off" → "retries: 3 with backoff"
CHECKS      ✓ files match the plan · ✓ no leftovers · ✓ commits in log

MY READ     approve — clean; the doc fix applies on approve

Decision →  approve (run the merge checklist) · revise <what> ·
            merged (after you merge) · abort
```

`merged` → ship.md → On merged.
