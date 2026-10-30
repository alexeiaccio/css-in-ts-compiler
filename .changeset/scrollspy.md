---
"@cssints/headless": minor
---

`@cssints/headless`: `createScrollspy`, a table of contents whose current entry is the last heading to reach the top of the scrollport, with `aria-current="location"` on that link (exactly one at a time) and `role="list"` items. One passive `scroll` listener on the root (the document by default; `offset` is px below its top edge, so a sticky header passes its height), no `IntersectionObserver`: a total order over the headings is what the reader sees, and a band observer has to rebuild it from enter/leave state. Smooth scrolling stays the host's CSS. No APG pattern exists for a scrollspy, so `test/scrollspy.browser.test.tsx` is its oracle.
