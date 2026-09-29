---
# cssints-79xr
title: 'Implement tokens: token.<type>, @property, style() and token.set()'
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:29:55Z
updated_at: 2026-09-29T16:33:29Z
parent: cssints-vy0o
blocked_by:
    - cssints-vzd9
    - cssints-djzw
    - cssints-mjgx
---

## Question

Implement `docs/API.md` "Tokens" (decided in cssints-o00x). Blocked by the global sheet, because `@property` rules go at its top.

- [ ] `token.<type>(initial, name?)` for every @property syntax type: a Typed OM value with `toString()` = `var(--name)`, and the initial value checked by the twin (and by types, in the public types ticket)
- [x] Names: a named token (string or `{ var, inherit }`) can be set; an unnamed one gets `--_<hash>` of the file and site and is private; `inherits` defaults to true
- [ ] One `@property` per token at the top of the sheet, outside the layers; deduplicated across modules; a clash (same name, different syntax or initial value) is a build error
- [ ] `style(...)` and `token.set(token, value)` at build time give a style object; setting a private token is an error
- [ ] Fixtures, and the demo uses one named token in a style and in a class
