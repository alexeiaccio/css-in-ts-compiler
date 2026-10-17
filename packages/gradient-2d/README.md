# @cssints/gradient-2d

`mesh-gradient()` for [cssints](../../README.md), as a style of `cssints/plugin` `scope()`. Where the browser has the CSS
function, the style uses it. Where it does not, a runtime draws the mesh on a canvas and sets the drawing as the
background. **No browser has `mesh-gradient()` yet**, so today the runtime draws every mesh.

**Status (2026-10-17).** The CSSWG adopted mesh and freeform gradients into css-images-5 on 2026-10-14, as an explainer
([css-images-5/explainers/2d-gradients.md](https://github.com/w3c/csswg-drafts/blob/main/css-images-5/explainers/2d-gradients.md)).
That is not a spec draft: the syntax can still change. `freeformGradient()` is planned, not in this release.

```ts
import { cn, color } from "cssints" with { type: "cssints" };
import { meshGradient } from "@cssints/gradient-2d" with { type: "cssints" };

export const hero = cn(meshGradient("red, blue; green, yellow"), color("white"));
```

```css
@layer _.k {
  ._gradient2d-core {
    background-image: var(--gradient2d-fallback);
    background-repeat: no-repeat;
    background-size: 100% 100%;
  }
  /* only where the browser parses the function */
  @supports (background-image: mesh-gradient(red, blue; green, yellow)) {
    ._gradient2d-core {
      background-image: var(--gradient2d-native);
    }
  }
}
@layer _.a {
  ._1gxhgq5 {
    --gradient2d-native: mesh-gradient(red, blue; green, yellow);
    --gradient2d-fallback: linear-gradient(#918d78, #918d78);
    --gradient2d-data: '{"space":"oklab","rows":[[[1,0,0,1],[0,0,1,1]],[[0,0.502,0,1],[1,1,0,1]]]}';
  }
}
```

The native value is the spec's text, as written. The data is the stops as sRGB numbers, for the runtime. The fallback is
the average colour of the stops, in oklab.

## Syntax

- **`meshGradient(mesh)`**, one string: rows of stops, rows separated by `;` from the top of the box down, stops by `,`
  from the left. A stop is a colour: `red`, `#888`, `oklch(...)`, or `var(--token)`.
- **`in oklab`** or **`in srgb`** may open the text, as the spec has it: `meshGradient("in oklab, red, blue; green, yellow")`.
  A colour after it (`in oklab red, ...`) is the colour outside the mesh. It is checked and kept in the native value, but
  never drawn: the grid covers the whole box.
- **Build errors**, at the call: rows of different lengths, fewer than 2 rows of 2 stops, a colour that does not parse,
  another colour space than oklab or srgb, and a stop with a position, `by` or `with`.
- **Not supported yet:** positions (`red 0% 0%`) and the control points (`by`, `with`). The grid is regular: the corners
  sit at the corners of the box and the other stops are spaced evenly. A position needs the grid warped, which the
  runtime does not do yet. Both are build errors, not ignored.
- **`var(--token)` stops** work. The browser resolves them: the drawing waits for the runtime, and the first paint has no
  fallback (`--gradient2d-fallback: none`).

## Browsers

- **Native**: `mesh-gradient()` in no browser. The installed Chrome of `test:browser` reports no support, so the runtime
  draws. The `@supports` test is the spec's simplest example, `mesh-gradient(red, blue; green, yellow)`.
- **The runtime** is in every build whose browserslist targets include a browser that BCD tracks. The table in
  `@cssints/css-grammar` says every such browser lacks `css.types.gradient.mesh-gradient` (BCD has no entry yet). When BCD
  or the table has a browser with the function, the runtime ships only to the targets that lack it.
- **The runtime needs** `ResizeObserver`, canvas and `MutationObserver` (where the page has them, the drawing works).

## The runtime

- **The algorithm is this package's, not the spec's.** It is a bicubic (Catmull-Rom) through the 4 × 4 stops around a
  point, in oklab, drawn on a canvas. The spec interpolates a tensor-product patch with Bézier control points, which this
  package does not model. The drawing is a close relative of a browser's mesh, not the same surface. Compare by eye.
- **Resolution.** The canvas is a quarter of the box (64 px at least) and the browser stretches it to the box. A large box
  is soft, not sharp. In Chrome, the 1000 × 600 box redraws in 38 ms (median of six resizes between 800 and 1000 px, the
  canvas 250 × 150, the time to the new background, layout and PNG encoding included).
- **Size.** 2.9 kB minified, 1.6 kB gzipped (measured with rolldown's minifier; the `dist/runtime.mjs` of `vp pack` is
  not minified). `@cssints/balance`'s script is 552 bytes: the mesh needs the colour maths and the canvas.
- **Data and tokens.** The runtime reads `--gradient2d-data` (JSON in a CSS string). A `var()` stop is read through a hidden
  child of the element, so it inherits the element's custom properties, and a 1 × 1 canvas turns the computed colour into
  sRGB.
- **Redraw.** On a size change, and when an element gets the marker class (added to the page or given the class later).
  A drawing that is outdated when a newer one finishes is dropped. A previous blob URL is revoked.
- **CSP.** The fallback is a `blob:` URL. The page needs `img-src blob:` (or `img-src` with `blob:` in it) for the drawing.
- **SSR.** The runtime does nothing without `document`. The first paint is the average colour.

## Limits

- **A condition can change the data, and the runtime reads it at the draw.** `hover(meshGradient(...))` puts the data
  under `:hover` (checked: the engine prints it); the drawing does not change on hover, only on the next resize.
- **An element removed from the page keeps its observer and its blob URL** until the page unloads. Fine for pages, not
  for a long single-page app that churns meshes; a fix would observe removals.
- **Printing** takes the raster fallback. A PDF of a browser's mesh is a patch shading, not a bitmap.
- **The syntax can change** until the spec draft; the build error messages name the part they reject.

```bash
cd packages/gradient-2d && bun run test           # the maths in Node, the engine (kernel, data, errors, runtime by targets)
cd packages/gradient-2d && bun run typecheck      # and the type test
cd packages/gradient-2d && bun run test:browser   # Chrome (installed): the fallback, the pixels against the maths, resize, an added element
```
