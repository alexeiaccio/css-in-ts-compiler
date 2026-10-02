---
# cssints-obd3
title: fn() and a few built-in value helpers
status: completed
type: feature
priority: normal
created_at: 2026-10-02T10:14:48Z
updated_at: 2026-10-02T12:15:37Z
parent: cssints-9js6
---

## Question

Decided with the user: add `fn()` to `cssints/plugin` (a value function: an mdn grammar string and `computeTo(args) -> string | CSSStyleValue`, build-time only, plugins.md §4.3) and a small set of built-ins in cssints itself: `colorMix`, `clamp`, `min`, `max` (at least), typed so a token can be an argument and the result is a part of a property. Each helper is a grammar-checked value at build time; `computeTo` may return a Typed OM value. Decide which built-ins are worth it (colorMix with a token argument is the motivating case) and how a helper's error reads. Fixtures, type tests, bench within budget, API.md "Functions" section (the doc test must pass), a use in the demo if natural.

## Summary of Changes

- `fn(grammar, computeTo, name?)` in `cssints/plugin` (author.ts, author-types.ts). Parts are checked like a member's (types and build); `computeTo(args: string[])` runs at build time, a token arrives as `var(--name)`. The result is returned as is: a Typed OM value keeps its type (a `CSSColorValue` is a `<color>`), a string is opaque to the types and checked in the declaration it lands in. Errors are `MemberError` with `pluginName` = `name` (default `fn`) and the call site. A site that is a string is now replaced by its text (macro.ts, one line).
- Built-ins in cssints (functions.ts, grammars.ts, types.ts, `named` in macro.ts): `colorMix(space, a, b)` on `fn`, and `min`, `max`, `clamp` as plain calls typed `CSSStyleValue<T>` (T: first typed argument, default length, or given). All four kept: a token cannot go into a template string in the types.
- Fixtures plug-fn*, fn-builtins*, asserts in test/plugins.mjs, type tests test/types/plugins.ts and functions.ts, bench/functions.ts row (327999 tsc / 339633 tsgo), API.md "Functions", plugins.md row, demo use (Showcase hover).
