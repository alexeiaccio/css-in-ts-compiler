---
# cssints-ti8v
title: Terminal derived tokens register the browser runtime of derived tokens
status: in-progress
type: bug
created_at: 2026-10-11T08:21:52Z
updated_at: 2026-10-11T08:21:52Z
---

A terminal token derived from another (color-mix() over a token) still registers the browser runtime of derived tokens for its module; the module is empty unless the targets need it, but terminal modules should register nothing.

## Todo
- [ ] Failing test: a terminal module with a derived token imports no derived-token runtime
- [ ] Skip the registration for terminal token sets
