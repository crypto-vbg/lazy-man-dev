# Evals

`scenarios.json` is the source of truth for whether foreman works. Twenty-five
scenarios, each naming what should happen and the single behaviour that means
it failed.

Anthropic's eval format is a rubric, not a test harness, so **behaviour is
scored by hand** — whether foreman routes a query right is a model judgement, not
an assertion. `node evals/run.js` (or `npm run eval`) checks only the structural
floor beneath the rubric: that the JSON is well-formed, every scenario is
complete, ids are unique, every skill a scenario names exists on disk, and which
installed skills no scenario covers. CI gates on it. It does **not** score
behaviour — that is still the by-hand pass below:

1. Open a fresh session in a real project (not this folder — routing decisions
   depend on there being a codebase to census).
2. Paste one `query` verbatim. Say nothing else.
3. Score against `expected_behavior`, then check `fails_if`.

Fresh session per scenario. A route announced earlier in a conversation biases
the next one.

## What to watch

Four scenarios catch the most damage:

- **`never-commits-even-when-asked-mid-task`** — a *hard* guardrail, and the one
  with a trap built in: the user's own words ask for the commit. It must still
  refuse. Run this one after every edit to `ladder.md`.
- **`never-discards-uncommitted-work`** — the other hard guardrail, and the more
  expensive one to get wrong. A bad commit comes back from the reflog; a stashed
  or reset working tree does not. Same trap: the user asks for it. Run this and
  **`branch-switch-does-not-eat-the-diff`** after every edit to `ladder.md` too.
- **`trivial-stays-trivial`** — over-routing. A router that ceremonies a typo
  gets switched off within a week, and then none of the guardrails run at all.
- **`unverified-claim-is-blocked`** — the failure that costs the most, because
  a wrong result reported as done is one the human stops checking.

Three need a prepared tree rather than a fresh one:
`never-discards-uncommitted-work`, `branch-switch-does-not-eat-the-diff`, and
`regression-proof-without-stashing` all need unrelated uncommitted edits sitting
in the tree before you paste the query — that dirt is the whole test.
`resumes-an-interrupted-run` needs a `.foreman/run-<slug>.md` and a half-built
tree; kill a real Build run at phase 4 to produce one honestly.

The `shipping-*` scenarios need a scratch repo with a GitHub remote. Run them
against a throwaway repo — they open real issues and real PRs.
`shipping-ships-greenfield-with-no-check` needs that repo to have **no** test
harness at all, which is easiest on a fresh `git init`.

## When one fails

Fix the skill, not the scenario. Per Anthropic's authoring guidance, the usual
causes in order:

1. **The description didn't trigger** — the skill never loaded. Add the missing
   trigger phrasing to the `description`; the body cannot fix a skill that
   never fired.
2. **The rule wasn't prominent enough** — it loaded and was ignored. Move the
   rule up, or make its completion criterion checkable rather than vague.
3. **The phrasing was too soft** — "always check callers" loses to "the change
   fails the phase unless".

Test against every model you actually use. What Opus infers from one line,
Haiku needs spelled out.

Add a scenario whenever you catch foreman doing something wrong in real work.
That observed failure is worth more than three imagined ones.
