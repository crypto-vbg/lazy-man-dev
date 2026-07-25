#!/usr/bin/env node
// lazy-man-dev — eval validator.
//
// Anthropic's eval format is a rubric, not a test harness: whether foreman
// *routes* a query correctly is a model judgement, scored by a human against
// `expected_behavior`. This runner does NOT try to fake that.
//
// What it does is give the rubric a machine-checkable floor — the failures a
// human should never have to catch by eye:
//   - the JSON is well-formed and every scenario is complete
//   - ids are unique (a duplicate silently shadows a scenario in any tooling)
//   - every skill a scenario names actually exists on disk (a typo'd skill
//     name means the scenario can never pass, for a reason no rubric reveals)
//   - which installed skills have NO scenario at all (an untested guardrail)
//
// Exit 1 on any structural failure, so CI can gate on it.

const fs = require('fs');
const path = require('path');

const SKILLS_ROOT = path.join(__dirname, '..', 'skills');
const SCENARIOS = path.join(__dirname, 'scenarios.json');

let fails = 0, warns = 0;
const line = (flag, msg, fix) => {
  const tag = { ok: '[ ok ]', warn: '[warn]', fail: '[FAIL]', info: '[info]' }[flag];
  console.log(`${tag} ${msg}`);
  if (fix && flag !== 'ok') console.log(`       → ${fix}`);
  if (flag === 'fail') fails++;
  if (flag === 'warn') warns++;
};

console.log('\nlazy-man-dev eval validator\n');

// --- 1. The file parses -----------------------------------------------------
let scenarios;
try {
  scenarios = JSON.parse(fs.readFileSync(SCENARIOS, 'utf8'));
} catch (e) {
  line('fail', `scenarios.json does not parse: ${e.message}`, `fix ${SCENARIOS} by hand`);
  process.exit(1);
}
if (!Array.isArray(scenarios)) {
  line('fail', 'scenarios.json is not a JSON array', 'the top level must be [ ... ]');
  process.exit(1);
}

// --- 2. Which skills exist on disk ------------------------------------------
const installed = fs.existsSync(SKILLS_ROOT)
  ? fs.readdirSync(SKILLS_ROOT, { withFileTypes: true })
      .filter(d => d.isDirectory() && fs.existsSync(path.join(SKILLS_ROOT, d.name, 'SKILL.md')))
      .map(d => d.name)
  : [];

// --- 3. Every scenario is complete and coherent -----------------------------
const seen = new Set();
const covered = new Set();
const nonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;

scenarios.forEach((s, i) => {
  const where = s && nonEmptyStr(s.id) ? s.id : `scenario #${i + 1}`;
  const problems = [];

  if (!s || typeof s !== 'object') { line('fail', `${where}: not an object`); return; }
  if (!nonEmptyStr(s.id)) problems.push('missing a string `id`');
  else if (seen.has(s.id)) problems.push(`duplicate id "${s.id}"`);
  else seen.add(s.id);

  if (!Array.isArray(s.skills) || s.skills.length === 0) {
    problems.push('`skills` must be a non-empty array');
  } else {
    for (const name of s.skills) {
      covered.add(name);
      if (!installed.includes(name)) {
        problems.push(`names skill "${name}", which is not installed`);
      }
    }
  }

  if (!nonEmptyStr(s.query)) problems.push('missing a non-empty `query`');
  if (!Array.isArray(s.expected_behavior) || s.expected_behavior.length === 0) {
    problems.push('`expected_behavior` must be a non-empty array');
  } else if (!s.expected_behavior.every(nonEmptyStr)) {
    problems.push('`expected_behavior` has a blank entry');
  }
  if (!nonEmptyStr(s.fails_if)) problems.push('missing a `fails_if` — every scenario needs its one failing behaviour');

  if (problems.length) line('fail', `${where}: ${problems.join('; ')}`, `fix it in evals/scenarios.json`);
  else line('ok', where);
});

// --- 4. Skills with no scenario at all --------------------------------------
// Not a failure — but an installed skill no scenario exercises is a guardrail
// nobody is watching. Surfacing it is the whole point of a coverage check.
const uncovered = installed.filter(name => !covered.has(name));
if (uncovered.length) {
  line('warn', `no scenario covers: ${uncovered.join(', ')}`,
       'add at least one scenario per skill, or delete the skill if it is unused');
}

// --- Verdict ----------------------------------------------------------------
console.log(`\n${scenarios.length} scenarios, ${covered.size}/${installed.length} skills covered.`);
if (fails) {
  console.log(`INVALID — ${fails} structural failure${fails > 1 ? 's' : ''}, ${warns} warning${warns === 1 ? '' : 's'}.`);
  console.log('Behaviour is still scored by hand (see evals/README.md); this only gates structure.\n');
  process.exit(1);
}
console.log(warns
  ? `VALID, with ${warns} warning${warns > 1 ? 's' : ''}. Structure is sound; behaviour is scored by hand.\n`
  : 'VALID — structure sound. Behaviour is still scored by hand (see evals/README.md).\n');
