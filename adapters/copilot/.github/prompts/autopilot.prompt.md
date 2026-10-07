---
description: "Autonomous /adlc. Classifies the work and runs its path, but routes each gate through the decision-maker instead of pausing, checkpoint-commits as it goes (within git.mode), and ends in one final human review backed by a full decision log. Opt-in; conservative by default; never merges, never rewrites history."
---

Toolkit root: .adlc-toolkit

Execute the ADLC **autopilot** protocol — defined in `.adlc-toolkit/core/skills/autopilot.md` — against the `.adlc/` vault in the current repository.

Read that file in full and follow **every step literally**. It is a protocol, not a guideline (ADLC ETHOS principle 5 — load `.adlc-toolkit/ETHOS.md`).

**Paths:** `.adlc-toolkit/core/VAULT-LAYOUT.md` owns where work records live under `.adlc/specs`, `.adlc/bugs`, and `.adlc/sprints`. A vault may hold flat and month-bucketed folders at the same time, so never hard-code a path under those trees — resolve it.

This skill relies on the agents (codebase-explorer, architecture-adversary, task-implementer, correctness-reviewer, quality-reviewer, architecture-reviewer, reflector, ui-reviewer, decision-maker). Invoke the matching custom agents (use handoffs) or run each role sequentially.

**Git policy:** follow `git.mode` in `.adlc/config.yml` (default `manual`). `manual` — never run git writes; read git state and draft commit/PR artifacts for the user. `commit` / `commit+push` — you may commit (and push, fast-forward only) the REQ's own feature branch once that step's gate is approved. Never a protected branch, force-push, history rewrite, branch delete, `gh pr create`/`gh pr merge`, or `--no-verify` — in any mode.
