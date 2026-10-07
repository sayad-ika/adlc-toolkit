# Review routine — used by Easy step 2 and Hard step 2

Not a step on its own. The calling step names the **reviewer set**; everything else is the same on both paths.

## Who reviews

| Path | Always | When |
|---|---|---|
| Easy/Medium | `correctness-reviewer` | + `ui-reviewer` on a UI trigger · + `reflector` when the quick look found a matching lesson/gotcha |
| Hard | `correctness-reviewer`, `quality-reviewer`, `architecture-reviewer`, `reflector` | + `ui-reviewer` on a UI trigger |

**UI trigger** — `config.yml` → `stack.frontends` is non-empty **and** either (a) the diff touches UI files (`*.jsx/tsx/vue/svelte/css/scss`, `components/ pages/ views/ app/ routes/ templates/`) or a UI acceptance criterion, or (b) it changes an API contract a screen consumes — grep the frontend's API client/types for each changed endpoint, field or type. Otherwise record "no UI surface (coupling check run)" in the Summary and don't dispatch.

## 1. Build the packet — with the shell, never Read + Write

`.adlc/<REQ_PATH>/review-packet.md`. Write the header with a heredoc, then append with `>>` so nothing passes through your context:

- Diff, with `config.yml` → `review.packet.exclude` globs as `':!<glob>'` pathspecs and **`--ignore-cr-at-eol` always**:
  - committed: `git -C <workPath> diff <base>...<branch> --unified=99999 --ignore-cr-at-eol -- . ':!<glob>'`
  - uncommitted (`git.mode: manual`): the same against `<baseCommit>`, then every `git ls-files --others --exclude-standard` path no glob matches, under `## New files` with a `### <path>` heading each.
- Excluded files appear once in the header as `<path> (+N/−M)` from `--numstat`.
- `cat >>` `requirement.md` (or `bug.md`), `architecture.md` if present, and only the **Blast radius** + **Vault references** sections of `exploration.md` (the full report goes to `reflector` alone).

Header line: `Packet: <N>KB · <M> files · excluded: <list | none>`. Then this paragraph, verbatim:

> Read this packet instead of re-reading the diff, spec or architecture. Your own required reading — conventions, the vault, source outside the diff — is not a gap. Add `**Packet-gap:** <path> — <why>` only when the packet's own contents fell short.

`wc -c` it. Target ≤120KB; over 250KB goes on the gate card. Every reviewer reads all of it.

## 2. Dispatch — one message, all reviewers in parallel

Create `review-log.md` with one `## <Reviewer> findings` heading per dispatched reviewer. Each gets, with `<REQ_PATH>` written out:

```
REQ: <ID>-<slug> · Work path: <workPath> · Branch: <branch> · Base: <base>
Packet: .adlc/<REQ_PATH>/review-packet.md
Output file: .adlc/<REQ_PATH>/review-log.md  (your section only)
Candidates file: .adlc/<REQ_PATH>/lesson-candidates.md
Read the packet first. Hard caps: summary ≤5 lines, finding ≤8 lines after its
table, section ≤12KB, ≤12 lesson candidates of ≤4 lines.
```

`reflector` also gets `Exploration report: .adlc/<REQ_PATH>/exploration.md — read it in full.` `ui-reviewer` also gets the trigger, the changed UI files or changed contract + consuming call sites, `stack.frontends`, the `ui:` config, any design link, and the UI acceptance criteria; it runs the app (Chrome → headless → static checklist) and tears down any server it starts. A reviewer erroring out halts the step; `ui-reviewer` falling back to static is not an error.

## 3. Consolidate into `verification.md` (≤8KB — the only file later readers load)

- A header table (date, work path, branch, base, files, commits, packet size), then:
- **Findings at a glance** — one row per finding: `ID | severity | one line | where | effort | fix?`. IDs by severity (`C1`, `M1`, `m1`). Merge duplicates across reviewers and cite both. Mark each **actionable** (a code change) or **your call** (`vault-stale`, `adr-conflict`, a proposed ADR, an open design question — these are never auto-fixed).
- A roster line: `Reviewed by: correctness (balanced) · …`.
- **Consolidated by severity** — per finding, `Source / What / Recommendation` in a few lines. The long form stays in `review-log.md`.
- **Summary** — counts, top patterns, ADR conflicts, vault-stale items, UI tier and checklist, packet size.
- **Acceptance criteria** — `[✓|⚠] criterion — note` for each one. An unmet criterion is a Critical.

Set `findings: {critical, major, minor, trivial}` in state.

## Fix rounds — on `fix all` · `fix all-major` · `fix <ids>` at the gate

1. Resolve the set from **actionable** findings only. Name what was left out on the next card: `fixed 6 of 8 — 2 need your call: m1, m3`.
2. One `task-implementer` per finding: `Fix: <id> · File: <path>:<line> · Recommendation: <…>` — apply it, append a commit to `commits-draft.md` under `Fix commits`, run the tests.
3. Rebuild only the packet's diff, for the paths this round touched, and prepend `## Round <N> — what changed` (the open findings' digest rows + the file list).
4. Re-run only the reviewers whose findings were addressed. Their sections **append** to `review-log.md`; in `verification.md` a resolved finding **collapses** to one line on its row (`C1 — resolved, round 2`).
5. From round 3, lead the card with `Re-review round <N> · verdict file <N>KB`.

Reviewers never edit code. A reviewer reporting that it fixed something is a protocol violation — surface it.
