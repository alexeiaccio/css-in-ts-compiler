---
# cssints-qzkr
title: Scrollspy table of contents
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-31T14:52:44Z
parent: cssints-65eb
---

apps/docs Page.tsx keeps a scroll listener and sets aria-current="location" by hand; no APG pattern exists.

- [x] headings from the content or a passed list; the active one is the last passed the top
- [x] aria-current="location" on the link, not on the heading
- [ ] a smooth-scroll hook that respects prefers-reduced-motion
- [x] adopt in apps/docs Page.tsx: `createScrollspy({ entries, offset: ANCHOR })` with `onSettled(() => spy.attach())` and `aria-current={spy.active() === e.id ? "location" : "false"}` in `Outline` (apps/docs/src/Page.tsx); `apps/docs/test/browser.mjs` pins the mark and the scroll

## Notes

- `createScrollspy` landed in `@cssints/headless` (`packages/headless/src/scrollspy.ts`, oracle `test/scrollspy.browser.test.tsx`): a passive scroll listener on the root, not an IntersectionObserver (a total order over the headings, which a band observer would have to rebuild from enter/leave state). `offset` is px below the scrollport's top edge.
- No smooth-scroll hook: the links are plain `#id` targets, so `scroll-behavior` on the host (and its `prefers-reduced-motion` override) decides. A helper would duplicate the platform.
- Adopted in `apps/docs/src/Page.tsx` (its `Outline`): see Adopted below. Left: the smooth-scroll box, which is a decision (no hook: the host's `scroll-behavior`) rather than work.

## Adopted

The docs' aside is the host: `apps/docs/src/Page.tsx`'s `Outline` calls `createScrollspy({ entries: props.entries.map(...), offset: ANCHOR })`, attaches after the first settle (`onSettled(() => spy.attach())`), and writes `aria-current="location"` from `spy.active()`. `ANCHOR` is 56 + 16 px (the sticky header plus the page's `scrollPaddingTop`), the same line the old hand-rolled listener used. The remaining box is not adoption work: the links are plain `#id` targets and no smooth-scroll hook exists on purpose (see Notes); the app sets no `scroll-behavior`, so there was nothing to wire.
