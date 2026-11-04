---
# cssints-cs5u
title: 'native: the console prints only its changed cells'
status: todo
type: feature
tags:
    - wayfinder:task
created_at: 2026-11-04T10:36:36Z
updated_at: 2026-11-04T10:36:36Z
parent: cssints-1ttw
---

The rule the reference states and we already keep from the other side: **a frame with no changed cells writes nothing**, and a frame that changed prints only what changed.

We have the equivalent at the command level (`ui.hash` → `0 draws` at rest, checked by the idle tests). The console sink needs it at the cell level, because a console has no double buffer: every write scrolls, so a full frame a tick is unusable.

The work:
- compare the new grid to the previous one; each row emits only its changed runs, a row with none emits nothing;
- if no row changed, the frame writes nothing at all (not even an empty line);
- the check: 30 frames at rest → 0 writes; a key that moves one cell → exactly that cell's row and run (count the bytes); a re-mount (new tree, same cells) → still nothing;
- a mutation: diffing against the wrong frame (the new one) makes the idle check fail with its count.

Record next to the desktop's hash rule that this is the same idea, discovered independently by the reference — a corroboration, not a port.
