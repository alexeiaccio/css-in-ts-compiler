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
frames (the blur runs again each frame), and the cost is real — the Dialog page's 280x152 panel at blur 24 takes the
360x480 frame from 1.07 to 1.93 ms (Apple M2, one thread, `--bench 300`; light 1.00 → 1.76, quality 50 and 30 are 1.47
and 1.31 ms for 5/255 and 15/255 at the edge). The C pages — `examples/`, the terminal, the browser — ignore a shadow:
`header()` prints nothing for it and the generated declarations are unchanged.

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
