# Asking

## Contents

- The shape of the problem
- Sort before you ask
- Rank what remains
- The budget
- After each answer, show the collapse
- How a question is phrased
- Failure modes

## The shape of the problem

Decisions are not peers. A few are **load-bearing** — answer one and a dozen
others resolve by implication. Most are leaves, determined entirely by
something upstream of them.

Ask the load-bearing ones. Roughly a fifth of the open questions settle the
other four fifths, and finding that fifth is the whole job. An interview that
walks every decision in order is not thorough, it is unsorted — and it burns
the user's patience on answers you could have derived.

## Sort before you ask

Never ask from a raw list. Enumerate every open decision **silently**, then put
each into exactly one bucket:

- **Derive** — the repo, the lockfile, the existing convention, `Standing` in
  memory, or the research already answers it. **Never ask a derivable
  question.** Facts are yours; only decisions are theirs.
- **Follow** — determined by another decision on the list. Do not ask it; it
  resolves when its parent does.
- **Default** — a sensible default exists and reversing it later is cheap.
  Take the default, state it in one line, and move on. A reversible choice you
  can name is not a question.
- **Ask** — none of the above: genuinely the user's, nothing upstream settles
  it, and getting it wrong is expensive to undo.

Only the last bucket is spoken aloud.

## Rank what remains

Order the **Ask** bucket by **fan-out** — how many `Follow` decisions each one
resolves. Highest first, because every answer shrinks the list before the next
question is asked.

Two candidates with equal fan-out: ask the one that is **harder to reverse**.
A choice you can change next week can be defaulted; a choice baked into a
schema, a public URL, or a data migration cannot.

## The budget

**Three questions.** If it takes more, the load-bearing one has not been found
— go back and sort again.

Where a fourth is genuinely unavoidable, ask it, and say why the ones before it
did not settle it. An interview that keeps going without that explanation has
become an interrogation.

## After each answer, show the collapse

An answer is not just recorded — it is **propagated**. Cross off every decision
it settled, then say so in one line before the next question:

> Postgres it is. That settles the migration tool (Prisma, already a
> dependency), the hosting (Supabase, from `Standing`), and the ID type (uuid).
> One question left.

This is worth the line for two reasons: the user sees why the question earned
its place, and any wrong inference surfaces immediately rather than three
decisions later.

## How a question is phrased

- **One at a time.** Wait for the answer. A batch is unanswerable and gets a
  batch of guesses back.
- **Lead with the consequence, not the mechanism.** "Should users stay signed
  in after closing the browser?" beats "session cookie or JWT?" — same
  decision, but only one is answerable by someone outside the domain.
- **Attach your recommendation**, and the reason it wins *here*. A neutral list
  moves the work to the person least equipped to do it.
- **Make the default visible**: "Recommend X — say so if you want Y." Silence
  should be a safe answer.

## Failure modes

- **The interrogation** — leaf questions asked serially, each individually
  reasonable, cumulatively exhausting. Caused by skipping the sort.
- **Asking what you would ignore** — if every answer leads to the same action,
  it was never a decision. Act.
- **Asking what the repo already answered** — the most annoying kind, because
  the answer was sitting in the lockfile.
- **Defaulting the irreversible** — the mirror failure. Speed is not worth
  silently choosing something the user cannot undo. When in doubt about
  reversibility, ask.
