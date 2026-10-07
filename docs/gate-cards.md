# Gate cards — how the pipeline asks for your decision

Every human gate in the ADLC pipeline — the single ship gate on the Easy/Medium path, the design, build and ship gates on the Hard path, and `/autopilot`'s final review — presents the same **gate card**: a compact, scannable summary that ends in a decision. This page is the reader's tour; the authoritative spec the skills follow is [`core/GATE-PROTOCOL.md`](../core/GATE-PROTOCOL.md).

## The idea

A gate card is not a report. It's built to answer three questions at a glance, in order:

1. **What's done?** — the artifacts this step produced (FYI).
2. **What needs *you*?** — the decision-bearing items: a proposed decision record (ADR), a stress-test finding that held up, an open question. If nothing, it says so.
3. **What's the decision?** — the last line, and the only thing you must act on. On Claude it arrives as an `AskUserQuestion` with that gate's real options; the card is the context.

Every card also carries a one-line **recommendation** (`MY READ`) — the option the pipeline would pick and why — so a clean gate is one keystroke and a risky one is obvious.

## Anatomy

```
GATE <n>/<N> · <Gate> · <REQ> — <short title>  (<path>)
   <verdict — one line: what's ready, and whether anything needs a call>

READY       terse, FYI — the artifacts / counts this step produced
NEEDS YOU   the decision-bearing items, prioritized (omitted when there are none)
CHECKS      this gate's validation, compact — ✓ / ⚠ per check

MY READ     the recommendation + one-line why
Decision →  the gate's options, each stating what happens next
```

`READY` / `NEEDS YOU` / `CHECKS` / `MY READ` are a **menu of sections each gate can use, not a fixed form** — each gate uses the ones its step needs and can rename or add its own. A design gate shows the plan; a build gate leads with `FINDINGS`; a ship gate shows the PR and what the vault kept (on the Easy path it also leads with findings, since it is the only gate); `/autopilot`'s final review opens with a `RUN SUMMARY`. The order — done, needs you, recommendation, decision — is what never changes.

## Example — the Hard path's design gate

```
GATE 1/3 · Design · REQ-014-payment-retries  (hard)
   ready to review — 2 items need your call

READY       requirement: 4 criteria · architecture.md · 6 tasks in 3 tiers · ADR-007
            exploration.md · stress-test ran: full pass
            task order: T1,T2 → T3,T4 → T5

NEEDS YOU   ⚠ ADR-007  retry backoff strategy — accept or reject
            ⚠ fixed    double-charge on retry — the fix is in the
                       Approach section; please confirm it
            ? open     how long should idempotency keys live?

CHECKS      ✓ criteria covered · ✓ no cycles · ✓ conventions · ✓ tests concrete

MY READ     approve — the flagged risk is fixed; the new decision is low-risk

Decision →  approve (move on to build) · revise <what> · abort
```

Note the task order is shown as **compact text**, not a rendered picture: the card must read cleanly in a plain terminal, where Mermaid doesn't render. The full rendered diagram lives in `architecture.md`, where it renders in Obsidian, GitHub, and IDE preview. That's the rule for diagrams everywhere in the pipeline — see the [diagram conventions](fidelity-matrix.md) and the templates.

## Markers

Cards use one small, consistent vocabulary (no emoji): `✓` pass · `⚠` needs attention · `?` open question · severities spelled out (`critical` / `major` / `minor`; trivial shown only as a count). The full list lives in `core/GATE-PROTOCOL.md`.
