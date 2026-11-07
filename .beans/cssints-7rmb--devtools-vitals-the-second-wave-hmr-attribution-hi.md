---
# cssints-7rmb
title: 'devtools: vitals, the second wave (HMR, attribution, history, cost)'
status: todo
type: epic
priority: normal
created_at: 2026-11-07T11:08:54Z
updated_at: 2026-11-07T11:08:54Z
---

The console report (`@cssints/devtools/vitals`, branch `feat/devtools-vitals`) answers "what is this page paying now?". The next wave turns it into "what did *this edit* cost, and which code paid" — the questions a cssints developer actually asks while styling, and the ones a generic vitals tool cannot answer.

What is already there (do not rebuild): `observe()` + `vitals()`/`report()`/`print()` in `packages/devtools/src/vitals/`, web vitals from the browser's entries, long animation frames with style+layout, the frame timeline (sparkline + heatmap), and the sheet's numbers from the CSSOM (bytes, rules, declarations, layers, specificity, colours, fonts, `!important`, custom properties, keyframes, coverage). Decisions and the two refusals (no analyzer dependency, no SVG/DOM charts) are in `docs/wayfinder.md`, 2026-11-07.

The children, in the order that pays first:
1. the sheet's growth over HMR, and the price of the last edit;
2. LoAF attribution: which script, which invoker, how much forced style/layout;
3. the history across reloads, so an edit's delta is visible;
4. INP with the element and the frames that covered it;
5. CSS cost per `cn()` call site, from the devtools table;
6. a real home: apps/demo and the native browser page (a canvas page is the reason the surface is the console);
7. the CSS files' own load time and render blocking (low).

Not in this epic, by decision: a Vitals section in the overlay panel (the console was chosen; the panel asks a DOM question and a canvas has no DOM).
