# Changelog

All notable changes to the ADLC toolkit. The toolkit version lives in `core/manifest.json` → `version`.

Labels used below: **[breaking]** needs action on update, **[protocol]** changes how a skill behaves, **[vault-format]** changes on-disk vault layout, **[tooling]** install/build only.

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

## [1.2.2] — 2026-07-05

### ui-reviewer: Claude in Chrome is actually reachable **[protocol]** **[tooling]**

- The `ui-reviewer` (and `pipeline-runner`, which runs the UI lens inline for `/sprint`) documented a browser preference order — **Claude in Chrome → headless Playwright/Puppeteer → static checklist** — but on Claude the agent's tool grant was only `Read, Write, Edit, Grep, Glob, Bash`, so the `mcp__claude-in-chrome__*` tools were never available to the dispatched sub-agent and tier 1 could never fire. It always fell to Playwright.
- Fixed data-driven: agents flagged `"browser": true` in `core/manifest.json` (`ui-reviewer`, `pipeline-runner`) now receive the Claude in Chrome MCP tools in the generated **Claude** adapter. When the connector is active the reviewer drives a real, visible browser (its preferred tier); when it isn't connected the tools don't resolve and it degrades to Playwright, then a static checklist — exactly as before. Only the Claude adapter carries these tools; the other assistants resolve a browser through their own means.

### Update notes

- Run `node scripts/adlc.mjs build --tool=all` (or `sync`) once to regenerate adapters — the two `browser: true` agents now carry the Chrome tools.
- No change if you don't use the ui-reviewer, or never connect Claude in Chrome (behavior is identical: Playwright → static).

## [1.2.1] — 2026-07-04

### `uninstall` — receipt-driven removal **[tooling]**

- New `node scripts/adlc.mjs uninstall [--tool=<…|all>] [--keep=<tool,…>] [--dry-run]` subcommand: the inverse of `sync`. It reads the same per-tool receipts (`~/.adlc/receipts/`) that record what each `sync` placed and removes only those destinations — a recorded link is removed **only if it's still a symlink resolving back into the toolkit** (judged from the link target, so dangling links are still recognised), copied/written files are removed because they match the receipt, and anything unexpected (a real file where a link was expected, or a link repointed elsewhere) is left in place and reported. Emptied directories are pruned and each tool's receipt is deleted once cleared. Use `--keep=claude` to clear every other tool while sparing the Claude install. Always dry-run first.

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
