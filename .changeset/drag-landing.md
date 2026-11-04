---
"@cssints/headless": minor
---

A pointer drag says where it will land (`state().landing`, the origin the release will commit, snapped, clamped and `null` when no drag runs), and when the commit has to move the node — a world-bound clamp — `state().drop` gives the correction as `from`/`to`, so a host can draw the landing and animate the move.
