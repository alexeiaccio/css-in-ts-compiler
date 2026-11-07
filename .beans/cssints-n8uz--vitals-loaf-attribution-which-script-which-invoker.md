---
# cssints-n8uz
title: 'vitals: LoAF attribution — which script, which invoker, how much forced layout'
status: todo
type: feature
priority: normal
created_at: 2026-11-07T11:08:55Z
updated_at: 2026-11-07T11:17:42Z
parent: cssints-7rmb
---

A long frame is only actionable when it names the code. `PerformanceLongAnimationFrameTiming.scripts` already holds it: `sourceURL`, `sourceFunctionName`, `sourceCharPosition`, `invoker` (a timer, an event listener, a message handler…), `duration`, `pauseDuration`, and `forcedStyleAndLayoutDuration`.

Build:
- Extend the report's `loaf` with the scripts of the longest frames (and the session's total by source), and print:
  - the top sources by total script time (`src/components/Showcase.tsx` 312 ms over 7 frames),
  - the top invokers (`timer 4`, `message handler 2`),
  - `forced styles+layout` separately: a script that reads layout after writing it is the JS/CSS crossing worth naming, and `forcedStyleAndLayoutDuration` is exactly that.
- The row must stay short in the console (5 sources); a `console.table` when there is more than 5.
- Do not name frames from `page.evaluate` (Playwright's own tasks are not attributed — measured while building the report).

Check: the Chromium test (test/vitals-browser.mjs) runs a busy loop from a `setTimeout` in the page and asserts the invoker/source of the frame; a second loop with a read-after-write (offsetHeight after a style change) asserts a non-zero forced layout.

Fallback: without LoAF (not Chrome), the row is absent, not zero.


## Note (2026-11-07)

`web-vitals` already reports the long animation frames of the INP candidate with the longest script and its subpart
(`attribution.longestScript`, `totalScriptDuration`, `totalStyleAndLayoutDuration`). What stays ours: the general LoAF
row (every frame, not only the INP one) and the source/invoker attribution of the worst frames, which is what this
ticket is about — read `entry.scripts` of our own observer, not the library's.
