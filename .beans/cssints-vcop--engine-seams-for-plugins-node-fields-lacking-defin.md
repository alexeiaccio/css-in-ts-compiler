---
# cssints-vcop
title: 'Engine seams for plugins: node fields, lacking(), definition sites, generic Valid'
status: todo
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T11:57:41Z
parent: cssints-9js6
---

## Question

The internal seams the research (plugins.md §4.2, §8) put before any public API; only `addGlobal` shipped in 0.1. They do not depend on the public shape, so they go first:

- the style node carries `markers` and `kernels` next to its declarations; `cn()` merges them; `__site` prints markers into the class string; the sheet registers kernels by key (`addGlobal` grows `atProperty`), a sheet without plugins stays byte-identical;
- `lacking(bcdKey, targets)` exported next to `support()` (the inner `lacks()`, same rules);
- definition sites: a build-time module may hold plugin values (functions, plugin objects) from an attributed call, and `__site` no longer throws on them;
- the type-level error label generalised (`Valid<Label, G, S>`) so a grammar string that is not a property gets a readable message; `bun run bench` within budget.

Each seam gets one test through a test-only kernel/member. Answer: the merged seams, the budget numbers.
