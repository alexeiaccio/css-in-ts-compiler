---
# cssints-k6i0
title: 'native: cells to %c spans — the console sink'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-11-04T10:36:36Z
updated_at: 2026-11-05T10:26:30Z
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


## Summary of Changes
- `terminal/cells.c`: `cells_console` / `cells_console_text` — a grid to one `console.log` call: a `%c` run a foreground/background pair, a row a line, every cell of the row (the trailing spaces carry the background), a literal `%` doubled so the format does not read it. The Swift-style palette indices are resolved to `#rrggbb` from the cells' own palette.
- `solid/native/term.c` + `terminal/term.ts`: `term_console(path, mode)` (0 the whole frame, 1 the changed rows appended, 2 whole frames appended for the test's mutation); `terminal/solid.ts --console [file]` and `--console-frames [file]`, and `--bench` prints the sink's bytes and ms beside ANSI's.
- Check `terminal/console.mjs` (11 checks): the JSON parses back to the ANSI dump's 1,600 cells, glyph and both truecolours equal; the text dump a cell for a cell (its `.` ambiguous, skipped); the diff; the mutation; the numbers; the busy Sky page.
- Numbers: Sensors 3,315 B against ANSI's 3,018 B (1.10x), 0.09-0.14 ms against 0.13-0.23 ms (file write included); Sky 5,449 B, 98 runs.
- The honest limit is in the map: a cell's width is the console's — a proportional console font or a wide glyph breaks a row the sink cannot know.
