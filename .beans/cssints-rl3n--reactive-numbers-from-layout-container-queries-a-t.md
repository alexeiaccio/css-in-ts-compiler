---
# cssints-rl3n
title: 'reactive: numbers from layout (container queries + a typed @property), per noscript.ing'
status: todo
type: feature
priority: low
created_at: 2026-11-06T11:11:50Z
updated_at: 2026-11-06T11:11:50Z
---

Reference: https://noscript.ing/compute — Computing with CSS Layout (Agustin Capeletto). Layout as the calculator: a query container's width read back as a number with `round(100cqw / 1px)` into an `@property`-registered `<integer>`, then used in calc(), printed by a counter, or fed back as a width. Primitives: an auto grid column is max(), a hug-width flex row is a sum, `order` sorts (read the middle column for a median), `anchor()` gives a distance and so a rank, `sibling-index()` an index. For 300 changing numbers: item-by-index 99 ms / 31 KB of CSS in calc() vs 3.9 ms with layout; rank 95 ms / 5 MB vs 6 ms.

@cssints/reactive writes state into the DOM and computes attributes from it; this is the other direction — a derived value read off content, with no state at all. The kit uses `100cqw`/`100cqh` as lengths in the sparkline's hypot/atan2, never as a number; the engine can emit an `@property` (surface.ts does it by hand) but has no member for a typed numeric one.

Done when: one experiment on a real starter — a meter or a column chart whose scale is the max() of its siblings' values, read back with `100cqw / 1px` and printed by a counter, with a test asserting the printed number is the largest value and that the fallback (no container query units) still shows the same numbers as text. Then a written verdict on whether the engine grows a typed `@property` member or the pattern stays in the starters.
