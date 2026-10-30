---
"@cssints/headless": minor
---

`@cssints/headless`: `createPanZoom`, pan and zoom for one image in a viewport. There is no APG pattern for pan-zoom, so the contract is the module's own and `test/panzoom.browser.test.tsx` is its oracle: a focusable viewport (`role=group`, `tabindex=0`, `aria-roledescription="zoomable image"`, `aria-describedby` the value), keyboard operations that stand in for every gesture (`+` / `=` / `-` zoom by `step`, arrows pan by 24 px, Shift x4, `0` resets), and a polite live value (`"150%"`). The pointer adds drag-to-pan, a two-pointer pinch and a double-click reset; the wheel zooms only with `ctrl` / `meta` (the browser's pinch) and a bare wheel is left to the page. `bounds: "clamp"` keeps the scaled image covering the viewport, `"free"` lets it be dragged out. Not `createCanvas`: that is a camera over an infinite world, this is one image fitted to a box.
