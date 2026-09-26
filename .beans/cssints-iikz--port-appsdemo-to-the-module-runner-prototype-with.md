---
# cssints-iikz
title: Port apps/demo to the Module Runner prototype, with source maps
status: completed
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

## Summary of Changes
- `spikes/runner/app-react`: a copy of `apps/demo` without `with { type: "macro" }`. `npx vite build` works, the app renders in the browser, and the bundle contains only `cx`/`_cv`.
- Source maps via `ms.generateMap({ hires: true })`, verified by `map-check.mjs`.
