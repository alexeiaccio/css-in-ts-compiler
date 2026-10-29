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
only (ThorVG has radial and conic, the style's grammar takes neither), the solid fill under a gradient is not drawn (not
blended), no gradient on text, a border or an image, and the C targets — `examples/`, the terminal, the browser — keep the
solid fill: `header()` prints nothing for a gradient and the generated declarations are unchanged.

Cost: the Sky page's three cards (336x190 each) with gradients against the same page with the gradients dropped,
`--bench 1000`, Apple M2, one thread, the least-loaded of three back-to-back pairs: 3.735 against 3.631 ms a frame
(light 3.625 against 3.458), so **under 0.2 ms for the three cards**, inside the run-to-run noise of this machine
(±0.5 ms). The fill covers the same pixels either way; a gradient's per-pixel lerp is what a solid fill does with one
colour.

Banding, and the dither that goes with it: an 8-bit channel turns the dark card's 190px into **6 runs of one luminance of
about 30px** (18 distinct colours, the longest 32px), the light one into 12 of about 15px (30 colours, the longest 17px); the
dark gradient from `27 32 38` to `21 25 30` has 6 channel values to spread over 190px, so one step every 30px is a strap the
eye sees on a large flat surface. After the frame, `Clay_ThorVG_RenderClayCommands` ends with
`Clay_ThorVG_DitherGradients`: a **4x4 ordered (Bayer) dither of one level either way** (±1/255, the mean kept) on the RGB of
every pixel inside each gradient's box — cut to the canvas, to the clips (a scrolled feed) and to the corners' arcs, one
pixel inside the radius, so no pixel of the page moves. **The mark is the shape's pixels, not an axis-aligned box**: the
groups' map to the target is one affine (`Clay_ThorVG_Map`), and with a rotation in it the mark is the four mapped corners'
quad and every pixel of its bounding box is mapped *back* into the shape's own space and tested against the box and its
arcs. An axis-aligned mark inside a rotated group stippled the page around the quad (2216 of its 5637 pixels on the test
tree) and missed the quad's tips (none of them): a black gradient over a black fill shows the dither alone, since its ±1
clamps at 0. The quad test leaves the page alone and covers the tips (0 outside, 1151 inside the quad but outside the
unrotated box: `solid/rotated.test.ts`). **A clip's cut is its own quad too**: a clip is a paint in the transformed scene,
so it turns with its group, and the dither records the quad the clip's box maps to (`Clay_ThorVG_Clip`: the whole-pixel
rect is the scan's bound, the quad is tested a pixel at a time). Before that test a gradient inside a *rotated* clip was
stippled inside the clip's bounding box, so 1898 pixels the clip had cut away — the group's fill behind the gradient —
were stepped by ±1/255, and 3063 inside the clip were right; with the quad test the 1898 are 0 and the 3063 stay
(`solid/rotated.test.ts`, the `--clip` tree: the gradient 30px wider than the 60px clip inside a 30° group).
It is done in the buffer because there is no shader here: ThorVG's
CPU raster writes 8 bits a channel, and a second pass over the element's own pixels is the smallest place to break a step.
A card's column then shows **182 runs of 1-2px instead of 6 of 30** (the light card the same), and the three cards' ink is
unchanged by more than the step: a body's 828 ink pixels, its 44 flat ones at most 1/255 off the ink token, and none of the
15 pixels at the ink mask's threshold on its edge, so the mask — and the text's box — is the one the undithered frame had.
Cost: **0.22 ms for the three cards** (0.07 a card over 191,520 pixels: `--bench 400`, the least-loaded of three
back-to-back pairs 3.56 against 3.79 ms a frame) — the second pass over 766 KB of the target, which the run-to-run noise
of `--bench 1000` (±0.5 ms) cannot show. A per-row pre-scan (dither only the rows a band boundary falls in) was measured
against this and dropped: the step is one row of a 30px run, so the plateaus stay flat and the count above would not move.
`CLAY_THORVG_DITHER` picks the variant the build compiles (2: ±1 with the mean kept; 1: +1 on half the pixels, whose
0.5/255 mean shift is invisible but whose +1 clips the light card's white top into a flat band; 0: none) — those are the
three that were measured.

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
(`WIDTH` 0, `HEIGHT` 3, `PADDING` 6, `GAP` 10, `BACKGROUND` 14, `BACKGROUND_ALPHA` 17, `RADIUS` 18, `BORDER` 26,
`BORDER_ALPHA` 29, `OFFSET_X` 38, `OFFSET_Y` 39, `EXPAND_W`/`EXPAND_H` 40/41, `Z_INDEX` 42, `CAPTURE` 43). **45 to 50 are
not floats of the style**: 45 is `ui_shadow`'s blur, the one number of a shadow a page can move, which the channel hands
to the pending shadow before `ui_open` hangs it on the renderer's table; **46 (`ALPHA`), 47 (`SCALE`) and 48/49
(`TRANSLATE_X`/`TRANSLATE_Y`) are one element's whole subtree as a ThorVG scene** (the section below), and they go to the
renderer's table the same way; **50 (`GRADIENT_ALPHA`)** is the opacity of the element's background image, which the
renderer uses to composite that gradient over the box's solid fill (255 is the gradient alone, the only way it was drawn
before). Out of range, or a 65th override in a frame, is counted as an error and dropped.

**51..54 (`TEXT_COLOR`, r g b a) are a text's, not a box's.** A text's colour lives in its own 10 floats (`ui_text`), not
in the parent's box, so the box channel could not reach it and a changing label swapped its style in one frame. A text now
takes an id like a box does (`ui_text(id, id_len, bytes, len, floats)`, NULL for an anonymous one), and `ui_value` on that
id's field 51..54 overrides the four colour floats of the text's copy. **The ceiling: a text without an id cannot be
named**, so its colour is its style's literal and cannot be animated — the Sky page's tab labels are the user
(`<text id="sky-tabs-label-i">`, `effect(0.15)` from the muted token to the accent and back, beside the 2px underline
that is the tab's own border). Only the colour moves: the font, the size, the spacing, the line height, the alignment and
the wrap stay the literal's.

**55 (`ROTATE`) is the group's fifth number**: degrees about the element's box centre, in the same scene as `SCALE` and
the translate, which the renderer composes into **one matrix — scale, then rotate, then translate**,
`x' = s·R(θ)·(x - c) + c + t` (`Clay_ThorVG_SettleGroup`; ThorVG reads a matrix as `x' = x·e11 + y·e12 + e13`,
`y' = x·e21 + y·e22 + e23`, its third row unused, so `s·R` is the 2×2 and `c + t - (s·R)·c` is the third column). A
positive angle turns clockwise on screen (y runs down). It is drawn, not laid out: `ui_bounds` is the style's box on every
frame, which is the point — the Dialog's menu settles out of a `-2°` tilt as it slides out of its trigger (`-2 → 0` on
`spatial(0.22, 0.1)`, and back to `-2°` on the way out). The order is proved on a hand-built non-square box
(`solid/dialog.test.ts`): a 200x40 box at the root with `SCALE` 0.5, `ROTATE` 90° and `TRANSLATE_X` 40 is drawn as the
rect x 130..150, y -30..70 — the long side stood up about the centre (100, 20), and the 40px after the rotation,
unscaled: a translate taken before the transform would put the rect at x 110..130, and a rotation of 0° leaves the box
where it was. A rotation of exactly 0 takes the scale's own expression rather than the rotation's arithmetic at 0°,
because `c·(1 - s)` and `c - s·c` do not round the same and a page that never leans must keep its frames (measured:
three glyph pixels of the scaled panel moved by one level).

What a page may animate, and what is meaningless mid-frame: an **offset** (`OFFSET_X`/`OFFSET_Y`), `EXPAND_*`,
`Z_INDEX`, the **shadow's blur**, the subtree's **alpha**, **scale**, **translate** and **rotation**, a **gradient's
opacity** and a text's **colour** are read as the element is placed and drawn, and nothing else moves.
`WIDTH`/`HEIGHT`, `PADDING`, `GAP` and the colours are
legal — the override is applied to the floats the declaration is built from — but Clay's layout is computed from the
declaration every frame, so a width or a gap that changes re-lays-out the element's parent and its siblings each frame:
it is a **layout** change, not a transform, and an animation of one reads as a jitter of everything around it. A slide
belongs on a float's offset; a fade, a scale or an arrival belongs on the group.

The cost is one scan of the table per `ui_open` on a frame that uses the channel, and a 180-byte `memcpy` of the 45
floats for each element that has an override (the Dialog writes two elements a frame: 360 bytes, and its declare phase is
0.008 ms of a 2.0 ms frame). The table holds 64 overrides, which is more than a page animating a dozen elements needs.

### Group opacity and scale: an element's whole subtree

A packed style can move one element's own numbers, and a text's colour is not in its parent's floats, so a panel could
not fade its children. Clay has no opacity and no transform either, and its command stream is flat. What the renderer
does have is the **element tree** and each command's element, and that is enough for the two effects that were missing.

`ui.c` keeps the frame's tree as the page declares it: `ui_open` pushes a node `{id, parent}` (the parent being the
element that was open before it; Clay gives an anonymous element an id of its own on open, so it is read back after, and
an anonymous element is a parent like any other), `ui_close` pops, and `ui_text` adds a node for the text — a text is
never open, but a group's subtree has to reach through it. The nodes are in declaration order, at most 1024 a frame, and
cleared in `ui_begin`. Every element's declaration carries its node as `userData` (`index + 1`), which Clay copies into
each command it emits from that element, so at draw time every command says which element it belongs to.

The two fields are the value channel's, above the shadow's blur: **46 `ALPHA`** (0..255) and **47 `SCALE`** (1 = none);
48/49 `TRANSLATE_X`/`TRANSLATE_Y` are a visual offset of the same subtree (px, 0 = none) and 55 `ROTATE` its angle in
degrees about the same centre. `ui_open` reads them into the
renderer's group table instead of into the floats (they are not floats of the style), and they carry no layout:
`ui_bounds` does not move while a group scales, slides or turns. A page writes them from its `tick` as it writes an
offset, one call an element.

The renderer then turns each group into a **range**: the commands whose element is the group's element or under it.
Clay's commands are in depth-first order, so a subtree's commands are contiguous and a min/max over the ancestry is the
whole of it (the panel's range is 15..25 of the Dialog's frame, the menu's 14..21). A command that carries no node — a
scissor's own start or end — belongs to the last element that had one; it is emitted inside that element's subtree, so
it cannot widen a range past it. A group at alpha 255, scale 1 and no offset gets no range at all: a settled frame is
drawn exactly as the literal makes it, which is why the Dialog's settled frames came out byte-identical.

In the draw loop, the first command of a range opens a scene and makes it `into`; the last one gives the scene
`tvg_paint_set_opacity(scene, alpha)` and, if the scale is not 1, the offset is not 0 or the rotation is not 0, a
matrix, then adds it to the
scene that was current when it opened. The scale and the rotation are about the **box centre of the range's first
command**, and ThorVG
carries a matrix's translation in its third column (`x' = x·e11 + y·e12 + e13`; its third row is unused, so a
translation written into `e31`/`e32` is silently dropped — measured), which makes the whole transform `scale` on the
diagonal, `centre·(1 - scale) + translate` in `e13`/`e23`: `x' = scale·(x - c) + c + tx`, the scale about the centre and
the offset after it, unscaled. With a rotation the linear part is `s·R(θ)` and the third column `c + t - (s·R)·c`:
**scale, then rotate, then translate**, one matrix, about the box centre (the order is in the section above). Everything
in the range inherits it: the element's own fill, its text, an image, a
gradient, and — because the loop opens a group before the element's shadow is drawn — its shadow. A shadow fades, scales
and slides with the panel it belongs to, which is what the eye expects.

Limits, stated rather than hidden. **Nesting**: four groups may be open at once (a group inside a group inside …), and a
fifth is drawn ungrouped; 16 groups a frame. **A scissor** (`css.overflow`, a float's clip) opens its own scene *inside*
whatever is current, so a group's subtree that contains a clipped element fades and scales as a whole; the scissor stack
is eight deep. **A clip is a ThorVG paint in the transformed scene, so it turns with its group** — its edge is drawn
tilted, and `solid/rotated.test.ts` proves it (the clipped child's right edge at x 101 on one row and 89 on another
inside a 30° group) — while the dither, which works on the target's pixels after the draw, marks a gradient by the
groups' affine map: the box's four corners' quad, tested a pixel at a time, so a gradient in a rotated group is stippled
where it really is and never on the page around it. A clip's *cut* for the dither is that clip's quad as well: the
rect is the scan's whole-pixel bound and a pixel is also tested against the quad, so a gradient inside a rotated clip
is never stippled where the clip cut it away. **A backdrop's cut**
mid-group is the one thing that splits a scene: the cut draws pass 1 over the target,
so the groups open at that moment are settled into it first and made again in the new root after it, and the rest of the
subtree is composited with the same alpha, scale, rotation and offset — the Dialog's menu is exactly this case (its own
rectangle is the cut) and its shadow, fill, text and border all sit at the same opacity and lean. A group whose range
never meets its end
(only a hand-made command array could) is composited as it is at the end of the loop.

The Dialog page is the first user. The **panel** and the **menu** arrive as a group: `ALPHA` 225 → 255 on `effect(0.2)`
(a luminance field is clamped, as the dim is) and `SCALE` 96 → 100 on `spatial(0.22, 0.1)` — percent, not a fraction,
because a track's settle rule is 0.5 of its own unit, so 0.96..1 would be "settled" on its first sample; 96..100 snaps at
99.5, a 0.5% jump nobody sees. The **menu** also leans out of `ROTATE` `-2°` → `0` on the same `spatial(0.22, 0.1)`
(field 55, the rotation of the same scene), so it settles into place instead of arriving square: 2° over its 150px is
5px of top edge, which reads as a settle rather than a spin — measured (`solid/dialog.test.ts`, the insets of the top
border a row below the box's top) `112/11` on the frame it opens on, `108/10`, `60/8`, `25/7` and `5/5` at rest, with the
box `40,·,150,133` on every frame of it (`ui.bounds` is the style's: the rotation is drawn). The exit runs both back
(0, 96, -2°) on `effect(0.2)` and `spatial(0.2, 0)` beside the offsets
and the blur that were already there, and the backdrop keeps its own dim through field 17: its box is the window, so its
alpha *is* the dim, and a scene around it would composite the page's own pixels. Measured on the third frame after the
panel opens (`dialog-entry-mid`, t = 0.05s): alpha 119 of 255, scale 97.8%, the box `40, 156.1, 280x152.3` against
`40, 163.9, 280x152.3` at rest — the x, width and height are the literal's at every frame, only the float's offset moves
the y. A flat spot of the panel reads `24,27,36` between the dimmed page's `7,8,10` and the settled panel's `36,40,52`;
the title's brightest pixel `163,163,166` against the settled ink's `235,235,240`; and the panel's visible edges `43..316`
inside its settled `40..319`. The mutation is the renderer's: dropping `tvg_paint_set_opacity` from a group fails
`FAIL mid-entry the spot is a blend of the dimmed page and the panel: false, wanted true` and
`FAIL mid-entry the ink is a blend, not the settled text: false, wanted true`, and nothing else — the scale alone does
not fade.

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
settle, `effect` staying inside its range, and the decay's monotonicity and projection; with presence and reduced motion
it also checks an exit's length to a frame and its unmount, a revive mid-exit (the value is the exit's own, the velocity
carries), the channel's one call an element, and reduced motion's instant land and instant unmount. The mutation is the
model's: `Track.retarget` dropping the sampled velocity (setting `v0 = 0`) fails the sky test's mid-flight block.

Two host members carry the wheel to a page. `ui_window_poll` still adds every SDL wheel event through `ui_wheel`, and
`ui_wheel` now fills two channels: Clay's (as before, for a page that keeps Clay's scroll container) and the page's,
drained by `ui_wheel_pop(float out[2])`. `ui_auto_scroll(0)` stops `ui_begin` from calling
`Clay_UpdateScrollContainers` with that delta (the delta is still drained), so a page that owns its offset does not get
the notch twice; the default is on, and **the Sky feed and the List's viewport turn it off** — every other page keeps
Clay's container. On the host
side, `View.onWheel(dx, dy)` gets the polled delta before the frame (the window loop pops it after `ui_window_poll`;
`--wheel N` in headless mode calls the same pop after each notch, and `--wheel-rest` puts a frame of rest between them, so
a long scripted run is the notches' own 10px each instead of a 60Hz flick), `View.onPointer(x, y, down, touch)` is called
once a frame after the events (a page that drags keeps its own flag: `onPress` sets it, `down` false clears it; `touch`
says the pointer is a finger's — see "Touch input" below), and `View.tick(dt)` is called once a frame after the events and
before `flush()`. `main.ts` wires a page's `motion` object (`src/entry.ts`: the
three hooks) to all of them — the Widgets slider and the scrolling pages both take the pointer — and `Sky` and `List` put
their handlers there.

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
px a frame and rests at exactly 10px; eight notches step `2.59, 2.28, 2.64, 3.32, 4.14, 4.99, 5.79`, peak at 6.69 and
decay to rest at 78px after 20 frames; a notch up 13.51px into that throw lands at 64.05 (10px back), the worst
frame-to-frame increase 1.64px against the notch's 10. The four stored `frames/sky*.png` were regenerated with the new
`--settle 60` and are **byte-identical**: the settle is the same -78 the clamp had, so the motion changes the frames
between the ends, not the committed ones.

**The rubber band at the feed's ends.** Past an end the wheel is not scrolling, it is pulling the edge, and the content
moves by Rune's and iOS's resistance: `rubber(x, d) = (1 - 1/(x·c/d + 1))·d` with `c = 0.55` (`BAND_C` in `motion.ts`)
and `d` the viewport's height (the feed's 664px). `x` is the raw overshoot the notches have accumulated, so a notch's
first 10px past the end move 5.45 and the fourth only 5.19 (21.29 for the raw 40 — the resistance is *less* than the
push, and never reaches `d`). A notch is a **pull** only when the content is already at the end it pushes past (or over
it): a notch that merely *reaches* the end while the content is still gliding there is a scroll like any other, and
snapping it into the band would jump it — measured, an eight-notch flick's peak step is 6.69px either way. A pull is
where the wheel puts it on that frame, because that is direct manipulation; the return is a spring. **80ms**
(`BAND_HOLD`) without a notch and the band lets go on `spatial(0.35, 0.1)` from what it presents, settling exactly on
the clamp (measured: held four frames, back on 78 twenty-two frames later); a key drops it on the frame it is pressed;
a notch the other way walks it back towards the end. The fling is not a pull — a banded stroke's release is a spring to
the clamp, not a decay (`!band` in the release branch) — and a feed switch (a clamp that changed) is still a hard
clamp. The band goes on Clay's clip element through a second host member, `ui_scroll_put(id, y)`: `ui_scroll_to` clamps
to the content (Clay's own range), and a band is out of it on purpose — so the write takes `put` for as long as the
presented value is past an end (the band and the first frames of its way back) and `scrollTo` inside it, which is what
makes the return a spring rather than a snap; 0.01px past an end is the clamp's own float noise and is written through
`scrollTo`, so a settled page is the exact integer its stored frames have. Reduced motion has no band at all: the offset is
clamped hard, and `reduced()` folds the raw overshoot to 0 before the resistance is asked for. `sky-band.png` is
Discover — whose three posts are shorter than the viewport, so its first notch is already past its end — four notches
past it, at `21.29px` of the raw 40.

**The feed's entry.** On its first mount the Sky page's cards arrive: each starts 12px lower than its box and at 0
opacity, and settles on its literals in 0.3s (`TRANSLATE_Y` on `spatial(0.3)`, `ALPHA` on `effect(0.3)` — the group of
the whole subtree, so the card's shadow, fill, avatar, text and gradient all move and fade together and `ui_bounds` is
the settled box from the first frame). Each card waits 50ms (3 frames at 60Hz) longer than the one above it, so the
feed fills in rather than popping. A card's tracks start on the frame its delay is up, from the entry's own values, and
the page writes nothing at all once both have settled: a card at rest is the literal's frame, and `sky.png` is
byte-identical with and without the entry. The stagger is on the first mount only — a tab switch draws the new feed at
rest, so `sky-science.png` is unchanged. Measured (`solid/sky.test.ts`): the first frame draws none of the three; eight
frames in they are 4, 8 and 12px below their boxes, each further behind the one above it; thirty frames later they are
exactly on them. `sky-entry.png` is ten frames in, at 2, 4 and 10px. Reduced motion starts no track at all: no stagger,
no wait, the settled frame on the first frame.

**A hover is a fade, and the tab's underline with it.** A card's and a tab's hover used to swap a style variant; now it
is 120ms of `effect` (a luminance field is clamped and critically damped). A tab has no gradient, so the four
background floats (`BACKGROUND` 14–17) from the resting tone to the hover's are the whole of it — and a tab at rest has
no background at all, so the fade starts from the page it sits on (`variant(s.root)`'s packed colour, which is what a
transparent box shows) and lands on its `:hover` variant, the literal. A card has a gradient, which is drawn *instead*
of its solid fill, so the four floats alone would fade behind it: the card's fade also moves the gradient's opacity
(`GRADIENT_ALPHA` 50, from 0 to 255) and the renderer composites a gradient below 255 over the box's solid fill, so the
two gradients cross-fade through the tones between them and the settled hover is the hover gradient, pixel for pixel.
The card alternates two styles (`card` with the resting gradient, `cardHover` with the hover one) and the page keeps the
hover one while the fade runs *either way*: a `:hover` state would swap the gradient back the moment the pointer left,
and the fade out would never be seen. One consequence, stated: the gradient's identity changes at the two ends of a
fade, so the last 6/255 at the card's bottom edge appears when the fade hands over (the flat panel and the panel
gradient's top are the same colour; only the far end differs). A tab's **2px underline** is its own border colour
(`BORDER_ALPHA` 29): the tab that becomes active fades it in and the one that was fades it out — a colour, not a slide,
and the border is 2px on both (Clay draws a border inside the box, so no box moves) — and the tab that is leaving keeps
the border (and the tab that is arriving keeps it too) while its colour fades. **The label beside it fades with it**:
a text's colour is not in its box's floats, so the tab's `<text>` carries an id and the page fades the text's own four
floats (`TEXT_COLOR` 51–54, `effect(0.15)`) from the muted token to the accent on the tab that becomes active and back
on the one that was — the first use of the channel on something that is not a box. A settled label writes nothing: its
literal is the end it is on (the page still swaps `tabText`/`tabTextOn` at the switch), so the resting frames are
byte-identical to the ones before the label could fade. Measured (`solid/sky.test.ts`, the ink's core as the pixel
furthest from the page): the new label `139/152/165 → 126/152/176 → 106/153/195 → 89/154/211 → 77/155/222 → 59/156/240`
and the old one the same path back; a quick switch back never leaves the two ends, its widest frame 15/255; the one
stored frame of it is `sky-tab-mid.png`, a switch two frames in. Both fades retarget from
the presented colour, so a fast leave and re-enter never jumps (measured: the widest frame of one is 3/255); the ends
are read from the packed variants under the *frame's* theme, so the light palette fades between its own tones; a
selected card keeps `cardOn` and does not fade at all. Measured: a card's colour `28/33/41 → 31/37/44 → 32/37/46 →
32/38/46` a frame, between its resting `26/31/36` and its hover `34/40/49`; a newly active tab's underline
`42/64/87` on the way up and the old tab's `49/126/191` on the way down; `sky-hover.png` is three frames into a card's
fade.

**The drag: the pointer is the offset.** A press inside the feed grabs it (the feed's `onPress`, then the host's
`onPointer` on the same frame), and while the button is held the offset *is* the press point's offset less the pointer's
own travel — `dragX = place(grabFrom - (y - grabY), max)` every frame, no track between them, so the drag lags by nothing
and follows the pointer 1:1 (measured: 2px a frame presents 2, 4, 6, 8, 10). Past an end the same `rubber` resists it as
the wheel's pull is resisted (a 153px drag up presents 116.84, the clamp's 78 plus the resistance's f(75)). The tick
writes the value and nothing else while the finger is down: no notch, no key and no band release retargets the track under
it. Travel past `DRAG_SLOP` (4px, in x or y) makes the press a **drag**, and the card under it is not clicked on the
release: the card's `onClick` is dropped while `held && dragMoved`. A press that never moved is a click, and selects as
before. The release hands the drag to the spring/decay: the **speed** is the offset's over the last `FLING_FRAMES` (5)
samples' span, and a span under `FLING_MIN` (1/120s) is one frame's jitter and no speed at all (Rune's rule: no
single-sample spikes) — no travel or no speed means no fling, the offset stops where the finger left it, clamped. A fling
projects `decay(dragX, v)`, runs the decay inside the content and springs to the clamp past an end; a release in the band
lets the band go on its own way back. Reduced motion still drags 1:1 (it is direct manipulation) and flings nothing: the
offset stops where the finger left it, clamped. `held` and `dragged` are the scroll's own (`dragged` is `held &&
dragMoved` when the release's click is decided, which is before the pointer's release call runs). Measured
(`solid/sky.test.ts`): a 10px drag in five frames is released at
11.48 (the release frame is the fling's own first frame), the next frame at 12.9, and it rests at 54.95 — the speed of the
last five samples projected; the same drag past 78 springs back to the clamp and rests on it. `main.ts --drag-feed
X,Y,DY,DY,...` scripts one headless.

**The List's viewport is the same machine** (`solid/src/vscroll.ts`: `scroll(id, max)`, which both pages build), not a
second implementation: the wheel's 10px and the flick's decay, the press's 1:1 grab with its 4px click threshold, the
band's `rubber` and its 80ms hold, `ui_scroll_put` while banded and `ui_scroll_to` otherwise, and reduced motion's hard
clamp are one body of code. What a page keeps is where its content ends and what its keys do. Sky's end is its content
(the cards' real block plus the feed's two 12px paddings); the List's is its whole block of rows — `count·28 + (count−1)·2`,
898px for the 30 rows in a 240px viewport, so 658 to scroll — and neither is the declared window's. Sky's
keys move the offset itself (Down/Up 40, Page a viewport, Home/End); the List's keys move the **selection** a row (Page
eight rows, Home/End the ends) and the page then asks the track for the least offset that shows the moved row — the
reveal. The reveal is measured from the row's *place in the content* (`row.bounds - view.bounds - Clay's offset`) when
the window declared that row, and from the window's arithmetic (`i·(28 + 2)`) when it did not — the rows are fixed, so a
key can reveal one the window left out; it is compared with the track's **target** rather than what it presents, so a key
pressed while the track is still travelling still lands the row inside the viewport: with the row in view nothing moves.
A key also drops the band, as it does on Sky. The List's wheel is gated on `ui_pointer_over("list")` — Clay scrolled only
the container under the pointer, and a page that owns the offset has to keep that rule itself (Sky's feed takes a wheel
anywhere, as a phone feed would). The drag never touches the selection: it is the keyboard's (there is no per-row click).
Measured (`solid/list.test.ts`): one notch `2.59, 1.92, 1.42 …` px a frame to exactly 10; forty notches in one frame
step `103.44, 86.17, 78.69 …`, peak 103.44, rest on 658 after 40 frames; 4 notches past 658 present `678.15` (f(40) of
the 240px viewport), hold four frames and are back on 658; twelve Downs ease to 148 (the first reveal is 3.4px into its
28), PageDown to 388, End to 658, Home to 0, with the selected row inside the viewport after every settle. The stored
`list-wheel.png` and `list-select.png` are byte-identical: the run is `--wheel 32 --wheel-rest` (320, the notches' own)
and the keys get `--settle 90` (the scrollbar's fade needs the extra frames: see "The scrollbar" below), and a settled
frame is the same rows at the same offset, so the motion changed the frames between the ends, not the committed ones. The band's way back is the spring it is on Sky: 4 notches past 658 present
`678.15` and hold four frames, then `677.4, 675.6, 673.4, 671, 668.7, 666.7 …` and a dip a hundredth under the clamp
before it rests on 658.

**The scrollbar: a thumb the machine draws.** Both scrolling pages carry one (`solid/src/vscroll.ts`'s `thumbOf`, `BAR` of
the List and `sky-thumb` of the Sky): 4px wide, 2px in from the viewport's inner right edge, `max(24, view²/content)`
tall, with its top at `offset/(content-view)·(view-height)`, and nothing at all when the content fits (height 0, alpha 0).
`thumbOf(content, view, offset)` is a pure function, so the formula is checked without a frame. The page declares the thumb
as a **float on its viewport** — `css.float({ parent: "list" })` — which is the decision about the tree: Clay positions a
float from its parent's box and does not give it the clip's `childOffset`, so the thumb is a sibling of the scrolling
content, draws over the rows or the cards, and does not travel with them; it needs no clip of its own because it is
always inside the viewport's box. The machine writes it every frame through the value channel, five numbers: the height
(a FIXED axis is its min and max, fields 4 and 5), the float's offset y (39), the background's alpha (17) and the
pointer capture (43). The fade is a colour and an `effect(0.15)`: the thumb comes up on the frame the offset moves and
goes down `THUMB_HOLD` (600ms) after the last frame it moved — "moved" is the track's own settle, so a spring's tail
keeps it up, and a frame that moved at all, which under reduced motion is the jump itself. Reduced motion fades nothing:
the thumb is there on the frame the offset moves and gone 600ms later, at once. A press on the thumb (its `onPress`,
`scroll.thumb()`) grabs the offset *where it is* — the thumb does not jump under the pointer, as a native scrollbar's
does — and while it holds it, `offset = grabFrom + (y - grabY)·max/(view - thumbHeight)`: the thumb's travel is the
offset's whole range, so 1:1 on the bar and `max/travel` on the content. It clamps at both ends (a scrollbar has no band)
and its release stops it (no fling; a scrollbar is not a throw). A press on an *invisible* thumb is the page's, and a
press on a visible one is the bar's: the float's pointer capture is written with the fade (`CAPTURE` at alpha ≥ 128,
`PASSTHROUGH` below), so `Clay_SetPointerState` breaks at the thumb and the viewport (or the card under it) is not pressed
— a press on the bar therefore never starts a content drag and never clicks a card. That capture is one frame behind the
fade on purpose and stated: Clay's pointer test reads the previous frame's declaration, and one frame of a 0.15s fade is
not a press anyone can aim at. Measured (`solid/list.test.ts`: 898 of content in a 240 viewport, travel 175.86): the
thumb is `314,4x64.14` at the view's top, its top is `88.2` at 330 of the 658 and its bottom is the viewport's bottom at
658; a 10px drag on the thumb at that point moves the thumb 10px and the offset `37.4` (10·658/175.86), not the content's
1:1, and clamps on 658 and 0 past its travel; the fade's pixel is the row's own `36/40/52` at rest, `53/57/69`,
`82/86/99`, `105/111/124`… into the muted `150/155/170` (drawn as `149/154/169`), still there 40 frames into the hold and
gone by frame 64 of it (`131/137/151`, `103/108/122`… back to `36/40/52`). On the Sky (`solid/sky.test.ts`: Science's 742
in 664) the thumb is `354,4x594.2`, its travel 69.8, and it is height 0 on Discover, whose three posts fit. No stored
frame shows it: every settled frame is after the fade-out, so `--settle 60` became `--settle 90` where the frame follows
a scroll (`list-wheel`, `list-select`, `list-light`, `sky-scrolled`) and the pixels did not change — the frames were
compared, not re-stored. `sky-band` did not change either: it is Discover, and Discover has no bar.

**The horizontal axis, and a wide List.** The machine is one axis instantiated twice rather than a second
implementation: `scroll(id, max, bar, across?)` always builds the vertical axis, and with `across` (`{ max, bar }`, the
page's horizontal content end and thumb id) a second one from the same `axis()` closure — the wheel's accumulating
notches, the burst's fling, the `rubber` band and its 80ms hold, the drag's 4px click threshold, the fling's decay and
the thumb's fade are one body of code, and only the coordinate (`dx` for the notch, the pointer's x for a drag and a
thumb), the extent it reads (`ui.bounds`'s width or height) and what it writes (`ui_scroll_to`/`put`'s x or y, the
thumb's width and offset x or height and offset y) swap. The clock and the fade are the machine's, not an axis's: both
bars come up while *either* axis moves and go down 600ms after both stop. `barOf(content, view, offset, reserve)` is
`thumbOf` with the reserve `thumbOf` never needs, and `thumbOf` is `barOf(…, 0)` — the same formula turned: the
horizontal thumb is 4px tall at the viewport's inner bottom edge (2px up, as the vertical one is 2px in from the right),
its width is `max(24, view²/content)` of the viewport's width, its left is `offset/(content−view)·(view−width)`, and it
is hidden (width 0, alpha 0) when the content fits. With both bars the machine takes 6px (the bar's 4 and its 2px inset)
off the vertical thumb's travel, so the vertical bar's bottom is the horizontal bar's top: they meet, they do not
overlap.

The wheel's x delta reaches the page as it always did (`ui_wheel_pop` has always carried both), and a **shift+vertical
wheel is a horizontal scroll**: `ui_window_poll` swaps the delta onto x when the wheel has none of its own and
`SDL_GetModState()` has shift, which is a browser's rule and costs one branch (a trackpad's two-finger swipe already
sends x, and it is left alone). Headless, `--wheel-x N` is N notches to the right: `ui.wheel(-1, 0)` a notch, the same
sign rule as `--wheel`'s `(0, -1)` a notch down (the machine's offset is positive down or right).

The page that has horizontal content is the **List's wide layout** (`bun solid/main.ts list --wide`, `List({ wide })`):
the same 240px viewport and the same 28px rows with a 2px gap — the vertical window, the clamps, the band and the keys
are untouched, because the widths are a layout matter — with rows **900px wide**. A row stays the same three cells and
adds two: the number, the name as a 150px cell, the note as a 320px cell with `overflow: hidden` (a clip element of its
own, so a long note is cut at the cell instead of widening the row), the temperature, and a second column of values
(`10 seats · 5 sockets · wing C`) past the viewport's 280px edge, which is what there is to scroll to. The horizontal
clamp is `900 − 280 = 620`. The wide layout is a **prop**: the default page's tree is the one it always declared, so
`list-top`, `list-wheel`, `list-select` and `list-light` are byte-identical, and `list-wide.png` is the new frame
(`--wide --wheel-x 12 --wheel-rest --settle 90`: 120px of the 620, the notches' own step, after the bar's fade-out).

Measured (`solid/list.test.ts`, the wide page: the viewport `40,101.5,280x240`, the content 900 of rows): one horizontal
notch glides `2.59, 1.92, 1.42 …` px a frame to exactly 10, the rows' left `40 → 30`; forty notches in one frame step
`103.44, 84.78, 75.47 …`, peak 103.44, and rest on the clamp `620` after 39 frames; the thumb is
`232.89,335.5 87.11x4` px at rest, its travel 192.89, its left `0` at the start, `102.67` at 330 of the 620 and `192.89`
(the viewport's right edge its right) at 620; a 10px drag on the bar is `3.21` px of offset a px (62.1 and 94.24 from
30 over travel 192.89), and the drag clamps on 620 and 0; both bars at once: the vertical thumb's travel is 169.86
(240 − 6 − 64.14) and its bottom at the end `335.5` is the horizontal thumb's top, so nothing overlaps, and a vertical
notch shows the horizontal bar too (one fade). Cost (`--bench 500`, headless, the same 360x400 frame): the wide page is
declare 0.022-0.027 ms a frame against the default's 0.018-0.022 and layout 0.022 against 0.018-0.019, and draw 1.34
against 0.56 — the draw is the wide rows' own glyphs (a long note and a second column on nine rows), not the axis: one
more axis on the same tick is a few arithmetic branches, and its bar is five more numbers a frame through the value
channel (its length, its start, the alpha and the capture). The default pages write one extra call a frame
(`ui_scroll_to_x(id, 0)`, so a clip element's x does not survive a page with the same id in one process); their stored
frames are unchanged (66 comparisons, `test.sh`).

**The window: a page declares what the screen shows.** `solid/src/virtual.ts` is what makes a list of thousands cost
what the screen shows: it returns `{ first, last, above, below, content }` — the indexes to declare, the two spacer
heights, and the *real* content height — and both pages declare a spacer box, the items, a spacer box, inside the same
clip element and gap-spaced column. Two shapes, one function each. `fixedWindow` is arithmetic (`List`: every row 28px and
the column's 2px gap, so row `i` starts at `i·30`). `measuredWindow` is for the Sky's cards, whose heights differ: a cache
by index, filled from `ui.bounds` of each declared card after the frame (the page's tick reads the last layout's card
heights before declaring the next). It **measures once, then virtualizes**: while any card's height is unknown the window
is the whole column (`first` 0, `last` count−1, no spacers), so a feed of 200 declares 200 cards on the frame it mounts,
measures every one of them on the frame after, and has exact heights from then on. The mean of the measured heights
(190px until anything is measured) is only the estimate the measuring frames give the content, the clamp and the thumb —
never a place a card is *measured* at — so the content's end does not move when a card is first seen. `List` takes a
`count` (30 by default; 1,000 is the window's own page, `bun solid/main.ts list --count 1000`), `Sky` a `posts` feed (its
Discover fixtures by default; 200 synthetic posts are `--posts 200`, or `synthetic(200)` in `solid/virtual.test.ts`).

The spacers take their own gap out of the column (`above = first·slot − gap`), and there is **no** spacer at an end: an
empty box would still add its gap. So the declared items sit exactly where the whole page would have put them
(`virtual.test.ts` checks row 33 at 990px, the last row's bottom on the viewport's, and the gaps of 8 between cards), and
the declared block is the whole content: 1,000 rows are 29,998px whether nine or eleven of them are declared. The spacer
height is not a style (`css.height` is a build-time literal): the boxes carry the last two numbers of a FIXED axis through
the value channel, fields 4 and 5, as the scrollbar's thumb writes its own. The window is one `For` over the spacer cells
and the items' indexes (a `Show` either side would be put *after* the `For`'s items by Solid's renderer); the Sky's cell
is `${feed}:${index}`, so a tab switch gives each card a node created in its own child order.

**A list's selection is a range of its own.** The wheel moves the content and leaves the selection where it was, so the
selected row can be outside the window; it is declared all the same, because its box is what the reveal reads, its fill
and ring are what the user sees when a key brings it back, and a11y wants a node. `segments(w, { count, slot, gap, extra })`
is the column the `List` lays out: the window's rows, the extra index when it is outside the window, and a spacer for
everything not declared — `SPACER.above`, then the row, then `SPACER.middle` (the items between it and the window), then
the window's rows, then `SPACER.middle` and the row when the extra one is below, then `SPACER.below` — each spacer taking
its gap out as the window's do, and none of them when the two ranges are adjacent (a zero-height box would add its gap).
Three sentinels, three FIXED-axis heights (fields 4 and 5) of three boxes, `list-above`, `list-mid`, `list-below`. The
order follows the indexes, so every declared row is where the whole list would have put it: at 1,000px down with the
selection still row 1 the column is 12 rows and 3 spacers instead of 11 rows and 2, the window's rows (32..42) have not
moved, and the content is still 29,998px; `frames/list-wheel.png` (row 1 selected, 320px down) is **byte-identical** with
the extra range in the tree, because the clip cuts its box 292px above the viewport and nothing else changed. The Sky has
no selection, so it does not use it (its cells are strings, `${feed}:${index}`).

**The clamp and the thumb are the real content's.** `maxScroll` is `content − view` from the window's `content` (the Sky
adds its two 12px paddings), never the declared subset's, so the ends, the band's f(x) and the thumb's
`max(24, view²/content)` are the same as when every row and card was declared; `thumbOf` writes the bar from `max + view`,
which is that content. The Sky's content is the mean's estimate only while the measuring pass runs: a track that was at the
end follows it if it moves during those frames (when the content's end grows and the target was the old end, the page
seeks the new one; a shrink is the scroll's own hard clamp), and from the pass's last frame it is exact, so no later frame
moves it. The List's reveal reads the selected row's **bounds** — the selection is declared even when the wheel has left it
behind, so there is a box to read — and falls back to the window's arithmetic (`i·(row + gap)`) on the key's own frame,
when the selection has just moved to a row the last frame did not declare; the two agree to the pixel. The Sky's keys
move the offset, so no card is revealed. `ponytail:` `measuredWindow` builds a
prefix sum over the cache on every call (O(n) a frame, n the feed's posts); a persistent prefix or a binary search over a
running total is the upgrade if hundreds of thousands of items ever matter.

Cost, the same machine and `--png … --bench 500` (declare = the JS walk, the FFI and Clay's declaration and text
measure), before (the pages of `05e32400`, every row and card declared) and after: **List** 30 rows
0.086 → 0.032ms, 1,000 rows 2.084 → **0.030ms**; **Sky** 3 cards 0.022 → 0.028ms (its frame's own noise), 200 cards
0.683 → **0.042ms**. The declaration follows the window (nine rows at the top, eleven 1,000px down; six cards of the 200
at the top), not the data. `solid/virtual.test.ts` prints the same numbers from the frame stats (`stats[1]`) and holds the
1,000-row declare within a small factor of the 30-row page's. The stored frames of both pages are **byte-identical**: with
30 rows the window declares nine of them instead of 30 and a spacer for the rest, and the pixels do not move.

The measuring pass is the one frame that is *not* the window: 200 cards declared in one frame cost **0.85ms** of declare
(the suite's own `stats[1]`; medians of five mounts on the same machine 1.07ms) against 0.024ms a frame once the window is
back, and 1,000 cards 4.9ms. The rule: the pass is one frame while the column fits Clay — about 1,000 cards here (2,000
declared boxes already overflow this build's default element/ID capacity, `CLAY_ERROR_TYPE_HASH_MAP_CAPACITY_EXCEEDED`,
before any of it is drawn). A page with thousands of cards would therefore need both Clay's element count raised and the
pass in chunks over idle frames, with the content's end estimated until the last chunk; no page here has more than a feed
of hundreds, so there is no chunking (`virtual.ts` keeps the note). The pass costs one frame of a page's life and buys a
content height that never moves.

**Touch input: one pointer, mouse or finger.** SDL3 reports a finger as `SDL_EVENT_FINGER_DOWN/MOTION/UP` (and
`CANCELED`) with `event.tfinger.x/y` **normalised to the window** — 0..1, (0,0) the top left, not clamped, so a touch in
the letterbox lands outside every box. `ui.c` maps them through one function, `ui_touch_map(fx, fy, out)`
(`x = fx·width`, `y = fy·height` in the layout's pixels, the same space the mouse path writes after
`SDL_ConvertEventToRenderCoordinates`), into the *same* pointer state the pages already read: down while the finger is on
the window, up at the place it left. One finger owns the pointer — the first `FINGER_DOWN`'s `fingerID`; a second finger
is **ignored** until that one lifts, because a page here has one pointer and no pinch or two-finger gesture reads the
second (`CANCELED` is a lift). The mouse path is unchanged, and a mouse event clears the flag. The poll's array grew a
sixth slot, `out[5]`: 1 when the last pointer event was a finger's, 0 for the mouse; `main.ts` hands it to the frame,
`View.onPointer(x, y, down, touch)`, and on to `scroll.pointer(x, y, down, touch)`, which uses it for one thing: a
**touch drag has no 4px click threshold** (a finger has no mouse's precision, so any travel starts the drag,
`dragSlop = 0`), while a touch press that **never moved** travels 0 and is still a click — the Sky's card still selects.
The mapping and the flag are covered without a touchscreen: `bun solid/main.ts --touch FX FY` goes through the same
`ui_touch_map` and marks its frames as a finger's, so `--touch 0.5 0.5` is the frame of `--click 180 380` (the Sky's
second card selected) and `sh solid/test.sh` compares the two; `solid/sky.test.ts` runs a finger's 2px drag (not a card
click) against the mouse's (a click) and a finger's tap (a click). **Not verified: there is no touchscreen on this
machine.** No finger has touched this code: what is tested is the mapping, the flag's path through the host, and the
pages' two behaviours under it.

**The thread screen: the page's second screen.** A card press records the selection and opens that post's thread — the
bar (the wordmark and the three tabs) stays where it is, and the feed stays declared underneath, so its clip's offset and
its selected card are the feed's own and are not written while the thread is up. The screen is a **root float over the
content area** (`THREAD_H` 696 = the window's 760 less the bar's 64, at `zIndex` 2, capturing the pointer), with a 44px
header (the back control and the word "Thread") above its own clip element. The data is the app's recorded thread
(`apps/csssky/test/fixtures/thread.json`) as the page's own `Post` literals, the six-field records the feed draws: the
root is the clicked post with its own counts, and the replies are the fixture's tree — `jlp2024.bsky.social` at depth 1,
a tombstone at 2, `Katie Korth` at 2, `Mdubs949` at 3 and the row a cut branch ends in at 4 — cut at the app's
`MAX_DEPTH` (3) by the page's `cut`, which is `apps/csssky-tui`'s `rowsOf` transcribed (its rows are the API's
`ThreadNode` over `PostView`, and this page's records are not): a post row, a tombstone row, and a branch at the limit
ending in a `moreLabel`-worded row that opens that post's own thread (`moreLabel`, `goneText` and `MAX_DEPTH` are
imported from `apps/csssky/src/thread/model.ts` — the same strings, not copies). A row is a full-width wrapper whose
**left padding is the depth's indent, 16px a level** (the app's margin-left), so the card inside keeps a percent width
and wraps its body as the feed's does: measured, the cards start at x 12 (the root), 28, 44, 44, 60 and 76. The root is
the app's focused post — the accent border, `cardOn` — and the replies are the same card without the avatar.

The screen scrolls on the page's own machine (`src/vscroll.ts`, a second instance, one per opening, so a thread always
starts at its top): 900px of rows in the clip's 652 (the window less the bar and the header), so 248 to scroll; its thumb
is `max(24, 652²/900)` = 472.34 tall with 179.66 of travel, 4px 2px in from the clip's right edge, and it fades as the
feed's does. Two Tab stops: the back control (a `createButton` part, role `button`, label "Back", Enter and Space) and
the clip (Down/Up 40px, PageDown/PageUp a viewport, Home/End on the same track); the cards are not stops. Escape (from
either stop, and as the page's last resort from the bar) and a click on a tab return to the feed — the tab's click also
switches it — while the **history is one deep**: a thread opened from a "Show N more replies" row returns to the thread it
came from, and a card's returns to the feed. The a11y tree: the screen is a `region` named `Thread — @<handle>`, the root
and each reply are `article`s named by their author, the tombstone a `note`, the more row a `button`; the covered feed is
`hidden` while the screen is mounted.

The screen enters as **one group** and leaves the same way: 12px low and at 0 opacity → its box, on the page's card
entry's tracks (`TRANSLATE_Y` on `spatial(0.3)`, `ALPHA` on `effect(0.3)`), with `presence(0.3)` keeping the node mounted
for the exit and passing the press through while it closes; the layout never moves (a group is a renderer scene).
Reduced motion has neither: the first frame is the settled screen and the exit is the falling edge. Numbers
(`solid/thread.test.ts`): the feed's frame after back is byte-identical to the one the click left (0 bytes of
1,094,400) with its offset and its selected card, a "Show N more" row's thread returns to its parent's frame, the entry's
first frame draws none of the screen and the next two are a blend, and reduced motion's first frame is the stored one.
Five stored frames: `sky-thread.png` (settled), `sky-thread-mid.png` (two frames into the entry), `sky-thread-scrolled.png`
(six notches with a rest frame between them), `sky-thread-light.png`, and `sky-thread-more.png` (the deeper thread a
"Show 1 more reply" row opens — that row is only in view at the thread's end, so `main.ts` takes a second headless click
after the settle, `--click2`/`--settle2`). The eight frames of the feed (Discover, Science, the light theme, a scroll, the
entry, a hover, the band and a tab mid-fade) are byte-identical to before the screen existed.

Not here: fetching a real thread from the AppView (the page has the one recorded fixture, for whichever card is
pressed), a reply's own thread beyond the one branch the data holds, and the profile and settings screens.

**The thread's data is the AppView's, through one injectable loader.** This replaces the transcription above (that
paragraph's rows and its "not here" line): a card's press now asks the page's `load(uri)` — a post's at-uri in (the
`Post` literals carry the fixture records' own uris), its `ThreadScreen` out — and the screen opens in its **loading
state** before the answer lands. The default loader is the call `apps/csssky/src/api.ts` makes, written out in
`solid/app/Sky.tsx`: `GET https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=<at-uri>&depth=6&parentHeight=20`,
with `AbortSignal.timeout(8000)` and **no retry** (a thread is a screen the reader asked for, and the error state's Retry
row is the retry); a non-2xx is that error state too. The body's `thread` goes through the page's `screenOf`, the app's
shaping of it: the parent chain from the nearest outward, and `nodeOf` — a `threadViewPost` as the API's `ThreadNode` with
its replies sorted by the app's own `topFirst`, a `blockedPost`/`notFoundPost` as a tombstone. The page's rows are then
the app's, not a copy: `rowsOf` from `apps/csssky-tui/src/model.ts` (`MAX_DEPTH` 3, the cut's `moreLabel`, `goneText`),
and each `PostView` becomes the card in one function, `postOf` — display name, handle, the record's text and
`createdAt`, the counts, and the media as the terminal's line (`mediaText` over `embedParts(p).media`, so Mina's link is
`[link: Want to Get Off Your Phone? … - wired.com]`); an empty body draws no text at all (the fixture has a post whose
record is empty, and an empty `ui_text` is not a box). The import is the terminal's precedent, and it costs ~50 ms of
Bun's startup (`time bun -e 'await import("./apps/csssky-tui/src/model.ts")'`), not a frame.

**Three states.** A press mounts the screen on its entry exactly as before, and what it draws is the loader's:
**loading** — the header and one muted row, the tombstone card's own style, 336x44 at 12,120, "Loading the thread…";
**answer** — `rowsOf`'s rows (post rows at their depth, a tombstone's words as a `note`, a "Show N more replies" row at
the cut as the `button` that opens that post's own thread); **error** — "The thread could not be loaded" in the same card
and a **Retry** row under it (336x36, the more row's style), which asks the loader again for the same uri. A late answer
never lands on a screen a back, a tab or a second press replaced (an ask counter, `ask`), and a press on a card whose
record has no uri does nothing. **The honest failure path is the error state, not a fallback**: the fixture is not
offered as if it were the answer to a request that failed — it would read as a real thread — so the offline path is the
error state and its retry, and the recording is used only where nothing is asking: `--offline` (`solid/src/skyload.ts`),
and every headless run, so **a stored frame never touches a network** (`--png`/`--expect` are offline whether or not
the flag is given). `--pending` is a loader whose promise never settles (the loading state's stored frame) and `--fail`
one that throws (the error's).

**What the recording makes of it, and the frames that moved.** The recorded answer is Mina Kimes' *reply by Bluesky*:
`thread.json` has a parent. So the screen is ten rows — Mina Kimes (the parent, 280 tall: her body's paragraphs and her
link line), Bluesky (the root, 136, the accent border), then the app's sorted replies: Mina again (226 likes), Mdubs949
(4) with Ryan at depth 2, then jlp2024, Davide Aversa, Katie Korth, Juanita and rmar124 — 1758px of rows in the clip's
652 (1106 to scroll, the thumb 241.81 tall). That is **not** the old transcription, and the stored frames were re-stored
deliberately: the root was Titania's card (the click's own post; offline the recording answers for whichever card is
pressed, as the terminal's frame does), the old tombstone and its "Show 1 more reply" row are rows the recording does not
contain, and the four transcribed replies are the recording's middle **unsorted** (the page now shows the app's order, so
Mina's 226-like reply is first). Five frames, re-stored: `sky-thread.png`, `sky-thread-mid.png` (two frames into the
entry), `sky-thread-scrolled.png` (six notches), `sky-thread-light.png`, and `sky-thread-more.png` — that one is now
twenty notches down (the flick settles at 508 of the 1106; the second click lands on a post's card, since the recording
has no branch to cut), and the more row's own frame is the test's screen, built from the same posts. Two new frames: `sky-thread-loading.png`,
`sky-thread-error.png`. `solid/thread.test.ts` injects the loader everywhere (a promise per ask, settled by the test):
the loading row and its frame, the answer's rows and indents (12, 12, 28, 28, 44, 28…), the error and its retry (the
second ask for the same uri), a tombstone and the cut's more row from a screen built of the recorded posts (its press
asks for the cut post's uri; back restores the parent without a third ask), a pending answer a back overtook, the
scroll's numbers, back's byte-identical frame, the a11y tree of all three states, and the mutations — an at-once loader
never draws the loading row, and a reject after a loaded thread shows the error's two rows, not the thread that was up.
The frames of the feed are untouched.

Still not here: replies below `depth` 6 and a parent chain longer than 20 (the query's caps), paging a thread's replies
with a cursor (`getPostThread`'s `parentHeight` and `depth` are the whole request here), a cache (every press asks
again, and back restores the screen it came from without asking), the moderation `apps/csssky/src/api.ts` applies to a
logged-out viewer (this page shapes a `hidden`/labelled post as a post — it has no labeler), and a real service's auth
(the public AppView, no login).

**The settings screen: the page's third.** A gear at the bar's right end opens it — the app's own Settings nav item, its
glyph three 16x2 boxes (Roboto has no gear glyph and Clay has no icons) in a 40x28 box that ends at the bar's content
edge — and the screen is built like the thread's: a root float over the content area one z above the thread's, so it
opens over a thread as well; a 44px header with the back control and "Settings"; its own clip element on a third
instance of the page's scroll machine (the three rows fit the 652, so it never scrolls and its thumb stays out); the same
group entry (12px low and 0 opacity on `spatial(0.3)`/`effect(0.3)`, `presence(0.3)` for the exit, and reduced motion
neither); and Escape, the back control or a click on a tab returning to what was up — the feed, or the thread the screen
was opened from. Its five stops (the back control, the theme group, the switch, the size group and the clip) are the
page's Tab stops while it is up and disabled while it is down, the covered screen's stops are disabled under it, and the focus its opening
pushed comes back on the way out, so the frame under it is byte-identical (measured: the thread's back control has its
ring again, 0 bytes of 1,094,400).

Its three rows are controls that change the page, not a drawing of one. **Theme** is a radio group, Dark and Light: every
style's variant is picked by the *frame's* theme, so the pick is written back to the host (`Sky`'s `setTheme` prop —
main.ts's own `theme` variable, which its frame's `theme` getter reads and its `t` key flips) and the whole palette
follows, the page's own fades with it (they read the same signal): measured, the bar's ground and the screen's `16/19/22`
→ `243/245/247` and a row's panel `27/32/38` → `255/255/255`. **Reduced motion** is a `createSwitch` that calls
`setReducedMotion`, starting on the platform's flag (`--reduced-motion`), so afterwards every retarget lands at once:
measured, the frame after a card's click is the settled thread (0 bytes of the 20-frame one), where without it the same
frame differs by 672,965. **Text size** is a second radio group, Regular and Large: the page's styles are literals and a
Clay text carries its `fontSize` and `lineHeight` as numbers, so no token can carry them — the feed card's five text
styles have a Large variant each, two steps up (16/22 → 18/24, 12/16 → 13/18, 14/20 → 16/22, 13/18 → 15/20 twice), built
in `app/Settings.tsx` from the page's own tokens (the palette is `app/Sky.styles.ts`'s now, shared by the two screens).
The card grows 190 → 222 and its body's one 20px line is two 22px ones; the feed re-measures (the page drops its height
cache on the frame the size changed), so Science's 742px of content is 830, its thumb 594.2 is 531.2 and its end 78 is
166; back at Regular the card and the feed's whole frame are byte-identical to before. The thread's cards keep Regular.

The values are the page's while it runs — signals and `motion.ts`'s flag, no storage read or written — so a window starts
from `THEME=light` or the dark palette, from the platform's motion flag and at Regular. Not here: the app's full
appearance set (the accent hue's slider, the corners, the fonts — `apps/csssky/src/settings.ts`), which this page's tokens
have no handles for, and a persisted choice. Four frames (`solid/settings.test.ts`): `sky-settings`, `sky-settings-mid`
(two frames into the entry), `sky-settings-light` (Light picked, the ring on it) and `sky-settings-large`. The fifteen Sky
frames that show the bar were re-stored deliberately: the gear draws 96 pixels in a 16x12 box at 315,26 (its three
bar-glyph rows) and nothing else in any of them moved, measured pixel for pixel against the previous files; the command
golden (`solid/goldens/sky.json`) gained those three rectangles and the one a11y node.

**A page's entry, once.** The four plain pages — List, Widgets, Sensors, Text field — get the same first mount from one
helper (`solid/src/entry.ts`): the root element's subtree (its id is `Root` on all four) starts 8px low and at alpha 0 and
settles on its literals over `spatial(0.25, 0)` for `TRANSLATE_Y` and `effect(0.25)` for `ALPHA` — the group fields, so
no box moves and `ui.bounds` is the settled one on every frame — and then the tick writes nothing at all, so a page at
rest is the frame its literals make. The clock is the host's tick, so a headless frame and a window frame take one path.
The settle is ~21 frames (a spring's duration is not its settle time), so the stored frames of those pages are taken after
`--warm 30` and are byte-identical to the frames before the entry existed. Reduced motion has no entry: the first frame
is the settled one. `frames/list-entry.png` is four frames in (t = 3/60): the page is `5/6/8` of its `16/18/24` and the
selected row `12/14/18` of its `36/40/52`, still lighter than the page around it; `solid/list.test.ts` checks the blend,
the literals at rest and that the layout never moved.

The Dialog page is the value channel's first user, and it animates the two overlays of `headless/`. Both end on the
style's own literal, so a settled frame is the literal's frame: the **menu** slides out of its trigger — its float's
offset y from -10 to its style's -20 on `spatial(0.22, 0.1)`, and its shadow's blur from 0 to its style's 14 on
`effect(0.22)`, which is clamped and critically damped because a blur has no negative side and must not ring; the
**dialog** drops in — offset y from -14 to 0 and its shadow's blur 0 to 32, the same two tracks. Both use the `effect`
class for the blur and `spatial` for the offset for the same reason: position may carry a little velocity, a luminance
field may not. The pair that reads best in a frame is the offset with the blur at once: the menu grows out of the
trigger (it starts 10px lower, over the 20px it overlaps) while its shadow appears under it, so by the third frame
(2/60s in) the menu is 7.4px low with a shadow at a quarter of its blur — legible as "arriving" rather than as a jump;
the blur alone would look like a fade and the offset alone like a slide with no depth. The group is the third layer of
the same arrival and the one that reaches the panel's text: alpha 225 → 255 and scale 96% → 100% (`dialog-entry-mid` is
three frames in: 119 of 255 and 97.8%), so the panel is translucent and a shade small while it drops, and its own text
fades with its fill instead of standing at full ink over a ghost of a box.

The clocks are the page's and run only while the node is mounted: a fresh arrival starts at the entry values, and every
later frame is one dt after the one before it — through the exit too — so a reopen mid-exit presents the value the exit
would have shown next (measured: leaving at -19.03, reopened at -17.18, which is the exit's own next frame), no jump and
no restart. When the presence's exit ends the node leaves the tree and the clock stops with it; the next open starts
from the entry again.

**Presence: a node that leaves stays.** `Show` no longer follows the open state. The page keeps a signal per overlay
(`menuShown`, `dialogShown`) that its tick sets from `presence(when, exit)` (`src/motion.ts`): `update(open, dt)` returns
`{ mounted, closing }` — on the falling edge the node stays mounted and `closing` is true, that frame being the exit's
first (the page retargets there, so it is drawn at the offset the exit starts from); after `exit` seconds (0.35 for the
Dialog) it returns `mounted: false` and `Show` drops the node. `when` true again during the exit revives it: `closing`
goes false and the tracks retarget from what they present, so the reopen frame is the value the exit's own next frame
would have had — no jump and no restart. The page's clock keeps running for as long as the node is mounted, which is
what makes both true. A page's tick is one call an element now: `channel(write)` (`motion.ts`) wraps `ui.value` and
writes an element's fields together (`write(id, t, [field, track], …)`).

The exit runs the arrival tracks the other way. The **panel**'s offset y 0 → 14 on `spatial(0.2, 0)` (an exit must not
bounce past where it came from) and its shadow's blur 32 → 0 on `effect(0.2)`; the **backdrop**'s background alpha 140 →
0 on `effect(0.2)` — field 17 of the rgba, and since the backdrop's box is the whole window, its alpha *is* the dim (the
0.55 of `rgb(0 0 0 / 0.55)` packs as 140); the **menu**'s offset y -20 → -10 and its blur 14 → 0. The presence's 0.35s
is longer than the tracks take to settle exactly (~0.333 for the 32px blur), so the last frame an exiting node is on
screen is the literal's. Both overlays also leave as a group (alpha 255 → 0, scale 100% → 96%, the section on group
opacity and scale). Measured (`solid/dialog.test.ts`, `ui.bounds` and the pixels per frame): the panel's y
`163.88, 165.24, 167.82, 170.39, 172.54, 174.18 … 177.88` (its rest 163.88, the exit 14 below), the reddest title pixel
behind the backdrop `103, 115, 139, 162, 181, 196, 206, 214, 219, 222, 225, 227, 228, 228, 230` from the dim to the page,
the menu's offset `-20.00, -19.03, -17.18, -15.34, -13.81, -12.64, -11.79, -11.19, -10.79, -10.51, -10.33` with its
shadow lightening 13.9 → 18.0 (the page). After the exit both the panel and the backdrop are out of the layout and the
page's own pixels are back (0 pixels differ from the frame before opening).

**The trap is the open state's timing, not the node's.** `input.modal` asks `dialog.open()`, so it is released on the
frame the dialog closes: a Tab right after Escape reaches the page's own next stop (the Zoom trigger) while the panel is
still fading, and Enter on it reopens the dialog mid-exit (which is the revive above). The pointer follows the same
rule: a `closing` overlay writes `FIELDS.CAPTURE` 1 (passthrough) for the length of its exit, so a press goes through
it to the page instead of hitting a node on its way out.

**Reduced motion** is a module flag (`setReducedMotion`, `reduced` in `motion.ts`), read once by `solid/main.ts` from
`--reduced-motion` or `REDUCED_MOTION=1`, so a headless frame and the window take the same path. With it on, a retarget
lands on its target with v = 0 (settled in the same call) and a `presence` mounts or unmounts on the frame it changes,
so opening is the literal's frame in one frame and closing has no frame with the panel in it; the pages carry no branch
of their own. The dialog test checks it against the settled frame pixel for pixel, and `test.sh` runs the page with the
flag against `frames/dialog-open.png`. On the Sky page the same flag means no stagger and no wait (the cards start on
their boxes) and no rubber band (the wheel is clamped hard); its hovers are instant too, because a fade is a retarget and
a retarget under reduced motion lands at once — the sky test checks all three against the settled frames.

Not here: a transform on a *non-float* element's own siblings (a group is a whole-subtree opacity, a scale, a rotation
and a visual offset — one scene; a rotation is there, and a *gradient or clip inside* a rotated group is drawn with it and
stippled on its quad, the clip cutting the dither by its own quad too), a group deeper than four levels or a fifth
open at
once, a group whose subtree is cut in two by a *second*
backdrop's cut in the same frame (one cut a frame), **a text without an id** (a text's colour moves through the channel
only when it is named: an anonymous text is its style's literal, which is the ceiling of the fix, and nothing else of a
text's 10 floats moves), touch hardware (the drag is the window's mouse; a phone's touch events are the host's
next step), a second gradient on one element (a card cross-fades two by fading one over its solid fill), and the terminal,
browser and board targets (they have no Solid page, no wheel and no value channel).

## Idle: a frame's hash, and a draw only when it changes

Rune's rule for the shell: a static page ticks at zero, and a discrete input draws at once. The host can tell because
`ui_end` hashes the frame it has just laid out. `uint64_t ui_hash()` is FNV-1a over what a draw reads — every command's
type, element id, box, colours, corner radii and border widths, a text's bytes with its colour, font id, size, spacing
and line height, an image's pointer, a clip's axes, a custom's pointer — and over the renderer's tables beside the
commands: a shadow's offset, blur and colour, a backdrop's blur, a gradient's angle, stops and alpha, a group's alpha,
scale, translate and rotation (a group at alpha 255, scale 1, no offset and no rotation is skipped, because it draws
what it would have drawn
without one). Padding, `userData` and `zIndex` are not hashed: they do not reach the pixels. A settled frame hashes the
same value frame after frame; `ui_draws()` and `ui_presents()` count the calls, for a test.

`solid/main.ts` takes the shape Rune asks for: poll (`ui_window_poll`), then keys, typed text, the pointer and the
wheel; **declare and lay out every iteration** (a page's tick reads and writes values there, so a timer or a track
animates); hash; and draw and present only when the hash changed or the iteration carried a *discrete* input — a key,
typed text, a press or release, a wheel notch. A pointer move is not discrete: it draws through the hash, so a move that
starts a hover draws and a move inside a hover that has settled draws nothing. Nothing drawn means `await Bun.sleep(16)`
at the end of the iteration; a drawn frame does not sleep, and an input's frame is never behind one (the poll is the
first thing an iteration does). The decision is `createDrawer(frame, stats)` in `solid/src/frame.ts`: it runs
`frame(px, py, down, dt, render = false)` and then `ui.draw()` only when the hash changed or its `discrete` argument is
true, returning whether it drew; the draw is its own, so it writes the time into the frame's fourth phase (`stats`, the
view's own array) and a dev panel has a raster to show. The headless path uses the same drawer for every `--keys`/`--wheel`/`--settle`/`--move`
frame, so the stored frames go through the skipping loop and come out **byte-identical** (a skipped frame holds exactly
the pixels the previous draw left). `--idle N` runs N more frames with nothing in and prints
`idle: draws 0 of 60 in 1.2 ms (0.02 ms a frame: poll, declare, lay out, hash)`; `--idle-keys K` presses Tab every K of
them, and each key draws its own frame (`--idle 600 --idle-keys 10` is 60 draws of 600).

Measured (macOS, a 360x760 window at pixel density 2, 2026-10-25):

- headless, `--idle 600`: **0 draws**; Sky 21 ms (0.04 ms a frame) and Sensors 11 ms (0.02 ms a frame) for the tick
  that still declares, lays out and hashes.
- the window, Sensors at rest, `--frames 600`: **1 draw, 1 present**, 599 idle iterations of 17.7 ms each — the 16 ms
  sleep is most of it, the tick is the rest.
- the same 600 frames with the draw forced (an instrumented run): **600 draws, 600 presents, 5.00 s**, 8.29 ms a drawn
  frame, of which `ui_draw` is 0.30 ms (`--bench 1000`) and `ui_window_present` **6.43 ms** — the compositor's wait is
  measurable in the loop and it is the bulk of a present. So an idle frame skips ~6.7 ms of draw and present work, and
  the loop's own cost at rest is 0.04 ms a frame.
- the bench's phases are unchanged: events+flush 0.001, declare 0.004, layout 0.013, draw 0.30 ms (Sensors, 1000
  frames).

Not here: a **blocked** poll (`SDL_WaitEventTimeout`) instead of the 16 ms sleep, so the loop would wake only for an
event and hand back the tick's latency (the sleep bounds the input latency at ≤16 ms, with the frame drawn at once on
wake); the board's equivalent (its 22 ms frame at rest is where this would pay most, but the board has no hash and no
loop yet); dirty rects (a changed frame draws all of it — a hover fade re-renders the page, where a wrapped-frame diff
could redraw only the boxes that moved); a window-expose present (SDL asks for a redraw when the window is uncovered,
and an idle loop has none in hand, so the next input redraws it); and the terminal and browser targets, which have no
hash loop of their own.

### A dev panel: the tree, the bounds, the phases

Rune's item 7, first half: `bun solid/main.ts dev` is the Widgets page with a panel beside it (`solid/app/Dev.tsx`,
660x760, `solid/README.md` has the details). The page on the left is the `Widgets` component itself in a 360px column, so
its keys, focus and mouse are the `widgets` page's; the panel is 300px on the right, in the same Clay frame, in three
sections: the page's **accessibility tree** as indented rows (`role "name" [states] x,y w×h`, from `a11y.ts`'s
`snapshot` of the page's own subtree, bounds from `ui.bounds`), the **hovered box** (the innermost box under the pointer
that has an id and a role — `ui.over` on the way down — with its name from the tree and its `ui.bounds`; `nothing` over
the page's background), and the **frame's phases** (`View.stats`: events+flush, declare, layout, draw), the mean and max
of the last 30 frames, and `ui.draws()`/`ui.presents()`.

The panel reads all three every frame and prints them when they change. That is what makes the page useful for this
chapter: it is part of the frame, so a phase line reprinted every frame changes the hash every frame and the page could
never rest — the counters in the panel are there to show that it does. A change prints at once and the frame's own
numbers on the next reading (the host pushes them after the tick that reads them), so what is on screen is the last
frame that changed the page. Two runs of the same frame are therefore 13,661 pixels apart of 501,600, which is why the
four stored frames (`solid/frames/dev*.png`) are not compared.

Cost (Apple M2, one thread, `--bench 200`, five runs each, medians; the machine was busy with other work):

- the reading — Solid's `flush()`, `snapshot` (28 nodes) and the hover walk over ~95 boxes with `ui.over` — **0.09 ms** a
  frame: events+flush 0.02 without it, 0.11 with.
- the panel's 28 rows: **+0.02 ms** declare, **+0.008 ms** layout.
- its draw: **+5.4 ms** on a frame that redraws the panel (2.0 → 7.4 ms at 660x760) — ThorVG shapes every text command
  each frame and the panel is 34 lines of it, ~3 µs a glyph. `createDrawer(frame, stats)` now writes the time `ui.draw()`
  took into the frame's fourth phase, so the panel's draw line is the raster the loop did.
- at rest, `--idle 200`: **0 draws**, 0.20 ms a frame against the Widgets page's 0.06.

The page's own first-mount entry is off (the Widgets page is given no motion hook): the entry draws ~21 frames over a
page that does not change, and this page is about the frames after it. `solid/dev.test.ts` holds the panel's content
(the 28 rows, the ring after Tab, the hovered box, the four phases against the frame that changed the page, the counters,
0 draws at rest) and lists three mutations with their failure messages. Not there yet: **`tune!`-style live values** (a
control in the panel that writes a style field through the value channel while the page runs) — item 7's second half,
still later — and picking an element by clicking it into the tree.

## Text: the oracles, and why there is no weight correction

Rune's item: their text looked thin next to the platform's, so they built an oracle (CoreText drawing the same strings)
and two numbers per line — the **ink weight** and the **SSIM** — and fixed the drift by emboldening by ~0.1 pt. Same
method here, other verdict: ThorVG's text on macOS already weighs what CoreText weighs, at 1x and at 2x, so a correction
would be a regression. And the one rasteriser that is far from ours is Chrome's Canvas2D, the *web* target's: it is a
third heavier, which is its gamma, not a glyph we can fix here. The instruments are in the tree, because that is what
makes the verdicts checkable and re-checkable.

`solid/app/Sheet.tsx` is the sheet: twelve lines of the app's strings and eight sizes (11 to 32 px) in Roboto, one page,
nothing that moves. Two references draw the same lines at the same places, from one spec:

- `solid/text-oracle.swift` — CoreText, the platform's own rasteriser, font smoothing off (it is a display gamma with no
  counterpart in ThorVG), antialiasing and subpixel positioning on — into `frames/text-oracle.png`, and at the window's
  pixel density into `frames/text-oracle-2x.png`;
- `solid/text-canvas.mjs` — Chrome's Canvas2D through Playwright, the browser target's rasteriser, into
  `frames/text-canvas.png`.

`solid/src/textmetric.ts` is the metric: a crop's **coverage** per pixel (its luminance between the page's and the
text's), a line's **ink** (the coverage summed, in pixels of the text's colour), the best whole-pixel **shift**, and the
standard **SSIM** (11x11 Gaussian, sigma 1.5) over the windows that carry ink — over the whole crop it would score every
pair 1.0 on empty paper. `solid/text.test.ts` renders the sheet in-process at each reference's density and checks every
line of all three: no shift, an ink weight in that reference's band, an SSIM floor, an extent within a pixel or two. It
needs neither Swift nor a browser, so it runs in the suite. `bun solid/text-oracle.ts` prints the numbers,
`--density 2` the Retina pass, `--canvas` the Canvas2D reference, `--update` re-stores the frames, `--weight N` measures
the renderer's dial and `--sweep` a table of them.

Measured (macOS, Roboto-Regular.ttf, 1x, 2026-10-28; ink in pixels of the text's colour):

| line                    | size | ThorVG | CoreText | weight | SSIM  |
| ----------------------- | ---- | ------ | -------- | ------ | ----- |
| Sensors                 | 32   | 792    | 783      | 1.012  | 0.998 |
| Network & Sharing       | 24   | 1045   | 1039     | 1.005  | 0.998 |
| +1.16  -0.72  +10.04    | 20   | 543    | 541      | 1.003  | 0.999 |
| Wm ¼ ⅓ — “quotes”       | 20   | 559    | 583      | 0.958  | 0.459 |
| 18.3 °C                 | 17   | 157    | 158      | 0.995  | 0.996 |
| Room A1                 | 16   | 203    | 203      | 1.001  | 0.997 |
| The quick brown fox     | 16   | 453    | 450      | 1.005  | 0.983 |
| switch to g             | 14   | 191    | 189      | 1.008  | 0.991 |
| accel m/s²              | 14   | 177    | 174      | 1.019  | 0.997 |
| 18.3 °C                 | 13   | 92     | 89       | 1.027  | 0.993 |
| gjpqy 0123456789        | 12   | 276    | 269      | 1.025  | 0.994 |
| settings                | 11   | 100    | 96       | 1.044  | 0.993 |

The mean weight is **1.008** (1.013 without the fallback line): not thin anywhere, and up to 4.4 % *fat* at 11 px, which
is what a rasteriser without hinting does to a stem that falls between pixels — it spreads it. Every line is where
CoreText puts it (shift 0,0) and measures within a pixel of its extent (114/113 at 32 px is the widest gap), so the
advance sum is not drifting either. The one real difference is the **fallback font**: ThorVG sets one face, so the ⅓ of
"Wm ¼ ⅓ — “quotes”" is the empty box and CoreText falls back for it — weight 0.958, SSIM 0.459. The sheet keeps the line
because a weight alone would call it thin and the SSIM is what sees a wrong glyph, and the test asserts that low SSIM
rather than hiding it.

**At the window's density.** A Retina window draws the same layout at 2x (`SDL_GetWindowPixelDensity` hands the host
`ui_density`), and ThorVG scales its root scene, so the question is whether the glyphs are rasterised at 2x or a 1x
raster is enlarged. The numbers say rasterised: ink is 4.006x the 1x line (3,173 against 792 for "Sensors") and the
weight **1.005** on average, every line 1.001..1.018 — *closer* to CoreText than at 1x, and SSIM 0.967..0.998. The
stored `frames/text-sheet-2x.png` is the frame, `frames/text-oracle-2x.png` the reference, and the suite checks it at
2x with the same bands.

**Against the web target's rasteriser.** Chrome's Canvas2D draws the same twelve lines at **0.729** of our ink
(0.699..0.781 a line, SSIM 0.843..0.916, every line at shift 0,0 and the same extent within a pixel) — the browser is a
third *heavier* than the desktop, and the harness and the browser target's own frame agree (the same title 1,014 against
the stored `browser/expected.png`'s 907 in a tighter crop, "+1.16 -0.72 +10.04" 723 against 715). So the gap is Chrome's
canvas gamma, not our renderer, and matching it would mean thickening the desktop's text to a rasteriser that is wrong
next to its own platform. It is stored and pinned in the test (weight band 0.68..0.80) instead: a change in either
renderer is a failing line, not a surprise.

The dial exists and sits at 0: `ui_text_weight(px)` (`ui.textWeight`) makes the renderer draw every line twice, half the
weight either side of Clay's place, growing the glyph by that much and keeping its centre. The sweep is why 0 is the
value: a weight of 0.25 already yields **1.309** mean weight and SSIM 0.883, 0.5 → 1.408 / 0.840, 1.0 → 1.635 / 0.684.
Rune's 0.1 pt is 0.13 px at 96 dpi, in the same direction and the same order — and against CoreText here it is wrong.

Not covered: any font but Roboto-Regular (the stack vendors one face; a second face is a font feature, not a metric),
and the terminal and board targets, whose text is a cell grid and termbox2's — a different question from a rasteriser's
ink. And not measured: why Chrome's canvas is that heavy (gamma, contrast enhancement or subpixel coverage — its DOM text
was not compared with its canvas text), and the light theme's dark-on-light text, where a display gamma differs.

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
bun solid/main.ts sky --settle 60 --idle 600                  # the page at rest: 0 draws of 600, and the ms the tick takes
bun solid/main.ts sky --settle 60 --idle 600 --idle-keys 10   # ... and 60 keys, each drawing its own frame (60 draws)
bun solid/main.ts sky --touch 0.5 0.5 --png out.png           # headless: a finger's tap at the window's middle (ui_touch_map: 0.5,0.5 -> 180,380)
bun solid/text-oracle.ts                                      # the text sheet's ink weight and SSIM against CoreText, line by line
bun solid/text-oracle.ts --density 2                          # ... at the window's pixel density; --canvas against Chrome's Canvas2D
bun solid/text-oracle.ts --update                             # re-store the sheet and its references (needs swiftc; --canvas playwright)
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

## A scene as a file

A scene is a page's input as data: `solid/scenes/*.json` holds a page, the window's size, the theme, an optional
reduced-motion flag and a list of typed steps with times. `--keys`, `--click` and `--wheel` each store a state; a scene
stores the sequence that made it, so a bug report is a file, and "the same commands" can be checked as a sequence rather
than as one state.

```sh
bun solid/main.ts --scene solid/scenes/list-select.json --png out.png                            # replay it, write the last frame
bun solid/main.ts --scene solid/scenes/list-select.json --expect solid/frames/list-select.png   # ... or compare it
bun solid/scene.test.ts                                    # four scenes in-process: steps, frames, ending state, mutations
```

The file:

| field | what it is |
| --- | --- |
| `name` | the stored frame it reproduces (`solid/frames/<name>.png`) and the name a failure prints |
| `page` | `sensors`, `widgets`, `dialog`, `form`, `list` or `sky`: the page `bun solid/main.ts <page>` runs |
| `size` | `[width, height]` in pixels; it must be the page's own (`list` is 360x400, `sky` 360x760) |
| `theme` | `"dark"` or `"light"` (`THEME` is ignored: the file is the record) |
| `reducedMotion` | `true`, or left out: no travel and no waiting, as `--reduced-motion` |
| `steps` | the events, in order, each `{ "t", "kind", ... }` |

A step's `t` is seconds from the start, rounded to the nearest 1/60s frame — a frame is what carries input — and a step
whose frame is before the previous step's is a parse error. The kinds:

| `kind` | fields | what it does |
| --- | --- | --- |
| `key` | `name`, `down` | `Input.down`/`up`: the names the parts and the focus manager take (`Tab`, `Shift+Tab`, `ArrowDown`, `Enter`, `Space`); a press and its release at one `t` are one tap |
| `text` | `text` | typed characters (`Input.textInput`), a composed run as SDL's TEXT_INPUT delivers it, not a key |
| `pointer` | `x`, `y`, `down`, `touch`? | the pointer in the layout's pixels, `down` the button, `touch` a finger's (one pointer either way) |
| `wheel` | `dx`, `dy` | a wheel delta in SDL's units, the ones `ui.wheel` takes: `dy: -1` is one notch down, `dx: -1` one notch right |
| `settle` | `frames` | that many frames at rest while a page's motion runs out (`--settle`) |
| `frame` | — | one frame at 1/60s with nothing in it: a boundary stated rather than left to the gap between two steps |

`solid/src/scene.ts` parses and validates the file and replays it into the loop `main.ts` runs headless: one frame a
step, declared and laid out every frame and drawn when the hash changed or the step was a discrete input (a key, typed
text, a wheel, a press or a release), through the page's own `render`/`createFrame`/`createDrawer` — the replayer adds the
timeline, not a second frame loop. A pointer keeps its last place between steps and starts off the window at -1,-1; the
touch and reduced-motion flags are the file's, the theme is its starting one. A run prints its page, size, theme, steps
and frames; `--png` writes the last frame, `--expect` compares it with `main.ts`'s own message and exit code. A file that
is not a scene fails with the step's index and why (`scenes/x.json: step 1: out of order: t 0.1 is frame 6, after a step
at t 0.5 (frame 30)`), and a size that is not the page's fails before a frame runs.

Four scenes are the record of four stored frames, byte for byte (`solid/scene.test.ts` replays each in-process):

| scene | steps | frames | the frame | the ending state |
| --- | --- | --- | --- | --- |
| `widgets-switch-on` | Tab, Tab, Space, 30 frames in | 33 | `frames/widgets-switch-on.png` | focus `wifi`: the switch on |
| `list-select` | Tab, ArrowDown ×12, settle 90 | 133 | `frames/list-select.png` | "Room A3 — 13 of 30", the offset -148 |
| `sky-scrolled` | a click on the Science tab, 8 notches over the feed, settle 90 | 103 | `frames/sky-scrolled.png` | the feed 78px down, the tab focused |
| `dialog-menu` | Tab, Tab, Enter, settle 30 | 34 | `frames/dialog-menu.png` | focus `zoom-item-0`: the menu open |

The Sky's scene needs `settle 90`, not 60: the scrollbar's thumb holds 600ms after the track stops and fades over
0.15s, so a frame 60 frames after the last notch still has it on (2,376 pixels differ); at 90 it is the stored frame. The
test's mutations are the other half of the proof: the Widgets scene with Space where its first Tab was — the switch never
turns on — is **964 pixels and 2,892 bytes** off its frame, and the List's scene without its settle compares the frame
the twelfth ArrowDown left, 43 frames in: the selection is 13 but the reveal is at -33.97, not -148, and the frame is
**15,445 pixels and 46,544 bytes** off.

What a scene cannot say yet: a drag's velocity (a pointer step is a position; a fling is what the page makes of two of
them, and a stored frame is one instant of it, not a recorded speed), a window resize (the size is the scene's, one
window for the run), a font or a device change (the vendored Roboto, one pixel density, the desktop raster), a page's
own data options (`--count`, `--posts`, `--wide`: a scene has its page at its own size), and a theme change mid-run (`t`
is a key and works, but `theme` is the starting one). And the scenes are written by hand: nothing records a live window
into one yet.


## The frame as data: command-stream goldens

A stored frame answers "did the pixels change" and not "what changed". `ui_dump_json(path)` (solid/native/ui.c) writes
the last frame as JSON instead, and `bun solid/dump.ts <page>` renders a page exactly as `main.ts`'s headless path does
for its stored frame — the same size, input and motion hook, run to rest, no raster — and stores it in `solid/goldens/`:

```sh
bun solid/dump.ts sensors                  # the JSON to stdout, the counts to stderr
bun solid/dump.ts sky --out /tmp/sky.json  # ... or to a file
bun solid/dump.ts widgets --update         # re-store solid/goldens/widgets.json
bun solid/dump.test.ts                     # every golden, field by field (solid/test.sh runs it)
```

The JSON carries what a draw reads and nothing else, so a diff of it is a diff of the frame:

- the layout's `size` and the raster's `scale`;
- `commands`, one a line, each with its `type`, Clay's `id` (a 32-bit hash, printed as a number) and the page's own
  `element` id string behind it when the element has one (null for an anonymous one), its `box` and `z`, and per type:
  a text's bytes, colour, font, size, letter spacing, line height, alignment and wrap; a rectangle's colour and corner
  radii; a border's colour, radii and five widths; an image's path; a clip's axes; a custom's pointer;
- `effects`, the renderer's side tables beside the commands — the ones `hash_frame` folds in but no command carries: each
  `shadow`'s offset, blur and colour, each `backdrop`'s blur, each `gradient`'s kind, angle, alpha and stops, each
  `group`'s alpha, scale, translate and rotation (a neutral group, which makes no scene, is left out as the hash leaves
  it out), and the `textWeight`;
- `a11y`, the accessibility snapshot of the same tree (`solid/a11y.ts`): role, name, value, states, hasPopup, level and
  bounds per node.

`solid/dump.test.ts` compares five goldens and prints the counts: Sensors 10 commands and 0 a11y nodes (the page has no
roles), Widgets 59 and 28, the List's top 36 and 0, the Sky's Discover settled 35 and 4, and the Dialog's menu two frames
into its slide 22 and 7 — the one frame with every table in play (a group at alpha 233, scale 0.971 and -1.48°, the
menu's shadow at blur 3.45, its backdrop at 10, and the float it hangs off its trigger by; the Sky's three cards carry
the gradients). A miss names the command and the field, not a pixel count:

```
FAIL sensors: command 2 (text "accel m/s²") colour 150/155/170/255 -> 160/165/180/255
FAIL sensors: command 2 (text "accel m/s²") id 13290005 -> 836677627 (that is command 3 in the golden: the order moved)
```

The differ joins a colour or a box into one value, calls a field by the name a page reads it by (`colour`), annotates a
command with its type and its text, and says where an id that moved is in the golden — two commands swapped is a diff,
not a mystery. Numbers are written as they are (`%.9g`, a float32's exact round trip) and object keys are sorted where
their order carries no meaning, so a golden is stable: two processes write the same bytes. The one field that is not:
a custom command's `pointer`, an address. The frame's hash is written by `ui_dump_json` but left out of a golden, because
with an image in the frame it hashes the image's pointer, which is a process's own address. Re-store after a deliberate
change with `--update`, and read the diff first: the golden is the frame, not an opinion.

What it cannot see: the pixels — anti-aliasing, a shadow's raster (the geometry is data, the blur is not), a backdrop's
blurred pixels, a gradient's dither, a glyph's shaping (ThorVG applies no kerning, and the dump has the declared size and
the finished box, not the advances), and the raster's density beyond the `scale` it records. Nor anything the frame does
not declare: a part's handlers and key timing (`widgets.test.ts`, `list.test.ts`), the focus trap (`dialog.test.ts`), a
hover that has not moved the tree, or what a page would draw next. The per-target half is unfinished on purpose: the C
pages (`examples/sensors/page.c`), the browser's `browser/dump-commands.c` and the board still compare commands with
their own tables, so only the desktop's Solid pages have goldens; one dump for every target is the next step, together
with the scene files of item 4 and the board's own loop.
