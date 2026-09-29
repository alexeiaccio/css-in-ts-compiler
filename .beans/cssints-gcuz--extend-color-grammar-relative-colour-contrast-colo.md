---
# cssints-gcuz
title: 'Extend <color> grammar: relative colour, contrast-color(), if()'
status: todo
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:46:45Z
updated_at: 2026-09-29T15:52:13Z
parent: cssints-vy0o
blocked_by:
    - cssints-djzw
    - cssints-lmru
---

## Question

The mdn-data `<color>` grammar accepts `color-mix()` and `light-dark()` but rejects relative colour syntax (`oklch(from var(--x) l c h)`), `contrast-color()` and `if()` (cssints-kag5). Find the spec grammars (mdn-data, or @webref/css through extract.mjs), add them without hand rewriting, and check them in both twins, the generator and against Chrome; keep the budget.
