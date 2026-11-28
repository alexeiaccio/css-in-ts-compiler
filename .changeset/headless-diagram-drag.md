---
"@cssints/headless": minor
---

The diagram's link drag is the primitive's, not each skin's. `frameProps` carries the moves, the release, the cancel and the
lost capture; `nodeProps.onPointerDown` starts a press; a press that travels less than `dragThreshold` (default 4 px, the
pointer machine's `DRAG_PX`) is still a click, past it the link is pending, and the release commits on a node or cancels. The
pointer capture is taken and released by the primitive, and the click a browser sends after a drag activates nothing.

`linking()` is the declarative half: while a drag runs it reports `{ from, point, to?, allowed }`, so a skin draws the one
line a release would make without hit-testing; while a link is pending every other node carries
`data-link-target="allowed" | "blocked"` — the reachable set as attributes. `apps/ui`'s diagram drops its own 6 px threshold
and its forty lines of pointer plumbing.
