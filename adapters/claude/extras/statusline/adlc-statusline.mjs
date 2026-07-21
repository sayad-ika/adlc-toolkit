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

function scan(vault) {
  const out = [];
  for (const kind of ['specs', 'bugs']) {
    const root = join(vault, kind);
    if (!existsSync(root)) continue;
    for (const e of readdirSync(root, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const folder = join(root, e.name);
      const stateFile = join(folder, 'pipeline-state.json');
      if (!existsSync(stateFile)) continue;
      let st = {};
      try { st = JSON.parse(readFileSync(stateFile, 'utf8')); } catch { continue; }
      if (st.prState === 'merged' || st.aborted) continue;
      out.push({
        id: e.name,
        phase: st.currentPhase,
        waiting: existsSync(join(folder, '.awaiting-approval')),
      });
    }
  }
  return out;
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
  const reqs = scan(vault);
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
