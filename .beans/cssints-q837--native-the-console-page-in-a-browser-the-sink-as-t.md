---
# cssints-q837
title: 'native: the console page in a browser (the sink as the display)'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-11-04T10:36:36Z
updated_at: 2026-11-05T10:26:30Z
parent: cssints-1ttw
---

The console target in a browser: a page whose display is the console. `browser/solid/console.ts` + `console.html`, `mountPage` with the console sink as its surface (no canvas, or a canvas that stays blank so the canvas-shaped shell still works), keys through `browser/solid/keys.ts` into the page's `Input`, the frame printed by the sink and diffed.

The work:
- the page, and what `mountPage` needs to be without a canvas (say it: a sink interface rather than a `CanvasRenderingContext2D`, or a null surface);
- a note in the page for the reader: "open the console";
- the check in Chromium (Playwright's `console` event captures the messages): the frames' cells equal the terminal's `--dump` for the same page and the same keys (Tab, Space on the Widgets switch or the Sky tabs), the idle rule holds (no messages), and the canvas has no pixels;
- the numbers: bytes a frame, the sink's ms, the page's bundle size, and how far behind the terminal's frame time it is.

Out of scope: text input (a console has no editing model; the Field page cannot run here), a11y, and an npm-style "framework" — this is a sink we own.


## Summary of Changes
- `browser/solid/console.ts` + `console.html`: the Sensors page at 80x20 cells (the terminal's `cellStyle` through the value channel, the terminal's measure in place of Canvas2D's), the canvas dark, the display the console; Tab the ring and Space/Enter the pill's own press; `p` reprints the frame for a reader.
- `browser/ui.c` + `browser/build.sh`: the terminal's `render.c` and `cells.c` compiled into `ui.wasm`, with `ui_term_render`, `ui_term_console` (the same three modes), `ui_term_console_ptr/len`; `browser/solid/ffi-browser.ts` wraps them.
- `browser/solid/shell.ts`: `sink: "console"` (no canvas paint; the sink logs one line a frame when a cell changed), `beforeTree` (the cell plan runs after the page's motion and before the tree), `window.__page.cells()` (the whole frame, no log, no diff state), and a console measure (one cell a code point) chosen by the sink.
- Check `browser/console-check.mjs` (9 comparisons): the page's frame equals the terminal's cell for cell at rest, after Tab and after a press on the pill (`--click` at the same cell); 20 frames at rest write no console line; the canvas has no pixels; the bundle is 174 KB and a frame 0.04-0.07 ms.
- Out of scope, said: text input (the Sensors page is pointer-only; the Field page cannot run here), a11y, and a framework — this is a sink we own.
