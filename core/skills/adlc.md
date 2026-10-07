---
name: adlc
description: The one entry point. Classifies the work as Easy/Medium or Hard, then runs that path — Easy/Medium in 2 steps with 1 gate, Hard in 3 steps with 3 gates. Features and bugs alike. Resumable (--resume), reversible (--revert~N), cancellable (--cancel).
---

You are running `/adlc`. Load `$TOOLKIT_PATH/core/PREFLIGHT.md` and do its setup (skipping what's already loaded), then classify the work and run its path. Classifying is not a step — it's the first minute of step 1.

## Invocation

- `/adlc <description | issue ref>` — new work. `/adlc --bug <…>` marks it a defect (`kind: bug`, folder under `bugs/`, `BUG-` ID). A description that reads as a defect ("X crashes when…", a stack trace) is a bug without the flag — say so in the classification line.
- `/adlc --easy …` / `/adlc --hard …` — skip classifying; the user chose. `--easy` still upgrades to Hard on a risk signal (below) — say so, never silently.
- `/adlc <ID>` or `/adlc` — resume. Re-read `pipeline-state.json`; if a marker is present re-emit that gate's card, else run the next step. If the work path or branch is gone, stop and recommend `/recover`.
- `/adlc <ID> --resume` · `--revert~N` · `--cancel` — see **Flags**.

Aliases: `/proceed` = `/adlc --hard`, `/task` = `/adlc --easy`, `/bugfix` = `/adlc --bug`.

## Classify

From a quick look — the request, a grep of the area it names, `hot.md`'s head, `knowledge/gotchas.md` hits for those files. No agent dispatch.

**Hard** if any of these hold — name every one that does:

- **Sensitive** — touches anything in `config.yml` → `autonomy.hard_stops` (default: auth, security, secrets, payments, data/schema migration, public API contract, irreversible). **Risk wins over size:** a one-line auth change is Hard.
- **Decision** — needs a new ADR (library, pattern, integration approach), or contradicts an accepted one.
- **Spread** — likely more than 5 files, 2+ modules/layers, or more than one repo.
- **Shape** — more than 3 acceptance criteria, or the scope is unclear enough that it needs design before code.
- **Bug that isn't contained** — no runnable repro, or the cause is unknown after the quick look.

Otherwise **Easy/Medium**. Print one line and keep going — no gate:

```
→ Easy/Medium: ~2 files in src/pay, no sensitive area   (say "hard" to switch)
→ Hard: touches auth/session (sensitive) · ~9 files across 3 modules
```

Record `path` in `pipeline-state.json`. Then load and run **one** of:

- `$TOOLKIT_PATH/core/paths/easy.md` — 2 steps, 1 gate.
- `$TOOLKIT_PATH/core/paths/hard.md` — 3 steps, 3 gates.

Paths move one way: Easy can upgrade to Hard at any point (`easy.md` → Upgrade); Hard never downgrades.

## Flags

**`--resume`** — a catch-up before continuing. Three lines, then a menu:

```
RESUME — <ID>-<slug>  (<path>, step <n>/<N>)
  gate: <awaiting | cleared> · last activity <X ago>
  pending: <the gate question in one line, or "none">
  ⚠ <only if a drift check fails: worktree/branch missing, vault edited outside the pipeline — consider /recover>
```

Menu: `continue` · `details` (recent `hot.md` entries for this REQ, files touched since `pipeline-state.json`'s mtime, drift checks) · `revert~N` · `cancel` · `switch` (list in-flight REQs per VAULT-LAYOUT `enumerate(active)`). Writes nothing but an optional `last-seen.json`.

**`--revert~N`** — walk back N completed steps (N ≤ 2). Write `revert-plan.md`: per step walked back, the artifacts deleted (quoted in full inside the plan, so it is its own undo) — step 1 → `requirement.md`/`bug.md`, `architecture.md`, `tasks/`, `exploration.md`; step 2 → `verification.md`, `review-log.md`, `review-packet.md`, task completion flags; step 3 → `pr-draft.md`, `merge-checklist.md`, and lessons/gotchas/ADRs this REQ added are **tombstoned** (banner `STATUS: retracted YYYY-MM-DD via --revert`), never deleted. If code is walked back, also write `code-revert-plan.md` with the commits and suggested commands — **you never run `reset`/`revert`**. Ask approve / revise / abort. On approve: apply the vault side, set `step` back with `gateState: "cleared"`, log `req-reverted` to `hot.md`.

**`--cancel`** — abandon the REQ. Ask for a one-line reason (required). Write `cancelled.md` (when, step, reason, branch, the files present — kept so future work finds what was tried), set `terminal: "cancelled"`, remove the worktree if in worktree mode, print the branch cleanup commands for the user, log `req-cancelled` to `hot.md`, drop it from `now.md`. The folder stays.

## Rules

- **Never skip a gate on a path, and never merge two.** The path sets how many there are; the user's approve is the only way past one.
- **Never auto-fix a gate failure.** A failed test, a reviewer critical, a missing artifact: surface it and wait.
- **Dispatch agents by exact name.** If one isn't installed, stop: "`<agent>` isn't installed — run the toolkit sync, then re-run this step." Never do its work inline — that runs at the wrong model tier and, for reviewers, makes the author grade their own work.
- **Git follows `git.mode`** (default `manual`: draft, never write). In every mode: only the REQ's own branch — never a protected branch, force-push, history rewrite, branch delete, `gh pr create`/`merge`, or `--no-verify`.
- **Cross-repo** forces `worktree` mode and the Hard path; `pipeline-state.json.repos` maps repo-id → `{workPath, branch}`; findings and PRs are per repo, merged in `config.yml` → `mergeOrder`.
