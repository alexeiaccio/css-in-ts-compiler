---
# cssints-q837
title: 'native: the console page in a browser (the sink as the display)'
status: todo
type: feature
tags:
    - wayfinder:task
created_at: 2026-11-04T10:36:36Z
updated_at: 2026-11-04T10:36:36Z
parent: cssints-1ttw
---

The console target in a browser: a page whose display is the console. `browser/solid/console.ts` + `console.html`, `mountPage` with the console sink as its surface (no canvas, or a canvas that stays blank so the canvas-shaped shell still works), keys through `browser/solid/keys.ts` into the page's `Input`, the frame printed by the sink and diffed.

The work:
- the page, and what `mountPage` needs to be without a canvas (say it: a sink interface rather than a `CanvasRenderingContext2D`, or a null surface);
- a note in the page for the reader: "open the console";
- the check in Chromium (Playwright's `console` event captures the messages): the frames' cells equal the terminal's `--dump` for the same page and the same keys (Tab, Space on the Widgets switch or the Sky tabs), the idle rule holds (no messages), and the canvas has no pixels;
- the numbers: bytes a frame, the sink's ms, the page's bundle size, and how far behind the terminal's frame time it is.

Out of scope: text input (a console has no editing model; the Field page cannot run here), a11y, and an npm-style "framework" — this is a sink we own.
