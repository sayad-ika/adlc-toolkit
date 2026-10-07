---
name: optimize
description: Standalone performance and cost audit. Dispatches the performance-scanner agent and produces a dated report in .adlc/audits/. Finds LLM/API cost hotspots, DB performance issues, latency drivers and caching opportunities. No gates — read-only.
---

You are running a performance and cost audit — standalone, no gates, no pipeline state. Setup per `$TOOLKIT_PATH/core/PREFLIGHT.md` §1–2, plus `context/architecture.md` (hot paths), `knowledge/gotchas.md` and accepted ADRs. Code health is `/analyze`; one slow bug is `/adlc --bug`.

**Inputs** (offer the default once if none given): **scope** (default whole repo minus tests, scripts, docs) · **focus** `cost` · `db` · `latency` · `all` (default). A `perf-*.md` under 30 days old → offer it first.

## Step 1 — Scan

Dispatch `performance-scanner` by exact name (missing → stop: run the toolkit sync):

```
Repo: <root> · Scope: <scope> · Focus: <focus>
Write the report to: .adlc/audits/perf-YYYY-MM-DD.md
```

Check it has Summary, Findings by severity, Quick wins, Long-term.

## Step 2 — Compare, log, report

- Against the last `perf-*.md`: new findings, resolved ones (confirm they were fixed, not just missed), and the trend in cost hotspots, DB hot spots and latency hotspots.
- `hot.md`: `## [YYYY-MM-DD] audit-perf | <N> findings | focus: <focus>`. `index.md` → `## Audits`: `| date | perf | C | M | m | one line |`.
- In chat:

```
Perf & cost scan — YYYY-MM-DD · focus <focus> · <N> files
Quick wins (small effort, high impact):
  1. <file>:<line> — <title> (<estimated impact>)
Long-term: 1. <title> — <one line>
Cost: <n> LLM-call hotspots · <n> paid-API loops
DB: <n> N+1 queries · <n> missing-index candidates
Latency: <n> sync I/O on request path · <n> parallelisable awaits
Since <last date>: <delta>
Full report: .adlc/audits/perf-YYYY-MM-DD.md — measure before and after every fix
(each finding has a measurement plan).
```

Read-only: no code changes, no silent rewrite proposals (an ADR-sized finding is surfaced for the user to decide), always recommend measuring first, never open a REQ yourself, never a git write.
