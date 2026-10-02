---
# cssints-obd3
title: fn() and a few built-in value helpers
status: todo
type: feature
created_at: 2026-10-02T10:14:48Z
updated_at: 2026-10-02T10:14:48Z
parent: cssints-9js6
---

## Question

Decided with the user: add `fn()` to `cssints/plugin` (a value function: an mdn grammar string and `computeTo(args) -> string | CSSStyleValue`, build-time only, plugins.md §4.3) and a small set of built-ins in cssints itself: `colorMix`, `clamp`, `min`, `max` (at least), typed so a token can be an argument and the result is a part of a property. Each helper is a grammar-checked value at build time; `computeTo` may return a Typed OM value. Decide which built-ins are worth it (colorMix with a token argument is the motivating case) and how a helper's error reads. Fixtures, type tests, bench within budget, API.md "Functions" section (the doc test must pass), a use in the demo if natural.
