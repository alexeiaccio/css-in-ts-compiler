---
"@cssints/devtools": minor
---

`@cssints/devtools/vitals`: the page's report in the console — web vitals (FCP, LCP, CLS, INP, TTFB), long tasks and long
animation frames with their style and layout time, errors, heap, the frame timeline (p50/p95/max, a sparkline and a
heatmap), and the stylesheets' own numbers read off the CSSOM: bytes, rules, declarations, layer bars, the worst
specificity, colours, fonts, `!important`, custom properties declared / used / orphaned, keyframes in use, and coverage
(the classes no element carries). No dev server and no overlay: a plain browser module, so a page that draws to a canvas
(the native browser target) has a report too.
