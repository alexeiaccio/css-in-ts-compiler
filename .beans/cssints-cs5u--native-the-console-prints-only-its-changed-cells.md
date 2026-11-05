---
# cssints-cs5u
title: 'native: the console prints only its changed cells'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-11-04T10:36:36Z
updated_at: 2026-11-05T10:26:30Z
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


## Summary of Changes
- The sink diffs the new grid against the frame before it (`cells_console(g, prev, out)`), cell by cell on the glyph and both **colours** (the palettes may differ), and writes only the rows that changed; a row with nothing changed writes nothing, and a frame with no change writes `[]`.
- A changed row is printed **whole**: a console line starts at column 1, so a run of changed cells cannot be printed on its own (the reference's "runs" are a row's runs here; said in the map and the README).
- Check `terminal/console.mjs`: 30 frames at rest write 30 `[]` lines, 90 bytes, no console line; Tab on the Sensors pill writes its 3 rows (9, 10, 11), each the new frame's cells; the mutation (`--mutate console`, whole frames appended) writes 20 rows an idle frame, so the idle check's count fails.
- The rule is recorded next to the desktop's hash rule (`ui.hash` → `0 draws`): the same idea found independently by the reference — a corroboration, not a port.
