---
# cssints-k6i0
title: 'native: cells to %c spans — the console sink'
status: todo
type: feature
tags:
    - wayfinder:task
created_at: 2026-11-04T10:36:36Z
updated_at: 2026-11-04T10:36:36Z
parent: cssints-1ttw
---

`native/console/` — a sink that takes the terminal's cells and prints them as `%c` spans: the same grid (`terminal/cells.c`'s code point and palette index a cell), run-length encoded per row into a span a run with its truecolour foreground and background from the palette `render.c` already resolved, and one `console.log` assembling the runs. No terminal, no `termbox2`, no canvas: the sink's input is the cells, and its output is a string (so a headless run can print it and a test can compare it).

The work:
- the sink itself: cells → the run-length string, in ~100 lines, over the existing grid (do not copy `cells.c`; call it);
- the headless entry (`bun terminal/console.ts --page sky --dump-console`), the way `terminal/solid.ts --dump` writes cells today;
- the check: the string parses back to the same cells as `--dump` (run by run, the palette entry's rgb in the span's colour, the code point in the span's text), and its truecolour matches the ANSI dump's SGR values;
- the numbers: bytes a frame, the sink's ms (the cells are already the cost; say what the string adds).

Out of scope: the browser itself (that is the page), the diff (its own bean), FIGlet.

The honest limit to write down: a console cell's width is the console's, not ours — a proportional console font or a wide glyph breaks a row the way a terminal's does, and the sink cannot know.
