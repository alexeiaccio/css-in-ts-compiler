---
# cssints-j24s
title: 'Comma omission rule missing: background: red is rejected'
status: todo
type: bug
priority: high
created_at: 2026-09-26T08:26:25Z
updated_at: 2026-09-26T08:26:25Z
parent: cssints-tmv8
---

CSS Values 4 §2.6: a comma in the grammar is omitted when everything on one side of it is omitted. mdn `background` is `<bg-layer>#? , <final-bg-layer>`. Both twins and the generator read the comma literally, so `background: red` is rejected and `", red"` is accepted. The self-check could not see it, because all three make the same mistake. Chrome showed it through the leading-comma values in `diff.ts`.

- [ ] twin.ts: in `seq`, skip a `,` literal when nothing was consumed since the start of the seq, or when every following term matches empty
- [ ] css.ts: the same rule in `ConsumeSeq`; the budget must hold
- [ ] gen.ts: drop the comma next to an omitted side
- [ ] Rows in cases.ts: `background: red`, `url(a.png), red`, `none`, `", red"` (invalid)
- [ ] `node diff.ts`: no more leading-comma rows in the Chrome report
