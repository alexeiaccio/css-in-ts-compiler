---
# cssints-okos
title: flex("1") and grid("...") as the shorthand properties
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T08:55:18Z
updated_at: 2026-09-30T10:45:37Z
parent: cssints-vy0o
blocked_by:
    - cssints-wigi
---

## Question

Implement the decision of cssints-cmgv. Blocked by cssints-wigi, which also edits types.ts and macro.ts.

- [ ] `flex(...parts)` with arguments is the `flex` property, checked by the grammar; `flex()` without arguments stays the context with its chain. The same for `grid`
- [ ] Types: overloads on `flex` and `grid` (no argument gives `Chain<...>`, parts give `Style` with `Valid<"flex">`); members generator and JSDoc
- [ ] `container` stays the condition; docs say the property is written as `containerName`/`containerType`
- [ ] Fixtures, type tests, docs/API.md; the demo uses `flex("1")` once
