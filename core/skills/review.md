---
name: review
description: Multi-perspective code review for a REQ. Phase 4 of /proceed. Dispatches 4 read-only review agents in parallel (correctness, quality, architecture, reflector) — plus a 5th ui-reviewer that runs the app in a browser when the change touches a UI surface — consolidates findings by severity, and ends in the verify gate.
---

You are running Phase 4 of the ADLC pipeline: reviewing the implemented code through four lenses and consolidating findings.

## When to use

- The implement gate has been cleared and the user has run the drafted commits.
- The user invokes `/review REQ-NNN-<slug>` directly, or `/proceed` is moving past the implement gate.

## Preflight

1. **Resolve the REQ folder, then verify the implement gate cleared and code is committed.** Resolve the REQ per `$TOOLKIT_PATH/core/VAULT-LAYOUT.md`'s `resolve` rule. The result is `<REQ_PATH>` — vault-relative, no `.adlc/` prefix — and every path below is written `.adlc/<REQ_PATH>/…`. Read `.adlc/<REQ_PATH>/pipeline-state.json` (`currentPhase >= 3`, `gateState: "cleared"` for implement). Check that `git -C <workPath> log <base-branch>..<branch> --oneline` shows commits — if the branch has no commits past the base, **stop and remind** the user to run the commits first.
2. **Read the toolkit ETHOS** (`$TOOLKIT_PATH/ETHOS.md`) **, the gate protocol** (`$TOOLKIT_PATH/core/GATE-PROTOCOL.md`)**, the voice guide** (`$TOOLKIT_PATH/core/VOICE.md`)**, and the vault layout** (`$TOOLKIT_PATH/core/VAULT-LAYOUT.md` — where work records live on disk; never hard-code a path under `specs/`, `bugs/`, or `sprints/`) — the shared gate-card format used at step 9.
3. **Load context.** `.adlc/CLAUDE.md`, `config.yml`, `context/conventions.md`, `<REQ_PATH>/requirement.md`, `architecture.md`, `commits-draft.md`.
4. **Verify the work path and branch.** Read `pipeline-state.json.workPath`, `isolation`, and `branch`. Check `workPath` is a valid directory. Verify the branch ref exists: `git -C <workPath> rev-parse --verify <branch>`. (In `branch` mode, HEAD may be on a different branch — that's fine; comparisons below use `<branch>` by name.)
5. **Identify the diff.** Determine the base branch from `config.yml` (default `main`). Capture the list of changed files: `git -C <workPath> diff --name-only <base-branch>...<branch>`.
6. **Decide whether the UI reviewer runs.** Condition (a) is mandatory: `config.yml` → `stack.frontends` must be non-empty (the project has a frontend at all). If it's empty, never dispatch — there is no UI to review. With a frontend present, dispatch if **either** of these holds:

   - **(b) Direct UI change** — the diff touches a UI surface: component / page / view / route / style / template files (`*.jsx/tsx/vue/svelte`, `*.css/scss/less`, paths under `components/`, `pages/`, `views/`, `app/`, `routes/`, `public/`, `templates/`), or the spec has UI-facing acceptance criteria implicated by the change.
   - **(c) Indirect UI impact — an API/contract change the frontend consumes.** A back-end-only diff is *not* automatically safe. If the change alters an API the frontend calls — a changed response shape, a renamed/removed field, a new required request param, a new error or status code, a changed default, a modified shared DTO/type or GraphQL schema/OpenAPI spec — then a screen that consumes it can break (crash on a missing field, mis-render, swallow a new error) even though no frontend file changed. **Check for the coupling:** take the endpoints/paths/fields/types the diff changed and grep the frontend for references (its API client, fetch/axios/RTK-Query/react-query calls, shared types package, generated client) — and consult `exploration.md`'s integration points. If any frontend code consumes the changed contract, the condition holds.

   If (a) holds and (b) or (c) does, dispatch the ui-reviewer. Pass it the **trigger reason** and the relevant surface: for (b), the changed UI files; for (c), the changed endpoints/contracts **and** the frontend call sites that consume them, so the reviewer knows which screens to exercise against the new contract. If only (a) holds (a truly back-end-internal change with no frontend consumer — e.g. an API purely for outside consumers), do **not** dispatch; record in `review-log.md`'s UI section that no direct or indirect UI surface was present, and note the coupling check was run (the Summary in `verification.md` carries the one-line version).

## Steps

### 1. Initialize verification.md and review-log.md

The review writes **two files** with different jobs. `verification.md` is the **verdict file** — the digest, consolidated findings, summary, and acceptance-criteria check. It's what `/wrapup`, the gate packets, and every later reader load, so keep it lean (target ≤8KB). `review-log.md` is the **narrative log** — the reviewers' full sections, re-review threads, and packet-gap notes. Nothing downstream loads it; it exists for the human and for on-demand archaeology.

Create or truncate `.adlc/<REQ_PATH>/verification.md`:

```markdown
# REQ-NNN-<slug> — Verification

| Field | Value |
|---|---|
| Generated | YYYY-MM-DD |
| Work path | <path> |
| Isolation | branch \| worktree |
| Branch | <branch> |
| Files changed | <count> |
| Commits | <count> |
| Base | <base-branch> |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

_(populated after reviewers complete)_

## Findings at a glance

_(populated after all reviewers complete)_

## Consolidated by severity

_(populated after all reviewers complete)_

## Acceptance criteria check

_(populated at the acceptance-criteria cross-check)_
```

And create or truncate `.adlc/<REQ_PATH>/review-log.md`:

```markdown
# REQ-NNN-<slug> — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

_(written by correctness-reviewer)_

## Quality findings

_(written by quality-reviewer)_

## Architecture findings

_(written by architecture-reviewer)_

## Reflection findings

_(written by reflector)_

## UI/UX findings

_(written by ui-reviewer — only when the change touches a UI surface; otherwise "_(no UI surface in this change — ui-reviewer not dispatched)_")_
```

### 1.5. Build the review packet

Write `.adlc/<REQ_PATH>/review-packet.md`. This bundles the context all four reviewers need so they don't each re-read the same files.

Compose from:

- The manifest paragraph at the top (verbatim, including the packet-gap note — reviewers act on this language)
- `git -C <workPath> diff <base-branch>...<branch> --unified=99999` — the full-context diff (one stream covers added, removed, and surrounding lines for every changed file)
- Verbatim content of `requirement.md`
- Verbatim content of `architecture.md`
- Verbatim content of `exploration.md` if it exists on disk, else `_(no exploration report)_`

Shape:

`````markdown
# REQ-NNN-<slug> — Review Packet

This packet contains the diff with full file context, the REQ spec, the REQ architecture, and the earlier codebase exploration report. **Do not re-read these via Read — cite this packet.** If you Read anything beyond this packet — vault content (gotchas, lessons, ADRs, conventions, concepts) or a related source file outside the diff — add a `**Packet-gap:**` line in your section: `**Packet-gap:** <path> — <why the packet didn't cover it>`, whether or not it produced a finding. These notes are how future packets improve.

## Diff with full context (vs <base-branch>)

```diff
<git diff --unified=99999 output>
```

## REQ spec

<verbatim requirement.md>

## REQ architecture

<verbatim architecture.md>

## Codebase exploration

<verbatim exploration.md, or "_(no exploration report)_">
`````

### 2. Dispatch the reviewers in parallel

**Dispatch by exact agent name.** If the agent type isn't available (not installed, or the sync hasn't run since it was added), **stop and tell the user**: "`<agent>` isn't installed — run the toolkit sync, then re-run this step." Never absorb the agent's work into the main session as a fallback: inline work runs at the session's model instead of the agent's tier (a haiku-priced exploration silently becomes an opus-priced one), and for reviewers it destroys the independence the gate depends on — the same context that wrote the code would be reviewing it.

In a single message, launch the four static reviewers — **plus the ui-reviewer when preflight step 6 said the change touches UI**:

- **correctness-reviewer** (balanced)
- **quality-reviewer** (balanced)
- **architecture-reviewer** (balanced)
- **reflector** (balanced)
- **ui-reviewer** (balanced) — *only if the UI-surface condition held*

Each agent receives the following. Write the resolved path out in full — the agents resolve nothing, so `<REQ_PATH>` must already be substituted when it arrives:

```
REQ: REQ-NNN-<slug>
Work path: <workPath>
Branch: <branch>
Files changed: <list>
Base branch: <base-branch>
Packet: .adlc/<REQ_PATH>/review-packet.md
Output file: .adlc/<REQ_PATH>/review-log.md
Candidates file: .adlc/<REQ_PATH>/lesson-candidates.md

Read the packet first. It contains the diff with full file context, the REQ spec and architecture, and the earlier codebase exploration report. Do not re-read those files. If you Read anything beyond the packet, add a `**Packet-gap:**` line in your section so we can tighten the packet.

Append your findings under your section heading in the output file.
Append any lesson candidates to the candidates file per your skill instructions (bar: when in doubt, surface).
Follow your skill instructions for output format.
```

The **ui-reviewer**, when dispatched, additionally receives (it needs runtime context the packet doesn't carry):

```
Trigger: direct-ui-change | indirect-api-impact
UI surface (changed): <changed UI files — for a direct change>
Changed API contract: <endpoints/fields/types the diff changed — for indirect impact>
Frontend consumers: <the frontend call sites that consume the changed contract — for indirect impact>
Frontends: <config.yml stack.frontends>
UI config: <config.yml ui: block, or "infer dev script from package.json">
Design reference: <Figma link from architecture.md → Related / requirement.md, or "none">
UI acceptance criteria: <the UI-facing ACs from requirement.md>

Run the app and review per your skill instructions. Resolve the browser mechanism
(Claude in Chrome → headless → static + checklist), exercise the affected screens —
for indirect-api-impact, the screens that consume the changed contract, verified
against the NEW contract — apply the interaction & state-correctness lens, cover
every UI AC, and tear down any dev server you start.
The packet-gap discipline does NOT apply to you — your job is inherently outside the
packet (you run the app and read config); reading those is expected, not a gap.
```

### 3. Wait for all reviewers to complete

Each reviewer writes its findings to its section of `review-log.md`. Collect terminal claims from each:

- All dispatched reviewers (four, or five with the ui-reviewer) return findings → proceed to consolidation
- Any reviewer fails (tool error, timeout) → halt and surface
- The ui-reviewer degrading to its static tier (no browser available) is **not** a failure — it still returns findings plus a manual checklist; carry both forward

### 4. Consolidate findings

Read `review-log.md` after the reviewers finish. Build the **Findings at a glance** and **Consolidated by severity** sections **in `verification.md`** — the distillation step. Keep each consolidated entry to the digest row plus a compact What / Recommendation block; the long form stays in the log, findable by finding ID and reviewer section:

For each finding across all reviewer sections (including UI/UX findings when the ui-reviewer ran):

- Lead with a one-row-per-finding digest table (below) so the user can triage at a glance before reading any detail
- Under the digest, one roster line — `Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced)` (+ ui when it ran) — taken from each report's `Written by` line; flag any report that arrived without one
- Give each finding a short ID (C1, M1, m1 by severity) — the gate card and `fix <ids>` replies use these
- Deduplicate: if two reviewers flagged the same file + line + concern, merge into one entry citing both
- Sort by severity (Critical > Major > Minor > Trivial)
- Tag with originating reviewer(s)
- Mark each finding's disposition: **actionable** (a code change a task-implementer can apply) or **needs-decision** — a reflector `vault-stale` (the vault should change, not the code), an `adr-conflict`, a proposed new ADR, or an open design question. `fix all` acts on the actionable set only; needs-decision findings are the user's by definition — an implementer "fixing" one would be making the decision for them.
- Group by file

```markdown
## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| C1 | critical | double-charge path on retry | src/pay/retry.ts:88 | small | yes |
| M1 | major | duplicated retry helper; extract it | src/pay/retry.ts | small | yes |
| m1 | minor | ADR-009 conflict: retry lives outside gateway | src/pay/retry.ts | — | your call |

## Consolidated by severity

### Critical (<count>)

#### <File>:<line> — <short title>

- **Source:** correctness, reflector
- **What:** ...
- **Recommendation:** ...
- **Vault refs:** [[...]]

### Major (<count>)

...

### Minor (<count>)

...

### Trivial (<count>)

(usually omit from gate prompt — listed here for completeness)
```

### 5. Populate the summary

Edit the **Summary** section at the top of `verification.md`:

- Counts by severity
- Top patterns observed (e.g., "Three correctness findings around null handling; suggest review of the pattern in src/foo/")
- Whether any finding directly contradicts an accepted ADR (calls out reflector findings of category `adr-conflict`)
- Whether any finding is `vault-stale` (reflector suggests the vault, not the code, should change)
- Whether any finding is `repo-doc-stale` (reflector found user-facing docs the change left out of date) — count these out separately; they're fixed by updating the doc in this REQ's diff, ideally before the gate clears
- Whether the ui-reviewer ran and at what tier (chrome / headless / static-only), its severity counts, and whether it left a manual-verification checklist the user still needs to run

### 6. Cross-check against acceptance criteria

Re-read the spec's acceptance criteria. For each one, verify it's met by the implemented code. Fill in `verification.md`'s `## Acceptance criteria check` section:

```markdown
## Acceptance criteria check

- [✓ / ⚠] Criterion 1 — short note
- [✓ / ⚠] Criterion 2 — short note
```

If any criterion isn't met, flag it as a Critical finding.

### 7. Update pipeline state

```json
"currentPhase": 4,
"completedPhases": [0, 1, 2, 3, 4],
"gateState": "awaiting",
"currentPhaseGate": "verify",
"findings": {
  "critical": <count>,
  "major": <count>,
  "minor": <count>,
  "trivial": <count>
}
```

### 8. Write the gate marker

```
Phase: verify
REQ: REQ-NNN-<slug>
Awaiting: review the findings, decide which to fix.
Files:
  - .adlc/<REQ_PATH>/verification.md
  - .adlc/<REQ_PATH>/review-log.md (full narratives — open on demand)
```

### 9. Emit the gate card

Emit the gate per `$TOOLKIT_PATH/core/GATE-PROTOCOL.md`. A review gate **leads with findings** — that's its `NEEDS YOU` — and swaps in its own options (`fix` alongside approve/revise/abort). Map:

- **Header** — `Gate 4 of 5 · Review · REQ-NNN-<slug>`.
- **Verdict** — e.g. "`<total>` findings — `<k>` need a call", or "clean — no findings, recommend approve".
- **FINDINGS** — the consolidated list, one line each, prefixed by severity `crit / maj / min` (drop trivial to a count) and the originating reviewer; group the Critical + Major at the top. Suffix needs-decision findings with `— your call`, so the scope of `fix all` is visible on the card. This block *is* the `NEEDS YOU` for this gate.
- **READY** (brief) — `<4 or 5>` reviewers ran; `<total>` possible lessons noted (you decide what to keep at `/wrapup`); how the UI was checked + counts (or "UI check skipped — nothing visual changed"; omit entirely when the project has no frontend); when any doc is now out of date, name it ("docs now stale: docs/auth.md — update it in this branch before merging").
- **CHECKS** — the acceptance-criteria check as one compact `✓ / ⚠` line; call out any special item (a reflector `vault-stale` finding, an `adr-conflict`, an architecture "new ADR needed") on its own line since those need deliberate handling.
- **MY READ** — recommendation + one-line why. **Never recommend approve while a Critical is unaddressed** — that's a `fix` or `revise`.
- **Decision** — on Claude, an `AskUserQuestion`: **approve** (accept findings as-is → `/wrapup`), **fix all** (every actionable finding gets fixed, affected reviewers re-run, gate comes back — needs-decision findings return named), **fix** (`<ids>` or `all-major` — same loop, scoped), **revise** (other changes to the review), **abort** (escalate; halt). `fix all` is always offered whenever at least one actionable finding exists. Mark the recommended one per `MY READ`.

Example shape:

```
GATE 4/5 · Review · REQ-NNN-<slug>
   3 findings — 1 needs a call

FINDINGS    critical · correctness — double-charge path on retry
                       (src/pay/retry.ts:88)
            major · quality — duplicated retry helper; extract it
            minor · architecture — layering fine, no action

READY       4 reviewers ran · 3 possible lessons noted (decided at /wrapup)
            UI check skipped — nothing visual changed

CHECKS      ✓ criteria 1–2 met · ⚠ criterion 3 — safe-retry not verified
            ! past-mistakes check: repeats LESSON-007 (retry side effects)

MY READ     fix — the critical finding must be fixed before this ships

Decision →  approve (accept as-is) · fix all (every actionable
            finding; I fix, then re-check) · fix <ids|all-major> ·
            revise <what> · abort
```

## Gate clearance

If `approve` (no fixes needed):

1. Delete `.awaiting-approval`.
2. Update `pipeline-state.json`: `gateState: "cleared"`.
3. Append to `hot.md`: `## [DATE] verify-gate-cleared | REQ-NNN-<slug> | findings: C<critical>/M<major>/m<minor>`.
4. Tell the user: ready for `/wrapup`.

If `fix: <ids>`, `fix: all-major`, or `fix: all`:

1. **Resolve the set.** `<ids>` — as listed. `all-major` — every critical and major. `all` — every **actionable** finding, all severities. Needs-decision findings (`vault-stale`, `adr-conflict`, a proposed ADR, an open question) are never in the set, whatever was asked — they're decisions, not patches. If the resolved set excluded any, the re-emitted card must name them: `fixed 6 of 8 — 2 need your call: m1, m3`.
2. For each finding in the set, dispatch a `task-implementer` agent scoped to that fix:
   ```
   Fix: <finding-id>
   Source: verification.md
   File: <path>:<line>
   Recommendation: <from finding>

   Apply the fix. Append a commit message to commits-draft.md (new section: "Fix commits").
   Run tests, verify they pass.
   ```
3. **Patch the review packet's diff section.** Use `Edit` on `.adlc/<REQ_PATH>/review-packet.md` to replace the contents of the `## Diff with full context (vs <base-branch>)` section with the output of `git -C <workPath> diff <base-branch>...<branch> --unified=99999` against the updated branch. Spec, architecture, and exploration sections are unchanged — leave them alone.
4. After fixes complete, re-run the affected reviewers on the new diff (not all four — only those whose findings were addressed). Their re-review sections append to `review-log.md`, same as the first pass.
5. Refresh `verification.md` — digest rows, consolidated entries, summary counts — from the updated log, then re-emit the gate prompt with updated counts — and, when the set excluded needs-decision findings, carry those into `NEEDS YOU` by ID.

If `abort`:

1. Confirm explicitly.
2. Append to `hot.md`: `## [DATE] verify-aborted | REQ-NNN-<slug>`.
3. Update state to reflect rollback.

## Constraints

- **Reviewers are read-only.** They do not modify code. If a reviewer reports a fix was made, that's a protocol violation — surface it.
- **Don't apply fixes during the review pass.** Fixes happen only after the user approves them at the gate.
- **Deduplicate honestly.** Two reviewers flagging the same issue from different angles is a strong signal — don't lose that by collapsing too aggressively.
- **Surface vault-stale findings.** Reflector findings recommending the vault (not the code) change need special attention — the user decides whether to update the lesson/gotcha/ADR.
- **`verification.md` is the verdict file — keep it lean.** Target ≤8KB. Every later reader (`/wrapup`, the gate packets, `/status`) loads the verdict file and only that; per-finding essays belong in `review-log.md`. If the consolidated section starts reading like the log, you're writing in the wrong file.
- **Review applies code fixes but does not itself commit.** Committing follows `git.mode` (`.adlc/config.yml`, default `manual`) and happens at the implement/wrapup gate boundaries — never here, and never on a protected branch.

## Output artifacts

- `.adlc/<REQ_PATH>/verification.md` (the compact verdict file — digest, consolidated findings, summary, AC check; target ≤8KB)
- `.adlc/<REQ_PATH>/review-log.md` (full reviewer narratives and re-review threads; on no later phase's load path)
- `.adlc/<REQ_PATH>/lesson-candidates.md` (appended to by the four reviewers; persists for /wrapup to verdict)
- Updates to `pipeline-state.json` (findings counts, gateState)
- Updates to `commits-draft.md` if fixes were applied
- Updates to `hot.md` on gate clearance
