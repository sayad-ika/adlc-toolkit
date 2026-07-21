---
name: ux-doctor
description: Standalone UX & design-system audit of the whole app or a chosen part of it. Sizes the UI surface first — small apps get one pass; large apps get a gated segment plan run in phases (system pass → per-segment passes → cross-segment consolidation) with durable progress that survives sessions (/ux-doctor resume). Dispatches the design-system-auditor (static pass over the UI source) and the ui-reviewer in standalone-audit mode (runtime pass in a browser) in parallel, consolidates their findings into a dated severity-by-effort report in .adlc/audits/, and maintains .adlc/context/design-system.md. No pipeline state, no gates; fixes route to /task or /spec.
---

You are running a UX and design-system audit. This is **standalone work** — not part of the `/proceed` pipeline. No gates, no pipeline state. Two agents examine the app from opposite sides at once — the source and the screen — and you consolidate what they find into one prioritized report. On a large app, the audit is **segmented**: a plan file carries progress across sessions, so running out of budget mid-audit costs one segment, never the audit.

## When to use

- Periodic UX health check, or before investing in a design system
- The UI "feels inconsistent" and you want a concrete, prioritized inventory
- After a run of UI-heavy REQs, to catch accumulated visual/interaction drift
- One feature area before its redesign — `/ux-doctor <feature>` scopes to just that
- Onboarding a designer who needs to know the system's actual state

## When NOT to use

- Per-REQ UI review — that's `/review`'s job (`ui-reviewer`, scoped to the diff)
- Attacking a *planned* UI before it's built — that's the `architecture-adversary`'s UX lens in `/architect`
- Code health (dead code, complexity, coverage) — use `/analyze`
- Performance / cost — use `/optimize`

## Invocation

- `/ux-doctor` — size the surface, then run single-pass or propose a segment plan
- `/ux-doctor <segment | feature | route | path>` — scoped audit of just that surface, no plan
- `/ux-doctor resume` — continue an open segment plan from its next pending segment

## Inputs

Optional arguments:

- **Scope** — a segment name, feature, route, or source path (turns the run into a scoped audit). Default: the whole UI surface.
- **Depth** — `quick` (top 10 findings per pass), `standard` (top 30, the default), `thorough` (everything material).
- **Focus** — comma-separated categories to emphasize: `tokens`, `scale`, `components`, `naming`, `consistency`, `heuristics`, `a11y`, `responsive`, `flows`. Default: all.

If the user doesn't provide arguments, ask once whether they want the default (`standard`, whole surface, all categories) or to customize.

## Preflight

1. **Read the toolkit ETHOS.**
2. **Load vault context.** `.adlc/CLAUDE.md`, `config.yml` (`stack.frontends`, the `ui:` block, `sources.design`), `context/conventions.md`, `context/architecture.md`.
3. **Verify there is a UI to audit.** If `config.yml` declares no frontend and no UI source is detectable, surface that and stop.
4. **Check for an open plan.** If any `.adlc/audits/ux-plan-*.md` has pending segments, surface it (segments done / pending, last touched) and ask: resume it, or start fresh (marking the old plan `abandoned`)? `/ux-doctor resume` skips the question and resumes the most recent open plan.
5. **Check for `.adlc/context/design-system.md`.** Its presence changes both agents' briefs (audit *against* it) and the system pass's posture (drift report vs. first synthesis).
6. **Check for prior audits.** Read `.adlc/audits/ux-*.md`. If a completed one is recent (<30 days) and no plan is open, surface it and ask whether the user wants a new run or the recent one.
7. **Resolve auth posture.** If the app sits behind a login (`config.yml` → `ui.auth`, or the user says so), confirm the credentials env file (`ui.auth.env_file`, default `.adlc/ui-auth.env`) exists before dispatching. If it's missing, ask once — provide it now, or run the audit public-surfaces-only. Don't let the runtime pass stall on a login wall mid-run.

## Steps

### 1. Size the surface and pick the mode

Estimate the UI surface: routes (from `ui.routes`, router files, or the primary navigation) and UI source files (components/pages/views/styles under the frontend paths).

- **Scoped** — the user named a part. Resolve it to routes + implementing paths (via the segment map of an existing plan if one matches, else infer from routing and directory structure), confirm the resolution in one line, and run steps 3–5 for that slice only. Report file: `ux-YYYY-MM-DD-<slug>.md`. No plan file.
- **Single-pass** — the whole surface fits comfortably in one session (guideline: ≲ 12 routes *and* ≲ 100 UI files at `standard` depth — a judgment call, not a checkbox; `thorough` halves those numbers). Run steps 3–5 over the whole surface in one go.
- **Segmented** — the surface is bigger than that, or the user asked for phases. Continue to step 2.

Say which mode you picked and why, in one line. Never start a surface you can't honestly expect to finish — that's what the plan is for.

### 2. Segmented only — draft the segment plan (user approves it)

Divide the app by **feature area**, not by directory alphabet: each segment is a route group plus the source subtree that implements it (e.g. `auth`, `dashboard`, `checkout`, `settings`), plus one `shared-shell` segment for the chrome every screen uses (nav, layout, common components). Aim for 3–8 segments, each sized to fit well within a session at the chosen depth.

Write `.adlc/audits/ux-plan-YYYY-MM-DD.md`:

```markdown
# UX audit plan — YYYY-MM-DD

| Field | Value |
|---|---|
| Status | open \| complete \| abandoned |
| Depth / Focus | <depth> / <focus> |
| System pass | pending \| done (ux-system-YYYY-MM-DD.md) |
| Design-system doc | present \| absent \| synthesized this audit |

| # | Segment | Routes | Paths | Status | Findings |
|---|---|---|---|---|---|
| 1 | shared-shell | (all) | src/components/layout/ | pending | — |
| 2 | auth | /login, /signup | src/features/auth/ | pending | — |
| ... | | | | | |
```

The plan file is the durable twin of this conversation — like a gate's `.awaiting-approval`, it's what lets a fresh session pick up the audit. Present it per ETHOS principle 6 (an `AskUserQuestion` on Claude): **run phases now** (work through segments this session until budget says stop), **one segment per session** (run the first segment, then hand back — the safe default for large apps), **edit the plan** (rename/split/merge/drop segments), or **cancel**.

### 3. System pass (once per audit), then the segment passes

**Dispatch by exact agent name.** If the agent type isn't available (not installed, or the sync hasn't run since it was added), **stop and tell the user**: "`<agent>` isn't installed — run the toolkit sync, then re-run this step." Never absorb the agent's work into the main session as a fallback: inline work runs at the session's model instead of the agent's tier (a haiku-priced exploration silently becomes an opus-priced one), and for reviewers it destroys the independence the gate depends on — the same context that wrote the code would be reviewing it.

**System pass.** Dispatch the `design-system-auditor` in its **system-pass** shape first — global inventory only: token source, scales, component inventory, top-level compliance patterns, and (if `design-system.md` is absent) the Observed system appendix. Output: `.adlc/audits/ux-system-YYYY-MM-DD.md`. It's cheap by design and every later pass builds on it.

If `design-system.md` is absent, make the **gated synthesis offer now** — create `.adlc/context/design-system.md` from `templates/design-system-template.md`, seeded from the Observed system appendix, every seeded section under `STATUS: needs verification`, born minimal. Doing this *before* the segments means they audit against the contract instead of retro-fitting it. The user approves before the file is written; if they decline, segments audit for internal coherence only.

In **single-pass and scoped modes** there is no separate system pass — the one static dispatch covers inventory and audit together (the agent's full shape), and the synthesis offer moves to step 5.

**Segment passes.** For the current segment (or the whole surface in single-pass mode), dispatch both agents **in parallel** — they are independent by construction; one reads source, one drives a browser:

Launch the `design-system-auditor` agent:

```
Repo: <repo-root>
Shape: segment | full
Paths: <segment paths, or the whole UI surface>
Depth: <depth>   Focus: <static categories — tokens, scale, components, naming, consistency, a11y>
System-pass report: <ux-system-YYYY-MM-DD.md, when one exists>
Design-system doc: <path, or "absent">
Output file: .adlc/audits/ux-static-YYYY-MM-DD[-<segment>].md

Run the static design-system audit per your skill instructions. Report findings only.
```

Launch the `ui-reviewer` agent:

```
Trigger: standalone-audit
Work path: <repo-root>
Routes / flows to walk: <segment routes, or ui.routes / primary navigation>
Depth: <depth>   Focus lenses: <runtime lenses — heuristics, consistency, a11y, responsive, flows>
Design-system doc: <path, or "absent">
Design reference: <sources.design link if configured, else none>
Auth: <ui.auth summary — login_url + env file present/absent, or "none required">
Output file: .adlc/audits/ux-runtime-YYYY-MM-DD[-<segment>].md
Evidence dir: .adlc/audits/ux-evidence-YYYY-MM-DD/

Whole-app audit walk per your standalone-audit instructions — no REQ, no diff.
Resolve your browser tier per your skill instructions and record it; degrade, never block.
```

Verify both partials exist, each with a coverage statement (the runtime one with its browser tier). If an agent errored or a partial is empty, surface that — don't fake content.

**After each segment completes, update the plan file before anything else** — status, findings count, browser tier. The segment boundary is the save point: a session that dies loses at most the in-flight segment.

**Between segments, check the budget honestly.** If the session has been running long, stop cleanly: plan updated, one line to the user — "N of M segments done; run `/ux-doctor resume` in a fresh session to continue." Grinding into token exhaustion mid-segment wastes the segment; stopping at the boundary wastes nothing.

### 4. Consolidate (when the last segment — or the single pass — is done)

Write the final report — `ux-YYYY-MM-DD.md` (scoped runs: `ux-YYYY-MM-DD-<slug>.md`):

- **Header** — mode (single-pass / segmented, with segment count / scoped, with scope), depth, focus, browser tier(s), files scanned / routes walked.
- **Summary** — one paragraph: the top three patterns across all passes.
- **Findings** — merged and deduplicated across all partials. When a static and a runtime finding describe the same defect (matched by file/component/route), merge into one finding carrying **both** evidence trails (`file:line` + screenshot); note `seen in: source + runtime` — those are the highest-confidence items. Keep each pass's IDs (DS-###, UI-###) so evidence stays traceable.
- **Cross-segment consistency** *(segmented mode — this is why consolidation is a real phase, not a paste-up)*: per-segment passes structurally cannot see a misalignment *between* segments. Compare the accumulated evidence across segments — sibling patterns, shared components, spacing/typography/empty-state structure on peer screens in different features — and record divergences as findings here, citing evidence from both segments.
- **Payoff × effort matrix** — do first (big payoff, small effort — lead with these), worth planning (big payoff, big effort), easy tidy-ups (small/small), probably skip (small payoff, big effort — listed, not detailed).
- **Trends** — against prior audits of the **same scope** (full-app audits compare to full-app audits; scoped to same-scope): resolved / new / still-open.

Then delete the partial files — their content now lives in the report; the evidence directory stays. Mark the plan `complete` — the plan file survives as the audit's coverage record.

### 5. Design-system upkeep (gated)

- **`design-system.md` absent and not synthesized at step 3** (single-pass/scoped runs, or the user declined earlier): make the synthesis offer now, seeded from the Observed system appendix as described in step 3.
- **`design-system.md` present:** drift findings are in the report. If any are `intentional` divergences worth ratifying or `system-gap`s worth filling, offer the specific doc edits **per section, gated** — never silently rewrite the contract the team audits against.

### 6. Update hot.md and index.md

Append to `hot.md`:

```markdown
## [YYYY-MM-DD] audit-ux | <count> findings (<critical>C/<major>M/<minor>m) | <single-pass | N segments | scoped: <slug>> | tier: <browser-tier> | depth: <depth>
```

Also append a line when a segmented audit *pauses* (`audit-ux-paused | N/M segments`), so `hot.md` reflects reality between sessions. Add a row to the Audits table in `index.md` (create the section if `/analyze` hasn't already), type `ux`.

### 7. Report and route

Surface a concise summary in chat:

```
UX & design-system audit — YYYY-MM-DD

Mode: <single-pass | segmented, M segments | scoped: <slug>>
Scope: <scope>   Depth: <depth>   Browser tier: <chrome | headless | static-only>
Passes: static (design-system-auditor) + runtime (ui-reviewer)

Findings:
  Critical: <N>  ← <one-line summary if any>
  Major:    <N>
  Minor:    <N>
  Seen in both passes: <N>   Cross-segment: <N>

Quick wins (high impact, low effort):
  1. <finding> (effort: small)
  2. <finding>
  3. <finding>

Design system: <"design-system.md drift: N findings" | "synthesized this audit — ratify it" | "no design-system.md — synthesis declined">
Trends since <last-date>: <resolved> resolved · <new> new · <open> still open

Full report: .adlc/audits/ux-YYYY-MM-DD.md
```

(A paused segmented run reports progress instead: segments done/pending, findings so far, and the `resume` instruction — no matrix until consolidation.)

Then hand the decision back per ETHOS principle 6 — an `AskUserQuestion` on Claude:

- **Fix quick wins** — open `/task` for the selected quick-win findings (small, self-triaging; it escalates if one turns out large)
- **Draft a REQ** — open `/spec` seeded from the strategic findings (a design-system consolidation is real scoped work)
- **Report only** *(default)* — keep the report; findings are a backlog, revisit at the next audit

Never auto-open a REQ or start fixing without that choice.

## Constraints

- **Read-only on source.** Neither agent nor this skill modifies source, styles, or tokens. Your writes are the report, the plan file, `hot.md`/`index.md`, and — gated — `design-system.md`.
- **`design-system.md` changes are always gated.** It's the contract other skills audit against (`ui-reviewer` design-match, the adversary's UX lens); it never changes as a side effect.
- **Segment boundaries are save points.** The plan file is updated after every segment, before the next begins. Prefer stopping at a boundary over starting a segment you may not finish.
- **Shrink the plan, not the honesty.** If budget forces cuts, segments stay `pending` in the plan and the pause is reported — coverage is never silently thinned, and a half-run is never presented as a full audit (no silent caps).
- **Don't open REQs automatically.** Routing is the user's call at step 7.
- **Degrade honestly.** No browser means the runtime pass ran static — the report and chat summary must say which tier actually ran.
- **Credentials never enter the vault.** The auth env file is read by the ui-reviewer only; no value from it appears in the report, `hot.md`, or `design-system.md`.
- **Never run git mutations.**

## Output artifacts

- `.adlc/audits/ux-YYYY-MM-DD.md` (scoped: `ux-YYYY-MM-DD-<slug>.md`) + `ux-evidence-YYYY-MM-DD/` screenshots
- `.adlc/audits/ux-plan-YYYY-MM-DD.md` (segmented mode — survives as the coverage record) and `ux-system-YYYY-MM-DD.md` (the system pass)
- `.adlc/context/design-system.md` — created or updated only with approval
- Updates to `.adlc/hot.md` and `.adlc/index.md`
