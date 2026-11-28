# Canvas prior art and interaction models

> Carried over from `effects-of-atmosphere` on 2026-11-28, where it was read for this repository's canvas specs
> (`packages/apg-specs/specs/canvas/`, whose headers cite it as "Decision 2"). The evidence, the pinned commits and the
> findings are unchanged; the bean ids are that repository's tracker — `mjpw` is this note, `e9jm` the Quint spec, `u2op`
> the rendering architecture, `a1w9` the scene graph and persistence, `h9vk` accessibility, and `vtri` the map they hang from.

Bean: `effects-of-atmosphere-mjpw` (map `effects-of-atmosphere-vtri`). Related: `-h9vk` (a11y), `-e9jm` (Quint spec), `-a1w9` (scene graph + persistence), `-u2op` (rendering architecture).

Method: primary sources only. Upstream repos were shallow-cloned and read at the pinned commits below; specs, vendor docs and engine source were fetched from their owners. Every claim carries a `path:line` (resolved against the pinned commit) or a URL. Claims that are my own arithmetic or inference are labelled **(derived)**; things I could not confirm are labelled **(unverified)** and collected at the end.

| Short name     | Repo @ commit (read 2026-10-04)                                                                  | Package version read                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| tldraw         | https://github.com/tldraw/tldraw @ `db1c86ea7857483c47aa333cf4e92abf455a67cf`                    | `packages/editor/package.json:4` → 5.5.2                                                            |
| excalidraw     | https://github.com/excalidraw/excalidraw @ `ed10ac7dca7e40f3f4a31269b4bfba980d0db41e`            | `packages/excalidraw/package.json:3` → 0.18.0                                                       |
| xyflow         | https://github.com/xyflow/xyflow @ `3d35b57317576b0916c0bfeaaedd573aaacc2839`                    | `packages/react/package.json:3` → 12.12.0                                                           |
| rzpp           | https://github.com/BetterTyped/react-zoom-pan-pinch @ `cd69daf48d64ef54f5ce8dac7eaa0e5f73d31758` | `package.json` says `0.0.0` (published version not verifiable from the repo)                        |
| panzoom        | https://github.com/timmywil/panzoom @ `ca8217f6f8c631a4bdaee72b90d3145ed3e429cf`                 | `package.json:3` → 4.6.2 (= our catalog `^4.6.2`, `pnpm-workspace.yaml:43`)                         |
| perfect-arrows | https://github.com/steveruizok/perfect-arrows @ `a7708cec769e03402410695f4be44037e38b3100`       | `package.json:2` → 0.3.7 (= our catalog `^0.3.7`, `pnpm-workspace.yaml:71`); last commit 2022-06-09 |
| jsoncanvas     | https://github.com/obsidianmd/jsoncanvas @ `456f843cb293df4f4ab1763e22ccb46a80b307c8`            | spec 1.0 (2024-03-11)                                                                               |

`apps/design-editor` has no `node_modules/@panzoom` or `perfect-arrows` installed in this checkout, so those two were read from the upstream clones at versions matching our catalog.

---

## What this decides

1. **Rendering architecture** (`-u2op`): one camera transform vs per-node transforms; DOM vs `<canvas>`/WebGL vs hybrid.
2. **What the Quint interaction spec must encode** (`-e9jm`): the camera algebra, the pointer/keyboard state machine, the invariants, and what is deliberately left to adapters and host policy.
3. **What persistence needs** (`-a1w9`): the shape of a stored scene on atproto, given that atproto forbids floats, and what JSON Canvas does and does not give us.

Short answers are in [Recommendations](#recommendations); the evidence is in sections 1–10.

---

## 1. Camera / transform model

### 1.1 What each library actually stores

None of the camera libraries stores a matrix. All store three numbers: a translation and a uniform scale. A camera never rotates or shears, so a 2x3 matrix would only add illegal states.

| Library                   | Stored camera                       | Screen = f(world)                      | Where                                                                                                                                                              |
| ------------------------- | ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| tldraw                    | `{x, y, z}`                         | `(world + (x,y)) · z`                  | `screenToPage`: `Editor.ts:4312-4320` (`(point.x - screenBounds.x) / cz - cx`); `pageToScreen`: `Editor.ts:4334-4342`                                              |
| Excalidraw                | `{scrollX, scrollY, zoom: {value}}` | `(scene + scroll) · zoom`              | `packages/common/src/utils.ts:317-358`                                                                                                                             |
| xyflow                    | `transform = [x, y, zoom]`          | `world · zoom + (x,y)`                 | CSS `translate(x,y) scale(zoom)`: `packages/react/src/container/Viewport/index.tsx:7-8`; inverse in `getNodesInside`: `packages/system/src/utils/graph.ts:272-276` |
| d3-zoom (xyflow's engine) | `Transform {k, x, y}`               | `world · k + (x,y)`; `invert` provided | https://raw.githubusercontent.com/d3/d3-zoom/main/src/transform.js (`apply`, `invert`, `toString` → `translate(x,y) scale(k)`)                                     |
| rzpp                      | `{positionX, positionY, scale}`     | `world · scale + position`             | `src/utils/styles.utils.ts:7-15` (`translate(x px, y px) scale(s)`)                                                                                                |
| panzoom                   | `{x, y, scale}`                     | `(world + (x,y)) · scale`              | `src/css.ts:97-107` writes `scale(s) translate(x px, y px)`                                                                                                        |
| Figma (public plugin API) | `{center, zoom}`, `bounds` derived  | n/a                                    | https://developers.figma.com/docs/plugins/api/figma-viewport/ ("The position of the viewport is represented via its center coordinate and zoom level")             |

Corrections to the brief's premises:

- **`@panzoom/panzoom` is not matrix-based.** It writes `scale(s) translate(x px, y px)` (`src/css.ts:102`). The only `matrix` in its source is an IE-only SVG fallback (`src/css.ts:103-105`).
- tldraw does use a 2x3 `Mat` (`a b c d e f`, `Mat.toCssString` at `packages/editor/src/lib/primitives/Mat.ts:269-273`), but only for **shape** transforms (rotation, nesting). The camera is `{x, y, z}` (`Editor.ts:3544-3583`, `_setCamera`).

Two parametrisations matter because they change the zoom-about-point algebra:

- **world-offset** `screen = (world + t)·z`: tldraw, Excalidraw, panzoom.
- **screen-offset** `screen = world·z + t`: d3-zoom, xyflow, rzpp.

Figma's `{center, zoom}` is a third. It is stable under container resize because the centre stays fixed; the top-left-anchored forms keep the top-left fixed. The spec has to choose which resize behaviour is "correct" (Quint item, §2 of Recommendations).

### 1.2 Zoom about the cursor: the derivation, and who implements it how

Fix the cursor `s` (screen px, relative to the viewport). Its world point must not move:

- world-offset: `p = s/z − t` for both zooms ⇒ **`t' = t + s/z' − s/z`**.
  - tldraw wheel: `Vec(cx + x / zoom - x / cz, cy + y / zoom - y / cz, zoom)` — `Editor.ts:11198`.
  - Excalidraw `getViewportForZoom` — `packages/excalidraw/viewport.ts:204-228` (`baseScroll + zoomOffset`, which algebraically reduces to the same expression **(derived)**).
- screen-offset: `p = (s − t)/z` ⇒ **`t' = s − (s − t)·z'/z`**.
  - rzpp: `positionX - mouseX * (newScale - scale)` with `mouseX = (clientX - contentRect.left) / scale` — `src/core/zoom/zoom.utils.ts:25`, `src/core/wheel/wheel.utils.ts:93-95`. Same result **(derived)**.
- panzoom has a bespoke form because HTML elements get `transform-origin: 50% 50%` (`src/panzoom.ts:89-96`): `toX = (focal.x / toScale - focal.x / scale + x * toScale) / toScale` (`:324`), with an explicit centre correction in `zoomToPoint` (`:389-394`).

**Invertibility.** `screen→world` exists iff `z > 0`. Every library clamps below by a positive minimum; rzpp additionally floors at `MIN_SAFE_SCALE = 1e-7` (`zoom.utils.ts:44-61`). tldraw refuses non-finite camera values outright and says why: a throwing tick listener "kills every frame-driven behavior for the rest of the session" (`Editor.ts:3608-3616`).

**Zoom clamping, with the focal point preserved.** Clamping the new zoom without re-anchoring makes the view lurch toward the centre. tldraw handles this explicitly: `preserveFocalPoint` re-solves the translation for the clamped zoom (`Editor.ts:3383-3390`, applied at `:3433-3442` and `:3530-3536`).

**Ranges in the wild.**

| Library       | min   | max          | Source                                                                                                 |
| ------------- | ----- | ------------ | ------------------------------------------------------------------------------------------------------ |
| tldraw        | 0.05  | 8            | `zoomSteps: [0.05, 0.1, 0.25, 0.5, 1, 2, 4, 8]`, `packages/editor/src/lib/constants.ts:5-11`           |
| Excalidraw    | 0.1   | 30           | `packages/common/src/constants.ts:365-367`                                                             |
| xyflow        | 0.5   | 2 (defaults) | `packages/react/src/container/ReactFlow/index.tsx:88-89`                                               |
| panzoom       | 0.125 | 4            | `src/panzoom.ts:46-47`                                                                                 |
| d3-zoom       | 0     | ∞            | https://raw.githubusercontent.com/d3/d3-zoom/main/src/zoom.js (`scaleExtent = [0, Infinity]`, line 59) |
| design-editor | 0.4   | 2.5          | `apps/design-editor/src/graph.tsx:247-248`                                                             |

**Wheel → zoom delta is where libraries diverge, and it is an adapter concern.**

- tldraw: multiplicative, `zoom = cz + delta·zoomSpeed·cz`, with `delta` capped to ±0.1 per event when the wheel means zoom (`Editor.ts:11177-11197`). Default wheel behaviour is **pan**; ctrl swaps pan/zoom (`:11167-11171`).
- Excalidraw: **additive**, `newZoom = zoom − delta/100`, with a `log10` boost above 100% (`App.wheel.ts:143-149`), delta capped at `ZOOM_STEP·100` (`:127-132`).
- panzoom: exponential, `scale · exp(±step/3)` (`panzoom.ts:417`).
- d3-zoom: `-deltaY · (deltaMode === 1 ? 0.05 : deltaMode ? 1 : 0.002) · (ctrlKey ? 10 : 1)` (`zoom.js:33-35`) — the only one that handles `WheelEvent.deltaMode` in the formula I read.

Multiplicative or exponential gives uniform steps in log-zoom; additive does not. Excalidraw's log boost is a patch for exactly that. The pinch gesture on desktop arrives as `wheel` with `ctrlKey` set; Excalidraw states it in a comment ("event.ctrlKey is necessary to handle pinch zooming", `App.wheel.ts:79`) and d3 ×10-scales it.

**Fit-to-bounds** is the same in all of them: `z = clamp(min(vw/bw, vh/bh))`, then centre. tldraw: `Editor.ts:3913-3931` (with an `inset`); Excalidraw: `viewport.ts:267-279` (`Math.min(smallest, 1)` — never zooms in past 100% to fit); our design-editor: `graph.tsx:127-141` (also `min(1, …)`).

### 1.3 Non-integer zoom and `devicePixelRatio`

- **DOM:** the camera becomes a CSS number. tldraw rounds to 1e-4 when writing it (`toDomPrecision`, `primitives/utils.ts:354-356`; its own comment says "3 decimal places" but the code is `1e4`, `:350-355`). rzpp does `parseFloat(scale.toFixed(8))` to strip float noise (`styles.utils.ts:3-5`). Excalidraw's `getNormalizedZoom` is `clamp(round(zoom, 6), MIN, MAX)` (`scene/normalize.ts:7-9`). panzoom has `roundPixels`, which rounds **CSS-px** x/y (`panzoom.ts:249-252`).
- **canvas:** the backing store is `css size × devicePixelRatio` (`excalidraw/.../canvases/StaticCanvas.tsx:38-42`, `scale={this.ownerWindow.devicePixelRatio}` at `App.tsx:2623`). Excalidraw additionally **snaps scroll to whole device pixels** so cached element bitmaps are never resampled during a pan: "every element pulses between crisp and soft" otherwise (`renderer/helpers.ts:36-63`; test at `packages/excalidraw/tests/pixelSnap.test.tsx:299-336`). It deliberately skips snapping during zoom gestures while bitmaps are cached (`pixelSnap.test.tsx:99`).
- The platform gives you the exact device-pixel box for a canvas: `ResizeObserverEntry.devicePixelContentBoxSize` (https://www.w3.org/TR/resize-observer-1/).
- **Crispness of DOM under a scaled container** depends on the compositor's raster scale. In Chromium, `will-change: transform` makes it avoid re-rastering: "We try to avoid raster scale adjustment for will-change:transform for performance, unless the scale is too small compared to the ideal scale" (`kMinScaleRatioForWillChangeTransform = 0.25`, https://chromium.googlesource.com/chromium/src/+/master/cc/layers/picture_layer_impl.cc). The same file disables LCD text for `kWillChangeTransform`, `kTransformAnimation`, and non-integral offsets. So a permanently `will-change`d camera layer risks soft text when zooming in; omitting it costs a re-raster per scale change. Which wins is empirical **(unverified)**; Firefox/WebKit not read.

---

## 2. Precision and range

**What the platform stores.**

- A pure scale+translate transform (our camera) is stored by Chromium as **float32**: "it may be internally stored as an AxisTransform2d (float precision) or a full Matrix44 (4x4 double precision)… on construction… AxisTransform2d will be used if the matrix will be 2d scale and/or translation" (`ui/gfx/geometry/transform.h:43-55`, https://chromium.googlesource.com/chromium/src/+/refs/heads/main/ui/gfx/geometry/transform.h). Skia's `SkScalar` is `float` (https://skia.googlesource.com/skia/+/refs/heads/main/include/core/SkScalar.h, line 16).
- Layout (`left`/`top`) is fixed-point: Blink `LayoutUnit` = 1/64 px in an `int32_t` (`third_party/blink/renderer/platform/geometry/layout_unit.h:66-67`, `kIntMax = kRawValueMax / kFixedPointDenominator`, `:88-95`) → ≈ ±33,554,431 px **(derived)**. Gecko: `nscoord_MAX = (1 << 30) - 1` app units (`gfx/src/nsCoord.h:28`), 60 app units per CSS px (`gfx/src/AppUnits.h:11`) → ≈ ±17.9 M px **(derived)**. Positioning nodes with `left/top` therefore saturates at ~1.8–3.4e7 px; `transform: translate()` does not go through layout units.
- float32 spacing at magnitude `m` is `2^(floor(log2 m) − 23)` **(derived)**: ≈ 0.0078 px at 1e5, **0.0625 px at 1e6**, **1 px at 1e7**. So a float32 translate near 1e6 already shimmers sub-pixel; near 1e7 it moves in whole pixels.
- The same hazard exists on the GPU: "GPUs internally operate on single precision 32-bit floating-point numbers" and objects far from the origin "visually jitter" (AGI/STK, https://help.agi.com/STKComponents/html/BlogPrecisionsPrecisions.htm). Their fix is to **re-base**: render relative to a centre/eye (RTC/RTE), and Cesium encodes doubles as high+low floats (https://cesium.com/downloads/cesiumjs/releases/b30/Build/Documentation/EncodedCartesian3.html).

**What the canvas libraries do.**

- **No re-basing found** in tldraw or Excalidraw. A grep for rebase/re-base/far-from-origin/precision in `packages/` of both found nothing relevant (tldraw only has `isSafeFloat`, `primitives/utils.ts:369-371`, which is `|n| < MAX_SAFE_INTEGER` — no help at the float32 scale). I did not grep xyflow/rzpp/panzoom for this.
- Excalidraw **flags** extreme positions rather than handling them: `console.error("New element size or position is too large")` when `|x|`, `|y|`, `width` or `height` exceeds `1e6` — "a temporary check" (`packages/element/src/newElement.ts:112-132`). That is the closest thing to a documented practical bound, and it coincides with the float32 figure above.
- Both keep world coordinates as JS doubles and rely on the camera being small relative to them. The precision hazard is in the **composition** (`z·(world + t)` computed in float32 by the compositor), not in the stored double.

**Serialisation breaks earlier than rendering.** atproto's data model has **no floats** ("not allowed in atproto"); `integer` is signed 64-bit but "should be limited to 53 bits of precision" for JS, and the guidance for floats is "encoding the floats as strings or even bytes" (https://atproto.com/specs/data-model, "Data Types" and "Why No Floats?"). JSON Canvas also uses integers for `x,y,width,height` (`spec/1.0.md`, "Generic node"). `at.inlay.canvas#window` has integer `x,y,z,width,height` (https://lexicon.garden/lexicon/did:plc:mdg3w2kpadcyxy33pizokzf3/at.inlay.canvas). So the persisted world is an integer lattice by construction.

---

## 3. Culling and level of detail

|            | Spatial structure                                    | Mechanism                                                                                                | DOM kept?              | Never culled                                                        | Source                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tldraw     | R-tree (`rbush`)                                     | incremental derivation of "not visible" ids → one reactor flips `display: none` on the shape container   | **yes** (display:none) | selected shapes, the shape being edited; per-type `canCull` opt-out | `packages/editor/package.json:69`; `managers/SpatialIndexManager/RBushIndex.ts`; `derivations/notVisibleShapes.ts:12-71`; `Editor.ts:5786-5798`; `hooks/useShapeCulling.tsx:46-48,63-75`; docs `apps/docs/content/sdk-features/culling.mdx` |
| Excalidraw | none: O(n) scan per render, memoised                 | only visible elements are **drawn** to the canvas; selected-element handling separate                    | n/a (canvas)           | n/a                                                                 | `scene/Renderer.ts:205-240` (loop over `elementsMap`), `element/src/sizeHelpers.ts:80-115` (AABB vs viewport corners)                                                                                                                       |
| xyflow     | none: O(n) over the node lookup on each store update | `onlyRenderVisibleElements` (default **false**) → React **unmounts** nodes not intersecting the viewport | **no**                 | a node being dragged (`node.dragging`), nodes not yet measured      | `component-props.ts:381-387` ("might improve performance… but also adds an overhead"); `hooks/useVisibleNodeIds.ts`; `system/src/utils/graph.ts:264-304`                                                                                    |

Details worth copying as _ideas_:

- tldraw's doc claim: "a canvas with 10,000 shapes might only render 50" (`apps/docs/content/sdk-features/performance.mdx`, "Viewport culling").
- tldraw **debounced zoom**: with > 500 shapes (`debouncedZoomThreshold`, `options.ts:341-342`), per-zoom-dependent rendering reads a zoom value frozen while the camera moves (`Editor.ts:3221-3264`). LOD proper is thin: `--tl-text-outline` is switched off below `textShadowLod = 0.35` (`DefaultCanvas.tsx:69-93`, `options.ts:326`); that is the only zoom-driven LOD I found in the DOM layer.
- tldraw blocks hit-testing while the camera moves with a full-size overlay (`tl-hit-test-blocker`, `DefaultCanvas.tsx:159,347-358`).
- xyflow's visibility predicate is shared with **marquee selection**: `getNodesInside(…, partially)`; "partially" (any overlap) vs fully contained is the same flag (`graph.ts:264-296`, §4).
- xyflow measures node size from the DOM with a `ResizeObserver` (`container/NodeRenderer/useResizeObserver.ts`) and renders unmeasured nodes regardless (`forceInitialRender`, `graph.ts:295`). DOM-sized nodes mean geometry is asynchronous.

**What the DOM forces.** Culling is a per-node style/mount toggle; geometry for hit-testing must live outside the DOM tree (a spatial index) or be asked from the DOM. And **culling conflicts with accessibility**: tldraw's culled shapes get `display: none`, which removes them from the tab order and accessibility tree; its answer is a _virtual_ selection (§7). xyflow's unmounting does the same. The CSS-native alternative is `content-visibility: auto`, whose skipped contents "must still be available as normal to user-agent features such as find-in-page, tab order navigation, etc., and must be focusable and selectable as normal", and whose "relevant to the user" set includes anything focused or selected (https://www.w3.org/TR/css-contain-2/, "content-visibility" and §4.5). Whether its viewport test accounts for a transformed ancestor is implementation behaviour **(unverified)**.

**What `<canvas>` enables.** No per-element cost for off-screen items (Excalidraw draws the visible subset, `staticScene.ts:330`) and no DOM node budget. Figma went to WebGL because "HTML and SVG … are usually optimized for scrolling, not zooming, and geometry is often re-tessellated after every scale change" (https://www.figma.com/blog/building-a-professional-design-tool-on-the-web/, 2015 — a 2015 claim, not re-measured).

---

## 4. Hit-testing, z-order, pointer capture, marquee

### 4.1 Who hit-tests

- **tldraw (DOM-rendered, geometry hit-tested).** `.tl-shape { pointer-events: none }` (`editor.css:1012-1018`); the canvas element owns pointer capture and dispatches synthetic `target: 'canvas'` events (`hooks/useCanvasEvents.ts:49,60-66,80`). `getShapeAtPoint` (`Editor.ts:5906-6112`) walks shapes **top-most first** (reverse sorted order, `:5933`), uses the R-tree for candidates (`:5927`), then geometry: broad phase on bounds, narrow phase distance; filled shapes return immediately, hollow shapes hit within a margin of the edge (closest edge wins) or fall back to the **smallest-area** hollow shape; frames swallow hits inside them; labels are checked first. This is much richer than DOM hit-testing.
- **Excalidraw (canvas, manual).** `getElementAtPosition`/`getElementsAtPosition` (`App.tsx:5958-6056`): filter all elements with `hitElement`, order = array order (low→high z), **embeddables (iframes) are moved to the end so they win** (`:6042-6053`), and if the top element is hit only on its bounding box while another is hit on its figure, the latter wins (`:5991-6008`). Linear scan, flagged "Hot path for hit testing" (`:5957`).
- **xyflow (DOM, browser hit-tests).** Each node is a `div` with its own handlers and `zIndex` (`NodeWrapper/index.tsx:203-218`); node drag via d3-drag. Z-order is `internals.z`, so the browser's stacking decides who is under the pointer.
- **JSON Canvas** defines z-order as **array order**: "The first node in the array should be displayed below all other nodes, and the last node… on top" (`spec/1.0.md`, "Nodes").
- **z-order persistence differs:** tldraw and Excalidraw store a fractional-index string per element (tldraw docs `shape-indexing.mdx`; Excalidraw `packages/element/src/types.ts:65-69`: "Used for ordering in multiplayer scenarios… Always kept in sync with the array order"); Inlay stores integer `z`.

### 4.2 Pointer capture

- Pointer Events: touch/stylus direct manipulation "SHOULD behave exactly as if setPointerCapture was called on the target element just before the invocation of any pointerdown listeners" (https://www.w3.org/TR/pointerevents3/ §9.4); `touch-action: none` is what keeps the browser from taking the gesture (§8.1, Example 6).
- All of tldraw (`useCanvasEvents.ts:49`), Excalidraw (`App.tsx:7571-7576`, comment: "this makes other elements non-interactive until pointer up"), xyflow (`Pane/index.tsx:163`) and design-editor (`graph.tsx:172`) call `setPointerCapture` on one owner at pointerdown. One capture owner for the whole gesture is the shared design.
- Both tldraw and Excalidraw guard for the browser stealing the pointer (`pointercancel` handling in `useCanvasEvents.ts`; Excalidraw `App.tsx:8035` comment "The browser took the pointer over (scroll, pinch, palm rejection)"). tldraw refuses to act on non-pen input in pen mode (palm rejection, `Editor.ts:11226-11230`).

### 4.3 Marquee semantics: three different defaults

|            | Default                                                                                                                                                         | Alternate                                                                        | Source                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| tldraw     | **touch** (any intersection with the shape's geometry — brush edges hit-tested against geometry, so a hollow shape is not selected by a brush wholly inside it) | "wrap mode" user preference = must fully enclose; accel key inverts              | `Brushing.ts:132-133,196-225`                                                                           |
| Excalidraw | **contain**                                                                                                                                                     | `boxSelectionMode: "overlap"` in app state (persisted in `restore.ts:1294-1297`) | `packages/excalidraw/types.ts:285`; `element/src/selection.ts:70-99`; `element/src/bounds.ts:1268-1290` |
| xyflow     | **full** (`SelectionMode.Full`)                                                                                                                                 | `Partial`                                                                        | `ReactFlow/index.tsx:71`; `system/src/types/general.ts:284-287`                                         |

Notes: the "overlap" result is geometry-aware in Excalidraw (tests assert a brush that only overlaps a filled ellipse's corner of its bounds does not select it: `packages/excalidraw/tests/selection.test.tsx:531-570`) and groups select as a unit when one member is overlapped (`:279-305`). tldraw skips frame-like shapes unless fully enclosed (`Brushing.ts:203`) and restricts the test to on-screen shapes unless the viewport moved or the brush left it (`:148-161`, "On a page with ~5000 shapes, on-screen hit tests are about 2x faster"). tldraw re-tests against live shapes each move deliberately, "a user could select a shape by selecting where it _used_ to be" otherwise (`:148-152`).

The spec must pick the default and make the mode a parameter; "marquee while the camera moves/auto-pans" (tldraw `viewportDidChange`, `:46-54`) is a state the spec must cover.

---

## 5. Drag with grab offsets, resize, snapping and guides

**Grab offset = "original + (pointer − pointerdown), both in world coordinates".** Two forms, equivalent:

- tldraw: `delta = currentPagePoint − originPagePoint`, applied to a snapshot of original positions (`Translating.ts:591`, `snapshot` param at `:565-582`). Shift locks the dominant axis (`:593-603`).
- Excalidraw: `dragOffset = pointerCoords − pointerDownState.drag.origin`, applied to `originalElements` (`App.tsx:9915-9922`); shift locks axis (`:9925-9941`).
- xyflow: stores the offset explicitly per dragged node: `distance = mousePos − positionAbsolute` (`system/src/xydrag/utils.ts:52-58`), next position `= pointer − distance` (`XYDrag.ts:166`). Multi-select drags all selected non-child nodes.
- design-editor: `origin + (pointer − start)` in "user" (world) coords (`graph.tsx:162-200`).

Because the delta is computed in **world** coordinates from the pointerdown snapshot, camera changes mid-drag (edge auto-pan, wheel) are handled for free: tldraw dispatches a synthetic pointer event when the camera moves under a stationary pointer (`Editor.ts:3562-3577`, "the pointer's page will have changed"); xyflow does explicit auto-pan with `lastPos` compensation (`XYDrag.ts:232-256`).

**Drag threshold.** tldraw: `dragDistanceSquared: 16` (4 px), `coarseDragDistanceSquared: 36` (6 px) (`options.ts:298-299`) — in _screen_ px. design-editor's is 3 _world_ units (`graph.tsx:187-190`), which scales with zoom — a bug-in-waiting.

**Snapping.**

|            | Where it lives                                                                                                         | Policy knobs                                                                                                                                                                                                                                                                          | Source                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| tldraw     | in the editor library, as `SnapManager` (`editor.snaps`) used by the built-in tools                                    | threshold `snapThreshold: 8` **screen px**, divided by zoom → world (`SnapManager.ts:60-61`); off by default, Ctrl/Cmd inverts; `isSnapMode` user pref; separate grid mode; only snaps when pointer velocity < 0.5 (`Translating.ts:609-611`); snap indicators are state (`:606,652`) | `options.ts:346`; `Translating.ts:584-655`; docs `snapping.mdx` |
| Excalidraw | `packages/excalidraw/snapping.ts`, called from `App.tsx:10040-10067`                                                   | `SNAP_DISTANCE = 8` / zoom (`snapping.ts:41-49`); `objectsSnapModeEnabled` in app state, Ctrl/Cmd inverts (`:162-192`); snap lines in app state; grid separate                                                                                                                        |                                                                 |
| xyflow     | built-in **grid only** (`snapToGrid`, `snapGrid`, `component-props.ts:375-380`); no alignment guides found in the repo | host composes the rest                                                                                                                                                                                                                                                                | `XYDrag.ts:166-173`                                             |

Both tldraw and Excalidraw choose "8 px on screen" and convert by zoom. That is the invariant worth encoding: **a threshold is a screen quantity; candidates and results are world quantities**. Neither separates mechanism from policy: they ship defaults (what to snap to — edges, centres, gaps) inside the library. xyflow does separate them, by shipping only the grid.

**Resize.** In tldraw resize lives in `Resizing.ts` and each shape's `onResize`; in Excalidraw in `App.tsx` + `packages/element/src/resize*`. I did **not** read resize in depth (see unverified list); I only confirmed that both route it through the same snapping module (tldraw docs `snapping.mdx`: "When you move or resize shapes, tldraw snaps them…"; Excalidraw `snapResizingElements`, `snapping.ts:1108`).

**Where I'd put the line** is in Recommendations (§ decision 2).

---

## 6. Inertia, smooth zoom, `prefers-reduced-motion`

- **Inertia.** Only tldraw ships pan inertia that I read: `slideCamera`, friction per **time**, not per frame — "Apply friction per unit of elapsed time, not per tick, or a 120 Hz display decays twice as fast" (`Editor.ts:4114-4115`, default friction `0.09`, `options.ts:305`, constants assume 60 Hz `FRAME_MS_60HZ`, `constants.ts:27-33`), stops below `speedThreshold = 0.01` (`:4080,4116`). It also supports exponential zoom animation about the viewport centre (`:4104-4112`). rzpp has velocity-animation props (`__tests__/features/props/velocity-animation-props.spec.tsx`; implementation `src/core/pan/velocity.logic.ts`). panzoom has none beyond a CSS `transition` (200 ms ease-in-out) used by `zoomIn`/`zoomOut`/`reset`; wheel zoom is `animate: false` (`panzoom.ts:33-57,335,412`).
- **Camera animation** (fit/zoom-to): tldraw interpolates the _viewport box_ (left/top/right), not `{x,y,z}`, so the animation is zoom-consistent (`Editor.ts:3984-3990`).
- **Reduced motion.** tldraw is the only one that handles it in the camera: `animationSpeed` defaults to `0` when `(prefers-reduced-motion: reduce)` matches, tracked live (`UserPreferencesManager.ts:36-44,94-101`); `animationSpeed === 0` makes `slideCamera` return early (`Editor.ts:4071-4072`) and animated moves jump (`:4014`). User override wins over the OS value. Documented in `apps/docs/content/sdk-features/accessibility.mdx` ("Reduced motion"). A grep for `prefers-reduced-motion` found **nothing** in xyflow, panzoom or rzpp sources, and only unrelated UI styling in Excalidraw (`TopPicksDnD.scss`, `FileDropOverlay.scss`). The media feature itself: https://www.w3.org/TR/mediaqueries-5/ §12.1.
- **Excalidraw** animates scroll in `scrollToContent` (its tests `fitToContent.test.tsx:274-368` check "animate the scroll but not the zoom"), with no reduced-motion hook found.

For the spec, motion is an _output_ (a camera tween request) with a duration the adapter may set to 0; the end state must be identical with and without animation (this is what the Excalidraw "should stop ticking and settle on the target once complete" test asserts, `fitToContent.test.tsx:368`).

---

## 7. What a DOM + CSS-transform canvas can do that `<canvas>`/WebGL cannot — and the reverse

| Capability                                                            | DOM + CSS transform                                                                                                     | `<canvas>` / WebGL                                                                                                                                                                                              | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Real focus / tab order**                                            | native per node                                                                                                         | only via _fallback content_ inside `<canvas>`: "authors should have a one-to-one mapping of interactive regions to focusable areas in the fallback content. (Focus has no effect on mouse interaction events.)" | HTML Standard, canvas element, https://html.spec.whatwg.org/multipage/canvas.html (text: "the user can still focus descendants of the canvas element (in the fallback content)"). IDL has `drawFocusIfNeeded()` for drawing the ring. Excalidraw's canvas components contain no `aria-`/`role`/`tabIndex` (grep of `packages/excalidraw/components/canvases/` found none)                                                                                                                                                                                                                                                    |
| **Screen readers**                                                    | native roles/labels; but the reading order must be built (DOM order ≠ spatial order)                                    | manual shadow DOM                                                                                                                                                                                               | xyflow gives every node `tabIndex=0`, `role="group"`, `aria-roledescription="node"`, `aria-describedby`, and an `aria-live` region updated on keyboard moves (`NodeWrapper/index.tsx:128-161,219-225`; `A11yDescriptions/index.tsx:23-31`). tldraw does **not** use per-shape DOM focus: canvas is `role="application" tabIndex={-1}` (`TldrawEditor.tsx:354-356`), Tab moves a _virtual_ selection in computed reading order (rows by y, then x) with a visually-hidden live-region announcement `"[description], [type]. [n] of [total]"` (docs `accessibility.mdx`, "Screen reader announcements", "Keyboard navigation") |
| **Selection / copy / find-in-page**                                   | native text selection and find; tied to _not_ being `display:none`/unmounted                                            | none; copy needs custom serialisation                                                                                                                                                                           | `content-visibility:auto` keeps skipped content findable/focusable (css-contain-2, §"content-visibility"); `display:none` culling (tldraw) and unmounting (xyflow) do not                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Text editing + IME**                                                | native `<input>`/`contenteditable` inherits IME, caret, a11y                                                            | needs an overlay editor or a custom text engine                                                                                                                                                                 | Excalidraw draws text on canvas but edits in a positioned `<textarea>` ("wysiwyg", `wysiwyg/textWysiwyg.tsx:529-558`) and special-cases composition (`event.isComposing \|\| event.keyCode === 229`, `:884-896`). Figma wrote its own text layout and editing stack: "Text selection and editing is even more complex with platform-specific mouse, keyboard, and touch interactions" (https://madebyevan.com/figma/)                                                                                                                                                                                                        |
| **Arbitrary embedded UI (plugin components, iframes, form controls)** | yes                                                                                                                     | no — must overlay DOM anyway                                                                                                                                                                                    | Excalidraw embeddables are **DOM** `div`s with per-element `translate(...) scale(...)` positioned over the canvas (`App.tsx:1954-1972`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Crispness at zoom**                                                 | vector text is re-rasterised by the browser; depends on compositor raster scale, `will-change`, integral offsets (§1.3) | you control it, and must redo it per zoom + DPR; Excalidraw caches bitmaps during zoom gestures and snaps scroll to device pixels                                                                               | §1.3 sources                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Hit-testing**                                                       | free and transform-aware, z-order by paint; coarse (box)                                                                | manual: linear scan (Excalidraw) or spatial index                                                                                                                                                               | §4; note tldraw still hit-tests manually _despite_ DOM because it needs geometry-precise hits, frames and hollow-shape rules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **10k+ items**                                                        | needs culling + a node budget                                                                                           | cheap; GPU tile engines (Figma) scale furthest                                                                                                                                                                  | §3; Figma blog                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Cross-browser text/AA consistency**                                 | varies                                                                                                                  | consistent                                                                                                                                                                                                      | Figma: "Text layout is inconsistent between browsers" — for us, host styling via cssints is a _feature_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Export (SVG/PNG)**                                                  | DOM → needs rasterising/foreignObject                                                                                   | straightforward                                                                                                                                                                                                 | not evaluated                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Two further facts that bear on the decision:

- **Even the DOM leader doesn't use per-node DOM focus.** tldraw (DOM-rendered) chose a virtual-selection model _because_ it culls with `display:none`. A headless primitive whose first-class requirement is "accessible without a mouse" has to decide: (a) real focus on real nodes (xyflow, needs `content-visibility:auto` or no culling for focusables), or (b) virtual focus + live region (tldraw). Both are DOM-based. A pure `<canvas>` can only do (b) plus a mirrored subtree.
- **Pointer capture and gestures are the same in both** (§4.2).

**Hybrid precedent.** tldraw and xyflow (DOM, one camera transform), Excalidraw (canvas + DOM overlays for embeds and text editing), Figma (WebGL + DOM only for UI chrome) all end up hybrid; the difference is where the line sits.

---

## 8. Our own prior art: `apps/design-editor`

Read: `apps/design-editor/src/graph.tsx` (344 lines), `src/app.tsx:159-163,285-314,535-574`, `src/styles.css:413-534`, `src/app.browser.test.tsx:162-200`, `README.md:86-111`, `packages/design-tokens/src/editor/graph.ts:1-60`. Added in a single commit `cbb8387bd0` (`git log -- apps/design-editor/src/graph.tsx`).

**What it is.** A Solid 2 component `GraphView({graph, selected, onSelect})` (`graph.tsx:107-111`). One `<svg>` inside a `div.graph-canvas` that `@panzoom/panzoom` transforms.

- **Camera state.** Held _inside the Panzoom instance_, not in a signal: `let panzoom: PanzoomObject` (`:117`), read imperatively (`panzoom?.getScale()`, `:146`). The camera is therefore not reactive — nothing in Solid can derive from it (culling, minimap, LOD would need a bridge). Options: `minScale 0.4, maxScale 2.5, excludeClass 'graph__node', contain 'inside', touchAction 'none'` (`:246-252`). Created in `queueMicrotask` because Panzoom needs an attached element (`:243-255`). Wheel via wrapper `onWheel → zoomWithWheel` (`:220`). `+`/`−`/`Fit`/`Reset` are real `<button>`s (`:222-234`).
- **Node state.** `positions: Record<id, Point>` signal of _overrides_ over a column layout (`:112`, `:41-50`, `:68-105`). `placed` memo recomputes **every node and every edge on each pointermove** (`:120-122`, `:91-97`).
- **Nodes.** SVG `<g transform="translate(x y)">` with a rect, optional swatch and `<text>` (`:297-337`); fixed `NODE_WIDTH 168 × NODE_HEIGHT 28` (`:6-10`), labels truncated to 21 chars (`:38-39`). **Not HTML**, so no real text, focus or plugin content.
- **Edges.** `getBoxToBoxArrow` from perfect-arrows → `M sx sy Q cx cy ex ey` quadratic path with `bow 0.3, padStart 4, padEnd 6, straights false` (`:53-66`), one `<marker>` arrowhead (`:268-280`). Edges have no id; key is `from->to` (`:96`; `GraphEdge = {from, to}`, `graph.ts:46`).
- **Drag.** `pointerdown` on a node: `stopPropagation`, record start+origin in user coords, `svg.setPointerCapture` (`:153-173`); `pointermove` applies `origin + (pointer − start)` (`:183-200`); `pointerup` releases (`:202-207`). Click is suppressed after a drag by a closure flag `didMove` (`:118,175-181`); drag threshold is 3 _world_ units (`:187-190`). Screen→user conversion: `(client − rect.left)/scale` (`:144-151`).
- **Fit.** `scale = min(1, rect.w/W, rect.h/H)`, then `pz.pan((rect.w − W·scale)/2, …)` (`:127-141`). Because Panzoom applies `scale(s) translate(x,y)` with `transform-origin: 50% 50%` on HTML elements (`panzoom.ts:89-96`), pan is in pre-scale units and a centred pan should be `(rect.w − W)/(2s)` **(derived)**; the code's expression equals that only when `s = 1`. Not run, so **(unverified)** whether it visibly mis-centres.
- **Accessibility.** None for nodes: no `tabindex`, `role`, or key handlers on the `<g>`s; each has only a `<title>` (`:333-336`). Node activation is pointer-only.
- **Tests.** One browser test: counts `.graph__node` (>20) and `.graph__wire` (>10) and clicks two nodes (`app.browser.test.tsx:162-200`). No camera, drag, culling or keyboard tests.

**Reusable vs specific.**

| Reusable concept (re-implement, not copy)                                                                                                                                                                                         | Specific to the token editor                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| fit-to-bounds (`:127-141`); screen→world helper (`:144-151`); capture-owner drag with pointerdown snapshot (`:153-207`); position-overrides-over-layout split (`:112,68-105`); perfect-arrows box-to-box edge geometry (`:53-66`) | column layout & `COLUMN_LABELS` (`:12-17,41-50`); `GraphNode.kind/column/swatch/controlId/cycleKey/source` (`graph.ts:14-44`); click semantics (toggle source, cycle constraint) in `app.tsx` `handleGraphNode`; `.graph__node--kind` styles (`styles.css:466-534`); fixed node size; truncation |

**Gaps relative to the destination:** camera outside Solid's graph; no keyboard or SR; SVG not HTML nodes; no culling; no marquee/multi-select; no z-order; drag threshold in world units; O(N+E) relayout per move; edges without identity/labels/sides; one smoke test. It is an embryo of the _interaction_, not of the camera or scene model.

`docs/map.tldraw` and the `tldraw-offline` skill exist; not opened per instructions.

---

## 9. Licences

| Project                      | Licence                                                                                                                          | Evidence                                                                                                  | Reuse code/tests?                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **tldraw**                   | **Not OSI.** Custom "tldraw license" ("This License from tldraw, Inc."); `package.json` `"license": "SEE LICENSE IN LICENSE.md"` | `LICENSE.md` (full text read); `packages/editor/package.json:10`                                          | **No.**                                                                                                                                         |
| Excalidraw                   | MIT, "Copyright (c) 2020 Excalidraw"                                                                                             | `LICENSE`; `packages/excalidraw/package.json:42`, `packages/math/package.json:29`                         | Yes, with attribution. Only root `LICENSE` and package `license` fields checked; bundled fonts/assets may carry other licences **(unverified)** |
| xyflow / React Flow          | MIT, "Copyright (c) 2019-2025 webkid GmbH"                                                                                       | `LICENSE`; `packages/react/package.json:51`, `packages/system/package.json:37`                            | Yes, with attribution                                                                                                                           |
| d3-zoom, d3-drag             | ISC, "Copyright 2010-2021 Mike Bostock" (permissive; keep notice)                                                                | https://raw.githubusercontent.com/d3/d3-zoom/main/LICENSE                                                 | Yes, with notice (d3-drag licence not separately fetched)                                                                                       |
| react-zoom-pan-pinch         | MIT, "Copyright (c) 2019 prc5"                                                                                                   | `LICENSE`; `package.json:7`                                                                               | Yes, with attribution                                                                                                                           |
| @panzoom/panzoom             | MIT, "Copyright 2016-2019 Timmy Willison"                                                                                        | `MIT-License.txt`; `package.json:47`                                                                      | Yes, with attribution                                                                                                                           |
| perfect-arrows               | MIT, "Copyright (c) 2020 Steve"                                                                                                  | `LICENSE`; `package.json:3`                                                                               | Yes, with attribution (it is already a dependency; no code copied)                                                                              |
| JSON Canvas                  | MIT, "Copyright (c) 2024 Obsidian.md" (spec, site, assets)                                                                       | `LICENSE`; https://jsoncanvas.org/ ("open source under the MIT license")                                  | Yes                                                                                                                                             |
| rbush (tldraw's index)       | MIT, "Volodymyr Agafonkin"                                                                                                       | https://raw.githubusercontent.com/mourner/rbush/main/LICENSE                                              | Yes                                                                                                                                             |
| rocicorp/fractional-indexing | CC0-1.0                                                                                                                          | https://raw.githubusercontent.com/rocicorp/fractional-indexing/main/package.json (`"license": "CC0-1.0"`) | Yes                                                                                                                                             |
| Figma, AGI/Cesium blogs      | proprietary / copyright text                                                                                                     | n/a                                                                                                       | Read-only (ideas)                                                                                                                               |

### tldraw's licence, precisely (`LICENSE.md`)

- **Permits:** use "in Development Environments" (internal, not accessible to end users/customers/public); modify; bundle with your own projects; submit modifications to tldraw.
- **Forbids:** "Not to use the Software in Production Environments"; not to "disable, change, or interfere with the Software's License Key enforcement"; not to remove copyright/notices; not to "make the Software available under a license that supersedes or negates" it; not to distribute it "as a standalone product, but only as part of another application"; must include a verbatim copy in any distribution; must comply with the trademark policy.
- **Other terms:** trial and commercial licences exist ("Alternative licenses are available… https://tldraw.dev"); licence terminates on breach or if you start an IP claim against tldraw or its users; "Technical enforcement": the Software "may collect and transmit usage data to tldraw for license compliance purposes"; Delaware law.
- **Consequence for us:** any code, test, or doc text lifted from the tldraw repo would be "the Software" and would pull our files under these terms (no production use without a key; no relicensing). Our repo ships on atproto to end users, i.e. a Production Environment. **Do not copy code, tests, scenario data or doc prose.** Reading the source to learn _what behaviours exist_ and re-deriving them from the spec is the intended use. Behaviour facts quoted above are short citations for attribution of ideas; none of this document's formulae are tldraw code (they are standard algebra, §1.2).

---

## 10. JSON Canvas 1.0

Spec: https://jsoncanvas.org/spec/1.0 (= `spec/1.0.md`, 2024-03-11). It is a file format; it stores **no camera**, no viewport, no zoom.

### 10.1 Who reads and writes it

From the site's apps page (`docs/apps.md`, https://jsoncanvas.org/docs/apps):

- **Apps** (storage / import / export): Obsidian (✓/✓/✓), Charkoal (✓/✓/✓); import+export only: Kinopio, Flowchart Fun, hi-canvas, OrgPad, Ideaflip.
- **Converters:** Heptabase→JSON Canvas; JSON Canvas→Mermaid; →Property Graph Exchange Format (`pgraphs`).
- **Libraries:** Dart, Go, Python, React (`react-jsoncanvas`), Ruby, Rust, TypeScript (`@trbn/jsoncanvas`), Vue, a Rehype plugin, a TypeScript viewer.
- Its own reference viewer (`assets/canvas.js`) is a DOM page with a CSS variable `--scale`; fit is `min(vw/(bw+80), vh/(bh+80), 1)` (`canvas.js:41-46`). The sample is `sample.canvas` (negative coordinates present).

### 10.2 Mapping onto a runtime scene graph

| Runtime concept   | JSON Canvas                                                                                                                       | Notes                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| node id           | `id` (required string)                                                                                                            | no length rule in spec; Inlay caps `window.id` at 64 bytes    |
| node kind         | `type`: `text` \| `file` \| `link` \| `group`                                                                                     | closed set; no extension point in the spec text               |
| geometry          | `x`, `y`, `width`, `height` (required **integers**, "in pixels")                                                                  | no rotation, no lock, no aspect                               |
| z-order           | **array order** (first = bottom)                                                                                                  | no `z` field, no fractional index                             |
| colour            | `color`: `"#RRGGBB"` or preset `"1"`..`"6"` (red, orange, yellow, green, cyan, purple; actual values "intentionally not defined") | preset slots map cleanly onto cssints tokens                  |
| text content      | `text` (Markdown), `file`+`subpath`, `url`                                                                                        |                                                               |
| group             | `group` node with optional `label`, `background`, `backgroundStyle`                                                               | containment is **by geometry only**; no `children`/`parentId` |
| edge id/ends      | `id`, `fromNode`, `toNode`                                                                                                        |                                                               |
| edge anchoring    | `fromSide`/`toSide` ∈ top/right/bottom/left, `fromEnd` (default `none`)/`toEnd` (default `arrow`) ∈ none/arrow                    | side only; no port ids, no waypoints/control points           |
| edge label/colour | `label`, `color`                                                                                                                  |                                                               |
| camera            | —                                                                                                                                 | not stored                                                    |

### 10.3 Can it be our persistence shape? What it lacks

**As the interchange/import-export format: yes.** As the **runtime/atproto record: not as-is**, because it lacks:

1. A node type for **plugin components** (NSID + typed props). The four types are closed and the spec defines no unknown-field rule **(spec silent; "extensibility" is claimed on the site but not specified in `1.0.md`)**. Inlay solves this exact need with `componentUri` (at-uri) + `props: unknown` (lexicon above).
2. Node `rotation`, `locked`, `hidden`, `meta`.
3. Explicit **parent/child** (groups are geometric); needed for nested canvases and group move semantics.
4. Edge geometry beyond sides: waypoints, port/handle ids, routing mode, endpoint binding to a _point on_ a node.
5. Camera / per-viewer view state (by design).
6. Stable **ordering under concurrent edits** (array order has no merge story; tldraw/Excalidraw use fractional index strings, Inlay uses integer `z`).
7. Schema/versioning identifiers (atproto wants `$type`; Lexicon provides it).

What it gives: a minimal, widely implemented shape for the 80% case (text/file/link/group + side-anchored arrows), integer geometry that already satisfies atproto's no-float rule, and the colour-preset convention.

**atproto's own prior art** (`at.inlay.canvas`, key `tid`): `windows[]` of `{id (≤64 bytes), x, y, z, width?, height?, componentUri, props?}` plus `overrides` (DID stack) and `createdAt`; all geometry `integer` (https://lexicon.garden/lexicon/did:plc:mdg3w2kpadcyxy33pizokzf3/at.inlay.canvas; consumer code at `danabra.mov/inlay` `app/canvas/at/[did]/[collection]/[rkey]/page.tsx`, via https://tangled.org/danabra.mov/inlay). It has no edges and no camera.

Record-size limits for a large canvas record are **(unverified)**; the repository spec only says repos "are intended to store up to single-digit millions records" (https://atproto.com/specs/repository).

---

## Comparison table

| Library                | Camera model                                       | Rendering                                                                                                            | Culling                                                                      | Licence                                         | What we can reuse                                                                                                                                |
| ---------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| tldraw 5.5.2           | `{x,y,z}`, world-offset; 2x3 `Mat` for shapes only | DOM: one `scale(z) translate(x,y)` html layer + per-shape `matrix()` + z-index; SVG shapes; manual geometry hit-test | R-tree → `display:none`; selected/editing exempt; debounced zoom >500 shapes | **tldraw licence (non-OSI; no production use)** | **Ideas only**: virtual-focus a11y model, culling layering, snap threshold in screen px, friction per time, reduced-motion → animationSpeed 0    |
| Excalidraw 0.18        | `{scrollX, scrollY, zoom.value}`, world-offset     | 2D canvas (static + interactive layers) + DOM overlays for embeds and text editing                                   | per-frame O(n) viewport filter, memoised                                     | MIT                                             | Code and tests, with attribution: viewport math, device-pixel scroll snapping, box-select contain/overlap + tests, snapping, z-index/align tests |
| xyflow 12.12           | `[x,y,zoom]` (d3-zoom), screen-offset              | DOM nodes (per-node `translate`, `tabIndex`, ARIA) + SVG edges; one viewport transform                               | opt-in unmount (default off), O(n)                                           | MIT (d3 ISC)                                    | Code/tests, with attribution: DOM-node a11y pattern, drag `distance`, auto-pan, `getNodesInside` full/partial                                    |
| react-zoom-pan-pinch   | `{positionX, positionY, scale}`, screen-offset     | one DOM element, `translate() scale()`                                                                               | none                                                                         | MIT                                             | Bounds/rubberband and zoom-limit tests (scenario source); not an infinite-canvas model (it contains content)                                     |
| @panzoom/panzoom 4.6.2 | `{x,y,scale}`, world-offset, `scale() translate()` | one DOM/SVG element                                                                                                  | none                                                                         | MIT                                             | Already a dep; reference for focal zoom; unit tests are DOM-wiring (QUnit), little scenario value                                                |
| perfect-arrows 0.3.7   | n/a (geometry)                                     | returns points/angles; you draw                                                                                      | n/a                                                                          | MIT                                             | Already a dep; snapshot tests incl. far-from-origin case are scenario data                                                                       |
| JSON Canvas 1.0        | none                                               | n/a (file format)                                                                                                    | n/a                                                                          | MIT                                             | Interchange shape; node/edge vocabulary; colour presets                                                                                          |
| Figma                  | `{center, zoom}` (public API)                      | custom WebGL tile engine, own text engine                                                                            | engine-internal                                                              | proprietary                                     | Ideas only (resize-stable camera, why they left the DOM)                                                                                         |

---

## Reusable, with licence

Everything below needs the upstream copyright + permission notice preserved in copies or substantial portions (MIT/ISC) — record it in a `NOTICE` next to the code or scenario files.

- **Excalidraw (MIT)** — `packages/common/src/utils.ts:317-358` (viewport↔scene), `viewport.ts` (zoom-about-point, fit), `renderer/helpers.ts:36-63` (device-pixel scroll snap), `element/src/bounds.ts:1268-1290`, `selection.ts` (marquee modes), `snapping.ts`, `element/src/types.ts` fractional-index notes. Tests under `packages/excalidraw/tests/` and `packages/element/tests/` (see scenario table).
- **xyflow (MIT)** — `system/src/xydrag/*` (grab `distance`, auto-pan), `system/src/utils/graph.ts` (`getNodesInside`), `NodeWrapper` a11y wiring, `A11yDescriptions`. d3-zoom/d3-drag (ISC) as dependencies.
- **rzpp (MIT)**, **panzoom (MIT)**, **perfect-arrows (MIT)** — as dependencies or short algorithm references.
- **rbush (MIT)** — the spatial index tldraw uses; take it from upstream, not tldraw. **fractional-indexing (CC0)** — take from rocicorp, not from tldraw's vendored copy (`packages/utils/src/lib/fractionalIndexing.ts`, which also derives from `jittered-fractional-indexing`, whose licence I did not check).
- **JSON Canvas (MIT)** — spec text and sample files.
- **atproto specs and Lexicon Garden records** — spec text CC-BY (https://atproto.com, "© Copyright (CC-BY) Bluesky Social PBC").

## Read-only, do not copy

- **tldraw** — all of `tldraw/tldraw`: source, **tests**, docs (`apps/docs/content/**`), CSS, templates, and the vendored `fractionalIndexing.ts`. Cited here for _what exists_, never as a source of code or scenario data.
- **Figma** (blogs, plugin API docs), **AGI/Cesium** blog text, **Chromium/Gecko** source excerpts (BSD/MPL; quoted only as evidence for platform facts, not reused).

### Scenario sources (`packages/specs/scenarios/`)

Existing scenarios record `pattern`, `source`, `commit`, `license`, per-scenario `upstream` URL, `upstreamTest`, and `notes` (checked in `packages/apg-specs/scenarios/apg/grid.ariakit.json`). Reuse the same envelope.

| Source (MIT)   | Test file                                                                                                                                               | Gives us scenarios for                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Excalidraw     | `packages/excalidraw/tests/selection.test.tsx` (41 tests; "contain" default, `box-selection overlap mode` block at `:204`, group and frame cases)       | marquee semantics: contain vs overlap, shift-add, group promotion, hollow vs filled, rotated shapes |
| Excalidraw     | `tests/fitToContent.test.tsx` (scale-down, none, animated-settle)                                                                                       | fit/zoom-to, animation settles to the same end state                                                |
| Excalidraw     | `tests/scroll.test.tsx`, `tests/pan.test.tsx`, `tests/scrollConstraints.test.tsx` (40)                                                                  | pan/scroll constraints, secondary-button pan vs context menu, initial viewport precedence           |
| Excalidraw     | `tests/pixelSnap.test.tsx`, `packages/element/tests/zindex.test.tsx` (20), `align.test.tsx` (50), `distribute.test.tsx`, `fractionalIndex.test.ts`      | device-pixel scroll snap (adapter-level), z-order moves, align/distribute                           |
| perfect-arrows | `test/getBoxToBoxArrow.test.ts`, `getArrow.test.ts` (+ `__snapshots__`; includes a far-from-origin case at `(-4710, -1571)`)                            | edge geometry golden values (they are snapshot tests, i.e. data)                                    |
| rzpp           | `__tests__/features/props/scale-limits.spec.tsx`, `controls/controls.zoom.spec.tsx`, `controls.fit-to-view.spec.tsx`, `props/bounds-positions.spec.tsx` | zoom clamp, fit, bounds                                                                             |
| xyflow         | `tests/` (not read)                                                                                                                                     | selection-mode and drag; **unread**                                                                 |

**Constraints on porting.**

- MIT permits copying test _data and structure_, but the copyright notice must travel with it → `license: "MIT"`, `upstream` URL with commit SHA, and a `NOTICE`.
- Excalidraw's tests drive the real React app (`render(<Excalidraw/>)`, mouse helpers). Port the **intent and numbers** into the scenario envelope (config + steps + expectations on camera/selection), not the harness.
- **tldraw's tests (e.g. `Editor.test.ts`, `SnapManager.test.ts`, camera/brushing tests) must not be ported or paraphrased line-by-line** (§9). If a tldraw behaviour deserves a scenario, derive it from our spec and write the scenario fresh.
- panzoom's unit tests are DOM-plumbing (QUnit; e.g. `panzoom.test.ts:144-210`), so there is little to port; its algorithm is better checked by property (cursor world-point invariance).
- Existing numbers like zoom limits differ per library; scenarios must state `config` (min/max/threshold) rather than assume a library default.

---

## Recommendations

### Decision 1 — Rendering architecture

**Options and evidence**

| Option                                                                                                                     | For                                                                                                                                                                                                                                                                                                       | Against                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. **DOM, one camera transform on a world layer + per-node `transform: translate()`** (tldraw html-layer, xyflow viewport) | Real text, IME, selection, find-in-page; plugin components (arbitrary DOM, iframes) are first-class — Inlay-style `componentUri` windows are DOM by nature; real focus possible (xyflow); host styling via cssints works; proven at thousands with culling (tldraw: "10,000 shapes might only render 50") | Node budget; needs spatial index + culling; culling conflicts with a11y unless designed in (§3, §7); crispness depends on compositor (will-change); float32 compositor math beyond ~1e6 (§2)                                                                                                   |
| B. **Per-node full transforms (zoom on each node)**                                                                        | none found                                                                                                                                                                                                                                                                                                | Camera moves would touch every node's style. tldraw writes per-shape transforms only when the _shape_ changes (`Shape.tsx:81-91`) and the camera only on the layer (`DefaultCanvas.tsx:95-101`)                                                                                                |
| C. **`<canvas>`/WebGL**                                                                                                    | Scales furthest; no DOM cost (Excalidraw, Figma); consistent text                                                                                                                                                                                                                                         | No native focus/AT (fallback subtree must mirror every node, HTML spec); text needs overlay editor or own engine (Excalidraw wysiwyg; Figma's engine); plugin DOM components still need DOM overlays (Excalidraw embeddables); loses cssints/CSS styling of nodes; hit-test/z-order all manual |
| D. **Hybrid: DOM nodes + SVG edge layer (as design-editor does), optional canvas for overview/LOD later**                  | Matches precedent (tldraw, Excalidraw's overlays); keeps door open                                                                                                                                                                                                                                        | Two renderers if/when the canvas layer arrives                                                                                                                                                                                                                                                 |

**Recommendation: A, with edges as one SVG layer inside the same world layer (D without the canvas, for now).**

- **One** camera transform on the world layer; **per-node** `translate()` (never `left/top`, which saturates in layout units at ~1.8–3.4e7 px, §2; never per-node scale).
- Keep geometry (bounds, z-order) in the scene model and use a spatial index (rbush) for culling, hit-testing and marquee; DOM is a projection, as in tldraw.
- Do **not** hand the browser a permanent `will-change: transform`; apply it only during a gesture and drop it on settle so text re-rasterises crisply (Chromium reasoning in §1.3). _This is a reasoned choice, not measured; it needs a three-engine test._
- **Culling policy that survives a11y:** selected/focused/editing never culled (tldraw `Editor.ts:5792-5798`); for the rest, prefer `content-visibility: auto` + `contain-intrinsic-size` over `display:none`/unmount where it works, because the spec keeps skipped content focusable/findable. Keep a separate semantic list (reading order) so screen-reader navigation does not depend on what is in the DOM — `-h9vk` should decide between real focus (xyflow) and virtual focus + live region (tldraw); the camera must support either.
- Not clear from sources: whether `content-visibility:auto` behaves well under a transformed, scaled ancestor in all three engines, and where DOM becomes unworkable (node count). Need a spike with 5k/20k nodes in Chromium, WebKit, Gecko before committing to a node budget. tldraw's and Excalidraw's own numbers are doc claims, not benchmarks.

### Decision 2 — What the Quint spec must encode

Quint has `int`, `bool`, `str` — the language reference shows no floating-point type and integer literals are arbitrary-precision (https://raw.githubusercontent.com/informalsystems/quint/main/docs/content/docs/lang.md, "Names"/literals). So the model has to be integer.

**Encode (the mechanism):**

1. **Camera as `{x, y, z}` integers in fixed point with a power-of-two denominator** (e.g. 1/4096 for `z`), so TS doubles and Quint ints agree exactly in the differential tests (powers of two are exact in doubles **(derived)**). Convention: pick world-offset `screen = (world + t)·z` (tldraw/Excalidraw/panzoom). State the rounding rule for every division explicitly.
2. **Invariants:** `zmin ≤ z ≤ zmax`, `zmin > 0` (invertibility); `|world| ≤ W` hard bound (suggest 1,000,000 units — Excalidraw's own flag at `newElement.ts:112-132` and the float32 spacing at 1e6, §2; recommended, not mandated by any source); **zoom-about-anchor**: the anchor's world point moves by < 1 unit; clamp **re-anchors** (tldraw `preserveFocalPoint`, §1.2); camera is _screen-resize policy_ aware (top-left vs centre anchor — choose and test).
3. **Camera operations as events:** `PanBy(dxScreen, dyScreen)`, `ZoomBy(factor, anchor)`, `ZoomTo(z, anchor)`, `FitBounds(box, padding)`, `Resize(w,h)`, `ZoomStep(±)`. Wheel/pinch/trackpad normalisation is **adapter**, not spec (libraries disagree: additive vs multiplicative vs exponential, `deltaMode`, ctrl-as-pinch, §1.2).
4. **Pointer machine:** `idle → pointing(node|canvas|handle) → dragging | brushing | panning | pinching → idle`, with one **capture owner**, a screen-px drag threshold (tldraw 4/6 px), `pointercancel` → abort-to-snapshot, and "camera moved under a stationary pointer" re-dispatch (tldraw `Editor.ts:3562-3577`). Drag = `originalSnapshot + (pointer − pointerdown)` in world coordinates (§5) so auto-pan composes.
5. **Selection semantics:** marquee mode `contain | overlap` as a **parameter** with a stated default (tldraw touch, Excalidraw contain, xyflow full — they disagree, §4.3); shift = additive; group promotion; locked/hidden excluded; "selected/editing/focused are never culled".
6. **Hit order:** top-most-first over a total z-order; ties/frames/hollow rules are _host geometry_, but "topmost hit wins; a hit on a locked item is not a hit" is spec. Z-order total and stable under reorder.
7. **Snapping contract:** pure function `snap(delta, candidates, thresholdScreen, z) → {nudge, guides}`; threshold is a **screen** quantity converted `thresholdScreen/z` (both tldraw and Excalidraw, §5); modifier inverts; axis lock; guides are _output state_ cleared on every move. Candidate generation, grid size and defaults are host policy.
8. **Keyboard, no mouse:** roving selection in reading order, arrow-move with step and shift-multiplier (xyflow: `factor: event.shiftKey ? 4 : 1`, `NodeWrapper:156-159`), pan/zoom keys, **focus-follows-camera** (xyflow auto-pans when a focused node is outside the viewport, `NodeWrapper:163-181`), announce-as-output (live message with direction and coordinates, `:146-154`; tldraw's `"[description], [type]. n of m"`). Camera reveal must work even when the target is culled.
9. **Motion:** tweens are requested outputs with a duration that is 0 under reduced motion; **same end state with or without animation** (Excalidraw `fitToContent.test.tsx:368`); any new gesture cancels the tween (tldraw `stopCameraAnimation`).

**Leave out of the spec:** transform strings, rounding to DOM precision, DPR snapping, wheel normalisation, easing curves, spatial-index choice, snap candidate policy, rendering. They are adapter or host concerns and differ per library for good reason.

### Decision 3 — What persistence needs

- **Integer lattice only.** atproto forbids floats; use integer `x,y,width,height` (JSON Canvas and `at.inlay.canvas` already do), with a documented world bound. If a zoom/viewport is ever stored, store it as an **integer fixed-point** (same denominator as the spec) or a string, per the atproto guidance (§2).
- **Camera is not scene data.** JSON Canvas and Inlay store none. Keep it as local/per-viewer state; if saved, a separate small record, never inside the shared scene.
- **Shape: a JSON-Canvas-compatible `nodes`/`edges` core, extended Inlay-style for plugin nodes.** Node = `{id, type, x, y, width, height, color?}`; plugin node = `{…, componentUri, props}` (Inlay's `window` fields) instead of overloading `text/file/link/group`; edges = `{id, fromNode, fromSide?, toNode, toSide?, fromEnd?, toEnd?, color?, label?}`. Mapping to/from stock JSON Canvas is lossless for the four standard types; plugin nodes degrade on export (e.g. to a `link` node with the component URI).
- **Add what JSON Canvas lacks only when a spec scenario needs it:** `parentId` (nesting), `locked`, rotation, edge waypoints/ports. Do not add them speculatively.
- **z-order:** array order (JSON Canvas) or integer `z` (Inlay) is enough for single-writer; fractional-index strings (tldraw, Excalidraw, CC0 `rocicorp/fractional-indexing`) are needed once concurrent edits matter. Realtime/CRDT is out of scope for the map, but pick a field that can be migrated: prefer an explicit order field over relying on array position.
- **Ids ≤ 64 bytes** (Inlay `maxLength`) and TID-style generation (Inlay uses `TID.nextStr()` in its canvas page).
- **Record size and count:** unverified; the repo spec only gives "single-digit millions" of _records_ per repo. A scene with thousands of nodes in one record is untested against PDS limits.

---

## Could not verify

- Record size limit for a single atproto record (no figure found in the repository spec).
- Whether `content-visibility: auto` evaluates "on-screen" correctly under transformed/scaled ancestors in Chromium/WebKit/Gecko.
- Crispness/raster behaviour of a `will-change`d vs un-`will-change`d camera layer in WebKit and Gecko (Chromium source only, read, not run).
- Whether the design-editor `fit()` actually mis-centres at `scale ≠ 1` (derived from Panzoom's origin/pan semantics; not run).
- tldraw/Excalidraw resize internals (`Resizing.ts`, `resize*`), xyflow tests, and rzpp's `velocity.logic.ts` were located but not read in depth.
- Excalidraw sub-directory/asset licences beyond root `LICENSE` and package fields; d3-drag licence file; `jittered-fractional-indexing` licence.
- Figma's current (post-2025 WebGPU) text/accessibility architecture; the 2015 blog claims about DOM/SVG zoom cost were not re-measured.
- The HTML canvas chapter download was truncated (~111 KB); the cited sentences about fallback content and focus were present, other canvas-accessibility paragraphs were not read.
- Lexicon Garden is an aggregator; the authoritative `at.inlay.canvas` record lives in the DID repo `did:plc:mdg3w2kpadcyxy33pizokzf3` and was not fetched from the PDS directly.
