---
# cssints-wu2n
title: 'Wayfinder: survey prior approaches, wyw-in-js and dx-styles'
status: completed
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

Surveyed this repo's parcel cssints, `../oxc-macro`, `../tsdown-macro`, `../macros`, `lightningcss-napi`, and also wyw-in-js 2.5.1 and dx-styles 1.4.1.

## Summary of Changes
- `docs/wayfinder.md`: a table of the 5 prior approaches (LOC, state, the problem that killed each), the wyw-in-js pipeline and processor API, and a dx-styles comparison.
- Decision: do not build another full evaluator (Rust/NAPI/QuickJS/VFS/sandbox).
