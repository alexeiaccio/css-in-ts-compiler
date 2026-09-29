---
# cssints-euf0
title: 'CSS output pipeline: one sheet, dedupe, order, LightningCSS'
status: todo
type: task
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:28:04Z
parent: cssints-vy0o
blocked_by:
    - cssints-wx85
    - cssints-kpq1
---

## Question

Today each module has a virtual `cssints.css?file=...` and the demo uses Vite's LightningCSS transformer. Decide how CSS is emitted in dev and build, how atomic rules are deduplicated and ordered (with conditions and layers), and where LightningCSS runs.
