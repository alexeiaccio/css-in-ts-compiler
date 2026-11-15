---
# cssints-p1f7
title: A learned snap point in the resizable panels
status: completed
type: feature
created_at: 2026-11-15T07:29:16Z
updated_at: 2026-11-15T07:29:16Z
---

Harsh Agrawal's article (imharsh.in/snappy-resizable-panels) argues that people drag a sidebar back to one favourite width again and again, never to the same pixel, so the hook learns it: a mark per release, marks weighted by recency, hills, the tallest hill as the snap point once about three drags agree, a sticky point, a magnet inside 10 px, and a pause that lets go so the widths beside it stay reachable. The keys never snap.

`createResizablePanels` took it as `snap` (off by default): a histogram on a half-percent grid with a mark halving every five drags (SNAP_DECAY), a point at weight 2 (about three recent drags), spent hills dropped under 0.05; the zone is 10 px measured off the group at drag time (percent would be 200 px on a wide group); Alt during the drag asks for the exact width instead of a pause timer (exact, discoverable, testable — and the primitive has no clock); the point is sticky inside its zone; `keyDown` never snaps. `snapPoint(index)` exposes the learned width; the starter marks it on the grip (data-snap -> the accent) and enables `snap` in its workspace demo.

Checks: two browser tests in packages/headless (learn after three releases in one hill, stick inside the zone, Alt bypass, follow past the zone; the keys never snap and `snap` off does nothing), the starter's conformance test, the whole headless suite (the spec walks run without `snap`), apps/ui typecheck, wayfinder and the README/docs sections. Left: persistence of the hills (the article's `initial`), a snap point per pane instead of per separator, and a hint in the live region when the edge sticks.
