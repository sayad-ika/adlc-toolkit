---
name: status
description: Read-only overview of all active work — REQs and bugs in flight, their path, step and gate state, blockers, budgets, recent activity from hot.md. Use to orient at session start or to triage when /sprint has several REQs in flight.
---

You are showing where work stands. Read-only: no gates, no agents, no writes. Load `$TOOLKIT_PATH/core/VAULT-LAYOUT.md` if it isn't in context.

## Step 1 — Gather and show

**Gather** (quietly):

- `now.md`; `hot.md` with a line limit (newest at top, never the whole file); `wc -c` on `now.md`, `CLAUDE.md`, each `context/*.md` (not `*-rationale.md`), `wc -l` on `hot.md`, and the newest active REQ's `review-packet.md` / `verification.md` sizes.
- Active work per VAULT-LAYOUT `enumerate(active)`: `find .adlc/specs .adlc/bugs -maxdepth 4 -type d \( -name 'REQ-*' -o -name 'BUG-*' \) -not -path '*/_archive/*'`. Match on the folder's own name (`pipeline-state.json` is gitignored — on a fresh clone it's absent; list the REQ as "state unknown", don't drop it). Skip REQs merged more than 7 days ago.
- Per REQ from `pipeline-state.json`: path, step, gate + state, branch, isolation, blockers, findings; whether the work path / worktree / branch still exists; files changed (`git -C <workPath> diff --name-only <base>..<branch>`) once past step 1. Map a legacy `currentPhase` state per PREFLIGHT → Legacy state (in memory only — don't write).
- Audits under `.adlc/audits/` from the last 30 days, and any critical finding in them not yet addressed.

**Show** (one line if nothing is in flight):

```
ADLC status — YYYY-MM-DD HH:MM
Budgets: now.md 0.8/1KB · hot.md 312/500 · CLAUDE.md 4.9/5KB · packet(last) 298KB ⚠ → /config budgets
Focus: <now.md focus line>

REQ-014-payment-retries  hard 2/3 · build gate awaiting · feat/REQ-014 (worktree ✓)
   9 files · findings C1/M0/m1 · blockers: none
REQ-021-export-button    easy 1/2 · working · feat/REQ-021 (branch ✓)
BUG-007-null-cart        easy 2/2 · ship gate awaiting · 2 files

Recent: <last 5 hot.md entries, one line each>
Audits: 2026-09-30 health — 12 (C0/M3/m9) · unaddressed criticals: none

Next:
  clear a gate → /adlc REQ-014   (away >24h? add --resume)
  walk back a step → /adlc <ID> --revert~1   ·   abandon → /adlc <ID> --cancel
  drift: REQ-009's worktree is missing → /recover
```

With two or more items in flight, add a Mermaid board — `design → build → ship` as columns, each item placed at its gate, `awaiting` and `cleared` in two colours. Say plainly when `now.md` disagrees with the state files, or a work path, worktree or branch is gone for a REQ that isn't finished — and don't fix either.
