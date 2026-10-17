# @cssints/gradient-2d

`mesh-gradient()` and `freeform-gradient()` for [cssints](../../README.md), as styles of `cssints/plugin` `scope()`.
Where the browser has the CSS function, the style uses it. Where it does not, a runtime draws the gradient on a canvas and
sets the drawing as the background. **No browser has either function yet**, so today the runtime draws every gradient; the
first paint is freeform's stack of radial gradients or mesh's average colour.

**Status (2026-10-17).** The CSSWG adopted mesh and freeform gradients into css-images-5 on 2026-10-14, as an explainer
([css-images-5/explainers/2d-gradients.md](https://github.com/w3c/csswg-drafts/blob/main/css-images-5/explainers/2d-gradients.md)).
That is not a spec draft: the syntax can still change. Freeform may be renamed `diffusion-gradient()`, and neither
function's rendering rule is public, so both drawings here are **this package's algorithm**, not a browser's or
Illustrator's.

```ts
import { cn, color } from "cssints" with { type: "cssints" };
import { freeformGradient, meshGradient } from "@cssints/gradient-2d" with { type: "cssints" };

export const hero = cn(meshGradient("red, blue; green, yellow"), color("white"));
export const panel = freeformGradient("red top left, gold 4 60% 40%, yellow bottom right");
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
  ._gradient2d-ff {
    background-image: var(--gradient2d-ff-fallback);
    background-repeat: no-repeat;
    background-size: 100% 100%;
  }
  @supports (background-image: freeform-gradient(red top left, blue bottom right)) {
    ._gradient2d-ff {
      background-image: var(--gradient2d-ff-native);
    }
  }
}
@layer _.a {
  ._1gxhgq5 {
    --gradient2d-native: mesh-gradient(red, blue; green, yellow);
    --gradient2d-fallback: linear-gradient(#918d78, #918d78);
    --gradient2d-data: '{"space":"oklab","rows":[[[1,0,0,1],[0,0,1,1]],[[0,0.502,0,1],[1,1,0,1]]]}';
  }
  ._1ps31mi {
    --gradient2d-ff-native: freeform-gradient(red top left, gold 4 60% 40%, yellow bottom right);
    --gradient2d-ff-fallback:
      radial-gradient(circle at 0% 0%, #ff0000, transparent),
      radial-gradient(circle at 60% 40%, #ffd700, transparent),
      radial-gradient(circle at 100% 100%, #ffff00, transparent);
    --gradient2d-ff-data: '{"space":"oklab","points":[[0,0,1,[1,0,0,1]],[0.6,0.4,4,[1,0.8431,0,1]],[1,1,1,[1,1,0,1]]]}';
  }
}
```

The native value is the spec's text, as written. The data is the stops or points as sRGB numbers, for the runtime. Mesh's
fallback is the average colour of its stops, in oklab; freeform's is a radial layer per point.

## Syntax

### `meshGradient(mesh)`

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

### `freeformGradient(points)`

- **`freeformGradient(points)`**, one string: points separated by `,`, each `<color> <number>? <position>`. The number is
  the point's **spread**, its weight against the others (1 when it is left out). The position is a keyword
  (`top left`, `bottom right`, `center`) or one or two percentages, as `background-position` reads it
  (`gold 4 60% 40%`, `blue right 10%` is 90% across).
- **`in oklab`** or **`in srgb`** may open the text, as the spec has it: `freeformGradient("in srgb, red 20% 30%, blue")`.
  The function has no colour outside the points, so a colour after the method is a build error.
- **Build errors**, at the call: a point without a position, fewer than 2 points, two points at the same position (their
  weights are both infinite there), a colour that does not parse, a length (`10px` needs the box), a line (a point with
  more than one position, the spec's future work) and a shape.
- **Not supported yet:** lines, shapes and lengths, as above. A `var(--token)` point works: the browser resolves it, in
  the fallback too.

## Browsers

- **Native**: neither function is in any browser. The installed Chrome of `test:browser` reports no support, so the
  runtime draws. The `@supports` tests are the spec's simplest examples: `mesh-gradient(red, blue; green, yellow)` and
  `freeform-gradient(red top left, blue bottom right)`. The two are decided apart, so a browser with mesh and without
  freeform takes mesh's branch only (`_gradient2d-ff` is a class of its own).
- **The runtime** is in every build whose browserslist targets include a browser that BCD tracks. The table in
  `@cssints/css-grammar` says every such browser lacks `css.types.gradient.mesh-gradient` and
  `css.types.gradient.freeform-gradient` (BCD has no entry for either). When BCD or the table has a browser with one of
  them, the runtime ships only to the targets that lack it.
- **The runtime needs** `ResizeObserver`, canvas and `MutationObserver` (where the page has them, the drawing works).

## The runtime

- **The algorithm is this package's, not the spec's and not Illustrator's.** Mesh is a bicubic (Catmull-Rom) through the
  4 × 4 stops around a point; the spec interpolates a tensor-product patch with Bézier control points, which this package
  does not model. Freeform is **inverse-distance weighting**: the colour at a point is the weighted mean of the stops,
  the weight of a stop `spread / d²`, in oklab. The spec suggests a Delaunay triangulation; freeform's rendering rule is
  not public (Josh Tumath, 2026-06-25), so no browser or editor agrees on it yet. IDW was chosen over a Delaunay because
  every pixel of the box then has a weight: a triangulation paints only the points' convex hull and leaves the rest of
  the box undefined (the spike in `docs/research/2d-gradients.md` saw exactly that hard hull edge; this package's own
  reading of an IDW render is soft round blobs, one per stop, with the spread visible). The drawing is a close relative
  of a browser's freeform, not the same surface. Compare by eye.
- **Resolution.** The canvas is a quarter of the box (64 px at least) and the browser stretches it to the box. A large box
  is soft, not sharp. In Chrome (the installed one, 1000 × 600, median of six resizes between 800 and 1000 px, the canvas
  250 × 150, the time to the new background, layout and PNG encoding included): the mesh redraws in 49 ms, the freeform in
  34 ms. The distances of freeform are measured in the box's pixels (height / width), as the fallback's radial layers are,
  so a point's influence is a circle on screen and not an ellipse.
- **Size.** 3.9 kB minified, 1.9 kB gzipped for both rules (measured with rolldown's minifier; the `dist/runtime.mjs` of
  `vp pack` is not minified). Mesh alone is 2.9 kB / 1.6 kB, as it was before freeform joined it; `@cssints/balance`'s
  script is 552 bytes.
- **Data and tokens.** The runtime reads `--gradient2d-data` or `--gradient2d-ff-data` (JSON in a CSS string). A `var()`
  stop is read through a hidden child of the element, so it inherits the element's custom properties, and a 1 × 1 canvas
  turns the computed colour into sRGB.
- **Redraw.** On a size change, and when an element gets the marker class (added to the page or given the class later).
  Both rules share one `ResizeObserver` and one `MutationObserver` (src/canvas.ts). A drawing that is outdated when a newer
  one finishes is dropped. A previous blob URL is revoked.
- **First paint without JS.** Freeform's fallback is a stack of radial gradients, one layer per point: its colour at the
  point fading to transparent at the farthest corner of the box. It is an approximation with its own blend (alpha, in the
  browser's space, not `spread / d²` in oklab; the spread is not in it), and it holds a `var()` point, which mesh's
  average colour cannot.
- **CSP.** The fallback is a `blob:` URL. The page needs `img-src blob:` (or `img-src` with `blob:` in it) for the drawing.
- **SSR.** The runtime does nothing without `document`. The first paint is the kernel's fallback.

## Limits

- **Freeform's fallback and its drawing do not agree pixel for pixel.** The stack of radial gradients is a low-fidelity
  first paint, not the IDW rule: its blend is linear in the distance and in the browser's colour space.
- **A condition can change the data, and the runtime reads it at the draw.** `hover(meshGradient(...))` puts the data
  under `:hover` (checked: the engine prints it); the drawing does not change on hover, only on the next resize.
- **An element removed from the page keeps its observer and its blob URL** until the page unloads. Fine for pages, not
  for a long single-page app that churns gradients; a fix would observe removals.
- **Printing** takes the raster fallback. A PDF of a browser's freeform is a patch shading, not a bitmap, and freeform is
  large in PDF.
- **The syntax can change** until the spec draft, and freeform's name with it (`diffusion-gradient()`); the build error
  messages name the part they reject.

```bash
cd packages/gradient-2d && bun run test           # the maths in Node, the engine (kernels, data, errors, the runtime by targets)
cd packages/gradient-2d && bun run typecheck      # and the type tests
cd packages/gradient-2d && bun run test:browser   # Chrome (installed): both first paints, the pixels against the maths, resize, an added element
```
