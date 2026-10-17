# 2D gradients: `mesh-gradient()` and `freeform-gradient()`

Researched 2026-10-17. Scope: a cssints plugin that exports `meshGradient()` and `freeformGradient()` before any browser ships the functions, with a runtime polyfill. No package code was written. The spike in section 7 is throwaway and lives outside the repo.

Markers: **(verified)** I ran it here. **(source)** I read it in the cited page on 2026-10-17. **(guess)** my reasoning, not checked.

## Key findings

1. **The CSSWG adopted both functions on 2026-10-14.** The resolution is "Adopt both freeform and mesh gradients into css-images-5, with concerns noted" (source). That is adoption of an explainer, not a spec draft. The syntax can still change.
2. **No browser ships either function (verified).** Chrome 155.0.8059.80 returns `false` from `CSS.supports` for both. No BCD, web-features, mdn-data or @webref entry names them.
3. **The engine gates runtimes and fallbacks by BCD keys, and there are no keys (source + verified grep).** `polyfills` and `requires` take BCD keys. A `script` ships only to a build whose targets lack one of them. With no key, the runtime never ships. This is the real blocker for a polyfill, not the CSS.
4. **The `@supports` switch works (verified).** A `@supports not (background-image: mesh-gradient(…))` rule applied in Chrome 155. LightningCSS 1.33.0 kept both functions and both `@supports` blocks unchanged for Chrome 109, Firefox 128 and Safari 16 targets.
5. **Freeform is the one to build first.** Tab Atkins now leans to freeform as the basic 2D gradient (source). Mesh has a closed model (Coons and tensor-product patches, PDF type 7). Freeform has no public rendering rule (source).
6. **The plugin is a `scope()` package, not a spec group.** A group can only refuse what cssints already has. It cannot add a function.
7. **The spike is only a feasibility check.** A regular-grid mesh and a freeform IDW or Delaunay at 1000×600 took 0.5 to 1.6 s each in Node, raster only. Bicubic colour looks smoother than bilinear. Delaunay needs the box corners or it shows hard hull edges.

## 1. What is true today

| Question             | Answer                                                                                                                                                                                                         | Source                                                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec status          | Adopted into css-images-5 on 2026-10-14. The explainer moved into the repo the same day.                                                                                                                       | [issue, comment 6173137201](https://github.com/w3c/csswg-drafts/issues/7648#issuecomment-6173137201)                                                                                                |
| Mesh syntax          | `mesh-gradient( [ <color-interpolation-method> \|\| <color> ]?, <mesh-point># [ ';' <mesh-point># ]* )`. A point is a colour, then an optional position with `with` control points, or `by` a relative offset. | [explainer](https://github.com/w3c/csswg-drafts/blob/main/css-images-5/explainers/2d-gradients.md), [Tab, 2026-08-14](https://github.com/w3c/csswg-drafts/issues/7648#issuecomment-5296909780)      |
| Mesh interpolation   | Bicubic only. The bilinear keyword was dropped on 2026-08-15. The colour in the function is the colour outside the mesh.                                                                                       | [issue, comment 5299503581](https://github.com/w3c/csswg-drafts/issues/7648#issuecomment-5299503581)                                                                                                |
| Freeform syntax      | `freeform-gradient( <color-interpolation-method>? , <freeform-point># )`, `<freeform-point> = <color> <number>? <position>`. Lines (a Catmull-Rom curve through several positions) and shapes are future work. | [explainer](https://github.com/w3c/csswg-drafts/blob/main/css-images-5/explainers/2d-gradients.md)                                                                                                  |
| Freeform, Tab's view | `<color> <number> <position>+`, so a stop may carry a curve. Freeform is "the basic 2d gradient to use".                                                                                                       | [Tab, 2026-08-14](https://github.com/w3c/csswg-drafts/issues/7648#issuecomment-5296909780), [Tab, 2026-08-10 mail](https://lists.w3.org/Archives/Public/public-css-archive/2026Aug/0365.html)       |
| Browsers             | None. Chrome 155 `CSS.supports` is `false` for both (verified). No Firefox or Safari signal found.                                                                                                             | verified; search (no hits)                                                                                                                                                                          |
| Data packages        | No entry. `@mdn/browser-compat-data` 8.1.3, `web-features` 3.42.0, `mdn-data` 2.27.1 and `@webref/css` 6 and 8.7.5 have no `mesh-gradient` or `freeform-gradient` (grep, verified).                            | verified                                                                                                                                                                                            |
| chromestatus         | The API search for `gradient` at fetch time lists no mesh or freeform feature.                                                                                                                                 | [chromestatus](https://chromestatus.com/api/v0/features?q=gradient)                                                                                                                                 |
| Native renderers     | Skia, SwiftUI and Android Compose draw mesh gradients. Illustrator and Affinity draw freeform ones. Other engines fake freeform with radial gradients.                                                         | [explainer](https://github.com/w3c/csswg-drafts/blob/main/css-images-5/explainers/2d-gradients.md), [Bramus, 2026-08-13](https://lists.w3.org/Archives/Public/public-css-archive/2026Aug/0512.html) |
| PDF                  | Illustrator writes freeform as a type 7 tensor-product patch. Bramus measured 138 601 bytes for one freeform gradient and 1 387 bytes for a mesh.                                                              | [Bramus, 2026-08-13](https://lists.w3.org/Archives/Public/public-css-archive/2026Aug/0512.html)                                                                                                     |
| Paint API            | BCD `api.CSS.paintWorklet_static`: Chrome 65. Firefox (bug 1302328) and Safari (WebKit 190217) not implemented. `PaintRenderingContext2D` has no `putImageData`.                                               | [BCD](https://npmx.dev/package/@mdn/browser-compat-data), verified                                                                                                                                  |
| Reference tool       | [2dgradient.style](https://2dgradient.style/), Bramus's WebGL editor with freeform and PDF export. An AI-built prototype, not normative.                                                                       | [issue, IRC log](https://github.com/w3c/csswg-drafts/issues/7648)                                                                                                                                   |

## 2. Where it lives

**A spec group** (`cssints/css-images-5`) already exists, but only as a refusal group. Groups export cssints members and refuse values (docs/API.md, "Export groups"). They add no function, and no data names `mesh-gradient`. docs/API.md says a property that no data knows is "in every group", so the same rule would probably let the value through silently (guess: it is written for properties). A group cannot ship a runtime either. **Rejected.**

**A plugin on `scope()`** is the shape that fits. A member returns a style (a class). A kernel prints CSS once in `_.k`. A `script` delivers JS. A table of local grammar strings types the arguments (docs/API.md, "Plugins"). `@cssints/gradient` is the nearest example. It returns an `<image>` value (source: its README), which leaves no place for a `@supports` branch or a fallback (guess).

|                            | Plugin on `scope()`                      | Spec group  |
| -------------------------- | ---------------------------------------- | ----------- |
| Adds functions             | yes                                      | no          |
| Fallback CSS and runtime   | yes (`css`, `script`), gated by BCD keys | no          |
| Types of the syntax        | local grammar strings                    | none        |
| Users who do not import it | pay nothing                              | pay nothing |

**Why a style, not `backgroundImage(meshGradient(...))`.** A function inside `background-image` is grammar-checked, and mdn-data does not know the name (guess: a build error). A typed `<image>` value skips the check but has no `@supports` branch. A style member sets a custom property, and a kernel prints `background-image` under `@supports`. Custom property values are not checked (docs/API.md), which is what makes this work.

```ts
import { cn } from "cssints" with { type: "cssints" };
import { freeformGradient, meshGradient } from "@cssints/gradient-2d" with { type: "cssints" };

export const hero = cn(freeformGradient("red top left, gold 4 60% 40%, yellow bottom right"));
export const panel = cn(meshGradient("red, blue; green, yellow"));
export const broken = freeformGradient("red top left, yellow"); // type error: yellow has no position
export const ragged = meshGradient("red, blue; green"); // build error: rows of 2 and 1 points
```

**Type errors.** A grammar string names the failing part, as `gradient()` does (`gradient: unexpected "steps(4"…`, its README). The message for `broken` should read like `freeformGradient: … expected <position>` (guess, to verify in the MVP). Two checks cannot live in a grammar string: equal row length in a mesh, and a comma list inside one call argument (docs/API.md says a call's parts are joined by a space). The MVP tests `arg<T>()` or the tuple form for those (guess).

## 3. Polyfill strategies

| Strategy                                                            | Fidelity                                                                                                       | Resize                                                                | No JS, SSR, first paint                      | Tokens and `var()`                                                              | Browsers and bytes                                                                                               |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1. Build-time raster or SVG data URL                                | Our algorithm, frozen                                                                                          | Fixed size. The spike's unoptimised 1000×600 PNGs were 302 to 519 KB. | Yes: no JS, works in SSR                     | Colours fixed at build; a `var()` cannot be read                                | All. No JS bytes.                                                                                                |
| 2. Runtime 2D canvas, blob URL in a custom property, ResizeObserver | Ours, as exact as the maths                                                                                    | Yes                                                                   | Needs a CSS fallback for first paint         | Read the resolved colour from a probe (guess, to verify); culori or oklab maths | Canvas and Blob. Runtime about 3 to 8 KB minified (guess, unmeasured).                                           |
| 3. Runtime WebGL shader, same trigger                               | Ours, on the GPU                                                                                               | Yes                                                                   | As 2                                         | Colours as uniforms                                                             | Needs WebGL. Not measured.                                                                                       |
| 4. CSS Paint API `paint(mesh)`                                      | Drawn with the 2D context, no per-pixel write, so a mesh would be drawn as shapes (guess)                      | Yes                                                                   | Needs the worklet registered; no first paint | Only registered custom properties as inputs                                     | Chrome 65 (BCD). Squircle rejected it for the same reason: [squircle README](../../packages/squircle/README.md). |
| 5. CSS-only stacked radial gradients                                | Low for mesh. For freeform, one radial layer per stop: an approximation with its own blend (not rendered here) | Yes (percentages)                                                     | Yes                                          | Yes: `var()` and `in oklab` are the browser's                                   | All browsers. About 60 bytes of CSS per stop (guess).                                                            |
| 6. SVG filter over blurred shapes                                   | A blur of shapes, not a gradient rule                                                                          | Vector                                                                | Yes                                          | Colours fixed in the data URL                                                   | All. Filter cost on paint (guess).                                                                               |

No strategy is spec-exact until a browser ships the function. The claim we can make is "the package's own algorithm, tested against its own maths". The spike's JS loop took 0.5 to 1.6 s per 1000×600 frame in Node, so a runtime cannot repaint full size on each resize. It needs WebGL, or a canvas at a quarter of the box size that the browser scales up (guess, to measure). Strategy 5 gives first paint for freeform without JS. Mesh has no CSS fallback that looks right, so a mesh shows its average colour or waits for the runtime (guess).

## 4. The native switch

What the plugin prints (the design, not built):

```css
@layer _.k {
  ._g2d-core {
    background-image: var(--g2d-fallback);
  }
  @supports (background-image: freeform-gradient(red top left, blue bottom right)) {
    ._g2d-core {
      background-image: var(--g2d-native);
    }
  }
}
._k7x2 {
  --g2d-native: freeform-gradient(red top left, gold 4 60% 40%, yellow bottom right);
  --g2d-fallback: radial-gradient(…), radial-gradient(…);
  --g2d-data: "{…points as JSON…}";
}
```

- **The test is raw.** `css.supports()` takes property declarations and checks their grammar (docs/API.md), so a query for an unknown function would fail. A kernel's `css` string is raw CSS, as in `@cssints/squircle` and `@cssints/balance`. The raw query is not checked (guess, from those packages).
- **The value is a custom property.** Its value is not checked, which lets the native function through.
- **LightningCSS keeps it (verified).** See the output in section 7.
- **The native branch is untested.** No browser takes it, so the test is a rule that Chrome 155 skips. The `@supports` string must be a form the browser accepts when it ships. Use one test per function, the simplest valid form (guess).
- **Gating is the gap.** The raw kernel is always printed, so the CSS needs no key. Only the runtime does, and it ships only when a browserslist target lacks a BCD key (docs/API.md, "runtime"). Mesh and freeform have none. Fix: BCD entries with `version_added: false` for every browser, as the Paint API has `impl_url` entries. Until then the runtime never ships.

## 5. The runtime

- **Delivery.** The table names `script: "@cssints/gradient-2d/runtime"`. The engine writes `import "@cssints/gradient-2d/runtime";` into the client module, and Vite resolves it. The subpath is `development` → `src/runtime.ts`, default → `dist/runtime.mjs`, as `@cssints/balance` has it.
- **Plain code.** The plugin's `src/` is on the `plainCode` list, and `balance/src/runtime.ts` has no imports and no Effect (cssints-contributor skill). The runtime keeps that rule.
- **Data.** The site holds the points as JSON in a string custom property, as `--_derived` does (docs/API.md, "Themes"). A runtime parsing CSS text would need a grammar of its own.
- **Behaviour.** Return at once if `CSS.supports` says native. Otherwise, for each `._g2d-core` element, compute the colours and set `--g2d-fallback` to a `url(blob:…)`. A ResizeObserver redraws on size change. A MutationObserver handles new nodes, as balance's runtime does. Old blob URLs are revoked.
- **Tokens.** A point colour that is `var(--x)` arrives as text. The runtime reads its resolved value from a probe element (guess, to verify).
- **CSP.** An `img-src` without `blob:` blocks the fallback (guess; standard CSP, to test).
- **Cost.** Every build that uses the plugin pays the runtime once the BCD keys exist. Measure it in the MVP.

## 6. Recommendation and MVP

**Freeform first, mesh second, both as a `scope()` plugin with CSS fallback first and the runtime second.**

Why freeform first:

1. Tab's own preference (2026-08-10), and the resolution keeps both (sources above). Its syntax is the nearer to settled.
2. Its no-JS fallback is a stack of radial gradients (strategy 5), so the common case has a first paint without JS.
3. Its runtime is small. The spike's IDW and Delaunay were under 60 lines each of maths.
4. A mesh needs Coons or tensor-patch code and a bezier model. That can come later without a new API, because both take a string grammar.

The caveat: freeform's rendering rule is not public (source: Josh Tumath, 2026-06-25). The MVP claims "this package's algorithm", not Illustrator's. Mesh has the stronger fidelity story, because its model is written down. It waits for the patch code.

**MVP scope.**

- `freeformGradient(points)`: points only, `<color> <number>? <position>`, `in oklab` and `in srgb` only. No lines, no shapes, no `<mesh-gradient-method>`.
- Output: a build-time radial fallback in `css`, the `@supports` native branch, and a runtime that uses IDW (weight `spread / d²`) at a quarter of the box size. Delaunay only if IDW looks wrong in review, with the box corners added.
- The runtime and its key wait for the BCD entries. The CSS ships without them.

**API sketch.** Section 2. Test the comma list with `arg<T>()` or the tuple form before the grammar is final.

**Tests.**

- Maths (Node, fixtures through `node run.mjs`): each stop's colour at its own position; a point inside the hull is a blend; `in srgb` and `in oklab` differ at a midpoint; the grammar messages for a bad point.
- Build: both `@supports` branches present, `_.k` placement, the JSON data property.
- Chrome (`channel: "chrome"`, as `packages/cssints/test/browsers.mjs` does): the fallback paints the radial stack (computed `background-image`); the runtime's canvas read back against the maths at 20 points in oklab (tolerance to pick, guess 2 ΔE).
- The native branch cannot run yet. When a browser ships it, compare its render with the runtime pixel by pixel. Until then, check the test string against the explainer's examples by hand.
- Visual references: 2dgradient.style for freeform, and PDF renders of a type 7 patch. Compare by eye and note the result in the README. Neither is a pass or a fail: neither is normative.

**Open risks.**

1. **The syntax can change.** The explainer is in the repo, but the freeform name may change (it lists `diffusion-gradient()`), the spread may become a strength, and lines and shapes are future work.
2. **Freeform's maths is not public.** Josh's 2026-06-25 comment says the implementation is unknown. A remark in the issue that Adobe's method may be patented is unverified and not used here.
3. **Mesh degenerate cases are undefined.** Overlapping points and degenerate patches render differently between engines (CSSWG minutes, 2026-10-14, linked above).
4. **Colour interpolation is open.** Josh (2026-06-25) said the CSS colour-interpolation fit is not known. The MVP limits it to two spaces.
5. **BCD gating.** Without keys the runtime never ships, and there are no support warnings.
6. **Performance.** The spike's JS loop took 0.5 to 1.6 s per frame at full size. WebGL or a low resolution is needed; neither is measured.
7. **Print.** A raster fallback does not print like a PDF patch. Freeform is large in PDF (138 601 bytes against 1 387 for a mesh).
8. **Contrast.** A gradient behind text has no ratio that `check.contrast` can read (guess: it reads colour tokens). The explainer asks authors to check by hand.

## 7. Spike: feasibility, not the spec's algorithm

Throwaway, in the opencode temp directory `mesh-spike/` (not in the repo, not committed). Pure Node 24.22.0, with a hand-written PNG encoder. What the spike is not:

- The mesh is a regular 3×3 grid with no Coons edges and no bezier warp. "Bicubic" is Catmull-Rom on oklab colour, not a tensor-product patch.
- Freeform is inverse-distance weighting (`w = spread / d²`) or a Bowyer-Watson Delaunay with barycentric colour. Both interpolate in oklab.

Timings, raster only (median and minimum of five runs, 1000×600, nine freeform points):

| Case              | Median ms | Min ms | PNG, unoptimised |
| ----------------- | --------: | -----: | ---------------: |
| mesh-bilinear     |       987 |    728 |           309 KB |
| mesh-bicubic      |     1 643 |  1 395 |           333 KB |
| freeform-idw      |       560 |    454 |           302 KB |
| freeform-delaunay |       715 |    593 |           519 KB |

What the images show (viewed):

- **mesh-bicubic** is smooth. **mesh-bilinear** shows creases along the middle row and column of the grid.
- **freeform-idw** is soft round blobs, one per stop, with no grey dip in oklab.
- **freeform-delaunay** has triangle creases and a hard edge where the points' convex hull ends. Outside the hull the nearest stop's colour is painted, which is wrong. A real polyfill must add the box corners or define the outside.

Checks run in the same folder (verified):

- LightningCSS 1.33.0 output for `mesh-gradient(…)` and `freeform-gradient(…)` in `@supports` blocks: unchanged for Chrome 109, Firefox 128 and Safari 16 targets.
- Chrome 155.0.8059.80 (playwright-core 1.63.0, `channel: "chrome"`): `CSS.supports` is `false` for both functions; the `@supports not` rule applied and the positive one did not.

The spike file is 9 861 bytes raw, including the PNG encoder. It is not measured minified.

## Sources

- Explainer: [css-images-5/explainers/2d-gradients.md](https://github.com/w3c/csswg-drafts/blob/main/css-images-5/explainers/2d-gradients.md)
- Issue: [w3c/csswg-drafts#7648](https://github.com/w3c/csswg-drafts/issues/7648); resolution [comment 6173137201](https://github.com/w3c/csswg-drafts/issues/7648#issuecomment-6173137201)
- Tab Atkins, syntax and freeform: [comment 5296909780](https://github.com/w3c/csswg-drafts/issues/7648#issuecomment-5296909780), [mail 2026-08-10](https://lists.w3.org/Archives/Public/public-css-archive/2026Aug/0365.html)
- Bramus, PDF and tooling: [mail 2026-08-13](https://lists.w3.org/Archives/Public/public-css-archive/2026Aug/0512.html); [2dgradient.style](https://2dgradient.style/)
- Josh Tumath, the open questions: [mail 2026-06-25](https://lists.w3.org/Archives/Public/public-css-archive/2026Jun/0621.html)
- Data: [@mdn/browser-compat-data](https://npmx.dev/package/@mdn/browser-compat-data) 8.1.3, [web-features](https://npmx.dev/package/web-features) 3.42.0, [lightningcss](https://npmx.dev/package/lightningcss) 1.33.0, [playwright-core](https://npmx.dev/package/playwright-core) 1.63.0
- Repo: docs/API.md ("Plugins", "Export groups", "Themes"), `packages/balance`, `packages/squircle`, `packages/gradient`
