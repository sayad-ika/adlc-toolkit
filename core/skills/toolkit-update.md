---
name: toolkit-update
description: Update the ADLC toolkit install itself from upstream and reconcile every tool's adapters. Pulls new core/ engine changes, re-runs the installer (safe to repeat; new skills linked, removed ones cleaned up), and flags where a file you customized in local/ overrides a core file that upstream just changed. Operates on the toolkit repo, not a project vault.
---

You are updating **the toolkit at `$TOOLKIT_PATH`** — not any project. No pipeline gate, no agents, but it runs git and the installer on the toolkit repo, so every write is shown and approved first. Git here is the toolkit's own: fast-forward or a clean merge only — never force, rewrite or push.

**Before starting:** `$TOOLKIT_PATH` must be a git working tree (if not — a zip download or a vendored copy — say updates come as a fresh download and stop). Remote: `upstream`, else `origin`, else ask. Note HEAD, branch and `core/manifest.json` → `version`. A dirty tree with changes in `core/` means the engine was edited directly — offer stash, abort or continue.

## Step 1 — Preview

`git -C "$TOOLKIT_PATH" fetch <remote> --tags`, then show, for the latest release tag and the branch tip:

- `git log --oneline HEAD..<target>`, and the `CHANGELOG.md` entries in range — **call out anything marked breaking, protocol or vault-format**.
- Skills and agents added / removed / changed (diff `core/manifest.json` and the `core/skills`, `core/agents`, `core/paths` file lists).
- **Shadowed overrides** — the check that matters: each `local/skills|agents/<name>.md` whose core twin changed in range (`git diff --name-only HEAD..<target> -- core/skills/<name>.md core/agents/<name>.md`): "your override keeps winning over an engine file upstream just changed — review the diff and fold in what's worth keeping." Also any `local/manifest.json` entry pointing at something upstream removed or renamed. Advisory only — never edit `local/`.

Ask: **update to `<tag>` (Recommended — stable)** · update to the branch tip · cancel.

## Step 2 — Pull, reconcile, report

- Show and run `git -C "$TOOLKIT_PATH" pull --ff-only <remote> <ref>` (a plain merge is fine if the only divergence is additive in `local/`). **A conflict in `core/`** → don't resolve it: show the files, recommend moving those edits into `local/` overrides, offer `merge --abort`, stop.
- Show and run `node "$TOOLKIT_PATH/scripts/adlc.mjs" sync --tool=all` (or only the user's tools); report added / removed / pruned. (`build` refreshes the committed `adapters/` — only if they maintain it.)
- Report: `<old>` → `<new>` · skills/agents changed · overrides needing review · then the per-project follow-ups this skill can't do for them: run **`/config migrate`** in each project (new config keys, additively; it also offers a gated template refresh), and for a vault-format change, the CHANGELOG note and `/recover`. **2.0 note:** old `pipeline-state.json` files map themselves the first time `/adlc` reads them.
