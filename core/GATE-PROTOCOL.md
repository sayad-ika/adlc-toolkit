# Gate Protocol — the base for every human gate

This is the **shared spine** every gate uses to hand a decision back to the user — **not a fixed template.** Gates differ: a design gate shows a plan, a build gate is almost all findings, a ship gate is a checklist, `/autopilot`'s final review summarizes a whole run. So each step **adapts** this base to what it actually produced. What's constant is the spine and the principles below; the sections are a palette, not a mold.

Load it at preflight (with `ETHOS.md` and `core/VOICE.md`) from `$TOOLKIT_PATH/core/GATE-PROTOCOL.md`. It governs **presentation, not semantics** — `approve` / `revise` / `abort` do whatever each skill defines.

The card is the chat-facing twin of the `.awaiting-approval` file marker. The marker persists the gate across sessions; the card is what the user reads now. **Both are always written at a gate.**

## The invariants (every gate, no exceptions)

1. **Separate *done* from *needs-decision*.** Lead the user's eye to what needs them — not a flat list where FYI and blockers carry equal weight.
2. **Always recommend.** State the option you'd pick and one line of why, even when it's "approve — nothing flagged."
3. **The decision is last, and it is the only imperative.** Everything above orients; the final line asks.
4. **Every option states its consequence.** Never a bare `approve · revise · abort` — each option carries a short clause saying what happens next: `approve — moves on to implementation`, `abort — stops this REQ; nothing is committed`.
5. **On Claude, deliver the decision as an `AskUserQuestion`** with that gate's real options (`approve` / `revise` / `abort`, or whatever the gate defines), the recommended one marked *(Recommended)*, and each option's consequence clause (invariant 4) in that option's `description`. Other assistants render an inline menu. The card is the context; the question is the ask.
6. **Text-first.** The card must read in a plain terminal — compact text, never a raw Mermaid code block (it shows as source-noise where nothing renders it). Detail lives in the artifact files; name a file where the user would go to look, but don't pad the card with pointer lines for their own sake. Keep user-facing lines at or under ~72 characters — longer lines wrap badly in a narrow terminal. Never draw fixed-width rulers or boxes (`──────`); they break the moment the terminal is narrower than the card. A short plain header line (`GATE 2/5 · …`) is enough.
7. **Keep it short.** The card orients; it is not a report. Target 20 lines or fewer. When there is more to show (a long findings list, a full task plan), keep it in the artifact file and offer it on demand — "say `show findings` for the full list" — instead of inlining it.

## The base skeleton (adapt per gate)

```
GATE <n>/<N> · <Gate> · <REQ> — <short title>
   <verdict — one line: what's ready, and whether anything needs a call>

<WHAT'S DONE>     terse, FYI — the artifacts / counts this step produced
<WHAT NEEDS YOU>  the decision-bearing items, prioritized by consequence (omit if none)
<CHECKS>          this gate's validation, compact — if it has any

MY READ           the recommendation + one-line why
Decision →        the gate's options, each with its consequence
```

`READY` / `NEEDS YOU` / `CHECKS` / `MY READ` are the common vocabulary — use the names that fit the gate, drop any that don't apply, and **add sections when the work calls for it.** For example:

- **Design** (Hard) — `READY` with the task DAG in compact text (`T1,T2 → T3,T4 → T5`); `NEEDS YOU` for a proposed ADR or a stress-test finding that held up.
- **Build** (Hard) — leads with `FINDINGS` grouped by severity; the decision is which to fix vs. accept.
- **Ship** — the PR/lessons/vault state, including what the lesson dedup was compared against (`dedup vs origin/<base> as of <age>`). On the Easy path it also leads with `FINDINGS`, since it's the only gate.
- **`/autopilot` final review** — opens with a `RUN SUMMARY` across every gate it auto-cleared.

The spine (done → needs-you → recommend → decide) holds; the middle is the step's to shape.

## Markers

Use **one** small vocabulary across every card — no other glyphs, no emoji:

- `✓` — a check that passed.
- `⚠` — a check that flagged, or an item that needs attention/decision.
- `?` — an open question that bears on the decision.
- Severities spelled out: `critical` / `major` / `minor`; show trivial only as a count (`+3 trivial`).

The same symbol means the same thing at every gate, so the user reads cards without relearning them.

## Diagrams

Text-first (invariant 6). Render a structural thing as compact text when it earns space — a DAG as `T1,T2 → T3,T4 → T5`. The full Mermaid stays in the artifact file, where it renders in Obsidian / GitHub / IDE preview. Don't add a dedicated "Diagrams: …" line — the file is already named in what's done.

## Open a gate — the end of every gated step

This is bookkeeping, not a step. Every gated step ends with all three:

1. `pipeline-state.json`: `step`, `gate`, `gateState: "awaiting"`, plus whatever the step counts (`taskStatus`, `findings`).
2. `.adlc/<REQ_PATH>/.awaiting-approval`:
   ```
   Gate: <design | build | ship>  (<easy | hard> path, step <n>/<N>)
   REQ: <ID>-<slug>
   Awaiting: <one line>
   Files:
     - <the artifacts the user should open>
   ```
3. The card, per the invariants above. Header: `GATE <n>/<N> · <Gate> · <ID>-<slug>  (<path>)`.

## Close a gate — what each reply does

The same for every gate unless the step says otherwise.

- **approve** — delete the marker; `gateState: "cleared"`; append `## [DATE] <gate>-gate-cleared | <ID>-<slug>` to `hot.md`. If `git.mode` is `commit`/`commit+push`, commit the step's work on the REQ's feature branch using `commits-draft.md` (and push it, fast-forward only). Then continue to the next step, or stop if this was the last.
- **revise `<what>`** — apply it, re-run the step's checks, re-emit the card. Stay on this gate.
- **upgrade** (Easy path only) — switch to Hard per `paths/easy.md` → Upgrade. Nothing is lost.
- **abort** — confirm in plain words first ("This drops REQ-042's work so far. Confirm?"). Then: in `worktree` mode, remove the worktree (`git worktree remove --force`); print the rest for the user to run (`checkout <base>`, `restore .`, `clean -fd`, `branch -D <branch>`) — branch deletion is always theirs. Mark any drafted ADR `rejected` (never delete it). Set `gateState: "aborted"`, log `<gate>-aborted` to `hot.md`. The REQ folder stays unless the user explicitly asks to delete it.
- **anything else** — ask what they meant. Don't guess.
