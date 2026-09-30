---
# cssints-kotg
title: 'Error DX: the type error on the bad argument, completions inside strings'
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T12:27:18Z
parent: cssints-9js6
---

## Question

Two editor problems carried from 0.1:
- A bad typed part (`padding("2px", "red")`) puts the type error on the first argument, not on `"red"`. Can the per-argument error land on the bad part (a mapped tuple of per-position checks, or overloads), and at what instantiation cost (`bun run bench`, `bench/lsp.mjs`)?
- Completions inside string literals (arktype `Completion`-style): which keywords the editor can offer for `display("…")` or `color("…")` without breaking the recogniser budget.

Spike both on tsgo and tsc 5.9, measure, and recommend ship or rule out for each. If shipped, an implementation step on this map.

## Resolution

Full write-up with numbers: docs/research/error-dx.md. Instantiations are tsgo / tsc 5.9 on `bun run bench`.

**1. Error on the bad argument: ship (done).** A mapped tuple in `Check` (types.ts) puts the `Valid` message on the bad position only; the position comes from the furthest point the recogniser reached (`Furthest`, css.ts). Same message text, both compilers, no overloads needed. Cost: users.ts +4.2 % (759 073 -> 791 217 / 752 897 -> 784 649), about 0.2 k a call; a failing call +1.6 k. The first inline version cost +15 %: TypeScript instantiates both branches of `Check` while inferring, so the work sits in a second alias behind a conditional. `NoInfer` is wrong (the error moves to the whole list). `media("a", "b")` got the same fix, per-query checks. Latency (lsp.mjs) unchanged within noise (valid edit 170-280 ms, invalid 180-250 ms, bad second part 214 ms and marked at that part). Committed with placement tests (test/types/errors.ts).

**2. Completions in strings: ship with limits (done).** tsgo (and tsc 5.9's language service) offers the string literals of the parameter type, so the keywords of the word being typed go in next to the message: `display("fl|")` -> flex, flow, flow-root; `color("re|")` -> rebeccapurple, red; `border("1px", "so|")` -> solid; `border("1px so|")` -> `1px solid`; an empty later part -> all keywords. Keywords come from a generated table (scripts/keywords.ts -> src/keywords.ts, by first letter), not from the recogniser, so the recogniser budget is untouched. Cost on top of question 1: users.ts +1.3 % (801 820 / 795 192, +5.6 % over master for both), failing calls +4.6 %. Dropped shapes: a flat union filtered per keyword (+7 %), `Keywords[P]` (+270 ms per completion), an empty-part mapped type on the valid path (+27 k). Limits: keywords of the whole grammar, not of the position; only while the string is invalid; last word only; no functions; the error text becomes a union (tsc puts the hints first; an empty part hides the message and is now an error, `unexpected "⟨empty⟩"`). Committed with type tests (test/types/hints.ts) and `bench/complete.mjs --check`.

Budgets: +5.6 % on users.ts is over the +5 % line for the two together; argued in the doc: a fixed 0.2-0.7 k per call, +0.2 k on unused.ts, editor latency unchanged. css-grammar `empty.ts` +2.2 k (one alias, paid once).
