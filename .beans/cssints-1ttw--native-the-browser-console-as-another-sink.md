---
# cssints-1ttw
title: 'native: the browser console as another sink'
status: todo
type: epic
tags:
    - wayfinder:task
created_at: 2026-11-04T10:36:03Z
updated_at: 2026-11-04T10:36:03Z
---

The browser console as one more sink for the same tree. The reference is [textjs](https://github.com/anomalyco/textjs) (MIT): React + Yoga, a cell buffer, a frame run-length encoded into `%c` spans and written in one `console.log`, and a frame with no changed cells logging nothing.

What we take is the **sink and the rule**, not the stack. We already produce cells: `terminal/cells.c` is a code point a cell with a palette index, `terminal/render.c` turns Clay's commands into them, and `terminal/solid.ts` runs an unmodified Solid page over them. The console is the last step of that same path — cells to `%c` spans instead of `termbox2` — so it is a sink in `native/`, not a second framework, and certainly not a `cssints` member: the engine owns styles, a renderer owns the screen. Taking React + Yoga would fork the layout engine and the component model the map's "each target is a renderer, not a redesign" rule forbids.

What it buys: a fourth screen for free (the same page, the same Clay numbers, another surface), a debugging channel that prints a whole frame rather than the dev panel's lines, and a cheap demonstration that one tree reaches many displays. What it cannot be: accessible (a console has no tree), typed (a console takes `keydown` on the page, not text input), typographic (monospace only), or portable (desktop Chrome/Edge/Firefox/Safari; no console on a phone).

Children: the sink, the diff rule, the page, and FIGlet titles (deferred).
