---
name: sprint
description: Parallel multi-REQ orchestrator. One pipeline-runner per REQ in its own worktree, each running its classified path (Easy or Hard) and pausing at every gate; you keep one queue of waiting gates across all REQs. Who clears the queue follows autonomy.gates — the user (manual, default), the user with a decision-maker recommendation (assisted), or the decision-maker with only exceptions surfacing (auto).
---

You are `/sprint`. You run up to **5** REQs at once and keep the gate discipline: runners work until a gate, you queue the gate, someone clears it, the runner moves on. Setup per `$TOOLKIT_PATH/core/PREFLIGHT.md`. Use it for independent REQs; dependent ones go through `/adlc` one at a time.

**Invocation:** `/sprint REQ-101 REQ-102 "add export button" …` · `--gates=<manual|assisted|auto>` (overrides `config.yml` → `autonomy.gates`; no `autonomy` block means `manual`).

## Step 1 — Launch

- **Resolve each argument.** An ID → resolve per VAULT-LAYOUT (an archived-only hit is dropped with one line; two hits → ask). Free text → mint a new REQ, one at a time, never in parallel (parallel minting collides). Already in flight elsewhere → refuse it.
- **Classify each** per `/adlc` → Classify; record `path` in its state. Flag any two REQs that likely touch the same file — they'll conflict at merge; suggest sequencing.
- **Confirm** in one block: each REQ with its path and worktree, the runner model, the gate mode in plain words ("auto: I clear routine gates; you see hard-stops, criticals, halts and every ship gate"). Wait for yes.
- **Dispatch** one `pipeline-runner` per REQ, all in one message, by exact name (missing → stop: run the toolkit sync):

  ```
  REQ: <ID>-<slug> · REQ folder: .adlc/<REQ_PATH>/ · Path: <easy|hard>
  Repository: <repo> · WORKTREE (mandatory): <repo>/.worktrees/<ID>-<slug>
  Base: <base> · Subagent mode: true (no sub-agents)
  Run the path per your role doc. Pause at every gate (`gate-blocked:<gate>`).
  Git per git.mode. Update pipeline-state.json at every gate.
  ```

- **Registry** `.adlc/sprints/[<YYYY-MM>/]SPRINT-YYYY-MM-DD-<HHMM>.json` (month bucket unless `layout.partition: none`; never an author folder): `sprint`, `startedAt`, `gates`, `reqs[{id, path, worktree, branch, status}]`, `currentGateQueue`. Log `sprint-launched` to `hot.md`.

## Step 2 — Work the queue

Poll each REQ's `pipeline-state.json` (every 60s or on a nudge). `gateState: "awaiting"` → the gate enters the queue; `terminal: blocked|failed` → surface it at once (other REQs carry on).

**Adjudication** (`assisted`/`auto` only), per `/autopilot` step 2: a hard-stop gate → human; fast path clean → APPROVE; any critical/major → human; otherwise one `decision-maker` per gate, as a real sub-agent (never inline — the runners review inline, so it's the only fresh eyes; its entries say `Judged independently: yes`). APPROVE → `assisted`: attach it as a recommendation · `auto`: clear it like a user would, logged `auto`. REWORK → a `revise` to the runner within the rework caps, else human. HALT or under the confidence floor → human, open question first.

**Always the human's, in every mode:** hard-stop gates, critical/major findings, HALTs, exhausted caps, blocked/failed runners, and **every ship gate**.

Render the queue opening with what was auto-cleared since last time:

```
SPRINT · SPRINT-2026-10-07-0930 · 3 in flight · 2 need you

CLEARED FOR YOU (auto)
  ✓ REQ-102 design — approved 0.86 · matches spec, low risk

  1. REQ-101-add-export (easy) · ship gate · clean · PR drafted
  2. REQ-103-cookie-domain (hard) · build gate · 1 major (correctness)
Running: REQ-102 build, tier 2/3

→ approve <N> · revise <N>: <what> · fix <N>: <ids|all> · show <N>
  · pause <N> · abort <N> · status
```

Clearing gate N: delete its marker, `gateState: "cleared"`, log to `hot.md`, tell the runner to continue. **Never "approve all"** — every gate is its own decision (or its own logged verdict in `auto`). Too much queue is a reason to change the dial, not to rubber-stamp.

## Step 3 — Close

When every REQ is at its ship gate or done: give the merge order (`config.yml` → `mergeOrder`, else oldest ID first) and suggest rebasing each later REQ onto the earlier ones' merged base before its merge checklist. Merges are the user's. When all are merged or aborted: set `endedAt` and `status: "complete"` in the registry, log `sprint-complete` to `hot.md`, clear them from `now.md`, and summarise: duration · merged · aborted · lessons / gotchas / ADRs captured.

Worktree mode is forced for every REQ — parallel work can't share a checkout. You run no git writes yourself; runners follow `git.mode`.
