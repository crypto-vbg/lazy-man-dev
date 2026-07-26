---
name: shipping
description: Turn finished work into an issue, a branch, a commit, and a PR. The only skill in this pack that touches git — and it runs only when you type it.
disable-model-invocation: true
---

# Shipping

Everything else in this pack builds. This alone **ships**, and it exists behind
a deliberate act: you type it. No skill can reach it, and no agent fires it on
your behalf — that is the whole point of `disable-model-invocation` here.

Read [`../foreman/references/memory.md`](../foreman/references/memory.md) for
the memory format before the preflight. Every question below is asked **once**
and then lives in `Standing`.

## The line this skill does not cross

`--force`, `--force-with-lease`, `--no-verify`, `--amend` on anything already
pushed, and any commit made directly onto the base branch. None of these run,
including when a step fails and one of them looks like the fix. A failing hook
is a finding to report, not an obstacle to bypass.

## 1. Preflight

Gather before asking anything:

```bash
git status --porcelain          # what is actually uncommitted
git branch --show-current       # where you are standing
git remote -v                   # the repo
gh auth status                  # can we talk to GitHub at all
```

Read `.foreman/memory.md`. Then check three things and stop on any of them:

- **Nothing to ship** — clean tree and no unpushed commits. Say so; stop.
- **Not verified** — the work has no passing proof command from this session.
  Shipping unproven code is the failure this pack is built to prevent. Run the
  `Standing.checks` command now; red means stop and report.
- **Secrets in the diff** — scan for `.env` files, key material, tokens, and
  credentials. One is a hard stop, not a warning.

**The one case that does not hard-stop: there is no check to run.**
`Standing.checks` is absent *and* the repo has nothing to read one from — no
test script in the manifest, no CI workflow, no linter, nothing that could go
red. A greenfield repo and a docs-only change both land here legitimately, and a
gate that can never open is a gate people route around.

Look before concluding it: a `test` script, `.github/workflows/`, a `Makefile`
target, `pyproject.toml`'s dev dependencies. Find one → run it, and record it to
`Standing.checks` so this is asked once. Find none → carry
`verified: none — <reason>` into the plan block, name what a human would run
instead, and let the user approve *that*. Never invent a command, and never
report an absent check as a passing one.

*Done when:* the change set is known, clean of secrets, and either proven green
or explicitly carried as unverified with the reason.

## 2. Reconcile

Compare three sources: what memory holds, what the repo shows, and what you
were just asked for.

Aligned, or merely missing a field → continue; ask absent fields in step 3.

**Contradictory** → grill, per the memory reference: state the conflict in one
line, then ask by
[`../foreman/references/asking.md`](../foreman/references/asking.md) — one
question, your recommendation attached — and write the answer to `Standing`.
Facts you look up yourself; only the decision is theirs.

Watch for the common one: memory's `Log` says this work already shipped, and it
is still sitting uncommitted. That means an earlier PR was closed, reverted, or
never merged — find out which before opening a second one.

*Done when:* no contradiction remains between memory, repo, and request.

## 3. Plan

One block, one confirmation. This is the only approval gate — everything after
it runs without further questions.

```
issue:   <title>
         <2–4 line body: what and why>
base:    <target branch>            [from Standing, or asked now]
branch:  <name, per Standing.branching>
commit:  <message, per Standing.commits>
files:   <N> files, <+A/-B>
verified: <command> → exit <code>   [or: none — <reason>; a human must run <what>]
pr:      <title> — Closes #<issue>
```

`verified:` carries the command, never an adjective. It sits in the block the
user approves precisely so that shipping unverified work is a thing they say yes
to with their eyes open, rather than something the preflight waved through.

Ask only what `Standing` does not already answer. If `base` is absent, this is
the moment to ask it — once — and record it. A repo with an unusual base
(`develop`, `staging`) must be asked, never inferred from what looks default.

Post the block and wait for a yes. Anything other than a clear yes stops here.

*Done when:* the user has approved the block.

## 4. Execute

In order. Stop on the first failure and report it — no retry with a bypass flag.

```bash
gh issue create --title "<title>" --body "<body>"     # → #N
git checkout -b <branch>                              # never commit onto base
git add <the files in the plan>                       # named paths, not -A
git commit -m "<message>"
git push -u origin <branch>
gh pr create --base <base> --head <branch> \
  --title "<title>" --body "<body, ending: Closes #N>"
```

Notes that matter:

- **Stage named paths**, never `git add -A`. A blanket add is how unrelated
  work and stray local files reach a PR.
- **Branch before committing.** If you are already standing on the base branch
  with the changes uncommitted, `checkout -b` carries them across.
- **The issue comes first** so its number can appear in the branch, the commit,
  and the PR's closing line. One thread, three places.
- The PR body ends with `Closes #N` so merging closes the issue.

*Done when:* the PR URL exists. Print it.

## 5. Record

Append one `Log` entry to `.foreman/memory.md`, and write any `Standing` field
that got answered along the way:

```
shipped: issue #<n>, branch <name>, PR #<n> → <base>
```

Then say what remains for the human: review, merge, deploy. **Merging is not
shipping's job** — it opens the PR and stops.

*Done when:* memory reflects the shipped state and the PR link is in the
response.
