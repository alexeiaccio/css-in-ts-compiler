---
# cssints-vgff
title: mdn-data lacks spec ranges (negative flex-grow, gap, line-height, border-width pass)
status: todo
type: task
created_at: 2026-09-26T08:26:25Z
updated_at: 2026-09-26T08:26:25Z
parent: cssints-tmv8
---

mdn-data writes `flex-grow: <number>`, `row-gap: normal | <length-percentage>`, `<line-width> = <length> | ...`, while the specs say `[0,∞]`. The twin can only check ranges that the grammar states. `diff.ts` lists about 30 negative values that Chrome rejects in flex-grow, flex-shrink, gap, row-gap, column-gap, line-height and border-width.

- [ ] Compare with `@webref/css` (grammars extracted from the specs by W3C tooling): does it state the ranges, and how far does it differ from mdn-data?
- [ ] Decide: switch the source, or merge, or keep a small override table in `extract.mjs`
- [ ] `node diff.ts`: the negative-value rows are gone
