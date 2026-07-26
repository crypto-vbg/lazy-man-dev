# lazy-man-dev

**One skill you call. It works out the rest.**

A lazy developer is an efficient one: they reuse what exists, write the least
code that holds, and never do by hand what a check can do for them. This is
that discipline as an agent workflow — you describe the job, `foreman` routes
it, dispatches the sub-agents, and refuses to hand back more code than the job
needed.

```powershell
git clone https://github.com/crypto-vbg/lazy-man-dev.git
node lazy-man-dev/install.js
```

That links six skills, wires the sub-agent hook, and runs the doctor. If it
says `READY — full capacity`, you are done.

**That is the entire install.** There is no second pack to fetch. The skills
named in `routes.md` — `grilling`, `implement`, `ponytail`, and the rest — are
*optional* enrichments that a few users already have; foreman spots them at
runtime and hands a phase over. Install none of them and every route still runs
end to end.

## Why it exists

Two excellent packs solve orthogonal halves of the problem, and neither is much
use if you cannot remember which to reach for.
[`mattpocock/skills`](https://github.com/mattpocock/skills) answers *what
process do I run*; [ponytail](https://github.com/kaiviti/ponytail) answers *how
much code do I write*. The cost of both is the same: **you** have to know which
skill fits the moment, and typing the wrong one is worse than typing nothing.

lazy-man-dev collapses that decision into one model-invoked entry point. It is
self-contained — neither pack needs to be installed — but it detects and
delegates to them when they are.

## What it adds

| Gap in the source packs | What foreman does |
|---|---|
| `ask-matt` is a map you read, not a driver — it names the flow, you still pick it | `foreman` is model-invoked: it routes and dispatches on its own |
| Ponytail's "reuse what's already here" is a reflex with no completion criterion, so it is the rung most often skipped | Phase 2 promotes it to a gated sub-agent that must return `file:symbol` evidence or an explicit "nothing exists" |
| Bloat is scored only *after* the code exists (`net: -N lines possible`) | Phase 3 declares a file and line budget *before* the first line, and phase 5 measures against it |
| Neither pack gates a completion *claim* — "should work" passes | Phase 5 runs `verifying-work` first: a named command, run fresh, with its exit code |
| Sub-agents inherit no constraints — `SessionStart` context never reaches them | `hooks/foreman-subagent.js` injects the ladder into every spawn |

## Layout

```
lazy-man-dev/
├── install.js                     one command: link, wire, verify
├── doctor.js                      is it ready? every failure names its fix
├── skills/
│   ├── foreman/
│   │   ├── SKILL.md               the orchestrator: 6 phases
│   │   └── references/
│   │       ├── routes.md          6 routes → which phases run
│   │       ├── ladder.md          the constraint (also what the hook injects)
│   │       ├── memory.md          .foreman/memory.md format + conflict rules
│   │       └── asking.md          which questions to ask, and how few
│   ├── reuse-census/SKILL.md      looks INWARD: what this repo already has
│   ├── researching/SKILL.md       looks OUTWARD: primary sources, version-pinned
│   ├── lean-review/SKILL.md       parallel Correct ∥ Lean review
│   ├── verifying-work/SKILL.md    evidence gate on any completion claim
│   └── shipping/SKILL.md          issue → branch → commit → PR. YOU type this
├── evals/
│   ├── scenarios.json             25 scenarios: routing + guardrails
│   └── README.md                  how to run and score them
└── hooks/
    ├── foreman-subagent.js        injects the ladder into every sub-agent
    └── settings-snippet.json      manual wiring, if you skip the installer
```

Five skills are model-invoked, so `foreman` reaches them and you can also call
them by hand. **`shipping` is not** — it sets `disable-model-invocation: true`,
which is what makes the git guardrail structural rather than a promise. No
skill can reach it. Only you can.

## The git guardrail

**Nothing in this pack writes to git history.** No commit, no push, no merge,
no `gh pr create` — not at the end of a clean run, not when the user asks for
it mid-task, not when a commit would tidy up the next step. Work stops at the
working tree and is reported there.

The rule lives in `references/ladder.md` on purpose: that file is what the
`SubagentStart` hook injects, so **every sub-agent inherits the prohibition**
too. An agent told "finish the feature and commit it" finishes it and reports.

`shipping` is the single exception, and it is bounded three ways: you type it,
no skill can call it, and it refuses to run on work whose checks have not
passed in this session. It also never uses `--force`, `--no-verify`, or
`--amend` on pushed commits, and never commits onto the base branch.

### The other half: your working tree

History is the recoverable half — an unwanted commit is one `reflog` away. The
sharper rule covers the work that has no history yet, because **uncommitted work
a command discarded is simply gone.** So `git reset --hard`, `checkout --`,
`checkout -B`, `restore`, `stash`, `clean`, `revert`, `rebase`, and `branch -D`
never run on the agent's own initiative.

What decides it is whose work is at risk. It runs `git status --porcelain` first:
anything in the tree that this run did not write makes the whole class
off-limits — it names the command it wants and stops. Its own edits it may
reverse, saying which and why. Proving a test goes red therefore comments the fix
out rather than stashing over your work.

Branch switches count, and this is the one that bites: `git checkout -B` resets
the tree to its start point and discards local modifications **even when the two
trees are identical**. Uncommitted work gets committed on the branch it was
written on, before anything switches.

Additive git discards nothing and is always fine: `init`, `add`, `checkout -b`,
`worktree add`.

## Memory

`.foreman/memory.md` in your repo, gitignored by a `*` file inside `.foreman/`
so the project's own `.gitignore` stays untouched. Two sections:

- **`Standing`** — durable answers: base branch, branch naming, commit
  convention, the checks command. **Asked once, then never again.** Most are
  read from the repo rather than asked at all.
- **`Log`** — one entry per completed run: route, budget vs actual, the proof
  command and exit code, what shipped, what was deferred.

`foreman` reads it at phase 1 and appends at phase 6; `shipping` reads it at
preflight and records the PR.

Memory is a ledger of what *finished*, so a run still in flight lives next to it
in `.foreman/run-<slug>.md` — phase 3's budget block plus the `git status` the run
started from. That file is what makes a run survive a context reset: reopen the
work and phase 1 finds the budget, the declared check, and which files were
already dirty before it began. Phase 6 deletes it when the `Log` entry lands, so a
run file lying around *is* the signal that something was interrupted.

**On conflict, it grills.** Memory says `main`, you say staging → it states the
contradiction in one line, asks **one** question with a recommended answer,
waits, then writes the answer to `Standing`. Reality outranks memory and you
outrank both — but never silently. Facts it looks up itself; only decisions
reach you.

## Asking

Being interrogated is as bad as being guessed at. Decisions are not peers —
roughly a fifth of them are **load-bearing**, and answering one settles the
rest by implication. Finding that fifth is the whole job.

So before anything is asked aloud, every open decision is sorted into one of
four buckets:

| Bucket | Meaning | Action |
|---|---|---|
| **Derive** | the repo, lockfile, convention, `Standing`, or the research answers it | never ask |
| **Follow** | determined by another decision on the list | resolves with its parent |
| **Default** | a sane default exists and reversing it is cheap | take it, say so in one line |
| **Ask** | genuinely yours, and expensive to get wrong | ask — highest fan-out first |

Only the last bucket is spoken. **Budget: three questions.** Needing more means
the load-bearing one has not been found yet.

Each answer is then *propagated*, and the collapse is shown, so you can see
what the question bought:

> Postgres it is. That settles the migration tool (Prisma, already a
> dependency), the hosting (Supabase, from `Standing`), and the ID type (uuid).
> One question left.

Two rules keep it honest in both directions: never default something
irreversible to save a question, and never ask something the lockfile already
answered. Full discipline in `skills/foreman/references/asking.md`.

## Install

```bash
git clone https://github.com/crypto-vbg/lazy-man-dev.git
node lazy-man-dev/install.js
```

Node 14+ is the only prerequisite. The installer links the six skills into
`~/.claude/skills/`, wires the `SubagentStart` hook into `~/.claude/settings.json`
(backing it up first, and preserving every key already there), then runs the
doctor and prints a verdict.

**Clone it once, and not inside a project.** The default install is global —
the skills then work in every project on the machine, so there is no reason to
clone it again per repo. Somewhere like `~/tools/lazy-man-dev` is ideal. A
clone that lives inside another repo shows up in that repo's `git status`, and
the hook path in `settings.json` breaks the day you delete it.

**Then start a new Claude Code session** — hooks load at session start.

Links, not copies, so editing a skill in the clone takes effect immediately. On
Windows it uses a **junction**, which needs no Administrator and no Developer
Mode; if the OS still refuses, it falls back to a copy and says so.

### Flags

| Flag | Effect |
|---|---|
| `--project` | Install into `./.claude/skills` instead of the home directory |
| `--copy` | Copy instead of link — re-run after editing a skill |
| `--no-hook` | Leave `settings.json` alone. Sub-agents stop inheriting the ladder |
| `--dry-run` | Print the plan, change nothing |
| `--uninstall` | Remove the skills and unwire the hook |

### Checking it works

```bash
node doctor.js          # add --project if you installed there
```

Three verdicts, exit 1 on any failure:

```
READY — full capacity.
READY, degraded — 1 warning. Core skills work; the flagged parts do not.
NOT READY — 2 blocking issues.
```

Every non-ok line prints the command that fixes it. What it actually verifies:

- Each of the six skills is present, parses, and its frontmatter `name`
  matches its directory — a mismatch silently breaks discovery.
- **`shipping` still declares `disable-model-invocation: true`.** This is the
  git guardrail checked *structurally* rather than trusted. If it ever reads
  `[FAIL] shipping is model-invocable — the git guardrail is OPEN`, an agent
  can ship on its own; treat it as blocking.
- The hook is wired, the path in `settings.json` still resolves, the hook
  **executes**, and its payload still contains the git prohibition. A hook that
  runs but emits the wrong thing is the silent failure worth catching.
- `foreman`'s three reference files exist — without them it runs degraded.
- `git`, and `gh` authenticated. Missing `gh` warns rather than fails: it only
  blocks `/shipping`.

## Use

Say what you want built. `foreman` fires on its own for anything past a
single obvious edit, and announces its route:

```
Route: Build — new endpoint, fits one session.
```

Invoke a piece directly when that is all you want:

- `/reuse-census` — "does this repo already do X?"
- `/researching` — "what even *is* X, and which version applies here?"
- `/lean-review` — review a diff, or audit the tree for bloat
- `/verifying-work` — "did that actually work?" on any claim, yours or an agent's
- `/shipping` — the finished work becomes an issue, a branch, a commit, and a
  PR. **The only way git history ever changes.**

### The six phases

1. **Route** — read memory, pick one of six routes, post its checklist.
2. **Recon** — census sub-agent finds what already exists; you trace the callers.
3. **Budget** — post files, net lines, ladder rung, and the check, before
   coding; persist them so a reset context can still measure against them.
4. **Build** — fan out on reads, stay single on writes.
5. **Gate** — verify with a real command, then `Correct` ∥ `Lean` sub-agents;
   measure the diff against the budget.
6. **Ledger** — harvest `defer:` markers, append the run to memory.

Then it stops, with the change uncommitted in the working tree. Phase 7 is
yours: `/shipping`.

**The route decides which phases run**, and each phase says which routes it
binds. A router that ceremonies every request is the bloat this pack exists to
prevent:

| Route | Phases | Notes |
|---|---|---|
| Trivial | 4 | A typo gets no census, no budget, no two-agent review. |
| Build | 1–6 | The full run. |
| Broken | 1–6 | Red loop first; phase 5 adds the regression protocol. |
| Foggy | 1–3, then 6 | Phase 3 posts a **spec** block, not a budget. Writes a spec file, no run file. Phase 6 is one `Log` entry. |
| Judge | 5 | Review half only — nothing was built, so no verify gate and no budget to measure. |
| Learn | 2 | Delivers a trace, not census verdicts. |

A run that **cannot** finish has its own exit: stop building, leave the tree
alone, write the blocker into the run file, and say what you need. No `Log`
entry — memory records runs that finished.

### Check it still behaves

`evals/scenarios.json` holds thirty scenarios: one per route, plus the
failure modes that matter most — committing when it must not, *discarding
uncommitted work* when it must not, over-routing a trivial change, and letting an
unverified claim through. Run them by hand after any edit to a skill; see
`evals/README.md`.

## Walkthrough

### Building something

You type a normal request. No slash command:

> Add an endpoint that exports a user's orders as CSV.

**Phase 1 — it names the route and posts a checklist.** You always know which
path it took and why:

```
Route: Build — new endpoint, fits one session.
- [ ] 2 Recon    — census returns file:symbol evidence
- [ ] 3 Budget   — files, lines, rung, check declared
- [ ] 4 Build    — change works, project checks green
- [ ] 5 Gate     — verified, reviewed, measured against budget
- [ ] 6 Ledger   — defer: markers harvested
```

**Phase 2 — a sub-agent inventories what already exists**, before a line is
written. This is the phase that stops the duplicate:

```
reuse — src/lib/csv.ts:writeRows covers CSV encoding, as-is.
reuse — src/db/orders.ts:listByUser covers the query, as-is.
none  — the route handler itself. Build it.
house style: routes return Result<T>, never throw. src/api/invoices.ts is the model.
```

**Phase 3 — the budget, posted before any code.** This is the commitment
phase 5 measures against:

```
Route:   Build
Reuse:   src/lib/csv.ts:writeRows, src/db/orders.ts:listByUser
Build:   the route handler
Rung:    2 (reuse) — nothing above it applies; both halves already exist
Budget:  2 files, ~40 net lines
Check:   pytest -q tests/test_export.py
Skipped: streaming for large exports, add when a user exceeds ~10k orders
Excess:  none
```

**Phase 4 builds it. Phase 5 gates it** — first a real command, then two
review sub-agents in parallel:

```
claim:    the CSV export endpoint works
command:  pytest -q tests/test_export.py
exit:     0
evidence: 3 passed in 0.41s

## Correct
No findings.

## Lean
L18: shrink: manual header row build. writeRows takes a `header` arg. -4 lines.
net: -4 lines possible.
```

It applies that finding, then signs off with numbers rather than a tour:

```
2 files, +37/-4 lines (budget: ~40). Reused: src/lib/csv.ts:writeRows.
verified: pytest -q tests/test_export.py → exit 0.
skipped: streaming, add when a user exceeds ~10k orders.

Uncommitted, in the working tree. Next step is yours: /shipping
```

**It stops there.** Nothing is committed. That last line is the handoff.

### When you know the goal but not the concept

The hardest case: you can describe the outcome, but not the thing that gets you
there.

> I want people to log into my site with their Google account. I don't really
> know how any of that works.

An interview here would be useless — "which OAuth flow do you want?" is not
answerable by someone who has never met OAuth. So Recon turns **outward**
first:

```
Route: Foggy — unfamiliar, not undecided. Researching before interviewing.
```

```
goal:     let users sign in with an existing Google account
version:  next-auth@4.24.5 (from package-lock.json — NOT v5, the docs differ)

concept:  Google confirms who someone is, and hands your site a signed token
          saying so. You never see their password. Your site's only job is to
          check that token and remember the result.

options:
  1. next-auth Google provider — the library already in this project.
     fits because it is installed and handles the token exchange; costs one
     config block and two environment variables.
  2. Google Identity Services directly — no library.
     fits if you want zero dependencies; costs writing the token verification
     yourself, which is security-critical code.
  3. A hosted provider (Auth0, Clerk) — replaces next-auth.
     fits if you will add more providers later; costs a paid tier and a migration.

recommend: option 1.
because:   next-auth@4.24.5 is already a dependency here and already wired for
           sessions in src/app/api/auth/[...nextauth]/route.ts.

unknowns: whether you have a Google Cloud project — that is yours to create,
          and no source can answer it.
sources:  node_modules/next-auth/providers/google.d.ts;
          https://next-auth.js.org/v4/providers/google
```

Only **then** does it interview you — and each question is now phrased as a
consequence you can actually judge:

```
Should someone stay signed in after closing the browser, or sign in again
each visit?
Recommend: stay signed in (30 days) — it is the norm for portfolio sites and
is one setting either way.
```

Two things worth noticing. It read `package-lock.json` **before** the docs, so
it is describing v4 rather than the v5 that a search would surface. And the
unknown is listed as an unknown — no invented config key, no remembered API.

### Shipping it

Now you type the command. This is the only way git history ever changes:

```
/shipping
```

**Preflight** reads `.foreman/memory.md` and checks the change set, that the
checks passed in this session, and that no secrets are in the diff. Then it
posts **one** block and waits for **one** yes:

```
issue:   Export user orders as CSV
         Users need their order history in a spreadsheet. Adds
         GET /users/:id/orders.csv, reusing the existing CSV writer.
base:    main                       [from Standing]
branch:  42-csv-export
commit:  feat(api): export user orders as CSV
files:   2 files, +37/-4
pr:      Export user orders as CSV — Closes #42

Ship this? (y/n)
```

Say yes, and it runs the sequence unattended — no further questions:

```
✓ issue #42 created
✓ branch 42-csv-export
✓ committed feat(api): export user orders as CSV
✓ pushed
✓ PR #43 → main

https://github.com/you/repo/pull/43
Review and merge when ready — shipping does not merge.
```

Note `base: main [from Standing]`. It did not ask, because a previous run
already settled it. That is the memory doing its job.

**The second `/shipping` is different.** Review comes back, you fix it, and you
type it again — preflight finds the PR already open on this branch and switches
to update mode. One short block, then `add`, `commit`, `push`, and the PR picks
it up:

```
pr:      #43 Export user orders as CSV — https://github.com/you/repo/pull/43
commit:  fix(api): quote fields containing delimiters
files:   1 file, +6/-2
verified: pytest -q → exit 0
```

No second issue, no second PR, and no `--force` or `--amend` — the last commit
may be yours, but a reviewer may already have read it. A rejected push means
someone else pushed to the branch; that is reported, not forced through.

### When memory disagrees with you

Ask for something that contradicts what memory holds, and it stops instead of
guessing:

```
/shipping — put this PR up against staging
```

```
Memory has base: main; you asked for staging. `git branch -r` shows
origin/staging exists and is 12 commits behind main.

Is staging the new default for PRs, or a one-off for this change?
Recommend: one-off — main is still where releases cut from.
```

One question, with a recommendation, then it waits. Answer "one-off" and
`Standing.base` stays `main`. Answer "new default" and it rewrites the field so
you are never asked again. Facts it looks up itself — whether `staging` exists
is not your problem to answer.

### When it should not ceremony

```
Fix the typo in the login button — 'Sgin in' should be 'Sign in'.
```

```
Route: Trivial — one string, file named.
Fixed src/components/Login.tsx:24.
```

No census, no budget, no review. A router that ceremonies a typo gets switched
off in a week, and then none of the guardrails run at all.

## Tuning

- **Change the constraint** — edit `skills/foreman/references/ladder.md`. It is
  the single source of truth: the skill reads it and the hook injects it, so
  one edit changes both you and every sub-agent.
- **Add a route** — a row in `references/routes.md` plus its phase set. Routes
  are cheap; skills are not.
- **Scope the hook** — it currently injects into *every* sub-agent, including
  non-coding ones. If that proves noisy, read `agent_type` from the hook's
  stdin and skip on a mismatch. Ponytail's `ponytail-subagent.js` is a worked
  example, including why it must fail open when stdin never closes on Windows.

## Where the ideas came from

Borrowed deliberately, each for one thing:

- [mattpocock/skills](https://github.com/mattpocock/skills) — the phase
  pipeline, the two-axis review, the Fowler smell baseline.
- [ponytail](https://github.com/kaiviti/ponytail) — the ladder, the review
  tags, the `defer:` marker convention, the `SubagentStart` injection trick.
- [obra/superpowers](https://github.com/obra/superpowers) — verification before
  completion, and git worktrees as the thing that makes parallel writes safe
  rather than merely promised.
- [Anthropic skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
  — third-person descriptions, the 500-line SKILL.md ceiling, references one
  level deep, the copyable checklist, and eval-driven iteration.
- [Verification loops in Claude Code](https://claude.com/blog/building-verification-loops-in-claude-code-with-skills)
  — gather → act → **verify** as a loop, not a final step.
- [spec-kit](https://github.com/github/spec-kit) — phase gates with a
  documented-exception slot, which is what `Excess:` is; and the finding that
  chained phases without intermediate checks compound down to roughly a third
  of their starting quality.
- [x-skills](https://github.com/quangtran88/x-skills) — routers that classify
  intent and degrade gracefully to whatever executor is actually installed.

Deliberately **not** taken: multi-model dispatch to Codex/Gemini, persistent
cross-session knowledge stores, and the 100+ skill marketplaces. Each is real,
none is on the path to "one skill that knows what to call".

## Troubleshooting

Run `node doctor.js` first — it names the fix for anything it finds. Beyond
that:

| Symptom | Cause | Fix |
|---|---|---|
| `ReferenceError: require is not defined in ES module scope` | You are on a version before 1.0.1, cloned inside a project whose `package.json` has `"type": "module"` — Node walks up and finds that one | `git pull`. The repo now ships its own `package.json` pinning it to CommonJS. Better still, clone it outside the project |
| Skills do not appear at all | Hooks and skills load at session start | Start a new session |
| `foreman` never fires on its own | Another skill's description is winning, or the request looked trivial | Type `/foreman` and check `evals/scenarios.json` still passes |
| Sub-agents ignore the ladder | Hook not wired, or `node` not on `PATH` when Claude Code launched | `node doctor.js`, then re-run `node install.js` |
| `/shipping` cannot open a PR | `gh` missing or unauthenticated | `winget install GitHub.cli` then `gh auth login` |
| Edits to a skill do nothing | You installed with `--copy` | Re-run `node install.js` (drop `--copy` to link instead) |
| `settings.json` looks wrong | The installer backs up before writing | Restore `~/.claude/settings.json.bak` |

Two known limits, neither fixed:

- **Node is required** for the hook. Without it the skills still work, but the
  ladder stops reaching sub-agents and `foreman` must paste it into prompts.
- **The `defer:` marker** is this pack's own. Running ponytail too means two
  ledgers; grep both, or standardise on one marker in `ladder.md`.

## License

MIT.
