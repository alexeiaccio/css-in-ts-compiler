---
# cssints-63ia
title: Declare a layer below the engine's _.k
status: todo
type: feature
priority: normal
created_at: 2026-10-08T09:42:19Z
updated_at: 2026-10-08T09:42:19Z
---

Found by reset() (cssints-n9my, repro under "## Engine gaps"). Every declared layer is printed after `@layer _.k, _.a, ...;`, so a `reset` layer ranks above the classes and `* { margin: 0 }` beats `margin("1rem")`. reset() works around it with a global `@layer reset { ... }` that nests as `_.k.reset`; a user stylesheet cannot then name a layer between the reset and cssints.

## Todo
- [ ] a `{ layers: [...], before: true }` (or similar) entry printed before `_.k`
- [ ] move reset() to it
