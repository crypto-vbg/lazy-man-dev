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

The same directory also holds two other kinds of working state, both covered by
the same `*` gitignore, and neither of them is memory:

- `spec-<slug>.md` — what a Foggy run settled (see [`routes.md`](routes.md)).
  The Build route reads it on re-entry.
- `run-<slug>.md` — the live run: phase 3's budget block plus phase 1's
  `git status --porcelain` baseline. It exists only while a run is in flight and
  phase 6 deletes it.

Neither is a deliverable, and neither is committed.

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
route:    Build | budget: 2 files ~40 lines | actual: +37/-4
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
something that finished.

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
