---
# cssints-kotg
title: 'Error DX: the type error on the bad argument, completions inside strings'
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T11:58:19Z
parent: cssints-9js6
---

## Question

Two editor problems carried from 0.1:
- A bad typed part (`padding("2px", "red")`) puts the type error on the first argument, not on `"red"`. Can the per-argument error land on the bad part (a mapped tuple of per-position checks, or overloads), and at what instantiation cost (`bun run bench`, `bench/lsp.mjs`)?
- Completions inside string literals (arktype `Completion`-style): which keywords the editor can offer for `display("…")` or `color("…")` without breaking the recogniser budget.

Spike both on tsgo and tsc 5.9, measure, and recommend ship or rule out for each. If shipped, an implementation step on this map.
