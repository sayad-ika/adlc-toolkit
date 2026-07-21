# Gate cards — how the pipeline asks for your decision

Every human gate in the ADLC pipeline — the pause at the end of `/spec`, `/architect`, `/implement`, `/review`, `/wrapup`, and inside `/bugfix`, `/task`, and `/autopilot` — presents the same **gate card**: a compact, scannable summary that ends in a decision. This page is the reader's tour; the authoritative spec the skills follow is [`core/GATE-PROTOCOL.md`](../core/GATE-PROTOCOL.md).

## The idea

A gate card is not a report. It's built to answer three questions at a glance, in order:

1. **What's done?** — the artifacts this phase produced (FYI).
2. **What needs *you*?** — the decision-bearing items: a proposed ADR, a surviving finding, an open question. If nothing, it says so.
3. **What's the decision?** — the last line, and the only thing you must act on. On Claude it arrives as an `AskUserQuestion` with that gate's real options; the card is the context.

Every card also carries a one-line **recommendation** (`MY READ`) — the option the pipeline would pick and why — so a clean gate is one keystroke and a risky one is obvious.

## Anatomy

```
── Gate <n> of <N> · <Phase> · <REQ> ──────────
   <verdict — one line: what's ready, and whether anything needs a call>

READY       terse, FYI — the artifacts / counts this phase produced
NEEDS YOU   the decision-bearing items, prioritized (omitted when there are none)
CHECKS      this gate's validation, compact — ✓ / ⚠ per check

MY READ     the recommendation + one-line why
Decision →  the gate's options
```

`READY` / `NEEDS YOU` / `CHECKS` / `MY READ` are a **palette, not a fixed form** — each gate uses the sections its phase needs and can rename or add its own. A spec gate is often just verdict + `CHECKS` + decision; a review gate leads with `FINDINGS`; `/wrapup` shows the wrap-up checklist; `/autopilot`'s terminal review opens with a `RUN SUMMARY`. The *spine* (done → needs-you → recommend → decide) is what's constant.

## Example — the architect gate

```
── Gate 2 of 5 · Architect · REQ-014-payment-retries ──────────
   ready to review — 2 items need your call

READY       architecture.md · 6 tasks / 3 tiers · ADR-007 proposed
            exploration.md · adversary: full pass
            DAG: T1,T2 → T3,T4 → T5

NEEDS YOU   ⚠ ADR-007  retry backoff strategy — accept or reject
            ⚠ finding  double-charge on retry → fixed; confirm in §Approach
            ? open q   idempotency-key TTL still unresolved

CHECKS      ✓ criteria covered · ✓ no cycles · ✓ conventions · ✓ tests concrete

MY READ     approve — surviving finding is handled, ADR is low-risk

Decision →  approve · revise <what> · abort
```

Note the task DAG is shown as **compact text**, not a rendered picture: the card must read cleanly in a plain terminal, where Mermaid doesn't render. The full rendered diagram lives in `architecture.md`, where it renders in Obsidian, GitHub, and IDE preview. That's the rule for diagrams everywhere in the pipeline — see the [diagram conventions](fidelity-matrix.md) and the templates.

## Markers

Cards use one small, consistent vocabulary (no emoji): `✓` pass · `⚠` needs attention · `?` open question · severities as `crit` / `maj` / `min`. The full list lives in `core/GATE-PROTOCOL.md`.
