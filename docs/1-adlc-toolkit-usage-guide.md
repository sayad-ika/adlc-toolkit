# ADLC Toolkit — Usage Guide

How to use the toolkit day to day, and how to get the most from it with the least effort.

## What it does

You ask your AI assistant for a change. The toolkit makes it work in steps: write a spec, design it, build it, review it, then wrap up. At some of those steps it **stops and asks you** (a *gate*). Everything it learns goes into a `.adlc/` folder in your repo, so the next piece of work starts smarter.

You approve or redirect. The assistant does the rest.

**Key words**

| Word | Meaning |
|---|---|
| **REQ** | One piece of work, e.g. `REQ-014`. Bugs are `BUG-007`. |
| **Gate** | A stop where the assistant waits for your decision. |
| **Vault** | The `.adlc/` folder: specs, decisions, lessons. Plain markdown. |
| **Phase** | One step: spec → architect → implement → review → wrapup. |
| **Profile** | How many gates a REQ gets, based on risk. |

---

## 1. Set up (once)

**Install the toolkit (once per machine):**

```bash
git clone <repo-url> ~/code/adlc-toolkit
cd ~/code/adlc-toolkit
node scripts/adlc.mjs sync --tool=claude    # or cursor · copilot · codex · gemini · all
```

Leave the folder where it is — the commands read from it every time they run.

**Set up each project (once per repo):** open your assistant in the repo and run:

```
/init
```

It creates `.adlc/`, reads your existing docs, and asks a few questions. Answer them carefully — the answers go into `.adlc/config.yml`, and the better it knows your project, the less you correct later.

**Update the toolkit later:** run `/toolkit-update` from your assistant, or `node scripts/adlc.mjs sync --tool=all --pull`.

---

## 2. Pick the right command

This is the most important choice. Use this table:

| You want to… | Run | Gates you'll see |
|---|---|---|
| Make a small change (tweak, small feature, small refactor) | `/task <what>` | 2 — Plan, Ship |
| Fix a bug | `/bugfix <what's wrong>` | 2 — Diagnose, Ship (+ Verify if review finds something serious) |
| Build a normal feature | `/proceed <what>` | 3 — Plan, Build & Review, Ship |
| Build something risky (auth, data migration, public API, big change) | `/proceed <what>` | 4–5 — picked automatically |
| Run a feature with little involvement | `/autopilot <what>` | 1 final review (plus anything risky) |
| Run several unrelated features at once | `/sprint "feature A" "feature B"` | One shared gate queue |

**When unsure, start with `/task`.** It checks the size and risk first. If the work is bigger than it looks, it tells you and offers to hand it to `/proceed` — nothing is lost.

**Tips**
- `/bugfix #42` or `/spec #42` pulls the details from your issue tracker (if set up in config).
- `--profile=full` on `/proceed` forces every gate, when you want to watch closely.
- Risk always wins over size: a 3-line change to login code still gets the full set of gates.

---

## 3. Answering a gate

Every gate shows a short **gate card**:

```
GATE 1/3 · Plan · REQ-015-export-button
   small & clear — recommend approve

READY       requirement.md · 3 criteria · architecture.md · 4 tasks
CHECKS      ✓ criteria testable · ✓ no sensitive surface

MY READ     approve — scope is small and well defined
Decision →  approve (start building) · revise <what> · abort
```

How to read it:
- **READY** — what got done. Just for your information.
- **NEEDS YOU** — the things that actually need your decision. Read these first.
- **CHECKS** — `✓` passed, `⚠` needs attention, `?` open question.
- **MY READ** — what the assistant recommends and why.

Your answers:
- **approve** — continue to the next step.
- **revise `<what to change>`** — fix something and show me again. Be specific: "revise: also handle empty list".
- **abort** — stop this REQ.
- Some gates add options, like **escalate** (in `/task`) or **reframe** (in `/bugfix`).

**Low-effort rule:** if there's no `NEEDS YOU` section and all checks are `✓`, approve. Spend your attention only where the card points.

---

## 4. Picking up where you left off

Gates are saved to disk, so you can close the session and come back any time.

| Situation | Run |
|---|---|
| "What's in progress?" | `/status` |
| Continue a REQ | `/proceed REQ-014` |
| Continue with a summary of what happened | `/proceed REQ-014 --resume` |
| Redo the last 1–3 phases | `/proceed REQ-014 --revert~1` (or `~2`, `~3`) |
| Drop a REQ for good | `/proceed REQ-014 --cancel` |
| Records don't match git (crash, merged outside the toolkit, deleted branch) | `/recover` |

Start each session with `/status`. It takes seconds and shows every waiting gate.

---

## 5. Git — how much the assistant does

Set once with `/config git.mode=<mode>`:

| Mode | The assistant… | You… |
|---|---|---|
| `manual` (default) | Writes commit and PR drafts only | Commit, push, open the PR, merge |
| `commit` | Commits on the feature branch | Push, open the PR, merge |
| `commit+push` | Commits and pushes the feature branch | Open the PR, merge |

In every mode it never touches `main`/`master`/`release/*`, never force-pushes, never rewrites history, and never merges. **Merging is always yours.**

**Least effort:** once you trust the output, switch to `commit`. It saves you a manual step at every gate.

Merging is detected automatically — after you merge the PR, `/status` shows it as merged and the next pipeline command (e.g. `/proceed REQ-014`) closes the REQ.

---

## 6. Hands-off modes

**`/autopilot <what>`** — a decision-maker agent answers the gates for you and records why. You review once at the end. It still stops for risky things (auth, secrets, migrations, anything irreversible).

```
/autopilot "add CSV export to reports"
/autopilot REQ-014 --dry-run          # show what it would decide, change nothing
/autopilot REQ-014 --until=plan       # run up to a phase, then hand back to you
```

**`/sprint`** — runs up to 5 independent REQs in parallel, each in its own worktree. Don't use it for REQs that depend on each other.

How much they decide on their own is set in `.adlc/config.yml` → `autonomy`:
- `manual` — you answer every gate.
- `assisted` — you answer, with the agent's recommendation shown (the safe default).
- `auto` — the agent answers routine gates; you only see exceptions.

Start with `assisted`. Move to `auto` when its recommendations keep matching yours.

---

## 7. Health checks (no gates, read-only)

Run these now and then. They write a dated report to `.adlc/audits/`.

| Command | Checks |
|---|---|
| `/analyze` | Code health: complexity, dead code, risky areas |
| `/optimize` | Performance and cost: slow queries, expensive API calls, caching |
| `/ux-doctor` | UI/UX and design-system consistency (`/ux-doctor resume` continues a large one) |

Turn what they find into work with `/task` or `/proceed`.

---

## 8. Settings

Change settings with `/config` — no need to edit YAML by hand.

```
/config                       # show settings / pick one to change
/config git.mode=commit       # set one directly
```

Settings worth knowing:

| Setting | Why change it |
|---|---|
| `git.mode` | How much git the assistant runs (see section 5) |
| `req.id_scheme` | **Teams:** use `ticket` (IDs from your tracker) or `prefixed` (your initials) so two people never create the same REQ number |
| `layout.partition: month-author` | Keeps `specs/` browsable once you have many REQs |
| `autonomy` | How independent `/autopilot` and `/sprint` are (see section 6) |
| `stack` | Your languages and frameworks — helps every phase |

---

## 9. Getting the best results for the least effort

1. **Write a clear first sentence.** "Add a CSV export button to the reports page, same columns as the table" beats "export stuff". A clear request means fewer `revise` rounds.
2. **Let triage pick the size.** Use `/task` for anything that might be small. Don't force `/proceed` on a typo fix, and don't use plain chat for real work — then the vault learns nothing.
3. **Read only `NEEDS YOU`.** The cards are built so you can approve a clean one in seconds.
4. **Revise early, not late.** Fixing a spec takes a minute; fixing code takes much longer. Push back at the Plan gate.
5. **Always finish with the Ship gate.** That's where lessons and decisions get saved. Skipping it is how the toolkit forgets.
6. **Use `/bugfix` for bugs.** It writes a regression test and records the root cause, so the same bug doesn't come back.
7. **Give it more git once you trust it.** `git.mode: commit` removes a manual step at every gate.
8. **Start the day with `/status`.** And run `/recover` if it shows something you know is already done.
9. **Keep the vault committed.** `.adlc/` lives in git so your teammates (and their assistants) benefit from the same lessons.
10. **Use `/autopilot` for well-understood work.** Keep `/proceed` for work where your judgement matters.

---

## 10. Customizing for your team

Don't edit `core/` — it's overwritten on update. Put your changes in `local/` instead:

- A file in `local/` with the same name as one in `core/` **replaces** it.
- A new file **adds** a skill or agent.
- `"disabled": true` in `local/manifest.json` **removes** one.

Then run `node scripts/adlc.mjs sync --tool=all`. Details in [`local/README.md`](../local/README.md).

---

## Cheat sheet

```
/init                      set up a repo (once)
/status                    what's in progress — start here each session

/task <what>               small change           (2 gates)
/bugfix <what>             bug fix                (2–3 gates)
/proceed <what>            feature                (3–5 gates, picked by risk)
/autopilot <what>          feature, hands-off     (1 final review)
/sprint "A" "B"            several features in parallel

/proceed REQ-N --resume    continue with a catch-up summary
/proceed REQ-N --revert~1  redo the last phase
/proceed REQ-N --cancel    drop a REQ
/recover                   fix records that don't match git

/analyze · /optimize · /ux-doctor     health reports
/config                    change settings
/toolkit-update            update the toolkit
```

**More detail:** [Quickstart](quickstart.md) · [Gate cards](gate-cards.md) · [Install guides](install/README.md) · [What works on each tool](fidelity-matrix.md) · [Gate rules](../core/GATE-PROTOCOL.md)
