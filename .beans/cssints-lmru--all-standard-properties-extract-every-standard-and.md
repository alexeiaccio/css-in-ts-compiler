---
# cssints-lmru
title: 'All standard properties: extract every standard and experimental property, fix the blockers'
status: todo
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T15:02:52Z
updated_at: 2026-09-29T15:06:15Z
parent: cssints-vy0o
blocked_by:
    - cssints-djzw
---

## Question

Act on cssints-unkt (docs/research/grammar-coverage.md). Blocked by the TS + Effect port, which rewrites the twin.

- [ ] `extract.mjs` with no arguments takes every standard and experimental mdn property (529). The 107 nonstandard ones stay out of the core; they come back as plugins (see the plugin API research, cssints-rq2r). Engine names come from this list (`lib.mjs`).
- [ ] Twin and gen.ts: range bounds with units (`<time [0s,∞]>`, `<angle [-90deg,90deg]>`), since today every value of animation-duration, transition-duration and font-style fails
- [ ] Open repetition `{A,}` / `#{A,}` in both twins and gen.ts
- [ ] The missing primitives: `url`, `zero`, `resolution`, `flex`, `number-token`, `hash-token`, `ident`, `declaration-value`, `intrinsic-size-keyword` (in both twins and the generator)
- [ ] css.ts: the `[S] extends [never]` short-circuit in `AnyOrder`; `font-variant: "none"` drops from 4.3 M instantiations to about 51 k; no TS2589 on any property
- [ ] diff-support over all properties: classify the unexplained standard rows (820 in the research) by cause, fix ours, and extend KNOWN and the prose rules; types vs twin agree on every row
- [ ] Budgets updated and recorded (per-call cost ~4.2 k; the unused table costs 0)
