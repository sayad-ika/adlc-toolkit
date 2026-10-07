---
name: analyze
description: Standalone codebase health audit. Dispatches the health-auditor agent and produces a dated report in .adlc/audits/. No pipeline state, no gates — a read-only audit you run periodically or on demand.
---

You are running a codebase health audit — standalone, no gates, no pipeline state. Setup per `$TOOLKIT_PATH/core/PREFLIGHT.md` §1–2, plus `context/architecture.md` (the auditor checks against it). For a per-change review use `/adlc`; for performance use `/optimize`; for UI and design systems use `/ux-doctor`.

**Inputs** (offer the default once if none given): **scope** (path/glob; default whole repo minus generated, vendored and build output) · **depth** `quick` (top 10) · `standard` (top 30, default) · `thorough` · **focus** any of `dead-code, complexity, coverage, convention, duplication, deps, docs, vault` (default all). Scope with no source files → say so and stop. A `health-*.md` under 30 days old → offer it instead of a new run.

## Step 1 — Audit

Dispatch `health-auditor` by exact name (missing → stop: run the toolkit sync):

```
Repo: <root> · Scope: <scope> · Depth: <depth> · Focus: <list>
Write the report to: .adlc/audits/health-YYYY-MM-DD.md
```

Check the report has Summary, Findings by severity, Detailed findings, Vault health, Trends, Recommendations. An error or empty result is reported as such — never fill the gap yourself.

## Step 2 — Compare, log, report

- Against the last `health-*.md`: new, resolved, still open, direction. Add a **Trends** section if the auditor didn't.
- `hot.md`: `## [YYYY-MM-DD] audit-health | <N> findings (<C>C/<M>M/<m>m) | depth: <depth>`. `index.md` → `## Audits` table (create it once): `| date | health | C | M | m | one line |`.
- In chat:

```
Health audit — YYYY-MM-DD · <scope> · <depth> · <N> files
Findings: <C> critical · <M> major · <m> minor
Fix first (best payoff for the effort):
  1. <finding> (effort: small)   2. …   3. …
Vault: hot path <N>KB · knowledge <N>KB · <N>/30 lessons · <over-budget items or "within budget">
Since <last date>: <x> resolved · <y> new · <z> still open
Full report: .adlc/audits/health-YYYY-MM-DD.md
```

Read-only: never fix, never open a REQ for a finding (the user runs `/adlc` on it), never write a found convention into `conventions.md` (that's a `convention-gap` finding), never a git write.
