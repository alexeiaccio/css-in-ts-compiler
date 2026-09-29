---
# cssints-lmru
title: 'All standard properties: extract every standard and experimental property, fix the blockers'
status: todo
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T15:02:52Z
updated_at: 2026-09-29T16:19:08Z
parent: cssints-vy0o
blocked_by:
    - cssints-djzw
---

## Question

Act on cssints-unkt (docs/research/grammar-coverage.md). Blocked by the TS + Effect port, which rewrites the twin.

- [ ] `extract.mjs` with no arguments takes every standard and experimental mdn property (529). The 107 nonstandard ones stay out of the core; LightningCSS covers them: 16 are prefixed forms of standard properties and 9 are the legacy flexbox `box-*`, both emitted by LightningCSS from the browserslist targets when the user writes the standard property. About 65 are dead IE/old-Firefox properties and 3 are the replaced masonry draft. Only ~5 live WebKit-only properties (`-webkit-tap-highlight-color`, `-webkit-touch-callout`, `-webkit-box-reflect`, `-webkit-user-modify`, `-webkit-overflow-scrolling`) are ever written by hand: a small built-in list or the first plugin (cssints-rq2r decides). Engine names come from this list (`lib.mjs`).
- [ ] Twin and gen.ts: range bounds with units (`<time [0s,∞]>`, `<angle [-90deg,90deg]>`), since today every value of animation-duration, transition-duration and font-style fails
- [ ] Open repetition `{A,}` / `#{A,}` in both twins and gen.ts
- [ ] The missing primitives: `url`, `zero`, `resolution`, `flex`, `number-token`, `hash-token`, `ident`, `declaration-value`, `intrinsic-size-keyword` (in both twins and the generator)
- [ ] css.ts: the `[S] extends [never]` short-circuit in `AnyOrder`; `font-variant: "none"` drops from 4.3 M instantiations to about 51 k; no TS2589 on any property
- [ ] diff-support over all properties: classify the unexplained standard rows (820 in the research) by cause, fix ours, and extend KNOWN and the prose rules; types vs twin agree on every row
- [ ] Budgets updated and recorded (per-call cost ~4.2 k; the unused table costs 0)

Merge note from cssints-mjgx (already on master): regenerate mdn.ts (the conditions block uses `Object.keys(P)`, so `<declaration>` follows the property list) and members.ts (pseudo wrappers); `css.ts` exports `Stuck`/`Unexpected` and has a changed `NotIdent`; `budget.json` has two new entries (queries, supports), so re-run `--update`. With all properties, `supports.ts` costs about 1.23 M instantiations (about 0.5 M once per program).
