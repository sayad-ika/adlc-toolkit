# Preflight — load once, then work

Every ADLC skill starts here. None of this is a step: it's setup, and most of it is
already done by the time a second step runs in the same session.

`$TOOLKIT_PATH` is the toolkit install dir, stamped into your command stub as a
"Toolkit root:" line.

## 1. Load the rules — once per session

`$TOOLKIT_PATH/ETHOS.md`, `core/GATE-PROTOCOL.md`, `core/VOICE.md`, `core/VAULT-LAYOUT.md`.
**Already in context from an earlier step or skill? Skip them.** Re-reading the same
four files at every step was ~27 preflight items per Hard REQ.

## 2. Load the vault basics — once per session

`.adlc/CLAUDE.md`, `now.md`, `config.yml`, `context/project-overview.md`,
`context/conventions.md`, and `hot.md`'s **first 40 lines only** (newest entries are
at the top; the file can run to thousands of lines). Skip any already loaded.
Load anything else at the step that reads it, not here.

## 3. REQ identity

- **Existing REQ** (an ID was given, or `now.md` has exactly one in flight): resolve
  its folder per VAULT-LAYOUT `resolve` — `find .adlc/specs .adlc/bugs -maxdepth 4 -type d -name '<ID>-*'`.
  No hit → say so and stop. Two hits → show both and ask. Only hit under `_archive/`
  → it's shipped history; report one line and stop. Load its `pipeline-state.json`
  (run **Legacy state** below if it has `currentPhase` and no `path`).
- **New REQ**: mint the ID per VAULT-LAYOUT `mint` and `config.yml` → `req.id_scheme`
  (`sequential` / `prefixed` / `ticket`; one scan at depth 4, which covers every
  bucket, every author and `_archive/`). Bugs use the `BUG-` scheme under `bugs/`.
  Slug: kebab-case, ≤40 chars. Folder: `layout.partition` `none` →
  `specs/<ID>-<slug>`; `month-author` → `specs/<YYYY-MM>/<author>/<ID>-<slug>`
  (creation month, never moves; author = `layout.author` → `req.prefix` → initials
  of `git config user.name` → `_`). `mkdir -p` it.
- That vault-relative folder (no `.adlc/` prefix) is **`<REQ_PATH>`**. Agents
  resolve nothing — write it out in full in every dispatch.

**Source reference (optional).** Invoked with an issue ref (`#8`, `PROJ-8`, a URL)
and `sources.issues` set: fetch it (CLI like `gh issue view` → MCP → plain fetch,
first that works). Use it as draft material and link it under "Related". Nothing
resolves → one line (`couldn't reach <service> for <ref> — drafting manually`) and
carry on. A seed never blocks and is never copied verbatim into acceptance criteria.

## 4. Work path — open it when the first code is about to be written

Only when `pipeline-state.json.workPath` is null. Mode from `config.yml` →
`workflow.isolation` (`auto` → `branch`; a cross-repo REQ forces `worktree` — say
why). Branch name from `conventions.md`, default `feat/<ID>-<slug>` (`fix/` for bugs).

- **branch** — `git -C <repo> status --porcelain` must be empty; if not, stop and
  offer: commit/stash first, or switch to `worktree`. Then `git -C <repo> checkout -b <branch>`.
- **worktree** — `git -C <repo> worktree add <repo>/.worktrees/<ID>-<slug> -b <branch>`.

Record `isolation`, `workPath`, `branch`, `worktree`, `baseCommit` in state; log
`work-path-set` to `hot.md`. This is the only git write any skill makes outside the
`git.mode` grant.

**Every shell call** uses absolute paths or `git -C <workPath>` — cwd doesn't persist.

## 5. Blast radius — where edits are free

The work path plus every file the plan names (`requirement.md` → Approach, or
`tasks/TASK-*.md` → Files to touch). Inside it: edit freely. At its edge — a file
no plan named, a new top-level dependency, a schema/migration, anything touching
auth/security/secrets — stop and ask in plain words: "I need to touch `<file>`,
which isn't in the plan, because `<reason>`. OK, or find another way?"
`config.yml` → `workflow.edits: confirm-each` surfaces every write.

## pipeline-state.json

```json
{
  "req": "REQ-NNN-<slug>", "kind": "feature | bug",
  "path": "easy | hard", "step": 1, "gate": "design | build | ship",
  "gateState": "working | awaiting | cleared",
  "isolation": null, "workPath": null, "worktree": null, "branch": null, "baseCommit": null,
  "taskStatus": {}, "findings": {}, "prState": null, "notes": []
}
```

`notes[]` — one line per event, ≤160 chars. It's read by every resume, so narrative
belongs in the artifact it describes, not here.

## Legacy state (pre-2.0 REQs)

A state file with `currentPhase` and no `path` is from the five-phase pipeline. Map it
once and write it back: `path: "hard"`, `kind` from `kind` (`task` → `feature`, path
`easy`), and phase → step: 1–2 → 1 (`design`), 3–4 → 2 (`build`), 5 → 3 (`ship`).
Keep `gateState`. A legacy phase-3 REQ with a cleared gate resumes at step 2's
review half; a phase-4 awaiting gate re-emits step 2's gate.
