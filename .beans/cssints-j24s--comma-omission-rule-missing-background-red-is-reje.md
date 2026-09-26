---
# cssints-j24s
title: 'Comma omission rule missing: background: red is rejected'
status: completed
type: bug
priority: high
created_at: 2026-09-26T08:26:25Z
updated_at: 2026-09-26T10:25:02Z
parent: cssints-tmv8
---

CSS Values 4 §2.6: a comma in the grammar is omitted when everything on one side of it is omitted. mdn `background` is `<bg-layer>#? , <final-bg-layer>`. Both twins and the generator read the comma literally, so `background: red` is rejected and `", red"` is accepted. The self-check could not see it, because all three make the same mistake. Chrome showed it through the leading-comma values in `diff.ts`.

- [x] twin.ts: in `seq`, skip a `,` literal when nothing was consumed since the start of the seq, or when every following term matches empty
- [x] css.ts: the same rule in `ConsumeSeq`; the budget must hold
- [x] gen.ts: drop the comma next to an omitted side
- [x] Rows in cases.ts: `background: red`, `none`, `"none, red"`, `"left top, repeat-x red"`; invalid `", red"`, `"none,"`, `"red, none"`, `"none red, none"`. Not `url(a.png), red`: mdn.ts has no `<image>` syntax, so no url can match `<bg-image>` yet (and `"red, url(a.png)"` passes only through the opaque color-function rule, which is cssints-aj2u)
- [x] `node diff.ts`: no more leading-comma rows in the Chrome report

## Summary of Changes

Comma omission (CSS Values 4 §2.6.1) in all three interpretations of the grammar.

- twin.ts `seq` and css.ts `SeqRest`: a `,` is skipped for the remainders where nothing was consumed since the seq start or the previous comma (never before the first term). When every later term is statically nullable (`?`, `*`, `{0,n}`), the seq may also end before the comma, and a consumed comma then needs something after it (no trailing comma). `Start`/`Moved` are unions over all paths in both twins: an over-approximation, the same in both.
- gen.ts drops the same commas (`commas()`).
- css.ts keeps a single generic `Consume` reference in the seq helper: each extra generic reference costs ~1.3 k instantiations when tsc checks the declaration.
- diff.ts: Chrome agreement 1863/1950 -> 1866/1950, the leading-comma `background` rows are gone; types vs twin 456/456.
- Budget holds without an update: b200 tsc 195359 -> 195863 (+0.3%), tsgo 197478 -> 197995; empty.ts tsc 13289 -> 13600 (+2.3%).
