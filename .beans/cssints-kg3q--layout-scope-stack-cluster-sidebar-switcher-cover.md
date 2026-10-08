---
# cssints-kg3q
title: 'layout scope: stack(), cluster(), sidebar(), switcher(), cover(), autoGrid()'
status: completed
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:12:33Z
parent: cssints-dk1q
---

## What
Every-Layout style primitives as chain members with one kernel each, custom properties for gap/min/threshold.

## Sources
- https://smolcss.dev/ (smol grid, stack, sidebar, cluster)
- https://github.com/christiankaindl/LYTS
- https://github.com/kettanaito/atomic-layout
- https://github.com/basarat/gls
- https://evanminto.com/blog/intrinsically-responsive-css-grid-minmax-min/ (`minmax(min(100%, N), 1fr)`)
- https://gomakethings.com/automatically-wrapping-css-grid/
- https://ishadeed.com/article/smart-layouts-talk-css-day/
- https://www.joshwcomeau.com/css/container-queries-unleashed/

## Shape
- scope `layout`; each member a chain: `stack().gap(2)`, `cluster().gap(2).justify("between")`, `sidebar().side("left").width("20rem").content("50%")`, `switcher().threshold("30rem").gap(2)`, `cover().minHeight("100vh")`, `autoGrid().min("16rem").gap(2)`.
- `spacing: true` on gap methods. Kernels written as styles so conflicts derive (display, gap, grid-template-*).
- Check what `flex()`/`grid()` already chain so the kernels do not duplicate engine contexts.

## Todo
- [x] kernels for the six primitives
- [x] chain members + conflicts
- [x] fixtures, type test
- [x] demo usage in apps/demo (deferred: would conflict with the parallel plugin branches, do it after the merge)

## Engine gaps

- **A kernel written as styles cannot address children.** sidebar() and switcher() need rules on `& > :first-child` and `& > *`; the styles form has conditions on the element only (pseudo-classes, attr(), within(), media, container, supports). Worked around with a second, raw kernel per primitive (`-base`) for the child rules; the container properties stay in the styles kernel (`-core`), so conflicts still derive. Repro: `scope("x", { "#k": { css: (css) => [/* no way to write & > * { flex-grow: 1 } */] }, x: { uses: ["k"], chain: {} } })`.
- **A kernel written as styles cannot set a custom property** (no `--x` setter among the css.* members), so the defaults of the custom properties (which stop a nested primitive from inheriting its parent's values) live in the same raw `-base` kernel. Cost: two kernel classes per call instead of one. Repro: `"#k": { css: (css) => [css.gap("var(--_gap)") /* --_gap: 1rem cannot be written here */] }`.
- Config, not engine: the `inputs` of vite.config.ts do not list packages/layout/test/fixtures, and only `packages/cssints/test/types/**` has the no-unsafe rules off. So the fixtures carry `@ts-expect-error`, twice.ts a file-level `oxlint-disable`, and the type test writes `void x.method;` instead of a call. Adding `packages/layout/test/fixtures/**` to `inputs` (and to .prettierignore) would let those go.

## Summary of Changes

- New package `packages/layout` (`@cssints/layout`): one `scope("layout")` with six chain members, `stack().gap()`, `cluster().gap().justify().align()`, `sidebar().side().width().content().gap()`, `switcher().threshold().gap()`, `cover().minHeight().gap()`, `autoGrid().min().gap()`. Gap methods take spacing steps; every method sets a `--layout-<primitive>-*` custom property.
- Each primitive: a `-core` kernel written as styles (display, gap, the flex or grid properties, so `cn()` conflicts derive) and a raw `-base` kernel with the defaults (no leak into nested primitives) and the child rules (Every Layout's sidebar and switcher; `side("right")` swaps the children's `flex` and `min-inline-size` variables, DOM order kept). autoGrid is `repeat(auto-fit, minmax(min(var(--min), 100%), 1fr))`.
- No overlap with the engine's flex() and grid(): those chain the real container properties; these are fixed recipes over custom properties.
- Tests: test/layout.mjs (kernels, method classes, a condition, derived conflicts, grammar errors, a method used twice) and test/types/layout.ts. Checked by hand in Chrome (sidebar wraps, side right, switcher threshold, autoGrid columns).
- README: example, emitted CSS, rules, limits.
- Deferred: demo usage in apps/demo (conflicts with the parallel plugin branches).
