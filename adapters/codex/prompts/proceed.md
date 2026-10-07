Toolkit root: .adlc-toolkit

This is an alias: execute the ADLC **adlc** protocol — defined in `.adlc-toolkit/core/skills/adlc.md` — as if invoked with `--hard` before the user's arguments, against the `.adlc/` vault in the current repository.

Read that file in full and follow **every step literally**. It is a protocol, not a guideline (ADLC ETHOS principle 5 — load `.adlc-toolkit/ETHOS.md`).

**Paths:** `.adlc-toolkit/core/VAULT-LAYOUT.md` owns where work records live under `.adlc/specs`, `.adlc/bugs`, and `.adlc/sprints`. A vault may hold flat and month-bucketed folders at the same time, so never hard-code a path under those trees — resolve it.

**Gate:** this skill ends in an approval gate. Stop and wait for the user's explicit approval before anything proceeds past it. Do not auto-fix-and-continue on a gate failure — surface what failed and wait.

This skill dispatches sub-agents (codebase-explorer, architecture-adversary, task-implementer, correctness-reviewer, quality-reviewer, architecture-reviewer, reflector, ui-reviewer). Run them as subagents and consolidate their reports.

**Git policy:** follow `git.mode` in `.adlc/config.yml` (default `manual`). `manual` — never run git writes; read git state and draft commit/PR artifacts for the user. `commit` / `commit+push` — you may commit (and push, fast-forward only) the REQ's own feature branch once that step's gate is approved. Never a protected branch, force-push, history rewrite, branch delete, `gh pr create`/`gh pr merge`, or `--no-verify` — in any mode.
