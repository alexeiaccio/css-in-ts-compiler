---
# cssints-rl3n
title: 'reactive: numbers from layout (container queries + a typed @property), per noscript.ing'
status: completed
type: feature
priority: low
created_at: 2026-11-06T11:11:50Z
updated_at: 2026-11-15T00:00:00Z
---

Reference: https://noscript.ing/compute — Computing with CSS Layout (Agustin Capeletto). Layout as the calculator: a query container's width read back as a number with `round(100cqw / 1px)` into an `@property`-registered `<integer>`, then used in calc(), printed by a counter, or fed back as a width. Primitives: an auto grid column is max(), a hug-width flex row is a sum, `order` sorts (read the middle column for a median), `anchor()` gives a distance and so a rank, `sibling-index()` an index. For 300 changing numbers: item-by-index 99 ms / 31 KB of CSS in calc() vs 3.9 ms with layout; rank 95 ms / 5 MB vs 6 ms.

@cssints/reactive writes state into the DOM and computes attributes from it; this is the other direction — a derived value read off content, with no state at all. The kit uses `100cqw`/`100cqh` as lengths in the sparkline's hypot/atan2, never as a number; the engine can emit an `@property` (surface.ts does it by hand) but has no member for a typed numeric one.

Done when: one experiment on a real starter — a meter or a column chart whose scale is the max() of its siblings' values, read back with `100cqw / 1px` and printed by a counter, with a test asserting the printed number is the largest value and that the fallback (no container query units) still shows the same numbers as text. Then a written verdict on whether the engine grows a typed `@property` member or the pattern stays in the starters.

## Done (2026-11-15)

Shipped the experiment and the verdict (wayfinder, same date).

- **Starter** `apps/ui/src/registry/scale/` (registry item 65): a bar list whose scale is its own largest value. Marks sized
  `value` px in one `auto` grid column (the grid algorithm is the max), a `container-type: inline-size` item stretched to that
  column, `--scale: round(100cqw / 1px)` read inside it into a registered `<integer>`, bars at
  `calc(var(--value) / var(--scale) * 100%)`, and a counter printing the number. `scale.css` carries the `@property`; the
  stats show the values as text where container units are missing (the bars and the readout hide, the numbers do not).
- **Verdict: no engine member.** The registration is global and per-name where cssints's unit is a class (the conflict rules
  are `token.set()`'s), and the read is a dynamic value, which is inline `style` by the documented boundary. `scale.css` beside
  the component is the shape, as the hardware skin already does.
- **The engine was already enough** for the rest: `containerType`, the `auto` grid, the division inside `calc()`,
  `counterReset("result var(--scale)")`, `before(content("counter(result)"))`, the `@supports not (width: 1cqw)` fallback — and
  the grammar correctly refuses `round(100cqw / 1px)` as a length, naming the type.
- **Checks:** 3 browser tests (Chromium 156) reading the registered value off `getComputedStyle`, the counter off
  `counter-reset`, the shares off the bars; the site's conformance suite and its Chrome run; typecheck, fmt, lint.
- **Left:** typed `attr()` and `@function` (limited availability) would remove the inline read; nothing else in this direction
  is worth a member until then.
