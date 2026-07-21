# Changelog

All notable changes to the ADLC toolkit. The toolkit version lives in `core/manifest.json` → `version`.

Labels used below: **[breaking]** needs action on update, **[protocol]** changes how a skill behaves, **[vault-format]** changes on-disk vault layout, **[tooling]** install/build only.

## [1.3.6] — 2026-07-21

### Claude extras — statusline + gate notifications **[tooling]**

- New optional **statusline** for Claude Code: a persistent terminal line showing the active REQ, its phase, and `GATE WAITING` when the pipeline is paused for you (`ADLC REQ-014 · phase 3 (implement) · GATE WAITING`; with several in flight, a count of waiting gates). Zero tokens; reads `.adlc/` pipeline state and the `.awaiting-approval` markers; prints nothing when there's nothing to say and stays silent on any error.
- New optional **gate notification hook**: on Claude Code's `Notification` event, if a gate marker exists, emits an OSC 9 desktop toast (`ADLC gate ready: REQ-014 (review)`) — supported by Windows Terminal, iTerm2, WezTerm, Ghostty. Look away during long phases; the gate finds you.
- Both live in `core/extras/claude/` with a plain-language setup README (two `settings.json` snippets) and are passed through to `adapters/claude/extras/` by the build — which previously wiped anything hand-placed in `adapters/`. `local/extras/` overrides work like everywhere else. Claude-only by nature; other tools lose nothing.

### Update notes

- Re-run `node scripts/adlc.mjs build --tool=all` (or `sync`), then follow `adapters/claude/extras/README.md` to wire the two snippets into `~/.claude/settings.json` if you want them.

## [1.3.5] — 2026-07-21

### Model discipline — the right model for every job **[protocol]**

- **No more silent inline fallback.** Skills must dispatch agents by exact registered name; if an agent isn't installed (stale sync), they stop and say so instead of quietly doing the work in the main session. That fallback was how a haiku-priced exploration became an opus-priced one — and how review lost its independence (the context that wrote the code was reviewing it). New rule in ETHOS §3 and at every dispatch site; `/autopilot` HALTs on a missing agent. The one deliberate exception stays: `pipeline-runner` reviews inline in sprint mode by design, and now labels its review sections accordingly.
- **Every agent report says who wrote it.** First line: `Written by: <agent-name> (tier: <tier>)` — with an explicit note when running inline instead of as a sub-agent. `verification.md` carries a reviewer roster line, so a model-tier leak is visible at the gate instead of on the invoice.
- **Current model IDs baked into the adapters** (verified 2026-07-21; `tierVerified` in the manifest, re-verify quarterly): Codex agents get `gpt-5.4-mini` / `gpt-5.3-codex` / `gpt-5.5` per tier plus a new `model_reasoning_effort` line (low/medium/high); Gemini's fast-tier agents get `gemini-3-flash-preview` in frontmatter (balanced/deep inherit the session default). Claude keeps `haiku`/`sonnet`/`opus` aliases on purpose — they track the latest models automatically. New optional `tierEffort` manifest block; `local/manifest.json` can override everything as before.

### Update notes

- Re-run `node scripts/adlc.mjs build --tool=all` (or `sync`) — Codex and Gemini adapters change; verify the Codex model IDs against your Codex version before relying on them.

## [1.3.4] — 2026-07-21

### Terminal-readable cards — structure over decoration **[protocol]**

- Gate cards no longer draw fixed-width rulers (`── … ──────`) — they break at narrow terminal widths. The header is now a short plain line (`GATE 2/5 · Architect · REQ-014-payment-retries`); user-facing lines stay at or under ~72 characters; cards target 20 lines or fewer, with long content offered on demand ("say `show findings` for the full list"). All example cards updated to match.
- `verification.md` now leads with a **findings-at-a-glance table** — one row per finding with an ID (C1/M1/m1), severity, one-line summary, location, and fix effort — so triage happens before any detail. Review agents gained an `Effort: small | medium | large` field to feed it; `fix <ids>` replies use the IDs.
- `/proceed --resume` **leads short**: a three-line catch-up plus the menu; the full breakdown (activity, changed files, drift checks) only on `details`. The person coming back from a break no longer gets a wall of text.
- The implementer's out-of-scope stop now has a scripted, plain-words ask: "I need to touch `<file>`, which isn't in the plan, because `<reason>`. OK to proceed, or should I find another way?"
- `pipeline-runner` must pair every machine tag with a human sentence (`gate-blocked:review` + "Review finished: 2 major findings — waiting for your call"). On Claude, each gate option's consequence now rides in its `AskUserQuestion` description.
- `/spec` asks its 2–3 highest-impact clarifying questions first, not a questionnaire; `/init`'s discovered-docs list is grouped by destination in short lines instead of a 118-character-wide table.

## [1.3.3] — 2026-07-21

### Plain-language pass 2 — gate-card examples and queues **[protocol]**

- Every example gate card rewritten in the VOICE register: severities spelled out, options carry their consequence (`approve (move on to implementation)`), no more symbol soup (`vault: 4 candidates → L-042 promoted, ^g14 gotcha` is now `knowledge saved: lesson L-042 · gotcha g14 · ADR-007 confirmed`), "red→green" spelled out as "fails without the fix, passes with it", `✓ blast radius` is now `✓ changed files match the plan`, and "hard-stop-eligible" reads "always stops for your OK — even under `/autopilot`".
- `/recover`'s queue leads with a plain status line per entry ("records are behind — this actually shipped") with the class slug in parentheses; the `resume` reply is renamed `leave` (it never resumed anything — it leaves the entry as-is).
- One payoff-for-effort phrasing across `/analyze`, `/optimize`, and `/ux-doctor` (was three different formulas, one of them contradictory).
- `/init` explains the committed-vs-gitignored split in two sentences instead of a taxonomy lecture; "hermetic" is gone; reflector's severity rules define `landmine` / `trap` / `careful` inline.

## [1.3.2] — 2026-07-21

### Plain-language layer — `core/VOICE.md` **[protocol]**

- New **`core/VOICE.md`**: the rules for every word the pipeline puts in front of the user — everyday words over academic ones (decide, not adjudicate), toolkit terms glossed on first use, machine tags always beside a plain sentence, every gate option stating its consequence, concrete over abstract, short sentences in cards. Loaded at preflight by all nine gate-bearing skills; every agent carries a short Voice digest. New ETHOS principle 7 — **Speak Plainly**: a gate the user can't cheaply read is a gate they'll rubber-stamp.
- Findings vocabulary made plain: `Locus` → `Where`, `Authority` → `Rule broken`, `Surviving refutation` → `Why this holds up`, `Escalation tolerance` → `Caution level`, `Independence` → `Judged independently (yes/no)`, `Directives` → `Fixes requested`, `Evidence considered` / `Rationale` → `What I looked at` / `Why`. One severity scale everywhere: `critical | major | minor | trivial`, spelled out on cards (no more `crit`/`maj`/`min`), trivial shown as a count.
- "Reconnaissance/recon" → **exploration** everywhere (now matches the artifact name `exploration.md`); "decision dossier" → "catch-up summary"; the shared Packet-gap instruction rewritten in plain words.
- New gate-card invariant: **every option states its consequence** (`approve — moves on to implementation`), never a bare `approve · revise · abort`.
- `docs/quickstart.md` now opens with a six-term glossary (REQ finally expanded to "requirement"); gotcha/lesson severity words defined inline in their templates.

### Update notes

- Re-run `node scripts/adlc.mjs build --tool=all` (or `sync`) so agent/skill descriptions pick up the new wording.

## [1.3.1] — 2026-07-21

### Renames — `/ship` → `/autopilot`, phase labels match skill names **[protocol]** **[breaking]**

- **`/ship` is now `/autopilot`.** "Ship" is the word users reach for when they mean "finish this piece of work" (which is `/wrapup`'s job) — typing it launched the autonomous pipeline instead. `/autopilot` says what it is, and no longer collides with the `workflow.isolation: auto` config value. Its final artifact is `run-report.md` (was `ship-report.md`). Machine state values are unchanged (`currentPhaseGate: "ship"` and friends), so in-flight REQs, `/status`, and `/recover` keep working.
- Phase display labels now match the skills that run them: Phase 4 gates read **Review** (was "Verify"), Phase 5 **Wrap up** (was "Ship").
- Doc accuracy fixes: vault README no longer claims "Claude never runs git" (it contradicted `git.mode`); SDLC → ADLC in three files; spec-template's phase row matches the real pipeline; "status machine" → "state machine"; broken sentence in `now.md`.

### Update notes

- Re-run `node scripts/adlc.mjs build --tool=all` (or `sync`) — the `ship` adapters are replaced by `autopilot` ones.

## [1.3.0] — 2026-07-20

### UX layer — `/ux-doctor`, design-system-auditor, UX adversary lens **[protocol]**

- New standalone skill **`/ux-doctor`**: whole-app UX & design-system audit, shaped like `/analyze` (no gates, dated report, trends). Two passes run in parallel — the new **`design-system-auditor`** agent audits the UI *source* (token compliance and hardcoded values, scale coherence, component duplication, naming, cross-screen consistency, drift vs `design-system.md` with the cause classified), while the **`ui-reviewer`** gains a `standalone-audit` trigger and walks the *running app* (heuristic evaluation, cross-screen-consistency screenshots, design-system match — on top of its existing browser tiers). Findings consolidate into `.adlc/audits/ux-YYYY-MM-DD.md` with a severity × effort matrix (quick wins first) and gated routing of fixes into `/task` or `/spec`. No auto-REQs; read-only on source. **Large apps segment:** the skill sizes the UI surface first and, past roughly a session's worth, proposes a gated **segment plan** (`ux-plan-*.md`, feature-area segments) run in phases — a cheap global *system pass* first (which is also when the design-system synthesis is offered, so segments audit against the contract), then per-segment passes with the plan updated at every segment boundary (a dead session loses one segment; `/ux-doctor resume` continues in a fresh one), then consolidation with a **cross-segment consistency** lens that catches misalignment between features that no per-segment pass can see. `/ux-doctor <feature|route|path>` scopes a single run instead; coverage is never silently thinned — unaudited segments stay `pending` in the plan.
- **`architecture-adversary` gains a UX & design consistency lens** and a fifth full-pass trigger, **`ui-surface`** (UI-facing ACs, frontend files in the blast radius, or a resolved design reference) — UI-heavy REQs now get attacked pre-gate: unplanned screen states, irreversible flows, design-reference contradictions, bespoke components where the system already has one. `/architect`'s quick self-check adds "what screen state has no plan."
- **`ui-reviewer`: chrome-first + auth story.** Claude in Chrome is explicitly the first-choice browser tier (it drives the user's real, signed-in session, so login walls often vanish). For apps behind a login, new optional `ui.auth` config (`login_url`, `env_file` — default `.adlc/ui-auth.env`, per-developer and gitignored) lets the headless tier authenticate from a local dotenv; with no credentials the review degrades to public surfaces and says so. Credential values never appear in reports, logs, or screenshots, and `/init`'s proposed `.gitignore` block covers the env file.

### Design-system contract **[vault-format]**

- New `templates/design-system-template.md` → `.adlc/context/design-system.md`, created **gated** by `/ux-doctor` and seeded from the observed de facto system (`STATUS: needs verification`, born minimal). One contract, three consumers: `/ux-doctor` measures drift from it, the `ui-reviewer` design-matches against it in `/review`, and the adversary's UX lens checks plans against it in `/architect`.

### Update notes

- Run `node scripts/adlc.mjs build --tool=all` (or `sync`) once to generate the new skill/agent adapters.
- In each active project, `/config templates` picks up `design-system-template.md`.

## [1.2.0] — 2026-07-02

### Visual layer — Mermaid diagrams **[protocol]**

- Diagrams are now a first-class, **judgment-call** part of specs and architecture. The architecture template ships component / sequence / ER examples and renders the task DAG as a Mermaid graph; the spec template gains an optional user-flow `stateDiagram`. `/architect`, `/spec`, and the `codebase-explorer` recon agent add a diagram when structure is hard to grasp from prose (and skip it when it would just restate a paragraph). `/status` shows a Mermaid pipeline/gate board when 2+ REQs are in flight. All text-first and portable (Obsidian, GitHub, IDE preview) — no Obsidian-only Dataview dependency.

### Shared gate protocol — consistent gate cards **[protocol]**

- New `core/GATE-PROTOCOL.md` defines one base **gate card** every human gate adapts: it separates *what's done* from *what needs you*, always gives a recommendation, and puts the decision last (delivered as an `AskUserQuestion` on Claude). Wired into every gate-bearing skill — `/spec`, `/architect`, `/implement`, `/review`, `/wrapup`, `/bugfix`, `/task`, and `/ship`'s terminal review — replacing the old ad-hoc `Gate:` prompts.

### Vault template refresh **[tooling]**

- `/config` gains a gated, per-file template refresh (`/config templates`, also offered at the end of `migrate`): it diffs each `.adlc/templates/` file against the toolkit's current templates and updates only the ones you approve, so template changes (like the new diagram sections) reach existing vaults without clobbering local edits. `/toolkit-update` advises it per project.

### Read-only reviewers write their own findings **[protocol]**

- All 10 read-only agents (the reviewers plus `codebase-explorer`, `architecture-adversary`, `health-auditor`, `performance-scanner`, `decision-maker`) are granted `Write`/`Edit`, scoped **by instruction** to their own findings/report artifact (e.g. `verification.md`, an audit report, `gate-decisions.md`) — never source, config, or any repo file, and never a git mutation. Fixes reviewers having to write reports through `Bash`. Consequence: read-only-on-source is now enforced by instruction on every tool, not the tool sandbox (reviewers always carried `Bash`, which could write regardless). ETHOS principle 3 and the fidelity matrix say so.

### Update notes

- Run `node scripts/adlc.mjs build --tool=all` (or `sync`) once to regenerate adapters — reviewers now get `Write`, and Codex agents `read_only = false`.
- In each active project, run `/config migrate` and accept the template refresh to pick up the new diagram sections.

## [1.1.0] — 2026-06-26

### Install / update system — rebuilt **[tooling]**

- **One idempotent command** for install *and* update: `node scripts/adlc.mjs sync --tool=<...>`. Re-running reconciles against a saved receipt — newly added skills/agents are linked, removed ones are pruned, content changes flow through automatically. `--pull` git-pulls the toolkit first.
- `scripts/install.mjs` and `scripts/build.mjs` are now thin aliases for `adlc.mjs sync` / `adlc.mjs build`; existing commands keep working.
- **Pre-commit hook** (`scripts/hooks/pre-commit`, activated with `node scripts/adlc.mjs hooks` → `core.hooksPath`): rebuilds and stages `adapters/` whenever a commit touches `core/`, `local/`, or the generator, so the committed snapshot never drifts from the source. No npm/husky dependency. Bypass with `git commit --no-verify`.
- Fixed the corruption mode where re-running the installer onto a symlinked target produced self-referential symlinks and `.bak` litter. `dist/` is now wiped and regenerated cleanly each run, the linker refuses any destination that resolves back inside the toolkit, and old flat-file skill installs are auto-migrated to `SKILL.md` folder form.
- **Auto-heal legacy directory-symlinks.** If a prior corrupted install left a whole tool-config dir symlinked into the toolkit (e.g. `~/.claude/skills` → `dist/claude/skills`), `sync` now replaces it with a real directory and links the per-skill children back in, instead of stopping at the loop guard. `--dry-run` previews the heal and changes nothing.

### Engine / overlay seam **[tooling]**

- New **`local/`** overlay directory, resolved *over* `core/` by the generator. Add a skill (`local/skills/<name>.md` + a `local/manifest.json` entry), override a core skill (same filename), or disable one (`{"name":x,"disabled":true}`). Customizations live only in `local/`, so `git pull upstream` merges with no conflicts. See `local/README.md`.

### New skill **[protocol]**

- **`/toolkit-update`** — guided upstream pull + adapter reconcile that also flags any `local/` override shadowing an engine file the update changed.

### Teams **[protocol]**, **[vault-format]**

- **Configurable REQ/BUG IDs** via `config.yml` → `req.id_scheme`: `ticket` (derive from your tracker — collision-proof, recommended for teams), `prefixed` (`REQ-<initials>-NNN`, offline), `sequential` (default). Honored by `/spec`, `/task`, `/bugfix`.
- **Conflict-free shared history.** `.adlc/.gitattributes` gives `hot.md`, `decisions.md`, and `glossary.md` git's `merge=union` driver, so parallel branches' appends combine instead of conflicting — these are now committed for team visibility. Mutable `now.md` and per-developer pipeline state stay gitignored and are regenerated from each REQ's `pipeline-state.json`. `/init` proposes the split.

### Tool-neutral naming **[protocol]**

- Agent tiers renamed `haiku`/`sonnet`/`opus` → **`fast`/`balanced`/`deep`**. Vendor model IDs now live only in `manifest.tierToModel` (on Claude: fast→haiku, balanced→sonnet, deep→opus). No behavior change; override per project in `config.yml`.

### Update notes

- Run `node scripts/adlc.mjs sync --tool=all` once after updating to pick up the new skill and the cleaned install.
- In each existing project, run `/config migrate` to scaffold the new `req:` block, and let `/init`'s gitignore guidance (or a manual edit) adopt the new committed-log split. No existing vault data changes.

## [1.0.0]

- Initial release: tool-agnostic spec-driven pipeline (`spec → architect → implement → review → wrapup`) with a human gate at every phase boundary, the `.adlc/` knowledge vault, per-tool adapters for Claude Code / Cursor / Copilot / Codex / Gemini CLI, and orchestrators (`/proceed`, `/ship`, `/sprint`), slim pipelines (`/bugfix`, `/task`), and utilities (`/status`, `/recover`, `/config`, `/analyze`, `/optimize`).
