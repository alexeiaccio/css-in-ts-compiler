---
# cssints-wx85
title: How atomic CSS libraries emit and order CSS in Vite
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:41:27Z
parent: cssints-vy0o
---

## Question

Research StyleX, vanilla-extract, Panda CSS, Tailwind v4 and UnoCSS (see `docs/research/` first; do not repeat what is there).

- One stylesheet versus per-module CSS; how duplicate atomic rules are removed across modules in dev and in build.
- How rule order and conditions (media, pseudo, nested) are made deterministic; use of `@layer`.
- Where LightningCSS (or another optimizer) runs, and on what: per module or on the final sheet.
- How HMR updates CSS without a full reload.

Answer: the options that fit our engine (virtual CSS module per file today, content-hashed classes, `@layer _.a.._.e`), with a recommendation.

## Resolution

Findings: [docs/research/css-output.md](../docs/research/css-output.md).

- StyleX, Panda, Tailwind v4 and UnoCSS (global mode) ship one global sheet and sort it over all rules: StyleX by a numeric priority (property class + pseudo + at-rule) plus media width; Panda by bucket, at-rule, size query, pseudo table, property priority; Tailwind by variant bitmask plus property order; UnoCSS by parent order plus rule index. Dedupe is by construction. vanilla-extract is per-file virtual CSS like ours; its classes are file-scoped, so no dedupe is needed, and order follows imports.
- Optimizer: StyleX and Tailwind call LightningCSS on the whole sheet themselves; vanilla-extract, Panda v2 and UnoCSS leave it to Vite. For us, Vite already runs css.transformer per virtual module and build.cssMinify per output sheet.
- HMR: vanilla-extract, Panda, Tailwind use plain Vite CSS HMR on a CSS module; StyleX (polling runtime + refetch) and UnoCSS (hash ping) work around a sheet that is not a normal CSS module.
- Measured on apps/demo: cssMinify "lightningcss" removes the cross-module duplicates in a chunk (85 -> 70 rules) and keeps @layer order when layers.css is first.
- Gap: per-module CSS cannot order rules inside one layer (md vs lg in _.c; shorthand vs longhand in _.a); the order is Vite's module concat order.

Recommendation: option B, one global sorted virtual sheet (replaces cssints/layers.css), still a Vite CSS module so LightningCSS and CSS HMR come from Vite; build filled late (UnoCSS renderChunk placeholder, or a buildStart pre-evaluation). Gives up per-chunk CSS. Keep today's per-module output until then; option C (sublayers per condition) rejected.
