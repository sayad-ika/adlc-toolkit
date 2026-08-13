#!/usr/bin/env node
// ADLC statusline for Claude Code — shows pipeline state at the bottom of
// your terminal, always visible, zero tokens.
//
// Setup (see ../README.md): point settings.json -> statusLine.command here.
// Reads the statusline JSON Claude Code pipes on stdin to find the workspace,
// then reads .adlc/ pipeline state. Prints nothing when there is nothing to
// say, and never breaks the statusline on an error.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const DIM = '\x1b[2m', YEL = '\x1b[33m', RST = '\x1b[0m';
const PHASE = { 1: 'spec', 2: 'architect', 3: 'implement', 4: 'review', 5: 'wrap up' };

function findVault(start) {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, '.adlc'))) return join(dir, '.adlc');
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

// Work folders may sit flat (specs/REQ-042-x/) or bucketed by month and author
// (specs/2026-08/sf/REQ-042-x/), and one vault can hold both — see
// core/VAULT-LAYOUT.md. So walk down to the bucket depth instead of assuming
// REQ folders are direct children.
//
// The sentinel is the folder's own NAME, not a file inside it: pipeline-state.json
// is gitignored (invisible on a fresh clone) and bug folders have no
// requirement.md — they have bug.md. Matching on the name is the only test that
// holds in every vault.
const MAX_DEPTH = 4;
const isWorkFolder = (name) => /^(REQ|BUG)-/.test(name);

// Returns { found, strays } — strays are directories that are neither a work
// folder, nor _archive/, nor an ancestor of one. A vault with none of those and
// no work folders is simply idle; a vault with strays is one this walk failed to
// understand, which is the case worth surfacing.
function walk(root, depth, found, strays) {
  let entries;
  try { entries = readdirSync(root, { withFileTypes: true }); } catch { return false; }
  let ledSomewhere = false;
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const folder = join(root, e.name);
    if (isWorkFolder(e.name)) { found.push({ id: e.name, folder }); ledSomewhere = true; continue; }
    if (e.name === '_archive') { ledSomewhere = true; continue; } // done by definition
    if (depth >= MAX_DEPTH) { strays.push(folder); continue; }
    if (walk(folder, depth + 1, found, strays)) ledSomewhere = true;
    else strays.push(folder);
  }
  return ledSomewhere;
}

function scan(vault) {
  const out = [], found = [], strays = [];
  for (const kind of ['specs', 'bugs']) {
    const root = join(vault, kind);
    if (existsSync(root)) walk(root, 1, found, strays);
  }
  for (const { id, folder } of found) {
    let st = {};
    // No state file usually means a teammate's checkout, not an absent REQ:
    // pipeline-state.json is gitignored. Show it rather than dropping it.
    try { st = JSON.parse(readFileSync(join(folder, 'pipeline-state.json'), 'utf8')); } catch {}
    if (st.prState === 'merged' || st.aborted) continue;
    out.push({ id, phase: st.currentPhase, waiting: existsSync(join(folder, '.awaiting-approval')) });
  }
  return { reqs: out, strays };
}

try {
  let input = '';
  try { input = readFileSync(0, 'utf8'); } catch {}
  let payload = {};
  try { payload = JSON.parse(input); } catch {}
  const cwd =
    payload?.workspace?.current_dir || payload?.workspace?.cwd || payload?.cwd || process.cwd();
  const vault = findVault(cwd);
  if (!vault) process.exit(0);
  const { reqs, strays } = scan(vault);
  // A layout this walk can't read is worse than an empty statusline, because an
  // empty statusline looks exactly like "nothing in flight". Say something.
  if (reqs.length === 0 && strays.length > 0) {
    process.stdout.write(`${DIM}ADLC: layout? (${strays.length} unrecognized folder${strays.length > 1 ? 's' : ''})${RST}`);
    process.exit(0);
  }
  if (reqs.length === 0) process.exit(0);
  if (reqs.length === 1) {
    const r = reqs[0];
    const phase = PHASE[r.phase] ? `phase ${r.phase} (${PHASE[r.phase]})` : 'in progress';
    const gate = r.waiting ? ` · ${YEL}GATE WAITING${RST}` : '';
    process.stdout.write(`${DIM}ADLC${RST} ${r.id} · ${phase}${gate}`);
  } else {
    const waiting = reqs.filter((r) => r.waiting).length;
    const gates = waiting ? ` · ${YEL}${waiting} gate${waiting > 1 ? 's' : ''} waiting${RST}` : '';
    process.stdout.write(`${DIM}ADLC${RST} ${reqs.length} in flight${gates}`);
  }
} catch {
  // A broken statusline is worse than no statusline. Say nothing.
  process.exit(0);
}
