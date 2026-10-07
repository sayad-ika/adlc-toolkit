---
name: init
description: Bootstrap the .adlc/ vault in a new repo — copies templates, generates the CLAUDE.md schema doc, creates the vault files (now, hot, index, decisions, glossary, gotchas, lesson ledger), and imports existing documentation (README, ARCHITECTURE, CONTRIBUTING, lint configs, ADRs, GLOSSARY) into context/ and architecture/ with STATUS-flagged starting content.
---

You are bootstrapping a project's `.adlc/` vault — once per repo. Load `$TOOLKIT_PATH/core/VAULT-LAYOUT.md` (the tree and the gitignore set come from it). `$TOOLKIT_PATH` is the "Toolkit root:" line in your command; if missing, ask where the toolkit lives. Repo root = cwd unless told otherwise. `.adlc/` exists and is non-empty → **stop**, show what's there, and ask: abort, or overwrite (destructive — confirm explicitly).

## Step 1 — Ask

**Scan first, read-only** (never modify a source doc), then ask everything in **one round** of options (ETHOS #6; structured-question UI where available).

Scan for:
- **Overview** (first match): `README.*`, `OVERVIEW.md`, `docs/{overview,README,index}.md`.
- **Architecture** (all): `ARCHITECTURE.md`, `docs/architecture.md`, `docs/architecture/*.md`, `docs/{design,system-design,system}.md`.
- **Conventions** (all): `CONTRIBUTING.md`, `STYLE*.md`, `docs/{style-guide,conventions,coding-standards}.md`; lint/format configs — `.editorconfig`, ESLint, Prettier, `pyproject.toml` (black/ruff/isort), `.flake8`, `setup.cfg`, `.pylintrc`, `tsconfig.json`, `.golangci.*`, `rustfmt.toml`, `clippy.toml`, `Directory.Build.props`, `stylecop.json`; commit conventions — `.gitmessage`, commitlint configs.
- **ADRs**: `*.md` in `{docs/,doc/,}adr{,s}/`, `{docs/,}architecture/decisions/`, `{docs/,doc/}decisions/`.
- **Glossary**: `GLOSSARY.md`, `docs/glossary.md`.

Ask:
- **Project** — name · one-line description · stack (languages, frontends, backends, databases) · single repo or multi-repo (sibling paths).
- **Your initials** (offer them from `git config user.name`) → `req.prefix` + `layout.author`, `req.id_scheme: prefixed` (stops teammates minting the same ID on parallel branches). Skipped → `sequential`.
- **Vault layout** — **month-author** (Recommended for a new vault: `specs/2026-08/sf/REQ-042-slug/`) · **none** (flat).
- **Git policy** → `git.mode` — **manual** (Recommended: drafts only, you run git) · **commit** (commits the REQ's branch after a gate) · **commit+push** (also pushes it, fast-forward only). Every mode: never a protected branch, force-push, rebase, branch delete, `gh pr create/merge`, `--no-verify`.
- **Sources** — issue tracker `github` · `linear` · `jira` · `none` (+ default `repo` for bare `#8` refs); design `figma` · `none`; write-back **none** unless they ask (then the tracker goes in `sources.write`, always gated).
- **Import** — the discovered mapping, grouped by destination with a confidence tag, lines ≤72 chars:

```
  context/project-overview.md ← README.md (high)
  context/conventions.md      ← CONTRIBUTING.md (high) · .eslintrc.json (high)
                                · .prettierrc (medium)
  architecture/adr-001, 002   ← docs/adr/0001-…, 0002-… (high)
  Skipped: CHANGELOG.md (history) · docs/api/ (generated) · LICENSE
→ approve · approve except X, Y · approve only X, Y · skip
```

Nothing found → say so; the vault starts empty. Skipped questions take the defaults (manual, none, flat-or-month-author as recommended).

## Step 2 — Create and import

- **Tree:** `.adlc/{context,knowledge/{lessons,concepts,components},architecture,specs,audits,bugs,sprints,templates}` (`mkdir -p`; month/author folders are made later, when the first REQ lands).
- **Copy** `$TOOLKIT_PATH/templates/vault/*` → `.adlc/` (README, `.gitattributes`, CLAUDE.md, glossary, now, hot, index, decisions, `context/*`, `knowledge/gotchas.md`, `knowledge/lesson-ledger.md`), and `templates/*.md` (not `vault/`) → `.adlc/templates/`; `config-template.yml` → also `.adlc/config.yml`. Substitute `{{PROJECT_NAME}}`, `{{USER_NAME}}`, `{{USER_EMAIL}}` (from git config, with fallbacks), `{{DATE}}`, `{{PATH}}` in the vault copies only — templates keep their placeholders.
- **config.yml:** project name/description, `git.mode`, `req.*`, `layout.*` (write `month-author` over the template's `none` unless they chose flat), `stack.languages`, `repos.<id>.primary: true`, `sources` (uncomment only if something was chosen). `review.packet.exclude`: keep the defaults and add generated outputs the tree shows (`grep -rl "auto-generated\|DO NOT EDIT"`, minified bundles, `*.g.cs`) — say what you added.
- **Import** each approved source. Every synthesized section opens with `> **STATUS: needs verification** — synthesized from \`<source>\` on <date>. Review and edit; remove this banner when confirmed.` **Never invent** — a section the source doesn't cover keeps its placeholder.
  - README → `project-overview.md`: description, stack, core flows; skip badges, license, sponsors.
  - Architecture docs → `context/architecture.md` (diagrams verbatim); component pages → `knowledge/components/<slug>.md`; cross-cutting ones (auth, logging) → `knowledge/concepts/<slug>.md`.
  - CONTRIBUTING → `conventions.md` Git/testing/docs sections. Lint configs → plain-prose rules (ESLint `error` rules, Prettier's semi/quotes/width, editorconfig indent/EOL, tsconfig strictness, pyproject line-length and rule families, C# naming), with a note at the top naming the configs used. Commit configs → the commit format.
  - GLOSSARY → `glossary.md` rows, each `STATUS: needs verification`, links rewritten as wikilinks.
  - ADRs → `architecture/adr-<NN>-<slug>.md` in our template, **keeping the original number** (gaps stay gaps; a collision → ask), status mapped (accepted / superseded incl. deprecated / proposed incl. draft / rejected / `imported` if none), `^ADR-<NN>` anchor, sections verbatim, cross-references rewritten as wikilinks, banner `STATUS: imported from <source>`; a row each in `decisions.md` and `index.md`.
- **Starter content:** `now.md` focus → `Just initialized the vault. Run /adlc to start the first piece of work.`; `hot.md` → `## [DATE] init | Vault initialized` + one `init-import | <source> → <target>` per import.

## Step 3 — Gitignore and report

**Propose** (never auto-write) appending VAULT-LAYOUT's gitignore pattern set to the repo's `.gitignore` — copy it from that file, keep the `**` globs and the two literal lines. Two-sentence why: shared knowledge and the union-merged logs (`hot.md`, `decisions.md`, `glossary.md`, `lesson-ledger.md`) are committed so the team keeps its memory; per-developer scratch (state, gate markers, drafts, `now.md`, sprint registries, `ui-auth.env`) is ignored so it doesn't churn history. → `add` · `add except <pattern>` · `skip` (then remind them that state files will show as unstaged churn).

Report: files created; each import `→ target (from source)`; the count of `needs verification` sections ("review these before your first `/adlc` — the reviewers rely on `conventions.md`"); next steps — fill `config.yml`, verify `conventions.md` and `project-overview.md`, optionally open `.adlc/` in Obsidian, run `/adlc`.

Never commit the vault (the user reviews and commits it), never write outside `.adlc/` except an approved `.gitignore` append, never renumber an ADR.
