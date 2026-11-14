---
# cssints-kxew
title: 'The reading-progress bar: progress() in reveal and createScrollProgress in headless'
status: completed
type: feature
created_at: 2026-11-14T10:34:41Z
updated_at: 2026-11-14T10:34:41Z
---

The scroll-driven catalogue (scroll-driven-animations.style) added one thing the kit did not have: a bar whose fill is the scroll position. The plan (this session) was a plugin member, a polyfill and headless components; most of it already existed.

## Shipped

- `@cssints/reveal` `progress().axis("x" | "y").timeline().range()`: the element's own `scale`, scrubbed by a scroll timeline (`scroll(root)` and `normal` by default, x from the left edge). The kernel sets `animation`, `animation-timeline`, `animation-range`, `transform-origin`, and carries both axes' keyframes (a chain method that emitted a keyframes name carried no rule of its own). No fallback: a scrub cannot be played once, so the bar is not drawn where the timeline is missing; the support warnings stay.
- `@cssints/headless` `createScrollProgress({ root?, axis?, onChange? })`: `progress` (0..1, 1 when nothing scrolls), `scrolled`, `distance`, `barProps` (`role="progressbar"`, `aria-valuenow`), `attach()` = one passive scroll listener + one `ResizeObserver` + a sync. The JS half of the bar and the only thing an animation cannot give: the ARIA value.
- `apps/ui` starter `progress` (registry item 63): one bar element with both halves — the native animation wins over the inline scale where it runs, so the bar is never drawn twice; the pane is the scroll container for both (`scroll(nearest)` and `root`), focusable for keyboard scrolling. 3 conformance tests, 3 stories.

## Decided

- **The polyfill stays rejected.** flackr's scroll-timeline (61 kB min, 17 kB gzip, rewrites stylesheets, works on every scroll) against 605 B one-shot IO for entrances, and for a bar the JS listener is smaller than the polyfill and also provides the ARIA. Revisit only if scrubbing outside Chrome becomes a requirement.
- Grammar: no change needed. Every value from the catalogue compiles (`scroll()`, `view(y 20%)`, `animation-range: entry 0% cover 40%`, `view-timeline`, `scroll-timeline`, `timeline-scope`, `timeline-trigger`) — unlike `shape()`.
- A separate package would be the 33rd slot for one member plus 20 lines of CSS; the bar went into `reveal`, which already owns scroll-driven CSS.

## Checks

`packages/reveal/test/reveal.mjs` (the kernel's declarations and both keyframes, axis/timeline/range, the conflict message, the timeline warnings kept, 4 target sets), `packages/headless/test/scrollprogress.browser.test.tsx` (6: fraction and ARIA, clamping, a short container is 1, the inline axis, teardown, the document), `apps/ui` typecheck and conformance, the site's own test, docs blocks, lint and diff-check.
