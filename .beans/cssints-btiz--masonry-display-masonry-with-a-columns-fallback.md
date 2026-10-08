---
# cssints-btiz
title: 'masonry(): display masonry with a columns fallback'
status: completed
type: feature
priority: normal
created_at: 2026-10-08T08:55:58Z
updated_at: 2026-10-08T13:47:35Z
parent: cssints-dk1q
---

## What
`masonry().columns(min).gap(..)`: native masonry (`display: masonry` / `grid-template-rows: masonry`) with a pure-CSS `columns` fallback (no JS polyfill: too heavy). Low in tier 2.

## Sources
- https://github.com/lxsmnsyc/solid-mason
- https://github.com/jaredLunde/masonic

## Todo
- [x] kernel with requires + fallback rule
- [x] fixture

## Engine gaps

- **The grammar has no `display: grid-lanes`.** mdn-data 2.27.1's `<display-inside>` is `flow | flow-root | table | flex | grid | ruby`: no `grid-lanes` (nor `inline-grid-lanes`), and no `flow-tolerance` property, although @mdn/browser-compat-data 8.1.3 has `css.properties.display.grid-lanes` (Safari 26.4). Repro (packages/masonry/test/fixtures/gap-display.ts, asserted in test/masonry.mjs):
  ```ts
  import { display } from "cssints" with { type: "cssints" };
  export const a = display("grid-lanes"); // type error, and the build: display: unexpected "grid-lanes" in "grid-lanes", expected <display-outside> | <display-inside> | ...
  ```
  Workaround: the kernel is raw CSS (`"#lanes": { css: "&{...display:grid-lanes...}" }`) with a hand-written `conflicts` entry instead of derived conflicts. When the grammar knows the value, the test fails: write the kernel as styles and drop the conflicts entry.

## Summary of Changes

- packages/masonry (@cssints/masonry): `masonry().columns(<length>).gap(<length> | step)`, one chain member on `scope("masonry")`.
- Native: `display: grid-lanes` (the CSSWG's settled syntax, CSS Grid 3; Safari 26.4, Chrome/Edge 140+ and Firefox behind flags), `grid-template-columns: repeat(auto-fill, minmax(min(var(--masonry-min), 100%), 1fr))`, `gap`; kernel `requires: ["css.properties.display.grid-lanes"]`.
- Fallback: a CSS-only runtime (`polyfills` the same BCD key), in the sheet only when a target lacks grid lanes: `@supports not (display:grid-lanes)` multi-column (`columns: var(--masonry-min)`; the children inline blocks a column wide with a bottom margin of the gap, since WebKit carries a block's margin across a column break). Items go down each column (documented).
- Tests: test/masonry.mjs (kernel, method classes, conditions, fallback present for default targets and absent for `BROWSERSLIST=safari 26.4`, no warning, conflicts, grammar errors, the gap repro, a build through LightningCSS), test/types/masonry.ts, test/browsers.mjs (`test:browsers`: Chrome 154 and Firefox 155 columns, WebKit 26.6 native and columns, a plain-grid control that must fail).
- README with example, emitted CSS, browsers, rules, limits.

## Deferred

- `flow-tolerance`, horizontal masonry (rows as lanes), spanning items; derived conflicts once the grammar knows grid-lanes.
