---
# cssints-gp7m
title: Triage the remaining Chrome disagreements and support-warning noise
status: todo
type: task
created_at: 2026-09-26T10:42:30Z
updated_at: 2026-09-26T10:42:30Z
parent: cssints-tmv8
---

After the grammar fixes, typed values and the support/prose layers, `node spikes/typelevel/diff-support.ts` leaves 25 of 66 twin-accepts/Chrome-rejects values unexplained.

- [ ] Ranges missing inside function arguments now that calls are generated (`steps(<integer [1,∞]>)`, `box-shadow` blur `[0,∞]`): extend the webref range merge in `extract.mjs`, or add these to the ranges it copies
- [ ] BCD gaps (`display: run-in`, `inline-list-item`) and the BCD-vs-Chrome case (`align-items: anchor-center`): record them as known, or report them to BCD
- [ ] Remaining rows: classify each one as grammar, range, support or prose
- [ ] Noise: `cursor: pointer` warns for iOS Safari because BCD marks all `cursor` values unsupported there. Decide whether a property that is unsupported as a whole on a target should warn once per property or not at all
- [ ] The `!` multiplier (non-empty group) is ignored; `image()` passes
