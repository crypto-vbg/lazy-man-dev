#!/usr/bin/env node
// lazy-man-dev — ledger rollup.
//
// foreman writes one Log entry per completed run to .foreman/memory.md. Each
// entry already carries the numbers that say whether the discipline is working
// — budget vs actual, whether the run reused anything, whether it was verified.
// One run tells you nothing; twenty tell you if your estimates are honest.
//
// This reads that Log and rolls it up. It writes nothing.
//
//   node metrics.js                     reads ./.foreman/memory.md
//   node metrics.js path/to/memory.md   reads a specific ledger

const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(process.cwd(), '.foreman', 'memory.md');

if (!fs.existsSync(file)) {
  console.log(`No ledger at ${file}.`);
  console.log('foreman writes one after each run; there is nothing to roll up yet.');
  process.exit(0);
}

const text = fs.readFileSync(file, 'utf8');

// The Log lives after a `## Log` heading; everything before it is Standing.
// Split on run headings: `## <date> — <title>`. The Standing block has no
// `route:` line, so entries without one are skipped rather than mis-parsed.
const blocks = text.split(/^## /m).slice(1);
const runs = [];
for (const b of blocks) {
  if (!/^\s*route:/m.test(b)) continue;               // Standing / non-run block
  const heading = b.split('\n')[0].trim();
  const get = (key) => (b.match(new RegExp(`^${key}:\\s*(.+)$`, 'm')) || [])[1] || '';

  const route = (get('route').match(/^(\w+)/) || [])[1] || '?';
  const budget = Number((get('route').match(/~\s*(\d+)\s*lines/) || [])[1]) || null;
  const actual = get('route').match(/\+(\d+)\s*\/\s*-(\d+)/);
  const added = actual ? Number(actual[1]) : null;
  const removed = actual ? Number(actual[2]) : null;
  const reused = get('reused').trim();
  const verified = /exit\s+0/.test(get('verified'));
  const defers = Number((get('defer').match(/(\d+)\s*marker/) || [])[1]) || 0;

  runs.push({ heading, route, budget, added, removed, reused, verified, defers });
}

if (!runs.length) {
  console.log(`Ledger at ${file} has no completed runs yet.`);
  process.exit(0);
}

// --- Aggregate --------------------------------------------------------------
const pct = (n, d) => d ? `${Math.round((100 * n) / d)}%` : '—';
const routes = {};
for (const r of runs) routes[r.route] = (routes[r.route] || 0) + 1;

const withBudget = runs.filter(r => r.budget != null && r.added != null);
const netOf = (r) => r.added - r.removed;
const totalBudget = withBudget.reduce((s, r) => s + r.budget, 0);
const totalActual = withBudget.reduce((s, r) => s + netOf(r), 0);

const reusedRuns = runs.filter(r => r.reused && !/^none$/i.test(r.reused)).length;
const verifiedRuns = runs.filter(r => r.verified).length;
const totalDefers = runs.reduce((s, r) => s + r.defers, 0);

console.log(`\nlazy-man-dev — ${runs.length} run${runs.length > 1 ? 's' : ''} in ${file}\n`);

console.log(`routes:     ${Object.entries(routes).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`verified:   ${verifiedRuns}/${runs.length} (${pct(verifiedRuns, runs.length)}) ended on exit 0`);
console.log(`reuse:      ${reusedRuns}/${runs.length} (${pct(reusedRuns, runs.length)}) reused existing code`);
console.log(`deferrals:  ${totalDefers} marker${totalDefers === 1 ? '' : 's'} logged across all runs`);

if (withBudget.length) {
  const ratio = totalBudget ? (totalActual / totalBudget) : 0;
  const verdict = ratio > 1.15 ? 'runs OVER — budgets are optimistic'
    : ratio < 0.85 ? 'runs UNDER — budgets are padded'
    : 'tracks budget well';
  console.log(`\nbudget vs actual (${withBudget.length} run${withBudget.length > 1 ? 's' : ''} with both figures):`);
  console.log(`  budgeted ~${totalBudget} net lines, actual ${totalActual} — ${Math.round(ratio * 100)}% of budget, ${verdict}.`);
}
console.log();
