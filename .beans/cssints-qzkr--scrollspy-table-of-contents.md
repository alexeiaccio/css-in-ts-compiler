---
# cssints-qzkr
title: Scrollspy table of contents
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T17:32:49Z
parent: cssints-65eb
---

apps/docs Page.tsx keeps a scroll listener and sets aria-current="location" by hand; no APG pattern exists.

- [x] headings from the content or a passed list; the active one is the last passed the top
- [x] aria-current="location" on the link, not on the heading
- [ ] a smooth-scroll hook that respects prefers-reduced-motion
- [ ] adopt in apps/docs Page.tsx

## Notes

- `createScrollspy` landed in `@cssints/headless` (`packages/headless/src/scrollspy.ts`, oracle `test/scrollspy.browser.test.tsx`): a passive scroll listener on the root, not an IntersectionObserver (a total order over the headings, which a band observer would have to rebuild from enter/leave state). `offset` is px below the scrollport's top edge.
- No smooth-scroll hook: the links are plain `#id` targets, so `scroll-behavior` on the host (and its `prefers-reduced-motion` override) decides. A helper would duplicate the platform.
- Left: adopting it in `apps/docs/src/Page.tsx` (its `Outline`), a separate change in that app.
