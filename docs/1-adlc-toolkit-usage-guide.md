# ADLC Toolkit — Usage Guide

A complete, plain-English guide to installing and using the ADLC toolkit, and to getting the most out of it with the least effort.

**Contents**

1. [What the toolkit is](#1-what-the-toolkit-is)
2. [Install — you choose where](#2-install--you-choose-where)
3. [Set up a project](#3-set-up-a-project)
4. [Pick the right command](#4-pick-the-right-command)
5. [The five phases, in detail](#5-the-five-phases-in-detail)
6. [Gates and gate cards](#6-gates-and-gate-cards)
7. [Bugs and small changes](#7-bugs-and-small-changes-bugfix-and-task)
8. [Hands-off modes](#8-hands-off-modes-autopilot-and-sprint)
9. [Resuming, redoing and recovering](#9-resuming-redoing-and-recovering)
10. [Git — how much the assistant does](#10-git--how-much-the-assistant-does)
11. [The vault (`.adlc/`)](#11-the-vault-adlc)
12. [Settings (`config.yml`)](#12-settings-configyml)
13. [Health checks](#13-health-checks-analyze-optimize-ux-doctor)
14. [Teams](#14-teams)
15. [Customizing and updating the toolkit](#15-customizing-and-updating-the-toolkit)
16. [Getting the best results with the least effort](#16-getting-the-best-results-with-the-least-effort)
17. [Troubleshooting](#17-troubleshooting)
18. [Cheat sheet](#18-cheat-sheet)

---

## 1. What the toolkit is

You ask your AI assistant for a change. The toolkit makes the assistant work in a fixed order: write a spec, design it, build it, review it, wrap it up. At the important points it **stops and asks you** (a *gate*). Everything it learns is saved as plain markdown in a `.adlc/` folder in your repo, so the next piece of work starts smarter.

**You decide. The assistant drafts.** That is the whole idea.

It works with **Claude Code, Cursor, GitHub Copilot, OpenAI Codex and Gemini CLI**, on macOS, Windows and Linux. The same workflow and the same `.adlc/` folder work in all of them, so you can switch tools without losing anything.

### The pieces

| Piece | What it is | Where it lives |
|---|---|---|
| **The toolkit** | This repo. The workflow rules (`core/`), your overrides (`local/`), note templates (`templates/`), generated tool files (`adapters/`) | One folder on your machine — **you choose where** |
| **Adapters** | Tiny "pointer" files that connect your assistant's slash commands to the rules in `core/`. They copy no logic | Linked into your assistant's config |
| **The vault** | The `.adlc/` folder: specs, designs, decisions, lessons for *one* project | Inside each project repo |

### Words you will see

| Word | Meaning |
|---|---|
| **REQ** | One tracked piece of work (a *requirement*), e.g. `REQ-014`. Bugs are `BUG-007` |
| **Phase** | One step: spec → architect → implement → review → wrapup |
| **Gate** | A stop where the assistant waits for your decision |
| **Gate card** | The short summary shown at a gate, ending in your decision |
| **Profile** | How many gates a REQ gets, chosen by risk (`easy`, `standard`, `full`) |
| **Vault** | The `.adlc/` folder |
| **Agent** | A focused helper the assistant starts (a reviewer, an explorer, an implementer) |
| **Blast radius** | Every file and module a change touches, directly or indirectly |
| **ADR** | Architecture decision record: a short note on a decision and why it was made |
| **Lesson / gotcha** | Something learned (lesson) or a codebase quirk (gotcha), saved for next time |

---

## 2. Install — you choose where

There are **two separate choices**. Neither is forced on you.

### Choice 1 — where the toolkit folder lives

Clone it **anywhere you like**. `~/code/adlc-toolkit` is only an example; `D:\tools\adlc-toolkit` or `/opt/adlc` work equally well.

```bash
git clone <repo-url> <any-folder-you-like>/adlc-toolkit
cd <any-folder-you-like>/adlc-toolkit
```

One rule: **don't move it afterwards.** The installed commands read the rules from this folder every time they run. If you do move it, run the `sync` command again from the new location (see below) so the links point to the new place.

You need **Node 18 or newer** to run the installer.

### Choice 2 — how it is installed into your assistant

| Style | Command | Result | Best for |
|---|---|---|---|
| **Global** (default) | `node scripts/adlc.mjs sync --tool=<tool>` | Commands are available in **every repo** you open. Nothing is added to your projects except the `.adlc/` vault | Solo work across many repos |
| **Project-local** | `node scripts/adlc.mjs sync --tool=<tool> --repo=/path/to/project` | Commands are written **into that one project**. They look for the toolkit at `.adlc-toolkit/` inside the project, so you must also put a copy of the toolkit there (for example `git clone <repo-url> .adlc-toolkit`) | Teams: the workflow travels with the repo and everyone gets the same commands |

`<tool>` is one of `claude`, `cursor`, `copilot`, `codex`, `gemini`, or `all`.

**Always preview first.** Add `--dry-run` to see every action without changing anything:

```bash
node scripts/adlc.mjs sync --tool=claude --dry-run
node scripts/adlc.mjs sync --tool=claude            # then do it for real
```

### Where each tool puts things (global install)

| Tool | Installed into | Notes |
|---|---|---|
| Claude Code | `~/.claude/skills`, `~/.claude/agents`, `~/.claude/CLAUDE.md` | Full support. Only Claude has the hook that enforces vault size limits |
| GitHub Copilot | VS Code user prompts folder + `~/.copilot/agents` | Works in VS Code, Visual Studio, JetBrains. Not the github.com web chat. Use `--insiders` for VS Code Insiders, or `--vscode-prompts-dir=<path>` to choose the folder |
| OpenAI Codex | `~/.codex/prompts`, `~/.codex/agents`, `~/.codex/AGENTS.md` | Full support |
| Gemini CLI | `~/.gemini/commands`, `~/.gemini/agents`, `~/.gemini/GEMINI.md` | Commands are TOML; the installer handles that |
| Cursor | `~/.cursor/commands` | Partial: its memory *rule* is per-project. Install per repo with `--repo`, or paste the printed `adlc.mdc` into Settings → Rules (User Rules). No separate sub-agents, so roles run in one session |

Full per-tool notes: [`install/`](install/README.md). What works fully and what is reduced on each tool: [`fidelity-matrix.md`](fidelity-matrix.md).

### Other install options

- **Let your assistant do it.** Open the toolkit repo in your assistant and paste the prompt from [`install/README.md`](install/README.md#or-let-your-ai-assistant-install-it). It identifies itself, previews, installs, and walks you through verification.
- **Install by hand.** Each per-tool guide has copy-and-paste steps for macOS/Linux and Windows PowerShell.
- **Several tools at once.** `--tool=all` installs for every assistant. They all share the same `.adlc/` vault.

### Useful `sync` flags

| Flag | Effect |
|---|---|
| `--dry-run` | Show every action, change nothing |
| `--repo=<path>` | Install into one project instead of globally |
| `--pull` | `git pull` the toolkit first, then reconcile (global installs) |
| `--no-prune` | Don't remove commands that no longer exist in the toolkit |
| `--force` | Overwrite an existing real file without making a `.bak` backup |

### Windows notes

- Global installs use symlinks. Turn on **Developer Mode** in Windows settings, or run the terminal as administrator.
- In `--toolkit-path` values, use forward slashes (`D:/tools/adlc-toolkit`); they work and avoid escaping.

### Updating

Run the same command again. It is safe to repeat: new commands are linked, removed ones are cleaned up, and anything you added yourself is left alone.

```bash
node scripts/adlc.mjs sync --tool=all --pull
```

Or, from inside your assistant, run **`/toolkit-update`** for a guided update that previews the changes and warns you if a file you customized in `local/` has changed upstream.

### Optional: keep generated files in sync automatically

If you work on the toolkit itself, run `node scripts/adlc.mjs hooks` once. A pre-commit hook then rebuilds `adapters/` whenever you commit a change to the rules.

---

## 3. Set up a project

Do this once per code repo. Open your assistant in the repo and run:

```
/init
```

`/init` does the following:

1. **Asks you questions** (one at a time, with options):
   - Project name and a one-line description
   - Your stack: languages, frontends, backends, databases
   - Single repo or multi-repo (and the sibling repos' paths)
   - Your initials (1–8 lowercase letters) — used for IDs like `REQ-sf-007`
   - Vault layout: `month-author` (default for new vaults) or flat
   - **Git policy:** `manual`, `commit` or `commit+push` (see [section 10](#10-git--how-much-the-assistant-does))
   - Issue tracker (`github`, `linear`, `jira`, `none`) and design tool (`figma`, `none`)
2. **Scans your existing docs** — README, ARCHITECTURE, CONTRIBUTING, lint configs, existing ADRs, glossary — and shows what it found.
3. **Creates `.adlc/`** with starter files, templates and `config.yml`. Imported content is marked `STATUS: needs verification` until you confirm it.
4. **Proposes a `.gitignore` block** for per-developer scratch files. It asks before writing; answer `add`, `add except <pattern>`, or `skip`.

Not sure about an answer? Pick the default or skip it. Everything can be changed later with `/config`.

After `/init`, open `.adlc/config.yml` and check the `stack:` section. The better it matches your project, the less you correct later.

**`/init` is one-time.** After a toolkit update, use `/config migrate` to pick up new settings, not `/init`.

---

## 4. Pick the right command

This is the most important choice.

| You want to… | Run | Gates you'll see |
|---|---|---|
| Make a small change (tweak, small feature, small refactor) | `/task <what>` | 2 — Plan, Ship |
| Fix a bug | `/bugfix <what's wrong>` | 2 — Diagnose, Ship (+ Verify if review finds something serious) |
| Build a normal feature | `/proceed <what>` | 3 — Plan, Build & Review, Ship |
| Build something risky | `/proceed <what>` | 4–5 — picked automatically |
| Build a feature with little involvement | `/autopilot <what>` | 1 final review, plus anything risky |
| Run several independent features at once | `/sprint "feature A" "feature B"` | One shared gate queue |
| Run a phase on its own | `/spec`, `/architect`, `/implement`, `/review`, `/wrapup` | 1 each |

**When unsure, start with `/task`.** It checks size and risk first. If the work is bigger than it looks, it says so and offers to hand it to `/proceed`. The REQ it already created carries over; nothing is lost.

### How the profile is chosen (`/proceed`)

| Profile | Gates | Used when |
|---|---|---|
| `easy` (`/task`) | `plan` · `ship` | Small, low-risk change |
| `standard` | `plan` · `verify` · `ship` | The default for `/proceed` |
| `full` | `spec` · `architect` · (`implement`, only for sensitive work) · `verify` · `ship` | Any of the triggers below |

`full` is chosen if **any** of these is true:
- It touches a **sensitive surface**: auth, security, secrets, a data/schema migration, a public API contract, or anything irreversible (your `autonomy.hard_stops` list in config overrides this list)
- A new ADR is needed
- It spans more than one repo
- It touches roughly 8+ files or 3+ modules/layers
- It has a significant UI surface
- You passed `--profile=full`

Rules about profiles:
- **Risk beats size.** A 3-line change to login code still gets the full set.
- **Upgrade only.** If a phase discovers a trigger the profile missed, the REQ is upgraded and the next card says so. It never downgrades by itself.
- **Fewer gates, never fewer checks.** A combined gate still shows every check that the separate gates would have shown.
- You can pick a lighter profile at a card. That is logged as a `profile-override` and shown on every later card.

### Starting from a ticket

If you set `sources.issues` in config, you can seed the work from an issue: `/spec #842`, `/proceed #842`, `/bugfix #842`, or a full issue URL. For GitHub the `gh` CLI is used if installed; otherwise an attached MCP server, then a URL fetch, and if none work it falls back to writing the spec by hand.

---

## 5. The five phases, in detail

`/proceed` runs these in order. You can also run any one by hand.

### Phase 1 — `/spec`

**Does:** drafts the requirement, checks it against the vault (existing lessons, gotchas, ADRs), picks the profile, creates the REQ's folder and `pipeline-state.json`.
**Checks:** goal is clear, acceptance criteria are testable, scope is bounded, nothing contradicts the vault.
**Creates:** `requirement.md`.
**If your request is vague** it asks you with concrete options instead of guessing.

### Phase 2 — `/architect`

**Does:** sends the **codebase-explorer** to map similar patterns, blast radius and integration points; drafts `architecture.md`; breaks the work into `tasks/TASK-*.md` with an order (e.g. `T1,T2 → T3,T4 → T5`); decides whether a new ADR is needed.
**On risky work** the **architecture-adversary** attacks the design first, and only findings that survive its own rebuttal reach you.
**Checks:** every acceptance criterion is covered, no circular task dependencies, conventions followed, tests are concrete.
**Creates:** `architecture.md`, `exploration.md`, `tasks/`, possibly `architecture/adr-NNN-*.md`.

### Phase 3 — `/implement`

**Does:** runs the tasks in order; independent tasks run in parallel; each is built by a **task-implementer** agent. Runs tests at the end.
**Edits:** freely inside the REQ's blast radius; **stops and asks** before touching a file no task named, adding a top-level dependency, changing a schema, or touching auth/security/secrets (set by `workflow.edits`).
**Creates:** the code changes (uncommitted unless `git.mode` allows commits), `commits-draft.md` (ready-to-run commit messages), `lesson-candidates.md`.

### Phase 4 — `/review`

**Does:** builds one shared review packet, then runs four **read-only** reviewers in parallel:
- **correctness-reviewer** — logic, race conditions, security
- **quality-reviewer** — conventions, naming, duplication, test coverage
- **architecture-reviewer** — layering, separation of concerns, API contracts
- **reflector** — checks the change against lessons already in the vault

A fifth, the **ui-reviewer**, drives a real browser when your change touches a UI (including an API change that a screen consumes). It needs `stack.frontends` set in config.

Findings are ranked `critical` / `major` / `minor` (trivial ones appear only as a count) and checked against the acceptance criteria. Reviewers **never fix** anything; they only report. That keeps the reviewer independent of whoever wrote the code.
**Creates:** `verification.md` (the compact verdict), `review-log.md` (full details), `review-packet.md`.

### Phase 5 — `/wrapup`

**Does:** checks the final diff, drafts the PR, saves what was learned (lessons, gotchas, concepts, components, ADRs), updates the vault's index and logs, checks docs for drift (the repo-doc sweep), and prepares a merge checklist.
**Never:** commits, pushes, opens a PR or merges. You run the printed git/gh commands.
**Creates:** `pr-draft.md`, `merge-checklist.md`, vault updates. After merge it offers to archive the REQ folder under `specs/_archive/`.

### Fixing review findings

At the review gate you choose which findings to fix and which to accept. Fixes go back through a bounded re-review, so a fix is never un-reviewed.

---

## 6. Gates and gate cards

A gate is a stop. Each one also writes an `.awaiting-approval` marker file, so you can close your laptop and pick it up in another session.

### Reading a card

```
GATE 1/3 · Plan · REQ-015-export-button
   small & clear — recommend approve

READY       requirement.md · 3 criteria · architecture.md · 4 tasks
CHECKS      ✓ criteria testable · ✓ no sensitive surface

MY READ     approve — scope is small and well defined
Decision →  approve (start building) · revise <what> · abort
```

| Section | Meaning |
|---|---|
| **READY** | What got done. For information only |
| **NEEDS YOU** | The items that need your call. Read these first. Absent when there are none |
| **CHECKS** | `✓` passed · `⚠` needs attention · `?` open question |
| **MY READ** | The recommendation and one line of why |
| **Decision →** | Your options, each saying what happens next |

On Claude Code the decision arrives as a multiple-choice question. On other tools it is an inline menu. Cards are short (about 20 lines) and plain text, so they read in any terminal. Detail lives in the files; ask `show findings` for the full list.

### Your answers

| Answer | What happens |
|---|---|
| **approve** | Continue to the next step |
| **revise `<what>`** | Fix it and show the gate again. Be specific: "revise: also handle an empty list" |
| **abort** | Stop this REQ |
| gate-specific | **escalate** (in `/task`: hand to `/proceed`), **reframe** (in `/bugfix`: it's really a feature, route to `/spec`) |

**Low-effort rule:** no `NEEDS YOU` section and every check `✓` means approve. Spend your attention only where the card points.

### What each gate looks at

| Gate | Combines | You decide |
|---|---|---|
| `spec` | Phase 1 | Is this the right thing to build? |
| `architect` | Phase 2 | Is the design and task plan right? Accept the proposed ADR? |
| `plan` | Phases 1–2 | Both of the above in one card |
| `implement` | Phase 3 | Sensitive work only: is the code right before review? |
| `verify` | Phases 3–4 (or 4) | Which findings to fix, which to accept |
| `ship` | Phase 5 | PR, lessons and vault updates. Then you run the git commands |

---

## 7. Bugs and small changes: `/bugfix` and `/task`

### `/bugfix` — for defects

```
/bugfix the export button 500s when the list is empty
/bugfix #42
```

1. **Report + investigate.** Drafts `bug.md`, sends the explorer to find the root cause. No gate yet.
2. **Diagnose gate.** You see the root cause and the planned fix. Options include `reframe` if the "bug" is really a feature.
3. **Fix.** Fix plus a **regression test**, then tests run.
4. **Review.** Reviewers look at the fix. A **Verify gate** appears only if review finds a critical or major issue.
5. **Ship gate.** PR draft, lessons, gotchas.

Bug IDs are `BUG-NNN` and follow the same ID scheme as REQs. Use `/bugfix` for defects, not features.

### `/task` — for small changes

```
/task add a "created at" column to the export
```

1. Looks at the area, then **triages** the change.
2. **Plan gate.** A short requirement and approach (the folded spec + architect).
3. Implements, reviews.
4. **Ship gate.**

It recommends `/proceed` instead (the `escalate` option) if any of these hold:
- A new ADR is needed
- Roughly 5+ files or 2+ modules/layers
- Cross-repo
- A sensitive surface (auth, security, secrets, migration, public API, irreversible) — **always**, however small the change
- More than about 3 acceptance criteria, or the scope is unclear

`/task` still creates a real `REQ-NNN-slug` in the vault. Small work is recorded, not done off the books.

---

## 8. Hands-off modes: `/autopilot` and `/sprint`

### `/autopilot`

A **decision-maker** agent answers the gates for you, citing evidence for each decision. You review once at the end. It saves every decision in `gate-decisions.md` and writes a `run-report.md`.

```
/autopilot "add CSV export to reports"       # new REQ, run autonomously
/autopilot REQ-014                           # run or resume an existing REQ
/autopilot REQ-014 --dry-run                 # show what it would decide; change nothing
/autopilot REQ-014 --until=plan              # run up to a phase, then hand back
/autopilot REQ-014 --gates=assisted          # override the gates setting for this run
```

`--until` accepts `spec`, `architect`, `plan`, `implement` or `verify`.

**Three dials** (in `config.yml → autonomy`, or flags):

| Dial | Values | Meaning |
|---|---|---|
| `gates` | `manual` · `assisted` · `auto` | `manual`: you answer all. `assisted`: you answer, with its recommendation shown. `auto`: it answers routine gates |
| `git` | `read-only` · `commit` · `commit+push` | How much git it may run. **Capped by `git.mode`** — it can lower it but never exceed it |
| `escalation` | `cautious` · `balanced` · `aggressive` | How readily it stops and asks you |

If no `autonomy` block exists, autopilot uses safe defaults (`assisted`, read-only git, `cautious`) and tells you so.

**It always stops for the human** on `hard_stops` — auth, security, secrets, payments, data migration, public API contract, irreversible changes, and external writes to a connected service.

**Circuit breakers** halt the whole run when:
- a gate hits its rework limit (`rework_cap_per_gate`, default 2)
- the run hits its total rework budget (`rework_budget_total`, default 5)
- the same failure reappears after a fix (the fix isn't converging)
- any decision's confidence is below `confidence_floor` (default 0.6)

**Git:** autopilot is the only command allowed to commit on its own, and only to the REQ's feature branch, at gates that carry code. It never force-pushes, rebases, rewrites history, or merges. At the end it **does not** merge or open the PR; you get one final review.

It is resumable from `pipeline-state.json`.

### `/sprint`

Runs several REQs **in parallel**, one `pipeline-runner` agent per REQ, each in its own isolated worktree. Gates from all REQs go into **one shared queue**.

```
/sprint REQ-101 REQ-102 REQ-103
/sprint "fix login redirect" "add export button"     # new REQs are drafted first
/sprint REQ-101 REQ-102 --gates=assisted
```

- Up to **5** REQs at once. More makes gate triage the bottleneck.
- Use it for **independent** REQs. REQs that depend on each other go through `/proceed` one at a time. Two REQs must not touch the same file.
- Without an `autonomy` block, `/sprint` uses `manual`.
- Needs a tool that can run sub-agents in parallel: Claude, Codex and Gemini do; Copilot goes one at a time; Cursor runs sequentially.

### Which should I use?

| If… | Use |
|---|---|
| The change matters and you want to judge it | `/proceed` |
| The work is well understood and routine | `/autopilot` with `assisted`, then `auto` once you trust it |
| You have a batch of independent items | `/sprint` |

Start with `assisted`. Move to `auto` when its recommendations keep matching yours.

---

## 9. Resuming, redoing and recovering

Gate state is saved to disk, so you can close the session and come back.

| Situation | Run |
|---|---|
| What's in progress, and what's waiting on me? | `/status` |
| Continue a REQ from where it stopped | `/proceed REQ-014` |
| Catch me up first (what changed, what's pending, a menu) | `/proceed REQ-014 --resume` |
| Redo the last 1–3 phases | `/proceed REQ-014 --revert~1` (or `~2`, `~3`) |
| Drop a REQ for good | `/proceed REQ-014 --cancel` |
| Records don't match git | `/recover` |

- `--revert~N` is for a healthy pipeline where you decided the last phase(s) need redoing. Beyond 3 phases, cancel and restart is usually less work.
- `--cancel` is the out-of-gate "this should not ship" switch. It differs from answering `abort` at a gate.
- **`/status`** is read-only. It shows every active REQ and bug: phase, gate `n/N`, profile, branch, isolation mode, blockers, findings counts, and recent audits. It also prints a size-budget strip for the vault.
- **`/recover`** reconciles records against git. Use it after a session crash, after work shipped outside the toolkit, or after a branch was deleted. It sorts each item as in-sync, stale-state, abandoned, sprint-stuck or divergent, shows a triage queue, and back-fills the vault for REQs whose code shipped without `/wrapup`. It changes the vault only, never code or git.
  - `/recover` — everything in flight · `/recover REQ-101` — one · `/recover REQ-101 BUG-007` — several
- **Merge detection is automatic.** After you merge the PR, `/status` shows the REQ as merged; the next pipeline command (e.g. `/proceed REQ-014`) closes it and offers to archive it.

**Habit:** start each session with `/status`.

---

## 10. Git — how much the assistant does

Set it once with `/init` or `/config git.mode=<mode>`:

| `git.mode` | The assistant… | You… |
|---|---|---|
| `manual` (default) | Creates the REQ's branch or worktree, then only *drafts* `commits-draft.md` and `pr-draft.md` | Run every commit, push, and the merge |
| `commit` | Also runs `git add` + `git commit` on the REQ's feature branch after each approved gate | Push, open the PR, merge |
| `commit+push` | Also pushes the feature branch (fast-forward only) | Open the PR, merge |

**These hold in every mode and cannot be turned off:**
- Only the REQ's own feature branch is touched
- Never commits or pushes to a protected branch (`git.protect`, default `main`, `master`, `release/*`)
- Never force-pushes, rebases, amends published commits, resets away commits, or deletes branches
- Never runs `gh pr create`, `gh pr merge`, or `--no-verify`
- Reading git (status, diff, log, show) is always allowed

**Merging is always yours.**

**Branch or worktree?** `workflow.isolation` decides where a REQ's work happens:

| Value | Behavior |
|---|---|
| `auto` (default) | A branch on your checkout for single REQs; a worktree for `/sprint` and cross-repo REQs |
| `branch` | Always a branch on your current checkout. Needs a clean working tree at the start; your editor session stays put |
| `worktree` | Always an isolated folder per REQ. Tolerates a dirty checkout; each REQ is a folder switch. Aborting is one `git worktree remove --force` |

**Least effort:** once you trust the output, switch to `commit`. It removes a manual step at every gate.

---

## 11. The vault (`.adlc/`)

Plain markdown. Open it in Obsidian for graph view and backlinks, or treat it as a folder.

### What is inside

| Path | Contents |
|---|---|
| `CLAUDE.md` | The rulebook for how the assistant reads and writes the vault |
| `config.yml` | Your settings |
| `now.md` | What is in flight right now (per-developer) |
| `hot.md` | The activity log, newest first; entries are never edited |
| `index.md` | Catalog of everything |
| `decisions.md`, `glossary.md` | Decision log and project terms |
| `context/` | Project overview, architecture, conventions |
| `architecture/` | High-level architecture and ADRs (`adr-NNN-*.md`) |
| `knowledge/lessons/` | One file per lesson, ID like `LESSON-REQ-042-1`, so teammates can't mint the same one |
| `knowledge/lesson-ledger.md` | Generated index of lessons. Never edit by hand |
| `knowledge/gotchas.md` | Codebase quirks |
| `knowledge/concepts/`, `components/` | Patterns, invariants, and one page per major module |
| `specs/` | One folder per REQ |
| `specs/_archive/` | Merged REQs, moved whole (nothing deleted) |
| `bugs/`, `sprints/` | Same idea for bugs and sprint registries |
| `audits/` | Dated reports from `/analyze`, `/optimize`, `/ux-doctor` |
| `templates/` | Your project's copies of the toolkit templates |

### What is inside a REQ folder

| File | Written by |
|---|---|
| `requirement.md` | `/spec` |
| `architecture.md`, `exploration.md`, `tasks/TASK-*.md` | `/architect` |
| `commits-draft.md`, `lesson-candidates.md` | `/implement` |
| `verification.md`, `review-log.md`, `review-packet.md` | `/review` |
| `pr-draft.md`, `merge-checklist.md` | `/wrapup` |
| `pipeline-state.json`, `.awaiting-approval` | Every phase (state and gate marker) |
| `gate-decisions.md`, `run-report.md` | `/autopilot` |

### What to commit

- **Commit:** specs, architecture, decisions, lessons, gotchas, ADRs, and the shared logs (`hot.md`, `decisions.md`, `glossary.md`). They are your team's memory. The logs carry `merge=union`, so parallel branches don't conflict.
- **Don't commit** (gitignored): `now.md`, `pipeline-state.json`, `.awaiting-approval`, drafts (`commits-draft.md`, `pr-draft.md`, `merge-checklist.md`), and `ui-auth.env`. `/init` proposes this block for you.

### Size limits

Files the assistant reads often have size budgets (for example `now.md` about 1KB, `hot.md` 500 lines, `CLAUDE.md` 5KB). `/wrapup` rotates old log entries; `/status` warns with `⚠` when you're over; `/config budgets` fixes it, one gated file at a time, deleting nothing.

### Vault conventions

- Wikilinks: `[[concepts/idempotency]]`, `[[knowledge/gotchas#^g05|G05]]`
- Block anchors for stable references: `^L-REQ-042-1` (lessons), `^g05` (gotchas), `^ADR-07` (ADRs)
- `STATUS: needs verification` marks provisional content; don't build on it without asking
- Refer to a REQ by its ID (`REQ-042`), never its folder path, because folders move when archived

### Where the vault lives

`.adlc/` sits in the root of each project repo. It is created there by `/init`; you don't choose another place for it. If one feature spans several repos, give each repo its own vault and list them under `repos:` in `config.yml`.

---

## 12. Settings (`config.yml`)

Change settings with `/config`; you rarely need to edit the YAML by hand.

```
/config                              show settings, or pick one to change
/config git.mode=commit              set one directly
/config workflow.isolation=worktree autonomy.gates=assisted     set several
/config migrate                      pick up new settings after a toolkit update
/config templates                    refresh your template copies (per file, gated)
/config budgets                      bring oversized vault files back under budget
/config ledger                       rebuild the lessons ledger
```

`/config` validates each value, shows `old → new`, edits surgically (your comments stay), and re-syncs derived files (changing `git.mode` also refreshes the git block in `.adlc/CLAUDE.md`). It never touches git.

### The settings that matter

| Setting | Values | What it does |
|---|---|---|
| `git.mode` | `manual` · `commit` · `commit+push` | How much git the assistant runs |
| `git.protect` | list of branch globs | Branches the assistant never writes to |
| `workflow.isolation` | `auto` · `branch` · `worktree` | Where a REQ's code is built |
| `workflow.edits` | `confirm-out-of-scope` · `confirm-each` | Friction *inside* a phase. Phase gates apply either way |
| `req.id_scheme` | `sequential` · `prefixed` · `ticket` | How IDs are made (see [Teams](#14-teams)) |
| `req.prefix` | your initials | Used by `prefixed` |
| `layout.partition` | `none` · `month-author` | Folder shape of `specs/`, `bugs/`, `sprints/` |
| `stack` | languages, frontends, backends, databases | Helps every phase choose stack-specific behavior |
| `review.packet.exclude` | globs | Files left out of the review packet (lockfiles, snapshots, generated API clients). Each excluded file saves tokens several times over |
| `docs` | paths | The user-facing docs `/wrapup` checks for drift. `docs: []` turns the sweep off |
| `ui` | dev_server, url, routes, browser, auth | How the ui-reviewer starts and drives your app |
| `sources` | issues, design, repo, write, mechanism | Where tickets and designs come from; `write` lists services it may write back to (default none) |
| `autonomy` | see [section 8](#8-hands-off-modes-autopilot-and-sprint) | How independent `/autopilot` and `/sprint` are |
| `repos`, `merge_order` | | Multi-repo layout and merge order |
| `forbidden_paths` | paths | The assistant must not read these (secrets, prod data) |
| `read_only_sources` | paths | May be read for checking, never written |

### The UI reviewer's browser

`ui.browser` is `auto` (default), `chrome`, `headless` or `static`. `auto` tries Claude in Chrome, then headless Playwright/Puppeteer if installed, then a static review with a manual checklist for you. It never blocks the pipeline. If your app needs a login, set `ui.auth` and keep test credentials in `.adlc/ui-auth.env` (gitignored, never printed in reports).

### Model tiers

Agents use capability tiers, not model names: `fast`, `balanced`, `deep`. On Claude these map to Haiku, Sonnet and Opus. The mapping lives in `core/manifest.json → tierToModel` and can be overridden per project.

---

## 13. Health checks: `/analyze`, `/optimize`, `/ux-doctor`

These are standalone, read-only, and have no gates. Each writes a dated report to `.adlc/audits/`. Run them now and then, and turn the findings into work with `/task` or `/spec`.

| Command | Agent | Looks for |
|---|---|---|
| `/analyze` | health-auditor | Tech debt, code smells, dead code, complexity hotspots, missing tests, drift from your conventions |
| `/optimize` | performance-scanner | LLM/API cost hotspots, database performance, latency drivers, caching opportunities |
| `/ux-doctor` | design-system-auditor + ui-reviewer | UX and design-system problems: token compliance, scale consistency, duplication, drift — a static source pass plus a runtime browser pass |

`/ux-doctor` forms:
- `/ux-doctor` — sizes the UI first; small apps get one pass, large apps get a plan run in segments
- `/ux-doctor <segment | feature | route | path>` — audit just that part
- `/ux-doctor resume` — continue an unfinished segment plan in a new session

`/ux-doctor` also maintains `.adlc/context/design-system.md`.

---

## 14. Teams

The toolkit works solo out of the box. For a team, set these.

### 1. IDs that don't collide

The default `sequential` scheme picks the next number by scanning the vault. Two people branching at the same time can both create `REQ-042` and conflict at merge.

| `req.id_scheme` | ID looks like | Use when |
|---|---|---|
| `ticket` (recommended) | `REQ-842` or `PROJ-842` | You set `sources.issues`. `/spec #842` takes the ID from the tracker, which is already unique |
| `prefixed` | `REQ-sf-007` | No shared tracker. `req.prefix` gives each person a private number space. Works offline |
| `sequential` | `REQ-007` | Solo only |

The same scheme applies to `BUG-*` IDs.

### 2. A `specs/` you can still browse

Unique IDs don't stop the folder list growing. `layout.partition: month-author` puts new folders at `specs/2026-08/sf/REQ-042-slug/`. This is for browsing only; it does **not** prevent ID collisions. Old and new shapes work side by side. `/config migrate` moves existing folders, after showing you the plan.

### 3. A shared history that doesn't conflict

`hot.md`, `decisions.md` and `glossary.md` are committed with `merge=union`, so parallel branches combine instead of conflicting. Lessons have REQ-namespaced IDs, so teammates can't create the same lesson ID. The lesson dedup at `/wrapup` compares against the base branch, so duplicates across branches are caught.

### 4. Everyone gets the same commands

Use a **project-local install** (`--repo=<project>`) so the workflow travels with the repo, or have everyone run the same global `sync`. Put team conventions in `local/` and share them (see next section).

---

## 15. Customizing and updating the toolkit

**Don't edit `core/`.** It is the upstream engine. Put your changes in `local/`, which always wins over `core/`:

| You want to… | Do this |
|---|---|
| **Add** a skill or agent | Create `local/skills/<name>.md` (or `local/agents/<name>.md`) with the same frontmatter shape as the core ones, and register it in `local/manifest.json` |
| **Override** a core one | Put a file with the **same name** in `local/skills/` or `local/agents/` |
| **Disable** one you don't use | Add `{ "name": "optimize", "disabled": true }` to `local/manifest.json` |

Then run `node scripts/adlc.mjs sync --tool=all`.

`local/manifest.json` is a partial manifest. Entries are matched by `name`; your fields override, new names are added.

```json
{
  "skills": [
    { "name": "deploy", "category": "pipeline", "gate": true, "agents": [],
      "summary": "Our internal deploy pipeline." },
    { "name": "optimize", "disabled": true }
  ],
  "agents": [
    { "name": "compliance-reviewer", "tier": "balanced", "readonly": true,
      "dispatchable": true, "role": "Checks changes against our compliance rules." }
  ]
}
```

**Updating** (`/toolkit-update`, or `git pull` + `sync`): because you never edited `core/`, the pull merges cleanly. The one thing to watch: an override in `local/` keeps shadowing the core file even after upstream improves it. `/toolkit-update` lists exactly those files. Skim `CHANGELOG.md` for changes to files you shadow. After updating, run `/config migrate` in each project to pick up new settings.

To add support for another AI tool, add an emitter to the `TOOLS` map in `scripts/adlc.mjs` and rebuild.

**The seven principles** every skill follows (full text in [`ETHOS.md`](../ETHOS.md)):
1. You decide; the assistant drafts
2. Spec first, code second
3. Reviewers are read-only
4. Knowledge compounds
5. Process is explicit — steps are a protocol, not a suggestion
6. Ask with concrete options, not open questions
7. Speak plainly

---

## 16. Getting the best results with the least effort

1. **Write a clear first sentence.** "Add a CSV export button to the reports page, same columns as the table" beats "export stuff". A clear request means fewer `revise` rounds.
2. **Fill in `stack` and `docs` in config once.** Every phase uses them.
3. **Let triage pick the size.** Use `/task` for anything that might be small. Don't force `/proceed` on a typo, and don't do real work in plain chat — the vault learns nothing from it.
4. **Read only `NEEDS YOU`.** Cards are built so a clean one is a few seconds.
5. **Revise early.** Fixing a spec takes a minute; fixing built code takes much longer. Push back at the Plan gate.
6. **Always finish the Ship gate.** That is where lessons and decisions are saved. Skipping it is how the toolkit forgets.
7. **Use `/bugfix` for bugs.** It writes a regression test and records the root cause.
8. **Exclude generated files from review.** Add lockfiles, API clients and snapshots to `review.packet.exclude`. Smaller packets make faster, cheaper reviews.
9. **Give it more git once you trust it.** `git.mode: commit` saves a manual step at each gate.
10. **Connect your tracker.** Set `sources.issues` so `#842` is enough to start, and use `ticket` IDs on teams.
11. **Start each day with `/status`,** and run `/recover` if it lists something you know is done.
12. **Commit the vault.** Your teammates and their assistants then benefit from the same lessons.
13. **Use `/autopilot` for routine work** and `/proceed` where your judgement matters.
14. **Run `/analyze` monthly** and turn the top findings into `/task`s.
15. **Keep a clean working tree** if you use `branch` isolation, or switch to `worktree`.

---

## 17. Troubleshooting

| Problem | Fix |
|---|---|
| Commands don't appear after install | Re-run `sync` for your tool, then restart or reload the assistant (VS Code: reload the window). Check with `--dry-run` that it's targeting the right tool |
| `<agent> isn't installed` | Run `node scripts/adlc.mjs sync --tool=<tool>`, then re-run the step. The pipeline stops rather than doing a reviewer's work itself, so reviews stay independent |
| Symlink error on Windows | Turn on Developer Mode or run the terminal as administrator |
| Installed commands stopped working after moving the toolkit folder | Run `sync` again from the new location |
| `/status` shows a REQ you know is finished | Run `/recover` |
| A session crashed mid-phase | `/proceed REQ-NNN --resume`; if state looks wrong, `/recover` first |
| Two people have the same REQ number | Switch to `req.id_scheme: ticket` or `prefixed`, and rename one REQ |
| New settings missing after a toolkit update | `/config migrate` |
| Pipeline files show up as unstaged changes in git | Add the `.gitignore` block that `/init` proposes (see the list in `core/skills/init.md`, step 12) |
| `branch` isolation refuses to start | It needs a clean working tree. Commit or stash, or `/config workflow.isolation=worktree` |
| Vault files too big, `/status` shows `⚠` | `/config budgets` |
| Review is slow or expensive | Add generated files to `review.packet.exclude` |
| Not sure what a skill does | Read `core/skills/<name>.md`; it is the full protocol |

---

## 18. Cheat sheet

```
SETUP (once)
  node scripts/adlc.mjs sync --tool=<tool> [--repo=<path>] [--dry-run]
  /init                          set up a project (.adlc/)

EVERY DAY
  /status                        what's in progress, what's waiting on me
  /task <what>                   small change           (2 gates)
  /bugfix <what> | #42           bug fix                (2–3 gates)
  /proceed <what> | #42          feature                (3–5 gates, by risk)
  /autopilot <what>              feature, hands-off     (1 final review)
  /sprint "A" "B"                up to 5 in parallel

PHASES BY HAND
  /spec  /architect  /implement  /review  /wrapup

RESUME / REDO
  /proceed REQ-N                 continue
  /proceed REQ-N --resume        continue with a catch-up summary
  /proceed REQ-N --revert~1      redo the last phase (also ~2, ~3)
  /proceed REQ-N --cancel        drop a REQ
  /recover                       fix records that don't match git

HEALTH
  /analyze   /optimize   /ux-doctor

SETTINGS & UPDATES
  /config [key=value]            view or change settings
  /config migrate                pick up new settings after an update
  /toolkit-update                update the toolkit itself

AT A GATE
  approve · revise <what> · abort      (+ escalate / reframe where offered)
```

**More detail:** [Quickstart](quickstart.md) · [Gate cards](gate-cards.md) · [Install guides](install/README.md) · [What works on each tool](fidelity-matrix.md) · [Gate rules](../core/GATE-PROTOCOL.md) · [Vault layout](../core/VAULT-LAYOUT.md) · [Customizing: `local/README.md`](../local/README.md) · [Principles: `ETHOS.md`](../ETHOS.md)
