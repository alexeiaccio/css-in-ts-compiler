---
# cssints-z7lt
title: 'WebKit 17.0 (build 1869): frame() radii stale after first paint under a container query'
status: todo
type: bug
priority: low
created_at: 2026-10-03T13:08:17Z
updated_at: 2026-10-03T13:08:17Z
---

In Playwright's WebKit 17.0 (build 1869, playwright-core 1.36.2) the first style pass computes padding(3) = 0.75rem as 0.75px for a card whose padding changes under a container query (the post card of apps/sky, dev/posts). The next frame corrects it (12px) without a transitionrun on the sentinel, so the frame runtime keeps the first value: the quote and the media inside the card keep radius 18.25px instead of 7px until something else triggers an update. Builds 1944 (17.4, no style queries) to 2182 are fine. Found by apps/sky/test/safari.mjs (cssints-7gq2). Unknown whether Safari 17.0-17.3 releases show it: needs a real device. Possible fixes: re-read once per frame after an insert (cost), or a ResizeObserver on container elements.
