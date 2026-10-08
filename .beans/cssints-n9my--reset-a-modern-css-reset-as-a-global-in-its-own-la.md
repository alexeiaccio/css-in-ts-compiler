---
# cssints-n9my
title: 'reset(): a modern CSS reset as a global in its own layer'
status: completed
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:12:55Z
parent: cssints-dk1q
---

## What
`reset()` emits a small modern reset as `{ rule, layer: "reset" }` globals, declared below the app layers so anything beats it.

## Sources
- https://jakelazaroff.com/words/my-modern-css-reset/
- https://vale.rocks/posts/css-reset
- https://github.com/elad2412/the-new-css-reset
- https://piccalil.li/blog/my-favourite-3-lines-of-css/
- https://impeccable.style/
- https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025

## Shape
- scope `reset`, one `layers: ["reset"]` entry and one global; options as flags: `reset({ prose?: boolean, media?: boolean })`.

## Todo
- [x] pick the rule set (jakelazaroff + piccalil 3 lines)
- [x] global + layer
- [x] fixture

## Engine gaps

- No top-level layer below the engine's: the sheet prints `@layer _.k, _.a, …;` first and every declared layer (`layers()`, a `layers` entry) after it, so `{ rule, layer: "reset" }` with `layers: ["reset"]` ranks *above* the classes. Repro: a scope with `"#l": { layers: ["reset"] }, "#g": { rule: "* { margin: 0 }", layer: "reset" }` and a member using both, next to `p(2)`: the sheet is `@layer _.k, _.a, …; @layer reset; … @layer reset { * { margin: 0 } }`, and `* { margin: 0 }` beats `._x{margin:…}` in `_.a`.
- Workaround in the package: a global with no layer whose text is `@layer reset { … }`; it is printed inside `@layer _.k { … }`, i.e. `_.k.reset`, which ranks below `_.k`'s own rules and so below everything. A user stylesheet cannot name a layer between the reset and cssints. A fix would be a way to declare layers before `_.k` (e.g. `layers()` with a "before engine" position).

## Summary of Changes

- packages/reset (@cssints/reset): `reset({ media?, prose? })`, a call member of `scope("reset")` returning globals. Base: border-box, `* { margin: 0 }`, html line-height 1.5 and text-size-adjust, form controls inherit font/colour, overflow-wrap, text-wrap balance/pretty, markers off only for `[role="list"]` (Safari list semantics). `media`: block, max-inline-size 100%, block-size auto for img/video. `prose`: flow spacing (1em) between classless flow elements, heading line-height 1.25. Each block is its own global (deduped by text).
- Layer: nested `_.k.reset` (see Engine gaps); the test asserts the sheet order (`_.k` statement, `app`, reset first inside `_.k`, before `global()` rules, `@layer app`, `_.a`).
- test/reset.mjs (fixtures use.ts, base.ts), test/types/reset.ts (flags typed, wrong flag/value/shape are errors), README.
- Deferred: per-rule opt-outs, focus/disabled/table/abbr rules from vale.rocks, `interpolate-size`.
