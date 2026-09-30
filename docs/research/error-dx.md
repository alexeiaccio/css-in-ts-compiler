# Error DX: the error on the bad argument, completions inside strings

Spike for cssints-kotg. Numbers are instantiations from `bun run bench` (tsgo / tsc 5.9), minus the empty baseline;
editor latency is `node bench/lsp.mjs` and `node bench/complete.mjs` over tsgo's language server. Machine noise on the
latency runs is about ±30 %, so a latency is only quoted to the tens of milliseconds.

| bench item (cssints)   | master          | question 1      | questions 1 + 2 |
| ---------------------- | --------------- | --------------- | --------------- |
| users.ts (valid calls) | 759 073 / 752 897 | 791 217 / 784 649 (+4.2 %) | 801 820 / 795 192 (+5.6 %) |
| unused.ts (all members, no call) | 38 630 / 34 140 | 41 545 / 36 922 (+3 k) | 41 781 / 37 126 (+3.1 k) |
| errors.ts (12 bad calls, new) | not measured | 290 k tsgo | 303 k tsgo / 298 k tsc |

The css-grammar items move by at most 126 instantiations (their empty baseline by +2.2 k: the new `Furthest` alias is
checked once per program, so its budget was updated).

## 1. The error on the bad part: ship

**What was tried.** A mapped tuple, in `Check` (packages/cssints/src/types.ts): every position keeps its own type except
the bad one, which becomes the `Valid` message. The bad position is found from the furthest point the recogniser
reached (`Furthest`, css.ts, the text from the bad token on): the part is the first one whose joined prefix is at least as
long as the text before that token (`Bad`). No rest-parameter tricks and no overloads were needed: a homomorphic mapped
type over the inferred tuple puts the error on that argument in both compilers, and the message is the same text as
before.

**Numbers.** The first version, written inline in `Check`, cost +15 % on users.ts (868 k / 878 k): TypeScript
instantiates both branches of `Check` while it infers `A`, and a `Furthest` in the `extends` position of a template
pattern was evaluated for every property. Moving the work into a second alias (`Locate`), behind a conditional
on the furthest text, brought it to +4.2 % (+32 k on 160 calls, about 0.2 k a call). The price of a failing call is
about 1.6 k more (errors.ts +6–7 % for eight bad calls); a failing call is the state an editor is in while typing.
`NoInfer` around the failure branch was tried and is wrong: the error moves to the whole argument list.
Latency on the demo's Button.tsx is unchanged: a valid edit 170–280 ms, an invalid edit 180–250 ms before, the same
after; an edit that makes the second part of `border("1px", "nope")` bad reports at that part (column 16) in 214 ms.

**Also.** `media("a", "b")` (packages/css-grammar/src/query.ts) had the same error-on-the-first-argument shape; each query
is now checked alone (`{ [I in keyof Q]: ValidQuery<K, Q[I]> }`), which costs 0.3 % on the queries bench.

**Limits.** The place is where the message points, and the message names the furthest point of all alternatives:
`grid("auto", "nope")` marks `"auto"` (the message says `unexpected "auto"`, and so does the place). A bare number
`p(1, 2)` marks the first, as the grammar takes a `1` as no length.

**Committed.** The error lands on the bad part, with `@ts-expect-error` placement tests in
packages/cssints/test/types/errors.ts (each call is split over lines, so a directive on the bad argument is unused, and
the error stands, if it lands anywhere else; tsgo and tsc 5.9).

## 2. Completions inside strings: ship with limits

**What tsgo offers.** An editor offers the string literals of the parameter type. Today that is the error message itself
(`display("|")` lists `display: unexpected end in "", grammar …`). So the keywords go into the parameter type of the bad
part, next to the message: `display("fl|")` lists `flex`, `flow`, `flow-root`; `color("re|")` lists `rebeccapurple`,
`red`; `border("1px", "so|")` lists `solid`; `border("1px so|")` lists `1px solid` (the words before the cursor stay,
as the editor replaces the whole string); an empty later part (`border("1px", "|")`) lists all 206. tsc 5.9's language
service (ts.createLanguageService, checked by hand) offers the same.

**How.** The keywords are not found by the recogniser (that would cost a run of it per keystroke). A script
(`packages/css-grammar/scripts/keywords.ts`, run by `bun run extract`) writes `src/keywords.ts`: for each property, the
keywords of its grammar and of the `<types>` it uses, by first letter (lower case). `Hint<P, Text>` (css.ts) takes the
bucket of the word typed so far and filters it by prefix, case-insensitively; the word itself is never offered, because
a hint equal to the argument would make the bad value good (`font("bold")` must stay an error, and is tested).

**Numbers.** Questions 1 + 2 together cost +1.3 % on users.ts over question 1 (about 0.3–0.7 k a call, no matter the
property), +0.2 k on unused.ts and +4.6 % on the failing calls of errors.ts (tsgo). Three earlier shapes were
measured and dropped:

- A flat union of keywords, filtered by a conditional per keyword: +54 k on users.ts (+7 %). TypeScript instantiates the
  branches while it infers, with the word still generic, so a colour (193 keywords) cost 193 deferred conditionals per
  call. The first-letter buckets turn that into one deferred index.
- `P extends keyof Keywords ? Keywords[P]`: every completion request took 270 ms more, in any file that calls a member,
  because the constraint of `Keywords[P]` is the union of all 450 members. `Keywords extends { [K in P]: infer O }`
  reads one member: 15–30 ms for `padding("|")`, 30–170 ms for `display` and `color` (noise included).
- An empty part through a mapped type on the valid path: +27 k. Instead an empty part is now text `⟨empty⟩`
  (`Text`), so it takes the failure path that already exists.

Completion latency (tsgo, after a change): 15–30 ms where there is nothing to offer, 30–130 ms for `display`, `color`
and `border`, up to 270 ms in the noisiest run; `bench/complete.mjs --check` asserts the list for nine snippets.

**Limits (say so in the docs, API.md "Editor").**

- The offer is the keywords of the whole grammar, not those that fit at that point: `border("1px", "solid", "so|")`
  offers `solid` again. The position is known only to the twin, at build time.
- It stops once the string is valid: the parameter type of a valid part is the part itself, so `display("flex")` with the
  cursor inside offers only `flex`. Offering on valid calls would put the lookup on every call.
- The words after the cursor are not considered: the offer is for the last word of the string.
- Functions (`rgb(`, `calc(`) are not offered, only keywords.
- The message moves: with hints, the parameter type in the error is a union. tsgo prints the message first and the
  hints after it; tsc 5.9 orders by type id and prints the hints first (`"flex" | "flow" | "flow-root" | "display: …"`).
  With an empty part the list is long (`color("")` has 193) and TypeScript cuts it, so the message is not shown; an empty
  part is now an error in types (it was a valid join: `border("1px", "")`), worded `unexpected "⟨empty⟩"`.
- `keywords.ts` is 68 KB of generated text, next to mdn.ts (85 KB): the program parses it (`empty.ts` +57 instantiations).

**Committed.** `Hint` in css.ts, the generator, `src/keywords.ts`, type tests in packages/cssints/test/types/hints.ts
(the exact hint sets, and `@ts-expect-error` for a bad value whose last word is a keyword), `bench/complete.mjs`.
