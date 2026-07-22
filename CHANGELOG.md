# Changelog

All notable changes to the ADLC toolkit. The toolkit version lives in `core/manifest.json` → `version`.

Labels used below: **[breaking]** needs action on update, **[protocol]** changes how a skill behaves, **[vault-format]** changes on-disk vault layout, **[tooling]** install/build only.

## [1.4.2] — 2026-07-22

### The vault learns to watch its own weight **[protocol]**

- `/analyze` gains a **Vault health** section, run by the health-auditor alongside its usual audit: files over their size budget, lessons no exploration or verification has cited in the last 5 REQs ("still earning its place?" — the user decides), gotchas whose file no longer exists, `STATUS: needs verification` older than 30 days, superseded ADRs still wikilinked as if in effect, and merged REQ folders sitting under `specs/` past 30 days.
- The report now carries a **footprint readout** — bytes and estimated tokens per vault layer — plus the distance to the tiered-loading trigger, so growth is a number you watch, not a surprise.
- Size budgets are documented in the vault README ("Size budgets"): CLAUDE.md 5KB · context files 8KB each · now.md 1KB · hot.md 500 lines · verification.md 8KB per REQ · knowledge/ 60KB soft trigger. Soft — flagged by `/analyze`, never enforced silently. No config key for now; the defaults live in one place on purpose.
- New `docs/adr-tiered-vault-loading.md` (**proposed**, trigger-armed): when `knowledge/` crosses 60KB or 30 lessons, the reflector and architect switch to a ledger-first read. Deliberately **not** implemented now — the reflector's unfiltered pass is its value; the ADR exists so the flip is a planned decision with the trade written down.

## [1.4.1] — 2026-07-22

### The vault rulebook goes on a diet **[vault-format]**

- `templates/vault/CLAUDE.md` drops from ~11KB to under 5KB. It's loaded at every phase entry — it was the single highest-frequency file in the vault, and more than half of it restated what the running skill already enforces.
- Gone as tables, kept as pointers: the three-mode git matrix (the skill enforces `git.mode`; the rulebook keeps the one-paragraph summary and the full **never** list), the isolation-mode explainer (three sentences now), and the phase-by-phase artifact map (each phase skill and the vault README carry it).
- Kept in full: identity, read order, the authority table and contradiction rule, provisional-content rules, file conventions, capture triggers, when-in-doubt rules, and the per-project tail.
- `/config`'s derived-file sync is untouched: the `### Git policy` section survives as the sync target, and its canonical body still comes from this template.
- Existing vaults keep their current CLAUDE.md until refreshed — run `/config templates` (gated, per-file, shows the diff) to adopt the slim rulebook.

### Update notes

- Re-run `node scripts/adlc.mjs build --tool=all` (or `sync`).
- Existing repos: `/config migrate` then accept the CLAUDE.md template refresh if you want the slim rulebook; skip it to keep your current file.

## [1.4.0] — 2026-07-22

### The review verdict and the review narrative part ways **[protocol]** **[vault-format]**

- `/review` now writes two files. `verification.md` becomes the compact **verdict file** — digest table, consolidated findings, summary, acceptance-criteria check; target ≤8KB. A new `review-log.md` holds the full per-finding narratives, re-review threads, and packet-gap notes.
- Why: the verdict file is what `/wrapup` and the gate packets actually load. On a real REQ, `verification.md` ran to 40KB, of which the acted-on part was ~7KB — the other 33KB is useful history that now lives **off the load path** instead of being re-read at every wrap-up. First shipped piece of the long-run vault maintenance plan.
- All five reviewer agents write their sections to the log; the `/review` orchestrator distills the verdict (reflector's `repo-doc-stale` / `vault-stale` / `adr-conflict` tags survive the distillation — wrap-up's doc-staleness backstop keys off them). `pipeline-runner` does the same split inline in sprint mode.
- `fix` loops unchanged: re-run reviewers append to the log, the verdict's digest and counts refresh, the gate card re-emits.
- `/recover` and `/proceed` know both files. **No migration:** an old REQ with one fat `verification.md` and no log is recognized as the pre-1.4.0 shape and left alone.

### Update notes

- Re-run `node scripts/adlc.mjs build --tool=all` (or `sync`).
- Nothing to change in existing vaults; the split applies from the next `/review` onward.

## [1.3.9] — 2026-07-22

### Sprint gets an adjudicated gate queue **[protocol]**

- `/sprint`'s queue now follows `autonomy.gates` — the same dial `/autopilot` reads; `--gates=<manual|assisted|auto>` overrides it per sprint. `manual` is exactly today's behavior. `assisted` attaches the decision-maker's recommendation and confidence to every gate — you still clear each one, but a clean gate is one keystroke. `auto` turns the queue into an **exception queue**: the orchestrator fast-paths clean gates (no agent call), sends the ambiguous middle to the decision-maker on a size-capped packet, routes REWORK back to the runner under the rework caps, and surfaces only what needs a human — hard-stops, critical/major findings, HALTs and confidence-floor trips, exhausted caps, blocked runners, and every REQ's final review. Merges stay yours in every mode.
- **Runners are untouched.** `pipeline-runner` still pauses at every gate; what changed is who clears it. The decision-maker runs as a true sub-agent of the orchestrator (`Judged independently: yes`) — the only fresh pair of eyes in sprint mode, since runners review inline by design.
- Auto-cleared gates render as a no-reply **ledger** in the queue view (`CLEARED FOR YOU`), and every verdict — approvals included — lands in that REQ's `gate-decisions.md`. Visibility without interruption.
- The "approve all is not a valid command" rule holds in every mode, and the old "you're using the wrong tool" answer is gone — the right tool for queue overwhelm is the `gates` dial.

### The review gate learns `fix all` **[protocol]**

- The verify gate's fix vocabulary is now `fix all` · `fix all-major` · `fix <ids>` — in `/review`, `/proceed`'s routing, and the sprint queue (`fix <N>: all`). `fix all` dispatches a task-implementer for every **actionable** finding at any severity, re-runs the affected reviewers, and brings the gate back. It's always offered when at least one actionable finding exists.
- Findings are now classified **actionable** vs **needs-decision** (a reflector `vault-stale`, an `adr-conflict`, a proposed ADR, an open question). `fix all` never touches the latter — an implementer "fixing" an ADR conflict would be making your decision for you. Excluded findings come back named on the re-emitted card ("fixed 6 of 8 — 2 need your call: m1, m3"), and the findings table gains a `Fix` column (`yes` / `your call`) so the scope is visible before you reply.

### Update notes

- Re-run `node scripts/adlc.mjs build --tool=all` (or `sync`).
- To opt a sprint into the adjudicated queue, set `autonomy.gates` in `.adlc/config.yml` or pass `--gates=assisted|auto`. With no `autonomy` block, `/sprint` behaves exactly as before.

## [1.3.8] — 2026-07-21

### Review sweep — closing the gaps the series left **[tooling]**

- **Seven principles, everywhere.** ETHOS gained "Speak Plainly" in 1.3.2, but four surfaces still said six — ETHOS's own intro, README's principle list, the vault CLAUDE.md authority table, and the generated memory file (which now also carries principle 7 and the renamed principle 6).
- **`docs/gate-cards.md` caught up with the card format it documents**: plain `GATE n/N` headers instead of rulers, the current architect example (stages, stress-test, task order, options with consequences), "a menu of sections" instead of "a palette", and no more "surviving finding".
- "Terminal review" is now the **final review** everywhere ("terminal" read as a CLI or as fatal); the decision-maker's REWORK verdict carries `{fixes}`, matching its "Fixes requested" output.
- Leftover wording caught by the sweep: toolkit-update's "idempotent installer", config's "derived twin" / "edit friction" / "decision-maker bias" / "inert", sprint's "verify-phase", proceed's "reconciles state-vs-reality", implement's "edit posture" (and a quote it attributed to ETHOS that ETHOS never said), the dense ui-reviewer / design-system-auditor / adversary descriptions, and small template fixes (lesson "manifestation", spec "provisional", bug/index/decisions glosses).
- The quickstart glossary gains its seventh term: **ADR**, finally expanded.

## [1.3.7] — 2026-07-21

### Docs pass — the reading surfaces speak plainly too **[tooling]**

- README and quickstart lose their jargon: "base model" → "starting point", "pointer-stub adapters" → "a small adapter file that just points at core/", "idempotent reconciler" → "safe to run again and again", "resolves local/ over core/" → "files in local/ win", and the every-mode git rules are now a parseable sentence instead of a noun/verb pile-up.
- The fidelity matrix is retitled **"What works on each tool"** (same filename); "hermetic" and "degrades" are gone; the reviewer-Write paragraph reads like an explanation instead of a legal clause.
- ETHOS grounds its aphorisms ("Auto-fix is borrowed time" now says what actually goes wrong) and principle 6 is titled "Offer Choices, Don't Ask Open-Ended Questions".
- Template fields a person had to guess at are named for what they want: `Anchored on` → `Based on`, `Validates by` → `Check by`, assumption status `provisional|validated|invalidated` → `unverified|confirmed|disproven`, design-system status `de facto|ratified` → `as-found|agreed`, task `Tier` gets a gloss, and hot.md leads with the one rule that matters (only add entries).
- Vault docs: CLAUDE.md is a "rulebook" not a "schema doc"; "tombstoned" is explained; config comments drop "minted", "hermetic", "invariants", and the unexplained Karpathy reference.

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
