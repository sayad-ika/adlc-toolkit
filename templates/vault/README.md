# {{PROJECT_NAME}} — `.adlc/` Vault

This directory is the project's knowledge vault and ADLC workspace. It's an Obsidian-compatible vault — open it in Obsidian for graph view and backlinks, or just edit the markdown directly.

## Read this first

- [[CLAUDE]] — the rulebook: how Claude reads and writes this folder. How Claude reads and writes this vault. Claude reads this at the start of every session.
- [[now]] — what's actively in flight right now.
- [[hot]] — the activity log. New entries go on top; old ones are never edited.
- [[index]] — content catalog. Drill into specific pages from here.

## Layout

| Path | What lives here |
|---|---|
| `context/` | Project-wide architecture, conventions, overview |
| `knowledge/lessons/` | Per-file lessons with `^L##` anchors |
| `knowledge/gotchas.md` | Consolidated codebase quirks with `^g##` anchors |
| `knowledge/concepts/` | Patterns, invariants, domain models |
| `knowledge/components/` | One page per major module |
| `architecture/` | High-level architecture + ADRs |
| `specs/REQ-xxx/` | All artifacts for a single requirement |
| `templates/` | Per-project copies of toolkit templates |
| `config.yml` | Stack config — deploy targets, repo layout |

## Conventions

- **Wikilinks** for cross-references: `[[concepts/idempotency]]`, `[[knowledge/gotchas#^g05|G05]]`
- **Block anchors** for stable references: `^L##` (lessons), `^g##` (gotchas), `^ADR-##` (ADRs)
- **`STATUS: needs verification`** flags provisional content — never silently assume it's confirmed
- **Field table at the top** of every spec, ADR, concept, and component page
- **"Related" and "Backlinks" sections** at the bottom of substantive pages

## Size budgets

The hot-path files are loaded at every phase entry — their size is a recurring token tax, so each has a soft budget. `/analyze`'s vault-health section flags files over budget; nothing enforces them silently.

| File | Budget |
|---|---|
| `CLAUDE.md` | 5KB |
| each `context/*.md` | 8KB |
| `now.md` | 1KB |
| `hot.md` | 500 lines (20 newest visible) |
| each REQ's `verification.md` | 8KB (verdict only — narrative goes in `review-log.md`) |
| `knowledge/` total | 60KB / 30 lessons — soft trigger for the toolkit's tiered-vault-loading ADR |

## How the pipeline writes here

Each phase of `/proceed` creates or updates artifacts in this vault:

1. `/spec` → `specs/REQ-xxx/requirement.md`
2. `/architect` → `specs/REQ-xxx/architecture.md`, `tasks/TASK-*.md`
3. `/implement` → code changes (in your repo, not the vault) + `commits-draft.md`
4. `/review` → `specs/REQ-xxx/verification.md` (compact verdict) + `review-log.md` (full narratives)
5. `/wrapup` → `pr-draft.md`, updates to `lessons/`, `gotchas.md`, `concepts/`, `index.md`, `hot.md`

By default you commit everything yourself (`git.mode: manual`). You can let the assistant commit or push on the feature branch — see `config.yml` → Git policy.
