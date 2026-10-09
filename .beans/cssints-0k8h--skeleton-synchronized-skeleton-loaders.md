---
# cssints-0k8h
title: 'skeleton(): synchronized skeleton loaders'
status: completed
type: feature
priority: low
created_at: 2026-10-08T08:55:58Z
updated_at: 2026-10-09T07:40:58Z
parent: cssints-dk1q
---

## What
`skeleton().radius(..)` kernel: shimmer keyframes with `animation-delay` derived from a shared timeline so every skeleton on the page is in phase.

## Sources
- https://github.com/crutchcorn/sync-skeleton
- https://oscargabriel.dev/blog/skeletons-in-my-codebase

## Todo
- [x] kernel + chain
- [x] fixture

- [x] browser test (sync phase, reduced motion)
- [x] README

## Engine gaps

- **A kernel written as styles cannot reach an ancestor of its element.** The clock is `:root:has(&){animation:...}`, so it
  is a raw kernel (`clock`) with raw `@keyframes _skeleton-clock` and `atProperty`. Repro, in a scope module imported with
  the attribute: `core: { css: (css) => [css.nest(":root:has(&)")(css.opacity(1))] }` → `cssints: nest() takes a
  selector that starts with & and a combinator (...), got ":root:has(&)"`.
- **`--_x` is not expanded inside a `keyframes()` made in a kernel.** `core: { css: (css) => [css.vars({ "--_k":
  keyframes({ from: css.vars({ "--_p": "0%" }) }) })] }` in scope `gap2` prints `@keyframes kf-…{from{--_p:0%}}`
  beside `._gap2-core{--gap2-k:kf-…}`: the step keeps `--_p` where the kernel has `--gap2-p`. (Animating a custom
  property from keyframes() needs `css.vars` in a step, which only a kernel's `css` has; user code has no member for it.)

## Summary of Changes

- `packages/skeleton` (`@cssints/skeleton`): `skeleton().radius().color().highlight()`. Kernel `core` (styles): a
  gradient three viewports wide, `background-attachment: fixed`, `background-position: var(--skeleton-p) 0`, colours and
  radius as `var(--skeleton-*, default)` (currentColor at 12% and 4% in oklab). Raw kernel `clock`: `@property
  --skeleton-p` (inherited percentage), one `@keyframes` and `:root:has(._skeleton-clock)` running it under
  `prefers-reduced-motion: no-preference`. Runtime `#grey`: rgb greys under `@supports not (color-mix)`, covering the
  color-mix warnings (Chrome 109 in the defaults).
- Sync: one animation on :root, every skeleton inherits its value, so phase is shared regardless of mount time; fixed
  attachment makes it one sweep across the page (iOS: per-element band, still in phase). Rejected: fixed with
  per-element animations (space only), document.timeline delays (JS), animation-timeline (no document timeline in CSS).
- Tests: test/skeleton.mjs (sheet, classes, fallback in/out by targets, no warnings, derived conflicts, hover(skeleton())
  error, grammar errors), test/types/skeleton.ts, test/browsers.mjs (Chrome, Firefox, WebKit: A/B mounted 700 ms apart
  match at 300/300 columns, a self-animated control differs at 132; reduced motion: no animation, base colour).
- README with example, emitted CSS, sync explanation, browsers table, limits.
