---
"@cssints/devtools": minor
---

The overlay's X-ray (`x`, or the `xray` button): the picked element, its subtree, or the whole page as boxes, each with
its border-box size, padding, border, corner radii, a flex/grid gap, the spaces between siblings and a 4 px grid inside
the root. Every number is read from the page (`getBoundingClientRect`, `getComputedStyle`), so it follows a hover, a
scroll or a query; no extension and no CDP. The panel repeats the measurements as text under X-RAY, and the button
cycles element → subtree → page → off.
