# Memory

## Contents

- Location and creation
- Standing — durable answers, asked once
- Log — what happened
- Reading rules
- Writing rules
- When memory and reality disagree

## Location and creation

`.foreman/memory.md`, at the repo root. Create it on first write, alongside a
`.foreman/.gitignore` containing a single `*` — that ignores the directory
without editing the project's own `.gitignore`.

Memory is working state, not a deliverable. It is never committed.

The same directory also holds three other kinds of working state, all covered by
the same `*` gitignore, and none of them is memory:

- `spec-<slug>.md` — what a Foggy run settled (see [`routes.md`](routes.md)).
  The Build route reads it on re-entry.
- `tickets/<n>-<slug>.md` — the spec sliced into one-run pieces, written by
  `ticketing`. Each carries its own `State:` line, and that line is the only
  record of progress: `open`, `building`, `done`. A `done` ticket outlives the run
  that built it, so unlike a run file it is not deleted.
- `run-<slug>.md` — the live run: phase 3's budget block plus phase 1's baseline,
  which is both the `git status --porcelain` file list **and** the
  `git diff --numstat` line counts. Phase 5 subtracts the numbers, so a baseline
  recorded as names alone cannot attribute a file that was already dirty before
  you edited it. Only the routes that write code create one (Build, Broken); it
  exists while that run is in flight and phase 6 deletes it. A run that stopped
  early keeps its file, with the blocker written into it.

None of them is a deliverable, and none is committed.

## The baseline, and how phase 5 measures against it

Phase 1 records the starting point; phase 5 subtracts it. Both halves live here
because both are about the run file, and half a baseline measures nothing.

**Phase 1 records two things**, on every route including Trivial — a promotion
to Build is only measurable if the baseline predates the first edit:

```
git status --porcelain     # which files were already dirty, tracked or not
git diff --numstat         # how many lines of that dirt sit in tracked files
```

Names alone are not enough. The common case is a file that was **already dirty
and that you then edit**, and nothing but the `--numstat` figures can separate
your lines from the ones that were there when you arrived.

**Phase 5 runs `git diff --numstat` again and subtracts, file by file:**

| At baseline | At phase 5 | Yours? |
|---|---|---|
| Dirty, tracked | Edited by you | This run's numbers **minus** the baseline's |
| Untracked | Anything | **None of it**, whatever it now holds |
| Absent | Present | **All of it** |

Compare the **added** lines against the budget, which phase 3 declared in added
lines: deletions are reported beside that figure and never netted into it. A
refactor that deletes 200 and adds 180 has spent 180, not −20.

**Authored lines only.** Anything phase 3 set aside on its `Generated:` line —
lockfiles, generated clients, migration scaffolds, snapshot updates, formatter
churn — is reported as a second figure beside the authored one, never folded in.
Folding makes the number meaningless in both directions: a dependency bump blows
a budget it never spent, and 4,000 machine-written lines are a good place to
hide 200 hand-written ones. Set aside is not exempt from *review* — the line
that regenerated it was yours.

Where the baseline is gone — a context that reset with no run file — the figure
is **unverifiable**. Say that rather than quoting a number you cannot attribute.

## Standing — durable answers, asked once

Answers that hold across runs. **Anything here is never asked again.** Repeated
questions are the main reason people stop using a workflow.

```markdown
## Standing

repo:      <owner/name>
base:      <the branch PRs target — main, develop, …>
branching: <convention, e.g. <issue>-<slug>>
commits:   <convention, e.g. conventional commits>
tracker:   <GitHub issues, Jira, local files, …>
checks:    <the command that proves the work — pytest -q, npm test, …>
reviewers: <who gets requested, or none>
```

Write a field the moment its answer is settled — from the user, or from the
repo itself. Most of these can be *read* rather than asked: `git remote -v`
gives `repo`, the default branch gives `base`, `git log --oneline -20` gives
`commits`, the CI workflow gives `checks`. **Look first, ask only what the
repo cannot tell you.**

Leave a field absent rather than guessing. An absent field gets asked once; a
wrong field gets acted on silently.

## Log — what happened

Newest last, one entry per completed run:

```markdown
## 2026-07-25 — CSV export endpoint
route:    Build | budget: 2 files ~40 lines added | actual: +37/-4
ticket:   2 — Export endpoint (3 of 4 done)
verified: pytest -q tests/test_export.py → exit 0
reused:   src/lib/csv.ts:writeRows
shipped:  issue #42, branch 42-csv-export, PR #43 → main
defer:    1 marker (streaming for >10k rows)
```

Absolute dates only — "yesterday" is meaningless on the next read.

Keep the last 20 entries. Older ones summarise to a single line or go.

## Reading rules

Read memory at the **start** of any run: foreman phase 1, and shipping
preflight. It is a small file; read it whole.

What it changes:

- A `Standing` field answers a question — so do not ask it.
- The `Log` says a run already shipped — so do not re-create its issue or PR.
- The `Log` names a `defer:` marker in the area you are about to touch — so
  raise it before you rebuild around it.

Memory records what was true when written. If it names a file, branch, or
issue, confirm that still exists before acting on it.

## Writing rules

Write at two moments only, so the file stays a ledger rather than a diary:

1. **A `Standing` answer is settled** — write that field immediately.
2. **A run completes** — append one `Log` entry.

Never log intentions, plans, or in-progress notes. An entry describes
something that finished. A run that stopped early is not one: it keeps its run
file and gets no entry, so the next session reads it as live work rather than
as history.

That rule is about **this file**, and it is why in-flight state lives in
`run-<slug>.md` instead. A budget nobody has met yet does not belong in a ledger
of what happened; it does belong somewhere a reset context can find it. Two
files, two lifetimes — the run file is deleted when its `Log` entry is written.

## When memory and reality disagree

Three ways this shows up, one response.

- **Memory vs the repo** — `base: develop` but `develop` no longer exists.
- **Memory vs the user** — memory says PRs target `main`, the user says staging.
- **Memory vs itself** — the log says PR #43 shipped this work, and the working
  tree still has it uncommitted.

**Reality outranks memory, and the user outranks both** — but never silently.
Stop and grill:

1. State the conflict in one line: what memory holds, what you observe.
2. Ask by [`asking.md`](asking.md) — one question, your recommendation
   attached, then wait.
3. Write the answer to `Standing` before continuing, so it is asked once and
   never again.

A conflict is usually a single load-bearing question. If you find yourself with
three, sort them first: most will follow from the one you have not asked yet.

The grill is for a genuine contradiction. A field that is simply absent is not
a conflict — ask it plainly, once, and record it.
