# Vault Layout — where work records live, and how to find them

This is the **single source of truth** for on-disk paths under `.adlc/`. Load it at preflight (with `ETHOS.md`, `core/GATE-PROTOCOL.md`, and `core/VOICE.md`) from `$TOOLKIT_PATH/core/VAULT-LAYOUT.md`.

No skill, agent, template, or script may hard-code a path under `specs/`, `bugs/`, or `sprints/`. They call `resolve`, `mint`, or `enumerate` below and then treat the result as opaque. **This is the whole point of the file:** the layout changed once, it will change again, and when it does this should be the only file that knows.

Knowledge files — `knowledge/`, `architecture/`, `context/`, `audits/` — are **never** partitioned. They're found by search, not by browsing, and their paths are stable. This file doesn't govern them.

## `<REQ_PATH>` is vault-relative. Always.

```
<REQ_PATH>  =  specs/2026-08/sf/REQ-042-payment-retries
               ^^^^^ no .adlc/ prefix, no trailing slash
```

Skills write `.adlc/<REQ_PATH>/requirement.md`. Templates write `.adlc/{{REQ_PATH}}/pr-draft.md`. `resolve` strips the vault prefix before returning.

This is pinned because the two conventions are indistinguishable at a glance and roughly sixty rewritten paths depend on getting it right. If you find yourself writing `<REQ_PATH>` where the text already says `.adlc/`, you have it backwards.

The same value is called `<BUG_PATH>` under `bugs/`. Same rules.

## The shapes

A vault holds all of these at once, forever. Which one a *new* folder gets is set by `config.yml` → `layout.partition`; which ones a vault *contains* is whatever its history left behind.

| Depth | Path | When |
|---|---|---|
| 1 | `specs/REQ-042-slug/` | `partition: none` (the default), or pre-migration |
| 3 | `specs/2026-08/sf/REQ-042-slug/` | `partition: month-author` |
| 2 | `specs/_archive/REQ-042-slug/` | archived, from a flat vault |
| 4 | `specs/_archive/2026-08/sf/REQ-042-slug/` | archived, from a partitioned vault |

`bugs/` takes the same four shapes. `bugs/_archive/` does not exist yet — `/bugfix` has no `merged` terminal state to hang it on.

`sprints/` is month-only, no author segment:

| Depth | Path |
|---|---|
| 1 | `sprints/SPRINT-2026-08-09-1430.json` |
| 2 | `sprints/2026-08/SPRINT-2026-08-09-1430.json` |

**Never assume a vault is uniform.** A migrated vault commonly has partitioned active work and a flat archive, or vice versa. Every read path below handles all four depths, which is exactly why migration can be optional.

## `<YYYY-MM>` — the creation month, and it never moves

Minted once, from the date the folder was created. Not the merge month. Not the current month. A REQ opened 2026-07-30 and merged 2026-08-05 lives in `2026-07/` forever.

Always `YYYY-MM`. Not configurable — a per-vault format would break the `maxdepth` arithmetic below and make two vaults unreadable by the same eye.

The **only** move a work folder ever makes is into `_archive/`, and that move **mirrors the source's tail**: whatever the folder had (`2026-08/sf/`, or nothing) is preserved under `_archive/`. A flat REQ archives flat. Never mint a month at archive time — that would be minting from the merge date, and it would silently re-bucket the work.

## `<author>` — initials

First hit wins:

1. `config.yml` → `layout.author`
2. `config.yml` → `req.prefix`
3. initials from `git config user.name` — "Shamim Fahad" → `sf`
4. literal `_` — unattributed

Lowercase, `[a-z0-9-]`, 1–8 characters. If step 3 yields anything outside that, fall through to `_` rather than sanitizing creatively. Step 4 exists so a missing git identity never blocks work.

**`<author>` is a display bucket, never a scan boundary.** Because step 4 exists, one person can write into `sf/` on one machine and `_/` on another. Any algorithm that assumes "my work is in my folder" will miss live folders — see `mint`.

---

## `resolve(ID)` → `<REQ_PATH>`

```sh
find .adlc/specs -maxdepth 4 -type d -name 'REQ-042-*'
```

For bugs, `.adlc/bugs` and `BUG-042-*`. For sprints:

```sh
find .adlc/sprints -maxdepth 2 -name 'SPRINT-2026-08-09-1430.json'
```

Strip the leading `.adlc/` from the result before using it as `<REQ_PATH>`.

- **Zero results** → the ID doesn't exist. Say so plainly and stop. Do not offer to create it unless the running skill's protocol says to.
- **One result** → that's the path.
- **More than one** → a real collision. Show both paths and ask. Never guess, never take the first.

**Use `find`, not a list of globs.** Three reasons, each of which has already caused a bug:

- One expression covers all four depths. A glob list needs six patterns per tree and it is very easy to write five.
- Under zsh, an unmatched glob aborts the entire command *before* `ls` runs — and `2>/dev/null` doesn't help, because the shell errors, not `ls`. Since at most one pattern matches in a real vault, the glob form fails on zsh essentially always.
- Depth becomes data (`-maxdepth 4`) instead of four hand-written path shapes that drift apart.

Cost does not grow with the vault: `find` returns one path, where `ls .adlc/specs/` returns every folder. Resolution is *cheaper* under a partitioned layout than it was flat.

There is no index file, no pointer file, and no symlink. The filesystem is the index. Anything else is a second source of truth that will drift.

## `mint(scheme)` → new ID

| Scheme | Scan |
|---|---|
| `sequential` | `find .adlc/specs -maxdepth 4 -type d -name 'REQ-*' \| sed 's#.*/##'` → highest number + 1, pad to 3 |
| `prefixed` | same, with `-name 'REQ-<prefix>-*'` → highest + 1 within that prefix |
| `ticket` | unchanged — the tracker owns the number |

`maxdepth 4` means the scan covers every month, every author folder, **and** `_archive/`. All three matter:

- Skipping the archive re-mints retired numbers (the bug 1.4.3 had to fix).
- Skipping other author folders re-mints live IDs whenever `<author>` resolved to `_` on some machine, or when the vault is flat — which is every vault that hasn't migrated.

So **`prefixed` scans all author folders too.** Scoping it to `specs/*/<author>/` looks like a free optimization and is a correctness bug.

Minting is not cheaper under a partitioned layout. It's a directory-name listing either way; the win here is browsing. If you need per-person ID safety, that comes from `req.id_scheme: prefixed`, which works identically in a flat vault.

For an explicit ID supplied by the user, run the same scan and collision-check against it before accepting.

`~/.adlc/.global-next-req` (the cross-project counter `/sprint` uses) is outside this file's scope and unchanged.

## `enumerate(active | archived)` → `<REQ_PATH>` list

`find` to depth 4, `-type d`, **matching on the folder's own basename** — `REQ-*` or `BUG-*`. Skip anything under `_archive/` unless `archived` was asked for.

```sh
find .adlc/specs -maxdepth 4 -type d -name 'REQ-*' -not -path '*/_archive/*'
```

**The sentinel is the name, not a file inside the folder.** Both obvious alternatives are broken:

- `pipeline-state.json` is gitignored, so on a teammate's fresh clone every folder looks empty and the enumerate returns nothing.
- `requirement.md` doesn't exist in bug folders — `/bugfix` writes `bug.md`. A `requirement.md` sentinel finds zero bugs, permanently.

Take the display ID from the REQ folder's basename. Under a partitioned vault, the child of `specs/` is a month (`2026-08`), not an ID.

---

## The gitignore pattern set

Per-developer scratch state is ignored; durable knowledge and shared logs are committed. The globs use `**`, which git defines as matching **zero** or more directories — so one pattern set covers all four depths with no conditional, in flat and partitioned vaults alike.

```
.adlc/now.md
.adlc/specs/**/pipeline-state.json
.adlc/specs/**/.awaiting-approval
.adlc/specs/**/commits-draft.md
.adlc/specs/**/pr-draft.md
.adlc/specs/**/merge-checklist.md
.adlc/specs/**/source-writeback.md
.adlc/specs/**/last-seen.json
.adlc/bugs/**/pipeline-state.json
.adlc/bugs/**/.awaiting-approval
.adlc/bugs/**/commits-draft.md
.adlc/bugs/**/pr-draft.md
.adlc/bugs/**/bug-fix-pr-draft.md
.adlc/bugs/**/merge-checklist.md
.adlc/bugs/**/source-writeback.md
.adlc/bugs/**/last-seen.json
.adlc/sprints/**/*.json
.adlc/ui-auth.env
```

Single-`*` versions of these silently stop matching the moment a vault partitions, and the symptom is per-developer heartbeat files appearing in everyone's diffs with no error anywhere. If you are editing this list, keep the `**`.

`.adlc/now.md` and `.adlc/ui-auth.env` are not globs and are easy to lose when the block is swapped wholesale. Keep them.

## Links in artifacts — split by lifetime

| Artifact | Link form | Why |
|---|---|---|
| `knowledge/lessons/*`, `architecture/adr-*` | `[[REQ-042]]` — the ID, resolved at read time | These outlive the REQ. A path baked into them rots the moment the REQ is archived or the vault migrates, and nothing sweeps them. |
| `<REQ_PATH>/tasks/*`, assumption pages | `{{REQ_PATH}}` | Live and die inside the REQ folder. |
| `merge-checklist.md`, agent dispatch prompts | `.adlc/{{REQ_PATH}}/…` | Consumed once, immediately. |

**Durable artifacts never hold a path.** That's what makes archiving and migration cheap: there is nothing to sweep, so there is no sweep to eventually get wrong.

## When you add a new artifact

Ask one question: *does this outlive the REQ folder?*

- **No** → it goes inside `<REQ_PATH>/`, and it goes in the gitignore list above if it's per-developer scratch.
- **Yes** → it goes in `knowledge/`, `architecture/`, or `context/`, it is never partitioned, and it refers back by **ID**.

## When you change this file

Update `core/manifest.json` → `layout` in the same pass; `scripts/adlc.mjs` reads it and the two must agree.

Then run the proof:

```sh
grep -rn "\.adlc/specs/REQ-\|\.adlc/bugs/BUG-\|\.adlc/specs/_archive/REQ-" \
  core templates README.md docs --exclude-dir=proposals | grep -v VAULT-LAYOUT.md
```

Clean means the centralization still holds.

It matches on the **consumption** form — the `.adlc/` prefix — deliberately. A path being *used* always carries that prefix, so this catches exactly the regression that matters. A bare `specs/REQ-042-slug` with no prefix is a *description* of a shape, which is legitimate in three places and nowhere else: the mint steps in `/spec` and `/task` (they define the shape, so they must state it), this file, and user-facing comments in `config-template.yml`. `dist/` and `adapters/` are generated — rebuild rather than editing them.

A non-empty result means some file has learned a path again, and the next layout change will cost thirty edits instead of one.
