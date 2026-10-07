# Gate consolidation — planted-defect replay (v1.9.0)

**Status: `needs-human` — no scenario has been run.** The replay needs the pipeline to run end-to-end against a scratch repo, and every gate waits on an interactive answer (`AskUserQuestion`). A headless `claude -p` run can't answer those, and nine scenarios × two versions is an expensive unattended run. No result below is an observed one; "Protocol" is where the expected behaviour is *specified*, so a human knows what to look for.

## Scenarios

Run each at `a266f5a` (baseline) and at the 1.9.0 commit, or compare 1.9.0 against "Must happen" alone.

| # | Scenario | Pipeline | Planted defect | Must happen at 1.9.0 | Protocol | Result |
|---|---|---|---|---|---|---|
| S1 | Rename a CLI flag in `src/pay/cli.js` | `/task` | README still names the old flag | Doc sweep lists the README on the Ship card; 2 gates | `task.md` Phase 3 (repo-doc sweep); `gates: ["plan","ship"]` | needs-human |
| S2 | Add retry to `src/pay/retry.js` (4 files) | `/proceed` | Off-by-one that double-charges | Profile `standard`; critical correctness finding on Build & Review; approve not recommended; 3 gates | `spec.md` 2a; `review.md` step 9 "Build & Review"; GATE-PROTOCOL → Profiles | needs-human |
| S3 | S2 plus an unmet AC | `/proceed` | AC 3 not implemented | AC check flags critical on Build & Review | `review.md` step 6 (unmet = critical) | needs-human |
| S4 | Touch `src/auth/session.js` | `/proceed` | none | `full` + `hardStop`; Spec, Architect, Implement, Review, Wrap-up gates (5); adversary full pass | `spec.md` 2a; `architect.md` adversary triggers; `implement.md` step 8 | needs-human |
| S5 | Fix a null crash | `/bugfix` | Implementer skips the regression test | Phase 3 "Verify the fix" stops mid-phase (no regression test) before review runs; no gate card offers approve | `bugfix.md` Phase 3 (test first), Phase 4 route, Ship card | needs-human |
| S6 | Repeat a seeded lesson | `/task` | Code repeats a `LESSON-…` pattern | Reflector flags it | `reflector.md` (vault check); `task.md` review | needs-human |
| S7 | Standard REQ where the explorer finds 9 files | `/proceed` | none | Upgrades to `full` at architect; `profile-upgraded` in `hot.md` | `architect.md` full-pass triggers; GATE-PROTOCOL → upgrade only | needs-human |
| S8 | Legacy REQ (delete `profile`/`gates` from state mid-run) | `/proceed` | none | Five legacy gates resume | `proceed.md` "Absent → legacy" | needs-human |
| S9 | Merge the S1 branch by hand, then `/status` and `/task` | — | none | `/status` shows "merged — not finalized"; `/task` finalizes + archive offer | `status.md`; `task.md` preflight 7; `wrapup.md` "Detected" | needs-human |

## Scratch repo

Outside this toolkit: `git init`, `node --test` as `npm test`, then `node <toolkit>/scripts/adlc.mjs sync --tool=claude --repo=<scratch>` and `/init`.

- `src/pay/{cli,retry,format}.js`, `src/auth/{session,token}.js`, `src/shared/{log,config,errors}.js` (the shared files are imported by both modules, so a change to `errors.js` has a 9-file blast radius for S7).
- `README.md` documents one flag, `--retries <n>` (S1).
- Seed one lesson, `LESSON-REQ-001-1-no-float-money.md` ("amounts are integer cents, never floats"); the S6 code does `amount * 0.01` (S6).
- Plant S2's off-by-one (`i <= max` where `i < max` is meant) **between** `/implement` and `/review`: run the phases as separate commands, which follow the same gate list as `/proceed`. S3 and S5 are planted the same way (drop AC 3's behaviour; delete the regression test).

## Record, per scenario

Stops taken · gates shown (`GATE <n>/<N>` titles) · findings caught (ID, severity) · artifacts present against the skill's "Output artifacts" list · approximate tokens, if the harness reports them.

## Pass criteria

Every "Must happen" holds; no artifact in any skill's "Output artifacts" is missing; stop counts match the plan's §3.1 (`/task` 2, `/bugfix` 2–3, `standard` 3, `full` 4 or 5 with `hardStop`).
