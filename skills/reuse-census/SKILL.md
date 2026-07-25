---
name: reuse-census
description: >
  Inventories what a codebase already has that covers part of a job, before
  any new code is written — helpers, utilities, types, hooks, patterns, and
  installed dependencies. Returns file:symbol evidence per part of the job, or
  an explicit "nothing exists". Use before implementing a feature or fix, when
  the user asks whether something already exists, whether code is being
  duplicated, or how this repo already solves a problem; and whenever another
  skill needs the reuse evidence.
---

# Reuse Census

Rebuilding what already lives three files over is the most expensive way to
write code: the diff is larger, the behaviour drifts from its twin, and the
bug gets fixed once in two places. The census is the search that prevents it.

Run this as a **sub-agent**. It reads widely and returns a short answer, so its
file dumps belong in a context that gets thrown away.

## 1. Split the job into parts

Break the request into the distinct capabilities it needs — "parse the CSV",
"validate the email", "retry the upload", "format the timestamp". Each part
gets searched separately; a job searched as one blob returns nothing.

## 2. Search each part four ways

Search by **behaviour**, not by the name you would have given it. The existing
helper is called `normalizeAddr`, not `formatAddress`.

- **Name** — the domain nouns and verbs, plus the synonyms this repo actually
  uses. Check the project's glossary or `CONTEXT.md` if one exists.
- **Shape** — the signature or call pattern: what goes in, what comes out.
- **Neighbourhood** — read the `utils`, `lib`, `common`, `shared`, `helpers`
  directories, and the files that already sit beside where the change lands.
  Adjacent code is the likeliest owner.
- **Dependencies** — read the manifest (`package.json`, `pyproject.toml`,
  `go.mod`, `Cargo.toml`). An installed library that already covers a part
  outranks anything you would write, and a new dependency for what a few
  lines cover is not on the table.

Also note the **house pattern** for this kind of work — how the last three
features did it. Matching it is worth more than a marginally better design.

## 3. Report

One line per part. Evidence, never opinion — a claim without a path did not
happen:

- `reuse — <path>:<symbol>` covers <part>, as-is.
- `extend — <path>:<symbol>` covers <part> but not <sub-part>; the change is
  <one line describing it>.
- `dependency — <package>.<api>` covers <part>, already installed.
- `pattern — <path>` is how this repo does <kind of thing>; match it.
- `none — <part>` has nothing; build it.

Close with a one-line `house style:` note if the repo has a strong convention
for this area, and nothing else. No recommendations, no design, no code — the
census reports what exists; the caller decides what to do with it.

Keep the whole report under 300 words.

## Completion

Every part of the job carries a verdict, and every verdict that is not `none`
carries a path. A census whose report contains no file paths has not run.

Prefer `none` to a stretch. A false reuse — bending an unrelated helper to fit
— costs more than the duplicate would have, because now two callers constrain
one function that was only ever designed for one.
