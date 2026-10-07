# ADLC Toolkit — pipeline conventions

This repository uses the **ADLC toolkit**: a plan-first development pipeline that classifies work as Easy/Medium (one human approval gate) or Hard (three). You are running inside Gemini CLI.

**Knowledge vault:** `.adlc/` holds specs, architecture, conventions, decisions (ADRs), lessons, gotchas, and glossary. Read `.adlc/context/conventions.md`, `.adlc/context/project-overview.md`, and `.adlc/now.md` before non-trivial work. The toolkit itself lives at `.adlc-toolkit/`. Work records under `specs/`, `bugs/`, and `sprints/` may be flat or bucketed by month and author — `.adlc-toolkit/core/VAULT-LAYOUT.md` is the only place that grammar is written down; resolve paths through it rather than assuming a shape.

**The seven principles (full text: `.adlc-toolkit/ETHOS.md`):**
1. **You decide; the assistant drafts.** Every gate pauses for the user. Git writes follow `.adlc/config.yml` → `git.mode` (default `manual` = the assistant drafts; you run git).
2. **Plan first, code second.** Never write code without a written plan; Hard work's plan is approved before any code exists.
3. **Read-only reviewers.** Review/audit agents are read-only on your code — they write only their own findings, never source. The user decides what gets fixed.
4. **Knowledge compounds.** Every change leaves the vault smarter — lessons, gotchas, concepts, ADRs.
5. **Process is explicit.** Skill steps are a protocol, not a guideline. No shortcuts; no `--no-verify`.
6. **Offer choices, don't ask open-ended questions.** When you need a decision from the user, present discrete labeled options with a recommendation. On Claude, use the `AskUserQuestion` tool; elsewhere, a short numbered list inline. The user can always go off-menu.
7. **Speak plainly.** Everything shown to the user follows `.adlc-toolkit/core/VOICE.md`: everyday words, toolkit terms glossed on first use, machine tags beside a plain sentence, every option stating its consequence.

**Git policy — set by `.adlc/config.yml` → `git.mode` (default `manual`):** In `manual`, never run git writes — read git state and draft the commit message, PR body, and merge checklist for the user. In `commit`, you may `git add`/`git commit` on the REQ's feature branch after that step's gate is approved; in `commit+push`, you also `git push` that branch (fast-forward only). **Invariant in every mode:** only the REQ's own feature branch — never a protected branch (`git.protect`, e.g. main/master/release/*), never force-push, rebase, amend published commits, `reset --hard` away commits, delete branches, `gh pr create`/`gh pr merge`, or `--no-verify`. Where any skill or agent below says "the user commits" or "never commit," that is the `manual`-mode description.

**Workflow:** run `adlc` for any work, feature or bug. It classifies the work and runs one of two paths: **Easy/Medium** — do → check & ship, one gate at the end; **Hard** (sensitive, needs a decision, spread wide, or unclear) — design → build & verify → ship, a gate after each. Easy upgrades to Hard the moment a risk signal appears, never the reverse. `proceed`, `task` and `bugfix` are aliases (`--hard`, `--easy`, `--bug`). See per-command stubs for how each maps in Gemini CLI.