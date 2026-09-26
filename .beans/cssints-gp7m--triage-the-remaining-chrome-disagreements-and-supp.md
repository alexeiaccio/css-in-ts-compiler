---
# cssints-gp7m
title: Triage the remaining Chrome disagreements and support-warning noise
status: completed
type: task
priority: normal
created_at: 2026-09-26T10:42:30Z
updated_at: 2026-09-26T11:08:40Z
parent: cssints-tmv8
---

After the grammar fixes, typed values and the support/prose layers, `node spikes/typelevel/diff-support.ts` leaves 25 of 66 twin-accepts/Chrome-rejects values unexplained.

- [x] ~~Ranges missing inside function arguments~~: `extract.mjs` misses nothing it can copy. webref's `steps()` has no range either (the minimum of 1, or 2 with jump-none, is prose in css-easing-2 §2.3, now a rule in `rules.ts`). The `box-shadow` blur range is in webref's `<shadow>`, but mdn-data's `<length>{2,4}` has no slot to carry it verbatim: recorded as known in `diff-support.ts`
- [x] BCD gaps (`display: run-in`, `inline-list-item`) and the BCD-vs-Chrome case (`align-items: anchor-center`): recorded as known in `diff-support.ts` (KNOWN). anchor-center is an mdn-data and BCD bug: css-anchor-position-1 §4.2 adds it to justify-self and align-self only. mdn-data main still has it. No support overrides
- [x] Remaining rows: classified. Prose rules added for calc-size() argument types, steps() minimum, anchor-size() only in sizing, inset and margin properties, two negative times in a transition, and positional keyword ambiguity in transition. The remaining one is a spec gap: linear() with one stop (Chrome and WPT reject it, css-easing-2 allows it), recorded as known. Unexplained: 25 to 0, also across seeds 1-8, 99, 123, 555, 1000
- [x] Noise: targets where the property itself is unsupported get only the property warning (support.ts), and macro.mjs warns once per property and BCD feature per build. BCD 8.1.3 marks `cursor` as supported on iOS Safari 13.4+ (auto, cell, text and url too), so `cursor: pointer` is not unsupported as a whole: it still warns, once per build (one line in app-react)
- [x] The `!` multiplier: a `bang` node in twin.ts, css.ts and gen.ts; `image()` and `image(ltr)` fail, rows in cases.ts

## Summary of Changes

- `!` multiplier (CSS Values 4 §2.2): `["bang", n]` in twin.ts (drops remainders equal to the input), css.ts (`Exclude<Consume<X, S>, S>`), gen.ts (makes one optional part required, not a filter, which never ended deep down). 4 cases.ts rows.
- rules.ts: function rules on every declaration (calc-size() argument types via a small css-values-4 §10.9 type checker, steps() minimum, anchor-size() only in sizing/inset/margin properties), plus transition rules (two negative times, keyword positional ambiguity).
- support.ts: property-scoped keys also looked up under the properties reached via <'q'> (flex-basis: fit-content() -> css.properties.width.fit-content_function); targets without the property only get the property warning.
- macro.mjs: warnings deduped per property and BCD key per build.
- diff-support.ts: KNOWN list (BCD gap, mdn-data/BCD anchor-center bug, box-shadow blur range lost in mdn-data, linear() one-stop spec gap).
- Result: 66 -> 62 rows (the 4 image() rows are gone), unexplained 25 -> 0. Budget: empty.ts baseline +1092 instantiations (tsc 13963 -> 15055, tsgo 14136 -> 15228, the bang branch in Consume); net per bench file unchanged for tsc, +6..11 for tsgo. budget.json updated.
