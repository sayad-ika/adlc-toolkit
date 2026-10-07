# Gate Protocol — the base for every human gate

This is the **shared spine** every gate uses to hand a decision back to the user — **not a fixed template.** Gates differ: a spec gate has no task DAG, a review gate is almost all findings, `/wrapup` is a ship checklist, `/autopilot`'s final review summarizes a whole run. So each skill **adapts** this base to what its phase actually produced. What's constant is the spine and the principles below; the sections are a palette, not a mold.

Load it at preflight (with `ETHOS.md` and `core/VOICE.md`) from `$TOOLKIT_PATH/core/GATE-PROTOCOL.md`. It governs **presentation, not semantics** — `approve` / `revise` / `abort` do whatever each skill defines.

The card is the chat-facing twin of the `.awaiting-approval` file marker. The marker persists the gate across sessions; the card is what the user reads now. **Both are always written at a gate.**

## The invariants (every gate, no exceptions)

1. **Separate *done* from *needs-decision*.** Lead the user's eye to what needs them — not a flat list where FYI and blockers carry equal weight.
2. **Always recommend.** State the option you'd pick and one line of why, even when it's "approve — nothing flagged."
3. **The decision is last, and it is the only imperative.** Everything above orients; the final line asks.
4. **Every option states its consequence.** Never a bare `approve · revise · abort` — each option carries a short clause saying what happens next: `approve — moves on to implementation`, `abort — stops this REQ; nothing is committed`.
5. **On Claude, deliver the decision as an `AskUserQuestion`** with that gate's real options (`approve` / `revise` / `abort`, or whatever the gate defines), the recommended one marked *(Recommended)*, and each option's consequence clause (invariant 4) in that option's `description`. Other assistants render an inline menu. The card is the context; the question is the ask.
6. **Text-first.** The card must read in a plain terminal — compact text, never a raw Mermaid code block (it shows as source-noise where nothing renders it). Detail lives in the artifact files; name a file where the user would go to look, but don't pad the card with pointer lines for their own sake. Keep user-facing lines at or under ~72 characters — longer lines wrap badly in a narrow terminal. Never draw fixed-width rulers or boxes (`──────`); they break the moment the terminal is narrower than the card. A short plain header line (`GATE 2/<N> · …`) is enough.
7. **Keep it short.** The card orients; it is not a report. Target 20 lines or fewer. When there is more to show (a long findings list, a full task plan), keep it in the artifact file and offer it on demand — "say `show findings` for the full list" — instead of inlining it.

## The base skeleton (adapt per gate)

```
GATE <n>/<N> · <Phase> · <REQ> — <short title>
   <verdict — one line: what's ready, and whether anything needs a call>

<WHAT'S DONE>     terse, FYI — the artifacts / counts this phase produced
<WHAT NEEDS YOU>  the decision-bearing items, prioritized by consequence (omit if none)
<CHECKS>          this gate's validation, compact — if it has any

MY READ           the recommendation + one-line why
Decision →        the gate's options, each with its consequence
```

`READY` / `NEEDS YOU` / `CHECKS` / `MY READ` are the common vocabulary — use the names that fit the phase, drop any that don't apply, and **add sections when the work calls for it.** For example:

- **`/spec`** — often just verdict + `CHECKS` + `MY READ` + decision (nothing structural to show).
- **`/architect`** — `READY` with the task DAG in compact text (`T1,T2 → T3,T4 → T5`); `NEEDS YOU` for a proposed ADR or a stress-test finding that held up.
- **`/review`** — leads with `FINDINGS` grouped by severity; the decision is which to fix vs. accept.
- **Combined gates** (`plan`, Build & Review, `/bugfix` `diagnose`) — one heading per covered phase, each with its own CHECKS line (see Profiles).
- **`/wrapup`** — a `SHIP CHECKLIST` and the PR/lessons/vault state, including what the lesson dedup was compared against (`dedup vs origin/<base> as of <age>`).
- **`/autopilot` final review** — opens with a `RUN SUMMARY` across every gate it auto-cleared.

The spine (done → needs-you → recommend → decide) holds; the middle is the phase's to shape.

## Markers

Use **one** small vocabulary across every card — no other glyphs, no emoji:

- `✓` — a check that passed.
- `⚠` — a check that flagged, or an item that needs attention/decision.
- `?` — an open question that bears on the decision.
- Severities spelled out: `critical` / `major` / `minor`; show trivial only as a count (`+3 trivial`).

The same symbol means the same thing at every gate, so the user reads cards without relearning them.

## Profiles — which phase boundaries get a gate

Phases never change; how many gates sit between them does. Each REQ carries `profile`, `hardStop`, and `gates` (the ordered gate list) in `pipeline-state.json`. (`/bugfix` carries `gates` only.) **No `gates` = legacy:** five gates `spec · architect · implement · verify · ship`, exactly as before 1.9.0.

| Pipeline | Gates (`currentPhaseGate`, in order — phases each covers) |
|---|---|
| `/task` (`easy`) | `plan` (1–2) · `ship` (3–5) |
| `/bugfix` | `diagnose` (1–2) · `ship` (3–5); `verify` (3–4) is inserted before `ship` when review leaves a critical/major open |
| `/proceed` `standard` | `plan` (1–2) · `verify` (3–4) · `ship` (5) |
| `/proceed` `full` | `spec` · `architect` · `implement` (only when `hardStop`) · `verify` · `ship` |

**Triage — one list for the whole toolkit.** Sensitive surface = `config.yml → autonomy.hard_stops`, else: auth, security, secrets, data/schema migration, public API contract, anything irreversible. `full` if any holds: sensitive surface (also `hardStop: true`), a new ADR is needed, cross-repo, blast radius ~8+ files or 3+ modules/layers, a significant UI surface, or `--profile=full`. Otherwise `standard`. (`/task` keeps its own, stricter entry triage.)

**Upgrade only.** A phase that finds a trigger the profile didn't cover upgrades the REQ, rewrites `gates`, appends `## [DATE] profile-upgraded | <REQ> | <from>→<to> | <trigger>` to `hot.md`, and names it on the next card. Upgrades change only gates not yet reached. Nothing downgrades on its own; a user who picks a lighter profile at a card is logged as `profile-override` and shown on every later card.

**Deferred gates.** A phase whose boundary has no gate ends with `gateState: "deferred"` instead of a marker and card. The next phase's preflight accepts `cleared` or `deferred`. Everything the deferred card would have shown moves to the next card under that phase's own heading — **a combined card keeps every covered phase's CHECKS line**; to stay short it moves READY detail into files, never checks. Target ≤20 lines, ≤28 for a combined card.

**Numbering.** `GATE <n>/<N>` with `N = gates.length` — a standard REQ reads `GATE 2/3 · Build & Review`.

## Diagrams

Text-first (invariant 6). Render a structural thing as compact text when it earns space — a DAG as `T1,T2 → T3,T4 → T5`. The full Mermaid stays in the artifact file, where it renders in Obsidian / GitHub / IDE preview. Don't add a dedicated "Diagrams: …" line — the file is already named in what's done.
