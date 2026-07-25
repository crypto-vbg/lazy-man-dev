---
name: researching
description: >
  Investigates a concept, library, protocol, or API the codebase does not
  already contain, against primary sources pinned to the versions actually
  installed. Returns the two or three real options with their trade-offs and a
  recommendation — decision-shaped, cited, with unknowns named rather than
  filled in. Use when the user knows the goal but not the domain, when a task
  needs an unfamiliar dependency or standard, before designing against an API
  nobody here has used, and whenever another skill hits a concept the repo
  cannot explain.
---

# Researching

`reuse-census` looks **inward**: what does this codebase already have. This
looks **outward**: what does the world already have, and which version of it
applies here.

Reach for it the moment a task depends on something neither the repo nor the
user can explain. That is precisely the condition under which a model
fabricates — no local evidence, no user correction, only priors — so this skill
exists to replace priors with citations.

Run it as a **sub-agent**. Reading documentation floods a context window and
the useful residue is a page.

## 1. Pin the version before reading anything

Docs for v3 are actively wrong for the v1 in this project. Read the manifest
and the lockfile — `package.json`/`package-lock.json`, `pyproject.toml`/`uv.lock`,
`go.mod`, `Cargo.lock` — and note the version actually resolved, not the range
requested.

Nothing installed yet? Note the current stable release and say that is what you
researched.

Every finding below is a finding **about that version**.

## 2. Rank sources, and stay high

Use the highest rung that answers the question:

1. **The installed source itself** — `node_modules/`, site-packages, the vendor
   directory. It cannot be out of date; it is what will run.
2. **Official documentation for that version** — the versioned URL, not
   `/latest`.
3. **The specification or RFC** for a protocol or format.
4. **First-party API reference**, changelogs, migration guides.

Blog posts, tutorials, forum answers, and AI-generated summaries are **leads,
not sources**. Follow one to the primary source it paraphrases, cite that, and
if no primary source backs the claim, drop the claim.

## 3. Answer the question that was asked

The user has an end goal, not a curiosity. Produce the decision, not a course:

```
goal:     <what the user is trying to achieve, in their words>
version:  <library@version, or "not installed; current stable is X">

concept:  <2–3 sentences. What this thing is, in plain language, assuming no
          prior exposure. No jargon that is not immediately defined.>

options:
  1. <name> — <one line on how it works>
     fits because <…>; costs <…>
  2. <name> — …
  3. <name> — …

recommend: <one option, and the single reason it wins here>
because:   <the specific fact about THIS project that decides it>

unknowns: <what no primary source answered>
sources:  <url or path per claim>
```

Two or three options. One is not a decision; five is a reading list.

**`recommend:` is not optional.** A user who does not know the domain cannot
choose between options presented neutrally — handing them an unranked list
moves the work back to the person least equipped to do it.

## 4. Name what you did not find

An unknown, written down, is a useful result. An unknown filled in from
plausible-sounding memory is the failure this skill exists to prevent.

Say `unknown — no primary source found for <X>` and, where it matters, name the
experiment that would settle it: a five-line spike, a curl against the real
endpoint, one call in a REPL.

Never present a remembered API surface as verified. If you did not read it in
step 2, it is an unknown.

## Teaching back, when the user is new to the concept

When research feeds an interview — someone knows the goal but not the domain —
each decision must be put in terms they can actually answer:

- **Lead with the consequence, not the mechanism.** "Do you want users to stay
  logged in after closing the browser?" beats "session cookie or JWT?"
- **One question at a time**, each with your recommendation attached.
- **Never ask a question the research already answers.** Facts are yours to
  look up; only trade-offs the user has a stake in are theirs to settle.

A question the user cannot parse is a question you have not finished
researching.

## Completion

Every claim carries a source, and every source is primary. The version is
stated. There is a recommendation, and it turns on a fact about this project
rather than a general preference. Unknowns are listed as unknowns.

Under 400 words, sources excluded. If the research does not change what gets
built, it was a reading exercise — say so in one line and stop.
