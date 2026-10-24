# cssints-native

A native UI framework on [cssints](../packages/cssints) styles and [Clay](https://github.com/nicbarker/clay)
layout: the desktop on the GPU first, then an ESP32 with no JS on the chip. The plan and the targets are in
[docs/map.md](docs/map.md).

```ts
import * as css from "cssints/clay" with { type: "cssints" };

export const units = css.cn(css.width(200), css.height(38), css.bg("rgb(36 40 52)"), css.borderRadius(19));
```

```sh
node --conditions=development generator/clay-header.ts styles.ts styles.h   # C for CLAY(CLAY_ID("Units"), units)
```

This directory is `native/` of the cssints repository: the commands below run from it (`cd native`), and `bun install` is
the repository's, at its root (`native` is one of the bun workspaces). From the repository root, `bun run test:native`
is `sh native/test.sh`.

## Layout

```
generator/clay-header.ts   styles.ts -> styles.h through the cssints plugin
generator/page-to-c.ts     a Solid page at build time to C: renders it, walks the tree, reuses styles.h's names
examples/units/            the pill proven on the board, and same.c: generated vs hand-written, same render commands
examples/sensors/          the Sensors page: styles.ts, page.c, its stored frames
desktop/                   host.c (SDL3 window or a headless frame), clay_renderer_thorvg.c, thorvg_wg.c, build.sh,
                           build-thorvg-gpu.sh (ThorVG's WebGPU engine, from source)
solid/                     Solid 2 on the desktop: a universal renderer over Clay through bun:ffi; the Sensors and Widgets pages (solid/README.md)
focus/                     the focus manager: Tab order, roving focus in groups, restore (no DOM), focus/README.md
terminal/                  the same page in cells: Clay -> terminal/cells.c -> ANSI truecolour; demo, --dump, --keys.
                           The sky screens (home, thread, profile) and their focus layer (terminal/focus.c)
vendor/                    clay.h and Clay's SDL3 renderer (e6cc369), a font
headless/                  button, switch, checkbox, disclosure as signals + neutral parts, checked against Quint specs
browser/                   the same page as WebAssembly on a canvas: page.c (Clay + generated C), render.js, check.mjs
docs/map.md                targets, layers, order of work
```

## Effects

`css.shadow({ x, y, blur, color })` is the first one: a renderer effect, because Clay 1.0's declaration has no shadow
field. The style's literal carries it as a sibling `shadow` key, `solid/src/pack.ts`'s `variant()` pulls it out beside
the image's path (the packed box itself stays 45 floats), `solid/src/frame.ts` calls `ui_shadow(x, y, blur, r, g, b, a)`
before `ui_open`, and `ui.c` hangs it on a side table keyed by the element id's 32-bit hash (`Clay_ElementId.id`),
cleared in `ui_begin` with the rest of the frame. `desktop/clay_renderer_thorvg.c` draws it for the element's first
command that carries that id — the command's box and corner radii, offset and filled with the shadow's colour, as a
scene with `tvg_scene_add_effect_gaussian_blur` (sigma `blur / 2`, CSS's reading, quality 80), then the command, which
covers the shadow's middle. One shadow an element; **the element needs an `id`**.

The effect's sigma is in the scene's own units, so the root scene's scale carries it: the same sigma under a root at
pixel density 2 blurs twice as many device pixels, which is why it is not multiplied by the density. Ceilings, on
purpose: 32 shadows a frame, no spread and no inner shadow (the box is the element's own), nothing cached between
frames (the blur runs again each frame), and the cost is real — the Dialog page's 280x152 panel at blur 32 takes the
frame's draw from 0.58 to 1.92 ms (Apple M2, one thread, `--bench 300`, two back-to-back runs; the price grows with the
blur's area). The C pages — `examples/`, the terminal, the browser — ignore a shadow: `header()` prints nothing for it
and the generated declarations are unchanged.

### A backdrop: glass over our own content

`css.backdrop({ blur })` blurs the page under an element, so a translucent fill is glass. It travels as the shadow
does — a sibling `backdrop: { blur }` key, pulled out by `variant()`, `ui_backdrop(blur)` before `ui_open`, a side table
in `ui.c` keyed by `Clay_ElementId.id`, one an element, cleared in `ui_begin` — and the hard part is the draw, not the
style: the pixels under the panel must be blurred **before** the panel's own commands, and ThorVG draws the whole
command array in one `tvg_canvas_draw`.

So the renderer cuts the frame. When the first command carrying a backdrop element's id arrives (a rectangle: only one
cuts), it draws what it has built as pass 1, blurs the element's box in the buffer, starts a new scene, and carries on
from there: the element's fill, text, border and focus ring are in pass 2, over the blurred pixels, so they stay crisp.
`tvg_canvas_draw(d->canvas, d->clear)` clears for pass 1 only. Two things in ThorVG made this fiddly, both measured:
the software canvas seeds its working surface from the target on its **first** draw and replaces what a later draw's
paints touch (so a second draw of a translucent fill comes out as its own alpha — the renderer sets the same target
again before pass 2, which re-seeds it; and a scene effect drawn in an earlier pass wipes the frame if it does not), and
`tvg_paint_rel` on a scene the canvas has owned is a double free, so the pass-1 scene is only removed.

The blur is on the CPU, on the box alone, clipped to the canvas, intersecting nothing else: three box passes each way
(a gaussian to the eye, no kernel to build), radius from CSS's reading of a blur radius — sigma `blur / 2`, as the
shadow's, and a pass of radius r three times has the variance `r² + r`, so `r = (sqrt(1 + 4σ²) - 1) / 2`. The window
clamps at the box's edges, so nothing outside the box is read or written (the pixel test checks the rest of the frame is
byte-identical), and alpha is carried through untouched (it is 255 everywhere; a straight average per channel is
correct). The two buffers are the box's size, `malloc`'d a blur. One cut a frame: a second backdrop, or a nested one, is
not drawn — glass under glass would read a frame the first cut has already drawn. A backdrop inside a scissor scene does
not cut either, neither does one on the WebGPU canvas (its frame is read back after the whole draw, so there is nothing
to blur). The panel's own shadow is drawn before the cut, so it lies on the unblurred page under the glass; the part of
it under the box is blurred with the rest of the page, and the panel covers it.

Cost, measured on the Dialog page's menu (150x133, blur 10 → r = 5) at 360x480, `--bench 300`, Apple M2, one thread: the
frame's draw is 2.2 ms without the glass and 3.0 ms with it (back-to-back runs of 300 frames on a loaded machine, so
0.7-1.0 ms for one glass). The radius is not the lever: blur 18 costs ~0.2 ms more than 10, and a cut with blur 0 is
the same within the noise — the price is the second `tvg_canvas_draw` and the target re-seed, not the six box passes over
about 20k pixels each. Cheap enough for a menu; a full-window backdrop at blur 24 would be ~8× the area and is not free.

The Dialog page's menu is the first glass: `blur 10`, a fill of `rgb(23 27 32 / 0.72)` in the dark theme and
`rgb(255 255 255 / 0.78)` in the light one, overlapping its trigger by 20px so there is a border and a text stroke under
it. The modal dialog keeps its opaque fill and its shadow: the dimmed float under it is one flat colour, so a blur there
would show nothing.

### A gradient: a fill the renderer draws

`css.backgroundImage("linear-gradient(...)")` is a fill, not an effect on the buffer: the element's box is painted with
ThorVG's linear gradient instead of its solid `backgroundColor`. It travels as the shadow does — a sibling
`backgroundImage: { kind, angle, stops }` key of the style literal, `pack.ts`'s `variant()` pulls it out, `frame.ts` calls
`ui.backgroundImage(kind, angle, count, stops)` (the C function `ui_backgroundImage`, five floats a stop: offset 0..1, r,
g, b, a) before `ui_open`, and `ui.c` fills a pending value that `ui_open` hangs on the renderer's table by
`Clay_ElementId.id`, cleared in `ui_begin` with the rest of the frame. At the element's first **rectangle** command the
renderer fills the box's rounded rect with the gradient and does not draw the solid colour; a border is a command of its
own and stays. The element needs an `id`, and a solid `backgroundColor` too: Clay emits a rectangle only for a fill that
is not transparent, so the gradient is what that command draws, and the solid fill is what the C targets keep.

Geometry is CSS's gradient line: the direction is `(sin θ, -cos θ)` (0deg up, 90 right, 180 down — the default), the line
is `|w·sinθ| + |h·cosθ|` long (the box's projection on it), and it runs from the box's centre minus half of that to the
centre plus half. ThorVG's gradient coordinates are the shape's own, the same space as its path, so they are Clay units:
the root scene carries the pixel density, as it does for a shadow's sigma.

Ceilings, on purpose: one gradient an element (16 a frame), 8 stops (a ninth is counted as an error and dropped), linear
only (ThorVG has radial and conic, the style's grammar takes neither), no dither, the solid fill under a gradient is not
drawn (not blended), no gradient on text, a border or an image, and the C targets — `examples/`, the terminal, the
browser — keep the solid fill: `header()` prints nothing for a gradient and the generated declarations are unchanged.

Cost: the Sky page's three cards (336x190 each) with gradients against the same page with the gradients dropped,
`--bench 1000`, Apple M2, one thread, the least-loaded of three back-to-back pairs: 3.735 against 3.631 ms a frame
(light 3.625 against 3.458), so **under 0.2 ms for the three cards**, inside the run-to-run noise of this machine
(±0.5 ms). The fill covers the same pixels either way; a gradient's per-pixel lerp is what a solid fill does with one
colour.

Banding, reported rather than hidden: the dark card's 190px is **6 luminance steps of about 30px** (18 distinct colours),
the light one 12 steps of about 15px (30 colours). The dark gradient from `27 32 38` to `21 25 30` has 6 channel values
to spread over 190px, so one step every 30px is a strap the eye can see on a large flat surface. The cure is a dither
step (a 4x4 ordered offset before the 8-bit write), not built; the Sky cards are the first surface where it would matter.

The Sky page's cards are the first gradient: `180deg` from `rgb(27 32 38)` to `rgb(21 25 30)` in the dark theme and
`rgb(255 255 255)` to `rgb(240 243 246)` in the light one — both top-lighter, so the light theme is the same direction,
not an inversion. A hover overrides the whole gradient with the hover tokens (`34 40 49` to `28 33 40`): a state cannot
unset one, so it replaces it.

### A value channel: one field of a style, per frame

A packed style is a **compile-time literal**: `solid/plugin.ts` runs cssints at build time, `pack.ts` resolves a theme
and a state, and the 45 floats are packed once and kept per variant, so no number in a style can change between frames.
The value channel is the hole in that, kept as small as the shadow's and the backdrop's side tables: a page's `tick`
(which runs after `ui_begin` and after the events, before the tree is declared) calls
`ui_value(id, len, field, value)` for an element's id, and `ui_open` copies that element's 45 floats, applies the frame's
overrides of its id and declares from the copy. Nothing is cached between frames, the table is cleared in `ui_begin`, and
a frame that uses no channel declares exactly what the literal says — which is how the Dialog's settled frames came out
byte-identical after the menu and the panel learned to move.

`field` 0..44 is a packed field, in `solid/README.md`'s table order; `pack.ts`'s `FIELDS` names the ones worth a name
(`WIDTH` 0, `HEIGHT` 3, `PADDING` 6, `GAP` 10, `BACKGROUND` 14, `RADIUS` 18, `OFFSET_X` 38, `OFFSET_Y` 39, `EXPAND_W`/
`EXPAND_H` 40/41, `Z_INDEX` 42). **45 is not a float of the style at all**: it is `ui_shadow`'s blur, the one number of
a shadow a page can move, which the channel hands to the pending shadow before `ui_open` hangs it on the renderer's
table. Out of range, or a 65th override in a frame, is counted as an error and dropped.

What a page may animate, and what is meaningless mid-frame: an **offset** (`OFFSET_X`/`OFFSET_Y`), `EXPAND_*`,
`Z_INDEX` and the **shadow's blur** are read as the element is placed and drawn, and nothing else moves. `WIDTH`/`HEIGHT`,
`PADDING`, `GAP` and the colours are legal — the override is applied to the floats the declaration is built from — but
Clay's layout is computed from the declaration every frame, so a width or a gap that changes re-lays-out the element's
parent and its siblings each frame: it is a **layout** change, not a transform, and an animation of one reads as a jitter
of everything around it. A slide belongs on a float's offset; a fade or a scale is not this channel's (the last
paragraph of this section says why).

The cost is one scan of the table per `ui_open` on a frame that uses the channel, and a 180-byte `memcpy` of the 45
floats for each element that has an override (the Dialog writes two elements a frame: 360 bytes, and its declare phase is
0.008 ms of a 2.0 ms frame). The table holds 64 overrides, which is more than a page animating a dozen elements needs.

## Motion

`solid/src/motion.ts` is Rune's model, and the first user is the Sky feed's scroll. A **spring** is made from
SwiftUI's `(duration, bounce)`: `ω = 2π / duration`, `ζ = 1 - bounce`, and the analytic solution of
`d'' + 2ζω d' + ω² d = 0` for the three regimes — a decaying sinusoid under-damped, `e^(-ωt)(d0 + (v0 + ω d0)t)`
critically damped, two real exponentials over-damped. It is exact at any instant, so there is no integration and no
frame-rate dependence. A **track** is one segment `{x0, v0, target, t0, spring}`; `at(t)` returns `{x, v, done}` and
`retarget(t, target)` first samples the presented `(x, v)`, so the value and the velocity are continuous. The settle
rule is 0.5px and 0.5px/s: within it the value *is* the target and the velocity 0, an exact snap like Rune's 1/64px
idea without the grid. Two classes: `spatial()` (0.35s, bounce 0, may overshoot) and `effect()` (critically damped and
clamped to the start..target range, so a colour or an opacity cannot overshoot even when a bounce is asked for). A
**decay** is a fling: `v(t) = v0·r^t` with `r = 0.998` per millisecond (iOS's normal deceleration), i.e.
`v0·e^(-kt)`, `k = -1000 ln r ≈ 2.002`, and `x(t) = x0 + v0(1 - e^(-kt))/k`; `project()` is `x0 + v0/k`, where it lands,
and it stops at `|v| < 5px/s` on the projection. **The clock is passed in**: nothing in the file reads the time, so a
headless frame at 1/60 and a window frame at the real dt take one path and a test can ask for any instant.
`bun solid/motion.test.ts` checks 16.6ms against two 8.3ms steps, the continuity of a retarget (both limits), the exact
settle, `effect` staying inside its range, and the decay's monotonicity and projection. The mutation is the model's:
`Track.retarget` dropping the sampled velocity (setting `v0 = 0`) fails the sky test's mid-flight block.

Two host members carry the wheel to a page. `ui_window_poll` still adds every SDL wheel event through `ui_wheel`, and
`ui_wheel` now fills two channels: Clay's (as before, for a page that keeps Clay's scroll container) and the page's,
drained by `ui_wheel_pop(float out[2])`. `ui_auto_scroll(0)` stops `ui_begin` from calling
`Clay_UpdateScrollContainers` with that delta (the delta is still drained), so a page that owns its offset does not get
the notch twice; the default is on, and **only the Sky page turns it off** — the List page is unchanged. On the host
side, `View.onWheel(dx, dy)` gets the polled delta before the frame (the window loop pops it after `ui_window_poll`;
`--wheel N` in headless mode calls the same pop after each notch) and `View.tick(dt)` is called once a frame after the
events and before `flush()`. `main.ts` wires a page's `motion` object to both; `Sky` puts its handler there.

The Sky feed's offset is a positive-down value the page owns. A wheel notch adds 10px (as before) to a clamped target
and retargets the track; a notch from rest starts at the velocity a critically damped spring needs to glide the step
without overshoot (`ω·d`), so the notch moves on its first frame and each frame after it less. A burst of notches
(≥2, frames or notches) is a flick: on the release the track's presented velocity is handed to a decay, its
`project()` is clamped to the content, and the motion either runs the decay to that landing (inside the content) or
springs to the clamped end from the presented `(x, v)`. A wheel during a throw retargets from the presented `(x, v)`,
so nothing jumps or stops. The keyboard retargets the same track: Down/Up 40px, PageUp/PageDown a viewport, Home/End
to the ends. The clamp is explicit: the last card's `ui.bounds` bottom plus the 12px padding, less the viewport's
bottom and Clay's offset, so a shorter feed clamps to 0. `ui.scrollTo("sky-feed", -x)` puts the presented value on
Clay's clip element each frame. Measured (`solid/sky.test.ts`): one notch moves `2.59, 1.92, 1.42, 1.05, 0.78, 0.58…`
px a frame and rests at exactly 10px; eight notches step `2.59, 2.28, 2.64, 3.32, 4.14, 4.99, 5.79`, peak at 6.60 and
decay to rest at 78px after 31 frames; a notch up 13.51px into that throw lands at 64.05 (10px back), the worst
frame-to-frame increase 1.64px against the notch's 10. The four stored `frames/sky*.png` were regenerated with the new
`--settle 60` and are **byte-identical**: the settle is the same -78 the clamp had, so the motion changes the frames
between the ends, not the committed ones.

The Dialog page is the value channel's first user, and it animates the two overlays of `headless/`. Both end on the
style's own literal, so a settled frame is the literal's frame: the **menu** slides out of its trigger — its float's
offset y from -10 to its style's -20 on `spatial(0.22, 0.1)`, and its shadow's blur from 0 to its style's 14 on
`effect(0.22)`, which is clamped and critically damped because a blur has no negative side and must not ring; the
**dialog** drops in — offset y from -14 to 0 and its shadow's blur 0 to 32, the same two tracks. Both use the `effect`
class for the blur and `spatial` for the offset for the same reason: position may carry a little velocity, a luminance
field may not. The pair that reads best in a frame is the offset with the blur at once: the menu grows out of the
trigger (it starts 10px lower, over the 20px it overlaps) while its shadow appears under it, so by the third frame
(2/60s in) the menu is 7.4px low with a shadow at a quarter of its blur — legible as "arriving" rather than as a jump;
the blur alone would look like a fade and the offset alone like a slide with no depth.

The clocks are the page's, and they run only while the element is declared: `Show` unmounts the menu, so the tick stops
advancing its clock (an arrival's clock is the time of its last presented frame), and a reopen retargets from the value
it froze on — a menu closed 2 frames in comes back exactly where it was, no jump and no restart (measured: closed at
-10.85, reopened at -10.85, a jump of 0.000). At rest it retargets from the entry instead. There is **no exit
animation**: presence would need the page to keep the node alive after `Show` drops it, which the renderer's immediate
mode does not give it for free.

Not here: **opacity and transform animation**. The value channel (above) moves a numeric field of a style — an offset, an
expand, a shadow's blur — by element id, so a track can now drive a box; what it cannot do is fade a whole subtree
(every element's colours would need an override, and a text's colours are not in its box's 45 floats), scale or rotate a
box (Clay has no transform; a scale of a float's `EXPAND_W`/`EXPAND_H` moves its children, not its glyphs), or keep an
element alive after `Show` drops it (an exit animation needs presence: a page would have to keep the node and hide it when
the animation ends — out of scope, so closing the menu and the dialog is still instant). With them: reduced motion, a
rubber band at the feed's ends (the Sky feed clamps hard), drag scrolling and touch (a pointer's velocity is the host's;
the List page still has no momentum and keeps Clay's instant wheel step), the tab underline and hover, and the terminal,
browser and board targets (they have no Solid page, no wheel and no value channel).

## Test

```sh
bun install      # at the repository root
sh test.sh       # generator, same.c against vendor/clay/clay.h, the Sensors frames on SDL and on ThorVG (needs brew sdl3 sdl3_ttf sdl3_image thorvg)
sh desktop/build.sh examples/sensors && ./build/sensors/app   # the window, ThorVG's software raster; the t key toggles the theme
./build/sensors/app --raster sdl                              # Clay's SDL3 renderer instead (the window uses the GPU)
sh desktop/build-thorvg-gpu.sh examples/sensors               # ThorVG built from source with its WebGPU engine (~1 min, in $TMPDIR)
./build/sensors/app-gpu --raster thorvg-gpu --bench 500       # the same page on Metal through wgpu-native; needs brew meson ninja pkgconf wgpu-native
sh desktop/build-wg-window.sh && ./build/sensors/wg-window --capture out.png   # ThorVG into the window's own WebGPU surface, no readback; --capture checks the frame
bun solid/main.ts widgets                                     # Solid: headless button, switch, checkboxes, disclosure, radio, tabs, slider, toolbar; Tab, arrows, Space work
./build/sensors/app --press 180 250 --png out.png             # headless: a press held at 180,250, the frame written while pressed
IMAGE=1 ./build/sensors/app --raster thorvg --png out.png    # the IMAGE=1 variant: the page's 32x32 image, loaded by ThorVG from its path
sh terminal/build.sh && ./terminal/demo                       # the Sensors page in characters: Tab, Up/Down, Space, t; q quits
./terminal/demo --page sky                                    # apps/csssky-tui in characters: the feed; enter opens the thread
./terminal/demo --page profile                                # apps/csssky's profile: its tabs, its posts; enter opens a thread
./terminal/demo --dump out.txt                                # one frame headless as plain text ('.' is a fill)
./terminal/demo --keys Tab,ArrowDown --dump out.txt           # a frame after each key, as solid/main.ts --keys
sh browser/build.sh && node browser/check.mjs                 # the browser target, headless: wasm + Canvas2D, compared
node browser/check.mjs --serve                                # ...or serve the page and open the URL it prints
./terminal/demo --click 22,0 --page sky --dump out.txt        # a frame, a press, a frame, a release, a frame
```

## Browser (WASM)

The same generated C as step 5, compiled with `zig cc -target wasm32-wasi` (a libc; there is no emscripten here) and
drawn by `browser/render.js` on a `<canvas>`: rectangles, inside borders, `roundRect` corners, `fillText`, `clip()` for
a scissor. No framework and no build step at run time. Text is measured by Canvas2D through one wasm import, so Clay
lays out with the same font the canvas draws with (Roboto from `vendor/fonts`), and `w` or the button switches the
`use_g` frame.

```sh
sh browser/build.sh            # -> ${TMPDIR:-/tmp}/cssints-native-web/page.wasm, next to the generated styles.h
node browser/check.mjs         # Chromium through Playwright: the command array and the raster
node browser/check.mjs --serve # http://127.0.0.1:<port>/browser/index.html — a browser will not fetch a .wasm from file://
```

| What         | Size       |
| ------------ | ---------- |
| `page.wasm`  | 104,375 B  |
| the page     | 8,505 B (index.html + render.js) |

`browser/check.mjs` builds nothing: `browser/build.sh` does, into `$TMPDIR`, because the wasm is a build product.
`browser/dump-commands.c` is how the desktop's command table in the check was produced (Clay + SDL_ttf/Roboto, the
frame in `examples/sensors/expected-thorvg.png`); it is not part of the page.

## The sky screens in a terminal

`apps/csssky-tui` (`../apps/csssky-tui`) ported to cells: the same cards, the same recorded fixtures, the same palette
from its `styles.ts`. Its two screens and the profile of the sibling web app `apps/csssky`:

| screen | data | keys |
| --- | --- | --- |
| the feed (`--page sky`) | `apps/csssky`'s `home-discover-1` and `home-science-1` (three posts each; News has no fixture) | `tab`/`shift-tab` between the bar and the list, `left`/`right` the tabs (which switch the feed), `j`/`k` or `up`/`down` the list, `1`-`3` a feed, `enter` opens, `t` the theme, `q` quits |
| a thread (`--page thread`) | `thread.json`: the parent, the post, its replies | `j`/`k` or the arrows, `esc` back |
| a profile (`--page profile`) | `profile.json`, `profile-posts`, `profile-replies`, `profile-media` | `left`/`right` the tabs, `tab` to the list, `j`/`k` or `up`/`down`, `enter` opens a thread, `esc` back |

The focus is `terminal/focus.c`, a port of the semantics of `focus/src/focus.ts` (not shared code with it): Tab stops in
document order with the focus released at either end (a terminal has no platform to hand Tab to, so the page presses it
again and wraps), a group as one stop with roving focus, and `focus(id)` refusing a disabled stop. A click is a press
and a release over one control; the terminal has no pointer motion beyond that.

What stays unported: `apps/csssky-tui` has no profile screen of its own (that one is the web app's, on the same data
layer and fixtures); no fetching (the frame is the recorded fixture), no images (a media line), no quote box, no
wrapping (a body is one clipped row), the app's system theme, and the app shell (a bar, a list, a footer is all).

`cssints` is the workspace package (`"cssints": "workspace:*"`, `../packages/cssints`), not a release from npm: the
tests run with `--conditions=development`, which resolves to its sources, so an edit to the engine is seen at once; `dist`
is what a web build gets. `native` is a workspace of the repository's `bun.lock`, with one difference from the others: it
has no `test` script, so `bun run test` at the root (`vp run -r test`) does not need a C toolchain, SDL3 or ThorVG; the
script is `test:native`. `headless/` is a workspace too (`native/headless` in the root `workspaces`; TypeScript 7 and `@types/bun` of its own, the specs from
`@cssints/apg-specs`); its scripts are `typecheck:native` and `test:native` for the same reason, and `test.sh` runs them.
