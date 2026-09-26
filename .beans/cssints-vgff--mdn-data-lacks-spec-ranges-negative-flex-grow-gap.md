---
# cssints-vgff
title: mdn-data lacks spec ranges (negative flex-grow, gap, line-height, border-width pass)
status: completed
type: task
priority: normal
created_at: 2026-09-26T08:26:25Z
updated_at: 2026-09-26T10:21:52Z
parent: cssints-tmv8
---

mdn-data writes `flex-grow: <number>`, `row-gap: normal | <length-percentage>`, `<line-width> = <length> | ...`, while the specs say `[0,∞]`. The twin can only check ranges that the grammar states. `diff.ts` lists about 30 negative values that Chrome rejects in flex-grow, flex-shrink, gap, row-gap, column-gap, line-height and border-width.

- [x] Compare with `@webref/css` (grammars extracted from the specs by W3C tooling): does it state the ranges, and how far does it differ from mdn-data?
- [x] Decide: switch the source, or merge, or keep a small override table in `extract.mjs`
- [x] `node diff.ts`: the negative-value rows are gone (except transition `-100s`, see summary)

## Summary of Changes

- Compared `@webref/css` 8.7.5 with mdn-data 2.27.1 over the 57 properties and 143 syntaxes in `mdn.ts` (200 grammars): 116 identical, 2 differ only by ranges (flex-grow, flex-shrink), 73 differ in other ways, 9 syntaxes do not exist in webref (renamed there). The other differences: cosmetic spacing, outer brackets or alternative order (16), new edge-of-spec alternatives Chrome does not ship (`grid-lanes`, `running()`, `balance`, `hairline`, `<image-1D>`, `contrast-color()`, `justify-all`, `discard`, `white-space-trim`, `from <color>`, rec2100 spaces), restructuring through new types or longhands (`<box-size>`, `<'overflow-block'>`, `<'border-top-width'>`, `<spread-shadow>`, legacy/modern rgb()/hsl() split), removed mdn bits (`inline-list-item`, `anchor-center`, `paint()`, `none` in box-shadow), and ranges (row-gap, column-gap, line-height, line-width, shadow) mixed with other changes. The webref closure is 65 properties + 177 syntaxes. The twin parses all of it except `calc-sum` / `calc-product` (quoted `'+'`, `'*'`), which fail on mdn-data too and are opaque in the twin; over all of webref, 12 of 1396 grammars fail, all on quoted delimiters.
- Decision: keep mdn-data, copy only the ranges from webref (merge). Switching would trade ~30 negative-value rows for new rows of spec-draft syntax Chrome rejects, and would reshape many grammars. A hand table would be hand rewriting. The merge is mechanical: `<T>` becomes `<T [lo,hi]>` when webref's grammar of the same name uses T only with that one range; a range on T also covers T's members (so `<length-percentage [0,∞]>` ranges mdn's `<length>` and `<percentage>`).
- `extract.mjs` does the merge, defaults its property list to the runner's `PROPS`, and writes both versions in the `mdn.ts` header. `@webref/css` 8.7.5 and `mdn-data` 2.27.1 are pinned in `spikes/typelevel/package.json`.
- Six grammars changed: flex-grow, flex-shrink, row-gap, column-gap, line-height, `<line-width>`.
- `node diff.ts`: twin vs Chrome 1863/1950 → 1892/1950. All negative-value rows are gone except `transition` "linear -100s" (single-transition uses plain `<time>` in both sources). No new disagreement. `node budget.mjs`: all within ±0.05%, no update. check.ts, tsc, tsgo, runner fixtures and the app-react build pass.
