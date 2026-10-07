---
name: recover
description: Reconcile pipeline-state.json against git reality for one, several, or all in-flight REQs, bugs and sprints. Classifies each as in-sync, stale, abandoned, sprint-stuck or divergent, then works a triage queue — back-filling the vault for work that shipped outside the pipeline. Read-only on code and git; vault-only writes.
---

You are `/recover`: make the records match reality when they've fallen behind — a crashed session, work finished elsewhere, a branch deleted by hand. **Git is the truth; state is reconciled to it, never the reverse.** Setup per `$TOOLKIT_PATH/core/PREFLIGHT.md` §1–2.

**Invocation:** `/recover` (everything in flight) · `/recover REQ-101 BUG-007 SPRINT-…` (just those). Resolve IDs per VAULT-LAYOUT (`resolve`; two hits → ask). With no IDs, enumerate: `find .adlc/specs .adlc/bugs -maxdepth 4 -type d \( -name 'REQ-*' -o -name 'BUG-*' \) -not -path '*/_archive/*'` and `find .adlc/sprints -maxdepth 2 -name 'SPRINT-*.json'` — by folder name, since `pipeline-state.json` is gitignored. Skip merged-over-7-days and already-`recoveredAt` entries unless named. An archived REQ named explicitly is history: report it, don't touch it.

## Step 1 — Diagnose and queue

Per entry, read-only:

- **State:** path/step/gate/gateState (legacy `currentPhase` mapped per PREFLIGHT), isolation, workPath, branch, prState, terminal, recoveredAt.
- **Git:** branch exists (`rev-parse --verify`); commits past base; merged (`branch --merged <base>`, else `gh pr list --state merged --head <branch>`, else `git log <base> --grep <ID>`); worktree registered.
- **Disk:** work path exists; uncommitted changes (report, never act); which artifacts exist.

| Signals | Class | Recommend |
|---|---|---|
| branch alive, unmerged, artifacts match the step | **in-sync** | leave — `/adlc <ID>` resumes it |
| merged, but state says not shipped | **stale — shipped** | recover: back-fill, mark merged |
| merged, at ship, but no vault capture | **stale — capture missing** | recover: capture only |
| no branch, no merge, no commits on base, no work path | **abandoned** | abort |
| state says merged, branch alive and unmerged | **divergent** | your call |
| sprint `running`, all its REQs finished | **sprint-stuck** | end the sprint |

Doesn't fit cleanly → **divergent**, never a guess. Show the queue, 10 at a time:

```
Recovery queue — YYYY-MM-DD · 4 entries (3 REQs, 0 bugs, 1 sprint)
 1. REQ-042-firestore-indexes  claims hard 2/3 awaiting · merged PR #117 on 05-09
    records are behind — it shipped → recover
 2. REQ-051-export-button      claims easy 1/2 · branch gone, nothing merged
    looks abandoned → abort
 3. SPRINT-2026-04-30-1400     running, all 3 REQs done → end sprint
→ recover <N> · leave <N> · abort <N> · skip <N> · show <N> · more · recover all-abandoned
```

## Step 2 — Act, one entry at a time

- **recover (stale — shipped):** ask once — `Any lessons or gotchas worth keeping? lessons: …; gotchas: …; or none` — and never invent any. Write what's missing: `verification.md` marked `STATUS: recovered` (acceptance criteria with the best evidence, ✓ or ⚠) and `pr-draft.md` marked `STATUS: historical` (goal in past tense, branch, PR, merge date, `--stat`). Lessons as `LESSON-<ID>-<n>-<slug>.md` (VAULT-LAYOUT `mint(lesson)`) and gotchas with the next `^g##`, both bannered `STATUS: needs verification`; rebuild `lesson-ledger.md` if a lesson was written. Log `req-recovered` (+ one line per artifact) to `hot.md`, drop it from `now.md`. State → `step` = last, `gateState: "cleared"`, `prState: "merged"`, `mergedAt`, `recoveredAt`, `recoveryNotes`.
- **recover (stale — capture missing):** the knowledge question, artifacts, navigation and state only.
- **abort / abandoned:** confirm (not for `recover all-abandoned`); remove a still-registered worktree; print the branch cleanup for the user (`checkout <base>`, `restore .`, `clean -fd`, `branch -D`); state → `terminal: "aborted"`, `recoveredAt`, `recoveryNotes`; log `req-aborted-via-recover`.
- **leave:** nothing written — "looks alive; `/adlc <ID>` continues it."
- **sprint-stuck:** registry → `status: "ended"`, `endedAt`, `endedReason: "recovered-out-of-band"`; log `sprint-recovered`.
- **divergent:** show the raw signals and ask which side is right before doing anything.

End with: recovered · aborted · left · skipped · still divergent (with their signals) · lessons and gotchas captured · sprints ended.

No commits, pushes, checkouts, merges or branch deletes — the only git write is removing an abandoned worktree. Source code is never touched. Every recovery leaves `recoveredAt`, `recoveryNotes` and a `hot.md` line, so recovery is itself on the record.
