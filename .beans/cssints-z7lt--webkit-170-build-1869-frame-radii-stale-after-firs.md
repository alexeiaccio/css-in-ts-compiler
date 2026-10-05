---
# cssints-z7lt
title: 'WebKit 17.0 (build 1869) and later to 2104: rem read wrong while a custom-property transition runs, frame() radii stale'
status: completed
type: bug
priority: low
created_at: 2026-10-03T13:08:17Z
updated_at: 2026-10-05T11:53:24Z
---

In Playwright's WebKit 17.0 (build 1869, playwright-core 1.36.2) the first style pass computes padding(3) = 0.75rem as 0.75px for a card whose padding changes under a container query (the post card of apps/sky, dev/posts). The next frame corrects it (12px) without a transitionrun on the sentinel, so the frame runtime keeps the first value: the quote and the media inside the card keep radius 18.25px instead of 7px until something else triggers an update. Builds 1944 (17.4, no style queries) to 2182 are fine. Found by apps/sky/test/safari.mjs (cssints-7gq2). Unknown whether Safari 17.0-17.3 releases show it: needs a real device. Possible fixes: re-read once per frame after an insert (cost), or a ResizeObserver on container elements.

## Summary of Changes

Root cause (not the first style pass, not container queries): in WebKit builds 1869 to 2104 (Safari 17.0 to 18.2; 2182 is fixed), while a transition on a registered custom property runs on an element, that element's `rem` lengths are computed wrong, also through `var()`: 1869 reads 0.75rem as 0.75px, 1944 to 2104 read rem as the element's own font size (hidden where it equals the root's, as in the post card). `em` and plain lengths are right. The frame sentinel (`transition: --_t 1ms`) is such a transition, so the runtime read a wrong `--_i` and wrote it to the children; the correction comes when the transition ends, in a normal style pass that starts no new transition, hence no second transitionrun. Minimal case: registered `--t`, `.a{--p:.75rem;padding:var(--p);--t:var(--u);transition:--t 1ms}`, then `a.style.setProperty('--u','5px')`.

Fix: packages/cssints/src/parent-vars.ts listens to `transitionend` as well as `transitionrun` (the style is right when it fires). +16 B gzip (1754 B min / 881 B gzip to 1804 B / 897 B). Cost where the runtime is on and the browser is fine: 1 ms per load of dev/posts in Firefox 128 (75 events), 3 ms in 17.4 (57), against 10 and 8 ms for the transitionrun handler; no loop (event counts flat 1.5 s after settle). Test: a frame with a rem padding in a 20 px font in test/browsers.mjs (fails in 1869 without the fix). safari.mjs passes for 17.0, 17.4, 18.5 and real Safari 26.3.1; test:browsers passes in Chrome, Firefox 155, WebKit 26 and WebKit 1869 to 2182 and Firefox 128. Notes in docs/research/plugins.md section 3.7.
