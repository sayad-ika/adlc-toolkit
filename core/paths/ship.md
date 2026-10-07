# Ship routine — used by Easy step 2 and Hard step 3

Not a step on its own. Load only what each part reads, at the part that reads it — `hot.md`, `index.md`, `now.md`, `decisions.md` and `glossary.md` are outputs, and a typical REQ touches two of them.

## 1. Final sanity

- `git -C <workPath> diff <base>..<branch> --stat` (or against `baseCommit` if uncommitted) versus the plan's file list. Name any file changed that wasn't planned, or planned and not changed.
- Leftovers: debug prints, `TODO` without a link, `.skip()`/`xit(`, commented-out code from this REQ, any `--no-verify`.
- **Docs sweep.** Doc surface = `config.yml` → `docs:` (default `README*` + `docs/`; `docs: []` skips — say so). Grep it for every changed symbol, flag, config key, route and default; read the docs nearest the change and ask whether what they claim is still true. Each stale claim goes on the card as `docs: <file> — <claim> → <fact>` and is applied **after approve**, with a `docs(…)` commit drafted. Pure refactors and test-only diffs skip it and say so.

## 2. Knowledge

1. Read `lesson-candidates.md`. Missing → sweep `verification.md` and `commits-draft.md` for anything recurring or surprising and add it first.
2. List existing lessons by filename, here **and** on the team's base: `ls .adlc/knowledge/lessons/` and `git -C <workPath> ls-tree --name-only origin/<base>:.adlc/knowledge/lessons/`, plus `git -C <workPath> log -1 --format=%cr origin/<base>` for how old that view is. Always `git -C <workPath>` — from a subdirectory `ls-tree` silently returns nothing. No `origin/<base>` → skip that half and say so. Never fetch.
3. One verdict per candidate, appended as a `## Candidate verdicts` table: **promote** → `knowledge/lessons/LESSON-<ID>-<n>-<slug>.md` (VAULT-LAYOUT `mint(lesson)`; minimum fields: title, metadata with 2–5 Tags, the lesson, saw it in) · **demote-to-gotcha** → append to `knowledge/gotchas.md` (next `^g##` by `grep -o '\^g[0-9]\+' … | tail -1`, never a full read) · **discard** with a one-line reason (a lesson only on `origin/<base>` is `duplicate of LESSON-… (on <base>)`).
4. **The bar.** Features: "nothing to keep" is allowed but is said on the card. **Bugs: at least one promote or gotcha**, or the card asks the user to confirm there's nothing.
5. A promoted or superseded lesson → rebuild `knowledge/lesson-ledger.md` whole from one grep of the lesson headers (`grep -h '^# \|^| ID \|^| Tags \|^| Severity \|^| REQ \|^> \*\*STATUS: superseded' …`).
6. Hard path only, as applicable: fill concept/component stubs, confirm an accepted ADR's status in `decisions.md`, draft supersessions; `vault-stale` findings become proposed edits on the card, never applied silently.

## 3. Drafts and navigation

- `pr-draft.md` from `.adlc/templates/pr-template.md` (fall back to `$TOOLKIT_PATH/templates/`): title in the project's convention (bugs: `fix(scope): … [BUG-NNN]`), goal in past tense, each acceptance criterion ✓ with how it was verified, changes by module, lessons captured. Bugs add the repro and the regression test.
- `merge-checklist.md` from its template, keeping only the cleanup block for this REQ's isolation mode. It starts with `git fetch`.
- `source-writeback.md` only if `sources.write` lists the tracker **and** the REQ links an issue — drafted, sent only on explicit approval, even under autopilot.
- `hot.md`: read the first few lines only; add `req-ready-to-merge` plus one line per lesson/gotcha/ADR. Over 500 lines → move everything past line 500 to `hot-archive-<YYYY>.md`.
- `index.md` (new REQ, ADR, concept, component rows), `now.md` (drop or update this REQ — 1KB budget; move anything else out to its REQ or sprint file), `glossary.md` if new terms (grep first).

## On `merged` (a ship-gate reply)

Check it if you can (`gh pr view --json state,mergedAt`), set `prState: "merged"`, `terminal: "merged"`, log `req-merged`, drop it from `now.md`. Offer once to archive: `mkdir -p` the mirror path (`specs/_archive/` or `bugs/_archive/` + the same tail) and plain `mv` (not `git mv`), repoint `index.md`, log `req-archived`.

Never: `git add/commit/push` in `manual` mode, `gh pr create`/`merge`, or a branch delete — in any mode.
