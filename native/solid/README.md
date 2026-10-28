# Solid 2 on the desktop

Step 4 of [the map](../docs/map.md): a Solid 2 universal renderer that keeps a JS tree, and each frame declares that
tree to Clay through `bun:ffi`. Clay is immediate mode, so Solid only owns the tree and the state; layout and the
ThorVG software raster are C.

```
solid-js 2.0.0-rc.13, @solidjs/universal 2.0.0-rc.13 (createRenderer), @solidjs/compiler 2.0.0-rc.13
(native Oxc: generate "universal", moduleName src/renderer.ts), Bun 1.3.1, bun:ffi
```

## Run

```sh
sh solid/native/build.sh                         # build/solid/libui.dylib (brew sdl3 sdl3_image thorvg)
bun solid/main.ts                                # the window: the mouse is the pointer, `t` flips the theme
bun solid/main.ts widgets                        # the Widgets page (360x760): Tab, Shift+Tab, arrows, Space, Enter, and on the
                                                 # toolbar's Size item Down/Up/Enter open the size menu; the mouse (below)
bun solid/main.ts dialog                         # the Dialog page (360x480): Enter opens the settings dialog, Tab cycles it,
                                                 # Escape closes it; Tab to the menu, Enter/Down open it, arrows pick
bun solid/main.ts form                           # the Text field page (360x450): Tab to the field and type, Shift+arrows
                                                 # select, Enter submits, Escape blurs, Cmd/Ctrl+C/X/V copy, cut, paste
bun solid/main.ts list                           # the List page (360x400): the wheel scrolls Clay's own container under
                                                 # the pointer, Tab then Up/Down, PageUp/PageDown, Home/End move the
                                                 # selection and scroll it into view
bun solid/main.ts sky                            # the Sky page (360x760): csssky's feed, the tabs switch the three
                                                 # feeds, Tab reaches the feed and Up/Down, PageUp/PageDown, Home/End
                                                 # scroll it (the wheel scrolls it under the pointer)
bun solid/main.ts widgets --warm 30 --keys Tab,Tab,Space --expect solid/frames/widgets-switch-on.png   # scripted keys, then the frame
bun solid/main.ts dialog --keys Tab,Enter --expect solid/frames/dialog-open.png             # keyboard, headless
bun solid/main.ts form --keys Tab,Tab,text:Ada --expect solid/frames/field-typed.png        # typed text, not a key
bun solid/main.ts list --warm 30 --wheel 32 --expect solid/frames/list-wheel.png   # headless: the pointer onto the list, 32 notches down
bun solid/main.ts list --settle 3 --png out.png       # headless: four frames into the page's entry (frames/list-entry.png)
bun solid/main.ts sky --warm 40 --drag-feed 180,300,-2,-2,-2,-2,-2 --settle 60 --png out.png   # headless: a drag on the feed, then its fling
bun solid/main.ts sky --click 180 32 --wheel 8 --wheel-over sky-feed --png out.png   # headless: Science, its feed 8 notches down
bun solid/main.ts sky --settle 40 --move 180 300 3 --png out.png          # headless: a hover, three frames into its fade, at a page at rest
bun solid/main.ts sky --warm 40 --wheel 4 --wheel-over sky-status --png out.png   # headless: rest first, then four notches past the end (the band)
bun solid/main.ts widgets --drag 0.25 0.75 --png out.png                 # headless: press the slider's rail at a quarter, hold, move to three quarters
bun solid/main.ts dialog --reduced-motion --keys Tab,Enter --png out.png # no travel, no waiting (also REDUCED_MOTION=1)
bun solid/main.ts --warm 30 --expect examples/sensors/expected-thorvg.png          # one frame against a stored PNG
bun solid/main.ts --warm 30 --click 180 250 --expect examples/sensors/expected-thorvg-g.png   # host.c's scripted click
THEME=light bun solid/main.ts --warm 30 --expect examples/sensors/expected-thorvg-light.png
bun solid/main.ts sheet --density 2 --png out.png   # the text sheet at the window's pixel density (880x1128)
bun solid/text-oracle.ts                          # the sheet's ink weight and SSIM against CoreText; --density 2, --canvas, --update
bun solid/main.ts --png out.png --bench 1000     # ms a frame by phase
bun solid/main.ts sky --settle 60 --idle 600     # the page at rest: 0 draws of 600, and the ms the tick takes
sh solid/test.sh                                 # all of it; `bun run test` calls it last
bun solid/metamorphic.test.ts                     # the relations with no stored frame: a wrapper, a move, wrap, twice
```

## Layout

```
native/ui.c        Clay + desktop/clay_renderer_thorvg.c + SDL3 window behind flat C functions (libui.dylib)
src/renderer.ts    createRenderer: El (tag, props, children) and Txt nodes; <box id style onClick>, <text style>
src/pack.ts        a ClayShape + theme + state -> Float32Array, once per variant
src/motion.ts      the motion model: tracks (spatial/effect), decay, rubber, presence, reduced motion, the value channel
src/entry.ts       the page's frame hook (Motion: onWheel, onPointer, tick) and its first-mount entry
src/frame.ts       one frame: pointer in, events, flush(), the tree declared, layout, draw
src/ffi.ts         bun:ffi bindings
plugin.ts          Bun plugin: JSX through @solidjs/compiler, `styles.ts` and a page's own styles through cssints, solid-js client build
compile-styles.ts  Node child of the plugin: Vite + cssints, prints a style module as JS
compile.tsx.ts     Node child of a `.tsx` whose styles live in it: Solid's JSX first, then cssints on the JS
stub-bun.mjs       `bun:ffi` for that child: cssints runs the page to read its tokens, and the dylib has no meaning in Node
src/input.ts       SDL keys to names, and where a key goes: an open modal, the focus manager, the focused part, the page
a11y.ts            the accessibility tree of a rendered page: snapshot(root) -> { role, name, states, bounds, children }, and a11y(part), the props a page spreads to make a box the part's box
app/Sensors.tsx    the Sensors page; styles are examples/sensors/styles.ts, the same file the C page's styles.h comes from
app/Widgets.tsx    the Widgets page: headless button, switch, checkboxes, disclosure, radio, tabs, slider, toolbar, settings tree, and its styles, in the same file
app/Dialog.tsx     the Dialog page: a modal dialog on a backdrop (both Clay root floats) and a menu floated off its trigger
app/Field.tsx      the Text field page: the headless text field, its caret and selection drawn as runs, and its styles
app/List.tsx       the List page: thirty rows in a viewport Clay clips and scrolls, the wheel and the keys, and its styles
app/Sky.tsx        the Sky page: csssky's feed in a phone-sized window, the tablist switching it, drawn avatars, wrapped bodies
app/Sheet.tsx      the text sheet: the app's strings at eight sizes, for the CoreText oracle and the ink-weight metric
frames/            the pages' stored frames (the Sensors page's are in examples/sensors), and the sheet at 1x and 2x with
                   its two references: text-oracle.png and text-oracle-2x.png (CoreText), text-canvas.png (Canvas2D)
main.ts            the host (window and headless)
test.ts, widgets.test.ts, dialog.test.ts, field.test.ts, list.test.ts, sky.test.ts, text.test.ts   the checks the stored frames cannot make
test.ts, widgets.test.ts, dialog.test.ts, field.test.ts, a11y.test.ts   the checks the stored frames cannot make
```

**Styles live where the markup does.** A page may declare its tokens and styles in its own `.tsx`
(`import * as css from "cssints/clay" with { type: "cssints" }`) — `app/Widgets.tsx` does. The child spawns only when the
source mentions cssints, costs about 0.9 s once per page at load (the same as a `styles.ts` module: it is Node and
cssints' evaluation, not the extra stage), and reports a cssints error at the line the user wrote. A styles module
still has its place when the C side generates from the same file (`examples/sensors/styles.ts` feeds `styles.h`).
`app/inline-demo`/`InlineDemo.tsx` and `InlineDemoSplit.tsx` are the same page both ways, and `inline.test.ts` holds
their frames to each other.

A style is the `ClayShape` literal of `cssints/clay`. A theme (`THEME=light`, `t`) and a state are picked at run time
by `resolve()` in `pack.ts`, the merge `header()` does for C (`units_active_light`). `:hover`/`:active` apply to a box
with an `id`: Clay tells whether the pointer is over it. `onClick` runs on release over the box that was pressed;
`onPress` when the button goes down over it. `:focus` applies while the box's `focused` prop is true. `createFrame`'s `View.onPointer` gets the pointer once per frame, before the tree is declared: the widgets page uses it to drag the slider.

## The FFI (flat, no struct crosses it)

| Function | |
| --- | --- |
| `ui_init(w, h)`, `ui_font(path)` | Clay and a ThorVG canvas; a font by file path, its id is the order of calls. 0 / id on success |
| `ui_init_gpu(w, h)` | the same on ThorVG's WebGPU canvas (`--raster thorvg-gpu`); only a `libui.dylib` from `desktop/build-thorvg-gpu.sh solid` |
| `ui_begin(px, py, down, dt)` | pointer for this frame, then Clay's scroll containers move by the wheel this frame took (`Clay_UpdateScrollContainers(false, delta, dt)`, before the layout), then `Clay_BeginLayout` |
| `ui_open(id, len, f32[45])` | open an element; `id` NULL for none; the style as below |
| `ui_value(id, len, field, f32)` | an override of one number of that element's style for this frame: a packed field 0..44 (the table below), 45 its shadow's blur, 46/47 its whole subtree's alpha and scale (a ThorVG scene of its own: `FIELDS.ALPHA`, `FIELDS.SCALE`, the section below), 48/49 its subtree's translate, 50 the opacity of its background image, 51..54 the colour of the **text** with that id (a text's own floats, not its box's: `FIELDS.TEXT_COLOR`) and 55 its subtree's rotation in degrees (`FIELDS.ROTATE`). `ui_open` declares from a copy of the 45 floats with the frame's overrides applied, `ui_text` from a copy of its 10; the table is cleared in `ui_begin`, 64 overrides a frame (`src/pack.ts`'s `FIELDS` names the ones a page uses; `src/motion.ts`'s `channel(write)` writes one element's fields in one call) |
| `ui_image(bytes, len)` | the image of the element the next `ui_open` declares (a `css.image` style): the path as UTF-8, no terminator. Interned once per distinct path, so the renderer's picture cache (keyed by that pointer) sees one address every frame |
| `ui_shadow(x, y, blur, r, g, b, a)` | the shadow of the element the next `ui_open` declares (a `css.shadow` style): Clay has no shadow field, so it waits here and the element id's hash carries it to the renderer's table (one a frame, 32 at most, one draw an element) |
| `ui_text(id, id_len, bytes, len, f32[10])` | a text element, with an id or NULL: with one, the text's colour can be moved through `ui_value` (fields 51..54, applied to a copy of its 10 floats). The bytes are copied for the frame |
| `ui_close()` | close the element |
| `ui_pointer_over(id, len)` | Clay's `Clay_PointerOver`, on the last frame's layout |
| `ui_end(dt)`, `ui_draw()` | `Clay_EndLayout` (returns the command count), then the frame's hash; ThorVG draws the commands into the buffer |
| `ui_hash()`, `ui_draws()`, `ui_presents()` | the last frame's 64-bit FNV-1a over its commands and renderer effects, and the counts of those calls: the same hash twice draws the same pixels, so the host skips both |
| `ui_save_png(path)`, `ui_diff_png(ref, actual)`, `ui_pixel(x, y)` | the frame out; pixels that differ from a PNG; one pixel |
| `ui_pixels_copy(out, cap)`, `ui_load_png(path)`, `ui_png_size(out)`, `ui_png_copy(out, cap)` | the whole frame as RGBA32 (the text metric reads a crop of it every pixel at once); a PNG of the page's size, loaded once, and its size and bytes |
| `ui_text_weight(px)` | how much thicker than ThorVG's own raster a line is drawn: a second copy of it, half the weight either side of Clay's place (0, the default: one copy) |
| `ui_density(scale)` | the raster's pixel density: 2 draws the same layout into twice the pixels, as the window on a Retina screen does (`--density 2` headless) |
| `ui_window_open(title)`, `ui_window_poll(f32[6])`, `ui_window_present()` | SDL3 window (Metal); poll fills pointer x, y, button, quit, the last key's character, and whether the last pointer event was a finger's (1) or the mouse's (0). A finger's `SDL_EVENT_FINGER_DOWN/MOTION/UP` goes through `ui_touch_map` (normalised 0..1 of the window → the layout's pixels) into the same x, y and button, and the first finger owns the pointer until it lifts |
| `ui_touch_map(fx, fy, f32[2])` | a finger's normalised position in the layout's pixels: the one mapping the poll and the headless `--touch` share |
| `ui_key_pop(i32[4])` | the oldest key event the polls queued: down (1) or up (0), SDL keycode, `SDL_Keymod`, repeat. 0 when none; 64 are kept |
| `ui_text_pop(bytes)` | the oldest typed run the polls queued: UTF-8, a composed character, never a keycode. Its byte length, 0 when none; 64 runs of up to 128 bytes are kept, a longer run cut at a character boundary |
| `ui_text_input(on)` | `SDL_StartTextInput` / `SDL_StopTextInput`: only while it runs does the window poll `SDL_EVENT_TEXT_INPUT` (an IME needs it too). The host turns it on while the focused part is a text field (`Input.editing`) |
| `ui_clipboard_get(bytes)`, `ui_clipboard_set(text, len)` | `SDL_GetClipboardText` / `SDL_SetClipboardText`: UTF-8 in and out (the get writes NUL-terminated bytes and returns their count) |
| `ui_bounds(id, len, f32[4])` | x, y, width, height of an element in the last layout (tests click at the middle of a part). A scroll container's children are outside its box and their bounds are not clipped |
| `ui_wheel(dx, dy)` | adds a wheel delta for the next frame, in Clay's units and SDL's sign: positive is away from the user (the content moves down). `ui_window_poll` calls it for every `SDL_EVENT_MOUSE_WHEEL`, and a shift+vertical wheel is moved onto x there (`SDL_GetModState()`), so a mouse can scroll sideways as a browser's does; Clay moves the container the pointer is over by 10px a notch |
| `ui_scroll_offset(id, len, axis)` | the scroll offset of a clip element, in pixels along `axis` (0 y, 1 x; negative is scrolled down or right); 0 when there is none |
| `ui_scroll_to(id, len, axis, v)` | scrolls a clip element to `v` on `axis`, clamped to its content (the same range Clay clamps to); returns the offset it took |
| `ui_scroll_put(id, len, axis, v)` | puts a clip element's offset on `axis` where the page says, **with the content's clamp left out** — a rubber band past an end is past the content on purpose; returns the offset |
| `ui_errors()` | Clay errors so far |

Text is measured by ThorVG, as in `host.c`.

**Idle.** `ui_end` hashes the frame it has just laid out (`ui_hash`): every command's visible fields and the renderer's
tables beside them (a shadow, a backdrop, a gradient, a group; a neutral group is skipped). `main.ts` draws and presents
only when that hash changed or the iteration carried a discrete input (a key, typed text, a press or release, a wheel
notch); a pointer move draws through the hash alone, so a settled hover draws nothing. Nothing drawn means
`Bun.sleep(16)` at the end of the iteration; `createDrawer` (`src/frame.ts`) is that decision, and the headless flags
take it too. `--idle N` runs N frames with nothing in and prints the draws, `--idle-keys K` presses a Tab every K of
them. `native/README.md` ("Idle") has the fields and the numbers.

An image is the one part of a style that is not a float: `css.image` becomes `d.image.imageData`, a pointer, so
`frame.ts` calls `ui_image` with the path just before the element's `ui_open` (`pack.ts` keeps the path beside the
packed box in its variant). `ui.c` interns the path, because Clay's config is that pointer alone and
`Clay_ThorVG_Picture` caches a picture by it; ThorVG loads one file per path and stretches it into the element's box.
The packed style does not carry Clay's `aspectRatio`, so `fit: "contain"` is the C header's; `fill` (the default) is what
a Solid page gets. The SDL renderer path still reads `imageData` as an `SDL_Texture` and does not draw a path: the image
element is ThorVG-only, as on the C side.

A shadow is the second part of a style that is not a float, for the other reason: Clay 1.0's declaration has no shadow
field, and a shadow is an effect of the raster, not a box. `frame.ts` calls `ui_shadow` just before `ui_open`, and
`ui.c` files it under `Clay_ElementId.id` — the id the element's render commands carry — so the renderer draws it before
the element's first command (`clay_renderer_thorvg.c`: the command's box and radii, offset, filled and blurred, sigma
`blur / 2` in the scene's own units, quality 80). `pack.ts` keeps the `Shadow` object in its variant beside the image's
path; the element needs an `id`, or the shadow is dropped.

### `ui_open` fields (`pack.ts` `packBox`, `ui.c` `ui_open`)

| i | field | | i | field |
| --- | --- | --- | --- | --- |
| 0 1 2 | width: type, min or percent, max | | 14-17 | background r g b a |
| 3 4 5 | height: type, min or percent, max | | 18-21 | corner radius tl tr br bl |
| 6-9 | padding left right top bottom | | 22-25 | border width left right top bottom |
| 10 | child gap | | 26-29 | border colour r g b a |
| 11 12 | child alignment x (0 left, 1 centre, 2 right), y (0 top, 1 centre, 2 bottom) | | 30 31 | clip horizontal, vertical |
| 13 | direction (0 row, 1 column) | | | |

The floating fields (`css.float`, `packBox`'s `d.floating`; all zero means not a float):

| i | field | | i | field |
| --- | --- | --- | --- | --- |
| 32 | is a float | | 38 39 | offset x, y |
| 33 | attach to (0 none, 1 parent, 2 element with id, 3 root) | | 40 41 | expand width, height |
| 34 35 | the parent id's two 16-bit halves (a float32 cannot hold the 32-bit hash) | | 42 | z index |
| 36 37 | attach point of the float, of the parent (0 `left top` .. 8 `right bottom`) | | 43 | pointer: 0 capture, 1 passthrough |
| | | | 44 | clip: 0 none, 1 attached parent |

A float is a layout root of its own: Clay lays the page out as if it were not there and draws it above (ascending z), and
a capturing float stops `Clay_PointerOver` from seeing what is under it — which is how the dialog's backdrop swallows the
pointer. `root: true` attaches to the window (`Clay__RootContainer`), so `width`/`height` `stretch` is the whole window
(the backdrop) and `attach: { element: "center center", parent: "center center" }` centres the dialog, while
`parent: "<id>"` + `attach: { element: "left top", parent: "left bottom" }` hangs a menu off its trigger.

Sizing type: 0 fit, 1 grow, 2 percent, 3 fixed (Clay's order).

### The value channel: a field that moves

A variant is packed once and kept, so a page cannot change a style's number by rebuilding it. Instead its `View.tick`
runs before the tree is declared and calls `ui.value(id, field, value)`: `ui_open` copies that element's 45 floats,
applies the frame's overrides of its id and declares from the copy. It is the shadow's and the backdrop's kind of side
table — cleared in `ui_begin`, nothing cached — and a frame without overrides declares exactly the literal, which is why
the Dialog's settled frames stayed byte-identical. `field` is a packed field (0..44), or `FIELDS.SHADOW_BLUR` (45), which
is `ui_shadow`'s blur and not one of the floats, or the four **group** fields: `FIELDS.ALPHA` (46, 0..255),
`FIELDS.SCALE` (47, 1 = none) and `FIELDS.TRANSLATE_X`/`TRANSLATE_Y` (48/49, px), which are the element's whole subtree
as one ThorVG scene — its opacity, a scale about its box centre and a visual offset, none of which is a layout
(`ui_bounds` does not move). None of them goes into the floats. `FIELDS.GRADIENT_ALPHA` (50) is the opacity of the
element's own background image: 255 is the gradient alone, as an opaque one has always been drawn; below it the gradient
is composited over the box's solid fill, which is how two gradients cross-fade through the colours between them.

**`FIELDS.ROTATE` (55)** is the fifth number of that scene: degrees about the same box centre, composed with the scale
and the translate into one matrix — **scale, then rotate, then translate**, `x' = s·R·(x - c) + c + t`. ThorVG's matrix
is read as `x' = x·e11 + y·e12 + e13`, `y' = x·e21 + y·e22 + e23` (`tvg::operator*` in its `tvgMath.cpp`; the third row
is unused), so the linear part is `s·R(θ)` in `e11/e12/e21/e22` and the third column is `c + t - (s·R)·c`. A positive
angle turns clockwise on screen (y runs down), a page's tilt is its sign, and a rotation of exactly 0 takes the scale's
own matrix expression, not the rotation's arithmetic for 0°, so a page that never leans keeps the frames it had
(`c·(1 - s)` and `c - s·c` round differently; measured: 1-level shifts in three glyph pixels of the scaled panel).
The order is proved on a hand-built non-square box (`dialog.test.ts`): a 200x40 box at the root with `SCALE` 0.5,
`ROTATE` 90° and `TRANSLATE_X` 40 draws the rect x 130..150, y -30..70 — the long side stood up about the centre (100,
20) and the 40px after the rotation, unscaled (a translate taken before the transform would put it at x 110..130).

**A text's colour is the one field a box does not have**, so it is the table's other kind of target: `FIELDS.TEXT_COLOR`
(51..54, rgba) names a **text** element, and `ui_text` applies it to a copy of its own 10 floats — with the id of the
`<text id="...">` (`ui_text`'s first argument; a text with no id is anonymous and cannot be named, so its colour is its
style's literal and cannot be animated). A text's colour is not in its parent's box, which is why the group's opacity
fades a text but a colour transition needed this. Clay's text command carries the colour, so `ui_hash` sees it and the
frame draws.

Naming them is `pack.ts`'s `FIELDS`: `OFFSET_X` 38 and `OFFSET_Y` 39 of a float, `EXPAND_W`/`EXPAND_H` 40/41, `Z_INDEX`
42, `CAPTURE` 43 (a closing overlay sets it to 1, passthrough, so the page under it takes the press), `RADIUS` 18 (the
four corners), `BACKGROUND` 14 (rgba) and `BACKGROUND_ALPHA` 17 (the dim of a backdrop), `BORDER` 26 and `BORDER_ALPHA` 29
(a tab's 2px underline, and the alpha it fades by), `PADDING` 6, `GAP` 10, `WIDTH` 0, `HEIGHT` 3, `GRADIENT_ALPHA` 50,
`TEXT_COLOR` 51 (`TEXT_COLOR_ALPHA` 54) and `ROTATE` 55. The first group is what reads as motion; width, height, padding,
gap and the colours are legal but Clay lays the page out
from the declaration each frame, so a changing one re-lays-out the element's parent and its siblings — a layout change,
not a transform. The cost is a 180-byte copy per overridden element and one scan of the table per `ui_open` on a frame
that uses it.

### The element tree and the groups (`ui.c`, `clay_renderer_thorvg.c`)

A group is one element's subtree drawn into a scene of its own, which per-command alpha cannot do (a text's colour is not
in its parent's floats). `ui_open`/`ui_close` keep the frame's tree of `{id, parent}` nodes in declaration order and
`ui_text` adds a node for a text — a text is never open, but a group's subtree must reach through it — and every
declaration hands its node to Clay as `userData` (index + 1), so each command says which element it belongs to. Clay's
commands are in depth-first order, so a subtree's commands are contiguous: a group's range is the min and max command
index whose element is that node or a descendant. The renderer opens a scene at the first command of the range, gives it
`tvg_paint_set_opacity` and one matrix (scale, rotation, translate: above) at the last one, and adds it to the scene that
was current when it opened; the element's shadow is drawn inside it. A group at 255, scale 1, no offset and no rotation
makes no scene. Four groups may be open at
once, 16 a frame, eight nested scissors; a backdrop's cut inside a group settles it into pass 1 and makes it again after
the cut. The groups' map to the target is one affine (`Clay_ThorVG_Map`): a **clip** is a ThorVG paint in the transformed
scene, so it already turns with its group (the test tree's clipped child ends its bright fill at x 101 on one row and 89
on another inside a 30° group), and the **dither**'s mark of a gradient is the box's four mapped corners' quad — every
pixel of its bounding box is mapped back into the shape's own space and tested against the box and its corner arcs — so a
gradient in a rotated group is stippled where it really is (0 pixels of the page around the quad, 1151 inside the quad
but outside the unrotated box: `solid/rotated.test.ts`); a clip's cut for the dither is that clip's quad bounding box,
the conservative bound.

### A page's first mount (`src/entry.ts`)

`Motion` (`onWheel`, `onPointer`, `tick`) is the page's half of the host: `main.ts` wires all three to the page it
renders. `pageEntry(motion, root = "Root")` gives List, Widgets, Sensors and the Text field their entry: the root's
subtree starts 8px low and at alpha 0, and settles on its literals in 0.25s — `TRANSLATE_Y` on `spatial(0.25, 0)` and
`ALPHA` on `effect(0.25)`, the group fields, so `ui.bounds` is the settled box on every frame — and then the tick writes
nothing at all, so a page at rest is the frame its literals make. The settle is ~21 frames; the stored frames are taken
after `--warm 30` and are byte-identical. Reduced motion has no entry. The Sky page's entry is its cards' stagger and the
Dialog's its overlays; both own their ticks.

### `ui_text` fields (`packText`)

0-3 colour r g b a, 4 fontId, 5 fontSize, 6 letterSpacing, 7 lineHeight, 8 alignment (0 left, 1 centre, 2 right),
9 wrap (0 words, 1 newlines, 2 none). The colour is also the value channel's `FIELDS.TEXT_COLOR` (51..54) when the text
carries an id; nothing else of the 10 moves.

## Keys, focus and the Widgets page

`bun solid/main.ts widgets` is the headless widgets (`headless/`) and the focus manager (`focus/`) on this renderer.

**A key.** The window queues every key down and up (repeats too); the host pops them (`ui_key_pop`) after the poll and
before the frame. `keyName` (`src/input.ts`) gives the names the manager and the parts use: `Tab`, `Shift+Tab`, `Enter`
(keypad too), `" "` for Space (DOM's `key`; the parts take `"Space"` too), `Escape`, `ArrowLeft/Right/Up/Down`, `Home`,
`End`, `PageUp`, `PageDown`, `Backspace`, `Delete`, a letter as itself in lower case. A Ctrl, Alt or Cmd chord has no name and is dropped, and so is Shift with an
arrow, Home or End (the manager takes plain keys only; see below for how a text field still gets the selection chords). Then `input.down(name, repeat)`:

1. Tab and Shift+Tab go to the focus manager. It answers true when it moved focus. Past the last Tab stop it releases
   focus and answers false (a browser would hand Tab to its chrome): the next Tab starts at the first stop again, so the
   order cycles through one "nothing focused" stop.
2. Otherwise the focused part's `keyDown(name, repeat)`: Enter on a button, Space armed on key down; in a group the
   arrows, Home and End: the part asks the manager to move focus itself and then checks or selects what it moved to (a
   radio checks, tabs select, a toolbar only moves), a slider changes its value, and PageUp and PageDown are its large
   step. A key a pattern does not have (Home on a radio, Up on a horizontal toolbar) is nobody's. The arrows must not go
   to the manager first: it would move focus and the radio would never check.
3. Otherwise `input.fallback(name)`, the page level: `t` toggles the theme — but only while no text field has focus
   (`!input.editing()`): while one does, a letter is a character to type, and the page keeps its hands off it.

`input.up(name)` goes to the focused part's `keyUp` (Space fires there). `focus.onChange` blurs the part that lost focus
(dropping an armed Space) and focuses the one that got it, so a part's `focused` follows the manager.

**Typed text** is a second path beside the keys, because a text field takes characters (and composed ones: an IME commits
a run, an accent composes), not keycodes. While a text field has focus the host starts SDL's text input; `ui_window_poll`
queues every `SDL_EVENT_TEXT_INPUT` next to the keys, `ui_text_pop` hands them over and `Input.textInput(text)` inserts
them into the focused part. The key path is untouched: a letter still arrives as `keyDown("a")`, a text field's `keyDown`
ignores it, and the same character then arrives as text. While a text field has focus, `input.editing()` is true and
`solid/main.ts` turns SDL's text input on and off with it.

Editing keys stay keys, and `src/input.ts` names them: `Backspace` (SDL 8) and `Delete` (127) are new entries in `KEYS`;
`selectionName` (used by the host instead of `keyName`) keeps Shift on the arrows, Home and End (`Shift+ArrowLeft`,
`Shift+Home`), which a text field selects with. `keyName` itself is unchanged — it still refuses a Shift+arrow, and the
focus manager is only ever handed plain Tab and Shift+Tab, so no other part sees a name it did not have. Cmd/Ctrl+C, X
and V are chords `keyName` drops, so the host reads them before the name (`CHORD` in `main.ts`) and calls
`Input.clipboard(op, text)`: the part returns what goes on the clipboard (copy, cut) or takes what comes off it (paste),
and the bytes go through SDL's clipboard functions in C (`ui_clipboard_get` / `ui_clipboard_set`).

**A modal.** `input.modal` is a key the whole page gives to one owner while it is open: the Dialog page sets it to the
dialog's trap (`dialog.keyDown`), so Tab and Shift+Tab cycle the dialog's controls and Escape closes it before the focus
manager or any part sees them, and everything else falls through to the focused control. `up` still goes to the part
(Space fires there). The Widgets page uses it for the open size menu (`createMenu.keyDown`; Tab closes it and falls
through, every other key belongs to the menu) and for opening it from the toolbar's Size item (Down, Up, Enter, Space).

**The pointer.** A box with `onPress` runs it when the button goes down over it, as a browser focuses on mousedown;
`onClick` still runs on release over the box that was pressed. `input.add(part)` registers the part in the manager
(in call order: the document order) and returns the props `{ id, focused, onPress, onClick }` to spread on its row:
a press focuses it (`focus.focus(id)`) and a release over it calls `part.press()`. A group (radio, tabs, toolbar, slider)
registers its own items in the manager it is given (`createRadioGroup({ focus: input.focus })`), so `input.bind(part)`
only routes keys and focus to the part and returns the same props; both `onPress` and `onClick` get the pointer's x and y. The page also gets the pointer once a frame (`View.onPointer`): a press on the slider's rail sets its own `dragging` flag, and while the button is held each frame's x moves the value (a release clears the flag; a press off the rail never sets it). A press on a part that cannot take
focus (the disabled checkbox) changes nothing, focus stays where it was and `press()` ignores it. A press on no
element with `onPress` (empty space) blurs: `createFrame`'s `onPressMiss` calls `input.pressMiss()`.

**`:focus`.** A style may have `css.focus(...)`. A box with an `id` and a `focused` prop that is true takes it; with
`:hover`/`:active` the states that hold are laid over the base in the order hover, focus, active, so active wins a field
they both set, and focus ring and pressed look show together (`resolve` in `pack.ts`). The Widgets styles use a 2px
border in the `ring` token (a border does not change Clay's layout, so the ring moves nothing).

**The page.** `app/Widgets.tsx` (360x760: the page is as tall as it needs to be with the disclosure open and the tree's
Display open, the tallest state; a page taller than the window makes Clay shrink its boxes, a row wider than it widens
the root, both are asserted): a button that counts presses, a Wi-Fi switch (the thumb is at the end of the track
by `trackOn` instead of `track`), "Select all" (mixed) over Wired and Wireless (`all` is controlled: its `value` is
read from the two, its `onValueChange` sets both), a disabled checkbox, and a disclosure whose panel is in the tree
while `!panel.hidden`. Tab order: button, switch, select all, wired, wireless, trigger, then the five groups below.

The groups come after the disclosure, so the first part of the page is the old layout pixel for pixel (checked against
the earlier eleven frames over their old height: the only new ink in them is the tree under the toolbar; the frames are
regenerated at the new size). Each is made after the parts above it, because the manager's document order is the order of
registration:

| Widget | In the manager | Keys and pointer |
| --- | --- | --- |
| Speed (radio, `1x 4x 16x`; `disabledSpeeds` marks some disabled, the tests do) | a group: `orientation: both`, `wrap`, no memory, `entry` = the checked radio | Tab enters at the checked one and leaves as one stop; all four arrows move and check (wrapping, a disabled one skipped); Space checks; a click focuses and checks |
| Tabs (Overview, Stats, Log) | a group: horizontal, `wrap`, no memory, `entry` = the selected tab; the selected panel is a stop after it | Left and Right move and select (automatic), Home and End go to the ends; a click selects; Tab goes to the panel (ring on it), then on |
| Volume (slider 0..100, step 5, page 20, `valueText` "45%") | not a group: one entry (the thumb) | arrows step, PageUp and PageDown move by 20, Home and End go to the ends, clamped; a press on the rail or the knob sets the value and starts a drag: each held frame's x is the ratio from the rail's `ui_bounds` (less the knob's width, so a press on the knob's middle keeps its value); the ring is the rail's (the control), so it hugs the rail and the knob and the value text stays outside it |
| Format (toolbar: Bold, Italic and a menu button, Size; the first two toggle a lamp under the label) | a group: horizontal, no wrap, **memory**, `focusDisabled`; the menu button is one more item of it | Left and Right, Home and End move; Enter and Space toggle a plain item on key down; Tab away and back lands on the item left last. On Size, Down, Up, Enter or Space open the size menu (Down and Enter on the first radio, Up on the last), the item's label shows the chosen size and its lamp is lit while the menu is open |
| Settings (tree: Network open with Wi-Fi and Bluetooth, Display closed with Brightness, Storage a leaf: six nodes) | a group: vertical, no wrap, no memory, `entry` = the first selected visible node, else the first visible; a node in a closed subtree has `tabIndex: -1` | one Tab stop: Tab enters at Network (the first visible row); Up and Down, Home and End walk the visible rows only; Right opens the closed Display and, on an open parent, steps into its first child; Left closes an open parent, or steps to it from a child; Space selects, Enter opens and selects; a click opens, selects and focuses |

The tree is the last group, made after the toolbar, so its rows are the page's last Tab stop: Tab out of the tree
releases focus (nothing is after it). Its styles: a row per node with the hover and pressed looks of the other rows and
the same 2px `ring` on the roving row; the row's left padding is one step of 18px per `level` (`nodeOf`, one style made
at run time per level and selection, as `fillOf` does for the slider); `+` on a closed parent, `-` on an open one, and
a leaf has none; the selected row is the `surface` fill with its label in the `accent` (4.5:1 or more on the surface in
both themes); a node in a closed subtree is not in the Solid tree at all (`Show when={!item.hidden}`), so its row is
neither drawn nor findable. No disabled nodes: the tree part has none, so the page has no dim row look.

The slider's filled part is the one style made at run time (`fillOf`: `s.fill` with a fixed width of the value, kept
per width); Clay has no flex ratio. The focus ring is the rail's (`s.rail`: the control, 140x24, no padding or border at
rest — a Clay border draws inside the box, so it moves neither the rail nor the knob); the row (`s.sliderRow`) holds the
rail and the value and takes no ring, so the readout stays outside it. A drag reuses `Slider.pointer` for each held
frame's x: a press sets the value, moving with the button down follows the pointer, and a release ends it where it was.

The size menu is a float hung under the menu button (`formatMenu`: `parent: "format-item-2"`, `attach: { element: "left
top", parent: "left bottom" }`, 4px down, `zIndex: 10`, **capturing**, so a press on it does not also reach the page under
it), one row per radio with the accent dot on the chosen one. `createMenu` has a focus manager of its own: its trigger is
not a stop of the page, the toolbar's item is. The page gives the open menu every key through `input.modal` (Down, Up,
Enter and Space open it from the item; inside, the arrows and Home/End move, Enter picks and closes, Escape closes and
returns focus to the item, Tab closes it and goes on), and an effect closes it when the item loses focus to another part.

Checked by `bun solid/widgets.test.ts` (no pixels but a few ring, fill and knob positions: the full Tab order over the
page and Shift+Tab, one Tab stop for each group, Space on key up and Enter on key down, a held Space once, a click toggling
and focusing, the disabled box, blur on empty space, select all, the disclosure, the page fitting its window, the radio's
arrows (wrap, Space, Tab in at the checked one, a disabled radio skipped by arrows, Tab and a click), the tabs' arrows,
Home, End and panels, the slider's step, page keys, ends, clamping and rail presses, the rail's ring and the readout
without one, the toolbar's ends, memory and toggles, the menu button (`aria-haspopup`, Down/Up/Enter open, the menu's
arrows and Home/End, Enter picking and closing, Escape returning focus to the item, Tab closing and moving on, its float
under the item, a click picking), the tree's one stop, its visible-only arrows, Right and Left, Home and End, Space, the
ring following the roving row, a hidden node skipped, contrast of the ink on every fill, key names, the drag) and by
seventeen stored frames in `frames/`:

| Frame | Keys | Shows |
| --- | --- | --- |
| `widgets-initial` | | the page at rest: 1x checked, Overview selected, Volume 40%, no lamp on; below the toolbar the tree: `- Network` with Wi-Fi and Bluetooth, `+ Display`, Storage |
| `widgets-tab2` | Tab Tab | ring on the switch |
| `widgets-switch-on` | Tab Tab Space | the switch on |
| `widgets-mixed` | Tab×4 Space | Wired checked and ringed, "Select all" mixed |
| `widgets-disclosure` | Tab Tab Space Tab×4 Enter | the panel open, everything below it moved down, nothing shrunk |
| `widgets-radio` | Tab×7 ArrowRight | 4x checked and ringed, 1x cleared |
| `widgets-tabs` | Tab×8 ArrowRight | Stats selected and ringed, its panel's text |
| `widgets-slider` | Tab×10 ArrowRight | 45%, the filled part and the knob a step on, the ring around the rail (the `45%` outside it) |
| `widgets-slider-drag` | a press at a quarter, held, a move to three quarters | the knob near the right end, the fill grown, 80%, the ring on the rail |
| `widgets-toolbar` | Tab×11 Enter ArrowRight Shift+Tab Tab | Bold's lamp on; Italic ringed after leaving for the slider and coming back |
| `widgets-toolbar-menu` | Tab×11 ArrowRight×2 ArrowDown | the size menu floating under `Size: Medium`: `Small` ringed (the first item), the accent dot on `Medium`, the item's lamp lit; the menu covers the tree's first rows and is not clipped |
| `widgets-light` | the disclosure, then the four groups | the light theme: 4x, Stats, 50%, Bold on and ringed |
| `widgets-tree-focus` | Tab×12 | the ring on Network, the tree's first visible row: Network open with its two children, Display closed, Storage after it |
| `widgets-tree-down` | Tab×12 ArrowDown | the ring on Wi-Fi, the selection still empty (`ArrowDown` moves, it does not select) |
| `widgets-tree-expanded` | Tab×12 ArrowDown×3 ArrowRight | Display opened by Right (`+` became `-`), Brightness indented under it, the ring still on Display |
| `widgets-tree-select` | Tab×12 ArrowDown×3 ArrowRight Space | the same, and Display selected: the surface fill with its label in the accent, ring still on it |
| `widgets-tree-light` | the same keys, light | the light theme: Wi-Fi selected (white fill, accent label) and ringed |

## The Dialog page

`bun solid/main.ts dialog` is a settings screen (360x480) with the two overlays of `headless/`:

| Widget | What it is | Keys and pointer |
| --- | --- | --- |
| Settings dialog | `createDialogModal` (role `dialog`): a float 280 wide centred on the root (`css.float({ root: true, attach: { element: "center center", parent: "center center" }, zIndex: 2 })`) over a backdrop float that is the whole window (`root: true`, `left top`, `stretch`, `zIndex: 1`, `rgb(0 0 0 / 0.55)`) and takes the pointer | "Open settings" opens it by click or Enter; focus moves to Cancel and Tab/Shift+Tab cycle Cancel and OK and never leave; Escape and Cancel close without a write; OK writes `Volume: 55%` onto the page. The backdrop swallows every press, so the page behind is unreachable by pointer, and `input.modal` keeps it unreachable by keyboard. Closing returns focus to the trigger |
| Zoom menu | `createMenu` (plain, `100% 125% 150% 200%`): a float attached to `zoom-trigger`, `attach: { element: "left top", parent: "left bottom" }`, offset y -20 (it overlaps the trigger's bottom edge by 20px, so the glass has a border and a text stroke under it), `zIndex: 10` | Tab reaches the trigger; Enter, Space, Down or Up open it on the first/last item; Up/Down wrap, Home/End go to the ends; Enter picks and closes, Escape closes and returns focus to the trigger, Tab closes and leaves. The picked zoom is shown in the pill and the menu's dot |

The dialog's container and the backdrop carry an `onPress` that does nothing: a press inside the dialog or on the
backdrop must not read as a press on empty space (`onPressMiss` would blur).

**The arrival, and the exit.** The two overlays animate through the value channel (`ui.value`, above): each frame the
page's tick overrides numbers of their packed styles — the float's offset y, the shadow's blur and, for the backdrop, the
alpha of its dim — and every target is the style's own literal, so a settled frame is the literal's frame, pixel for
pixel. The menu slides out of its trigger: offset y `-10` → `-20` on `spatial(0.22, 0.1)` (a light bounce) and its
shadow's blur `0` → `14` on `effect(0.22)`; the dialog drops in: offset y `-14` → `0` and its shadow's blur `0` → `32`.
The blur takes the `effect` class because a blur has no negative side and must not ring in a luminance field, the offset
`spatial` because position may carry a little velocity.

The menu also **leans**: `FIELDS.ROTATE` (55) `-2°` → `0` on the same `spatial(0.22, 0.1)` as its scale, in the same
scene (`ALPHA` 225 → 255, `SCALE` 96 → 100), so it settles out of a tilt as it slides out of its trigger. It is a scene
transform: `ui.bounds` is the style's box on every frame (x, width and height are the literal's, only the float's offset
moves y) while the drawn top edge is 5px out of horizontal over the menu's 150px. On the way out it leans back to -2°
on `spatial(0.2, 0)`, though the fade to 0 is faster than the lean: by the fourth frame of the exit the border is under
the brightness a pixel check needs (measured: 129 → 117 of the muted border's 155 by the third frame, nothing by the
fourth) — the lean is there, it just has little ink left to show it.

A node that leaves stays in the tree while it leaves (`presence` in `src/motion.ts`): the page's tick asks
`presence(open, 0.35)` for each overlay, keeps a signal of its `mounted` answer and puts it on `Show`, so closing runs
the same tracks the other way — the panel's offset y `0` → `14` on `spatial(0.2, 0)` and its blur `32` → `0`, the
backdrop's alpha `140` → `0` (field 17; its box is the whole window, so the alpha is the dim), the menu's offset y
`-20` → `-10` and its blur `14` → `0` — and the node leaves the tree when the 0.35s is up (its 0.2s tracks settle at
0.333, so no frame is cut). The trap is the *open state's*, not the node's: `input.modal` asks `dialog.open()`, so a Tab
right after Escape reaches the page's own next stop (the Zoom trigger) while the panel is still fading, and a closing
overlay writes `FIELDS.CAPTURE` 1 so a press goes through it to the page. A reopen during the exit retargets from what
is presented (the reopen frame is the exit's own next value, no jump and no restart), and the clocks keep running for
as long as the node is mounted. With reduced motion (`--reduced-motion`, `REDUCED_MOTION=1`) a retarget lands on its
target in the same call and a presence unmounts at once, so opening is the literal's frame in one frame and closing has
no frame with the panel in it.

| Frame | Keys | Shows |
| --- | --- | --- |
| `dialog-closed` | | the page at rest: `Volume: 40%`, Zoom `100%`, no menu |
| `dialog-open` | Tab Enter, settled | the dimmed page and the dialog centred on it, ring on Cancel, `Volume` still 40% |
| `dialog-light` | Tab Enter, settled, `THEME=light` | the same in the light theme: a white dialog over a greyed page |
| `dialog-menu` | Tab Tab Enter, settled | the menu hanging off the Zoom trigger's left-bottom corner, ring and dot on `100%`, the trigger's `-` |
| `dialog-menu-mid` | Tab Tab Enter, 3 frames after the key | the menu 7.4px lower than it rests (offset -12.58), its shadow at about a fifth of its blur, and its top edge out of horizontal: the border's inset from the box's left 60px against 8px from its right |
| `dialog-exit-mid` | Tab Enter Escape, 3 frames after the key | the panel 3.94px below its place, its shadow at 22.9 of 32, the page behind it at 100.6 of the 140 dim |

Checked by `bun solid/dialog.test.ts`: opening by click and by keyboard, the trap's two-control cycle, the page's trigger
never a stop while open, Escape and Cancel writing nothing, OK writing 55%, a press on the backdrop doing nothing and not
reaching the page behind, `ui.bounds` of the backdrop (the window) and the dialog (centred on the root), the page's
layout unchanged behind the backdrop, the menu's arrows, Home/End, Escape back to the trigger, Enter and a click
picking, and the motion: the menu's offset `-10.00, -10.85, -12.58, -14.42, -16.04, -17.32, -18.26, -18.92, -19.36,
-19.64, -19.82, -19.92, -19.97, -20.00` and at rest exactly its style's -20, every frame towards it and none past it,
the shadow with no blur on its first frame (the page beside it) and its blur darkening that page 18.0 → 13.9 as it
settles, and the dialog's drop `149.88, 151.07, 153.49, … 163.88` finite and still.

The lean is measured on the pixels: the menu's border is the one near-grey bright line of the glass, so a row one pixel
below the box's top finds it on the left and on the right, each as an inset from the box's edge — `112/11` on the frame
it opens on, `108/10`, `60/8`, `25/7` as the lean decays and `5/5` at rest, the two corner arcs' own. Its box is
`40,·,150,133` on every frame of that (x, width and height the literal's; y is the float's offset alone), and the exit
leans back: `5/5`, `6/6`, `6/5`, `22/116` on the first four frames after Escape (the fade then takes the ink past what
a border check can see). The matrix itself is proved on a hand-built non-square box in the same file: a 200x40 box at the
root with `SCALE` 0.5, `ROTATE` 90° and `TRANSLATE_X` 40 is drawn as the rect x 130..150, y -30..70 — the long side stood
up about the centre (100, 20) and the 40px after the rotation, unscaled (a translate before the transform would put it at
x 110..130, and no rotation at x 40..140); its `ui.bounds` is still 200x40.

The exits and presence (`presence`, `channel`, `setReducedMotion` in `src/motion.ts`):
the panel's offset y `163.88, 165.24, 167.82, 170.39, 172.54, 174.18, 175.37, 176.20, 176.77, 177.16, 177.41, 177.58,
177.68, 177.75 … 177.88` and still at that 14 below its place, the title pixel behind the backdrop (47, 35) `103, 115,
139, 162, 181, 196, 206, 214, 219, 222, 225, 227, 228, 228, 230` (140 of 255 of dim to the page), the menu's exit
`-20.00, -19.03, -17.18, -15.34, -13.81, -12.64, -11.79, -11.19, -10.79, -10.51, -10.33` with its shadow lightening
13.9 → 18.0 (the page), the panel still in the layout on the frame Escape closes it and for the exit after, then gone
with the backdrop, and the page's own pixels back to the frame before opening (0 pixels differ, the trigger's ring
included). The trap is released on that same frame: a Tab right after Escape reaches `zoom-trigger` while the panel is
still fading. A reopen after four frames of the exit presents `174.18` — the exit's own next value — and settles back
on 163.88 with the keys back in the dialog. Reduced motion (`setReducedMotion(true)` in the test) opens on the
literal's frame (0 pixels differ from the settled frame) and removes both nodes on the frame it closes (the page back
in that frame); `test.sh` also runs `$D --reduced-motion --keys Tab,Enter --expect solid/frames/dialog-open.png`.

The frames are taken at rest (`--settle 30`) because a stored frame of a moving page would pin an instant of the spring;
`dialog-menu`, `dialog-menu-light`, `dialog-menu-mid`, `dialog-open`, `dialog-light` and `dialog-closed` came out
**byte-identical** to the frames before the exits (the entry's end is still the literal, and the closed page is the page
before anything was opened); the new `dialog-exit-mid` is three frames after Escape, the panel 3.94px into its exit.

**Mutation.** `ui_value` dropping `OFFSET_Y` leaves every frame at -20 — `FAIL every frame of the slide moves it towards
the offset: false, wanted true` and `FAIL the menu appears 10px below the style's offset` — and the mid frame's menu
sits at the settled place, only its shadow band differing; `ui.c` is compared with its backup after the revert.
Dropping the presence (mounting the dialog on `dialog.open()` again, so it unmounts on close) fails `FAIL the panel is
still in the layout right after Escape: false, wanted true`, with every sampled y `NaN` and the title already `230`
(the dim gone in the same frame) — `Dialog.tsx` is compared with its backup after the revert.
Dropping the `FIELDS.ROTATE` write (so the tilt track is computed and never reaches the scene) fails `FAIL mid-lean the
top edge is not horizontal: the border's two insets differ: false, wanted true` with the insets `NaN/NaN, NaN/NaN, 9/9,
7/7` — the flat edge — and nothing else in the test.

## The Text field page

`bun solid/main.ts form` is a form (360x450) around `headless/`'s `createTextField` — a part that is **not a port**: eoa
has no textfield primitive (`packages/headless` has `combobox` and `spinbutton`, each with its own model) and
`specs/apg/` has no textbox pattern, so there is no Quint model, mount, scenario or walk behind it and the conformance
counts in `headless/README.md` are untouched.

```ts
const name = createTextField({
  id: "name",                 // one focus entry; the field registers itself in the manager it is given
  focus: input.focus,         // the page's manager, so Tab reaches it in creation order
  maxLength: 24,
  onSubmit: (text) => setSubmitted(text),
});                           // uncontrolled: pass `value` + `onValueChange` to own the text
input.bind(name.part);        // keys and focus; the typed characters come through input.textInput
```

| Field / handler | |
| --- | --- |
| `value()`, `part.value`, `part.valueText` | the text (request/commit: `value` + `onValueChange` controlled, `defaultValue` uncontrolled) |
| `caret()`, `selection()` | the caret's index (0..length) and the run between the anchor and the caret, `{ start, end }` ordered |
| `part.role`, `part.tabIndex`, `part.focused`, `part.readOnly`, `part.disabled` | the neutral fields (the aria-* the driver reads) |
| `part.editsText`, `part.insert(text)` | the marker of a part that takes typed characters, and where they go |
| `insert(text)`, `keyDown(key, repeat?)` | the edits: insert at the caret (replacing the selection, clamped to `maxLength`), Backspace, Delete, arrows, Home/End, Shift+arrows/Home/End, Enter, Escape |
| `press(x, advance?)`, `setCaret(i)` | the caret from a press (x from the run's start, `advance` px a character), or programmatically |
| `part.clipboard(op, text)` | copy and cut return the selected text, paste inserts what was on the clipboard |
| `focus()`, `blur()` | the manager's (Escape blurs) |

**The keys.** Tab reaches the field as one stop. Typing inserts at the caret; Backspace and Delete remove before and
after it or the whole selection; Left and Right move and collapse a selection to the near end; Home and End go to the
ends; Shift with Left, Right, Home or End extends from the anchor; Enter calls `onSubmit` (a key repeat does not fire it
again) and keeps the focus; Escape blurs, and `t` flips the theme again once nothing has focus; Cmd/Ctrl+C, X and V go
through SDL's clipboard. A press on the field focuses it, and on release its x over the row places the caret.

**The caret and the selection are drawn, not measured per glyph.** Clay has no text attributes, so the value is laid out
as up to three text runs in a row — before the selection, the selection (a box with the tinted `selection` token and the
text inside it), after it — with a 1px caret box between them, so Clay puts each run exactly where its glyphs are. The
caret costs 1px of layout while it is in the middle of the text (browsers overlay it): the runs after it sit 1px right.
A press is the one place that needs an advance: the page takes the row's width from `ui.bounds` and divides it by the
text's length (`pressAt` in `app/Field.tsx`), one advance for every character — an approximation for a proportional font,
which can be a character off in the middle of a word and clamps at both ends.

The page's styles are in `app/Field.tsx`: the page's palette (`:hover` on the field, the same 2px `ring` on `:focus`), the
`ink` caret and the `selection` tint (`30%` of the accent in the dark theme, `22%` in the light one). The page fits its
window in its tallest state (a submitted line under the buttons; the test asserts it).

| Frame | Keys | Shows |
| --- | --- | --- |
| `field-empty` | Tab Tab | the empty Name field, ringed, with the 1px caret just inside its left padding |
| `field-typed` | Tab Tab, `text:Ada` | "Ada" and the caret after the last character, `Value: "Ada" (3)` |
| `field-selection` | Tab Tab, `text:Ada`, Shift+ArrowLeft ×2 | "A" then the caret, then "da" in the tinted run |
| `field-submit` | Tab Tab, `text:Ada`, Enter | the field still focused and `Submitted: Ada` under the buttons |
| `field-light` | the same as `field-typed`, light | the light theme: white field, blue ring, dark ink caret |

Checked by `bun solid/field.test.ts`: typed text reaching the focused field only (the read-only one and the command
button's count unchanged), the theme key not firing while a field is focused and firing after Escape, the caret's box at
the end of the run and its pixel in the ink, the arrows moving it, the selection's box at the anchor's x with its pixel
tinted over the surface, Backspace and Delete, a selection replaced by typing, `maxLength` 24, a press at either edge of
the run, Enter and the Submit button each showing the value once, and the page fitting its window.

**Mutation check.** Inserting at the start of the text instead of at the caret (`take + value()` in
`headless/src/textfield.ts`) fails seven `headless/test/textfield.test.ts` tests and two asserts of `solid/field.test.ts`
(the selection replace and the Submit button's text); the file is compared with its backup after the revert.

## The List page

`bun solid/main.ts list` is thirty rows in a fixed 240px viewport (360x400) whose offset **the page owns**
(`solid/src/vscroll.ts`, the Sky feed's machine): the viewport is one clip element (a `Clay_ClipElementConfig` — to Clay
any clip element is a scroll container) with the same id, and the page writes its offset through `ui_scroll_put` /
`ui_scroll_to` every frame before the tree is declared, with `ui_auto_scroll(0)` keeping Clay's own wheel scrolling out of
the way. Its header (`Room A3 — 13 of 30`) and its footer are the viewport's siblings, so they do not move, and the rows
beyond the box are clipped by the renderer's `SCISSOR_START`, not drawn outside. A scrollbar on the viewport's right edge
is the same machine's (`BAR`, below).

| | |
| --- | --- |
| The wheel | the machine accumulates `SDL_EVENT_MOUSE_WHEEL` notches (`ui_wheel_pop`, 10px each, sign unchanged) and the tick retargets the track: the offset glides to exactly 10 (a burst of notches in one frame is a flick whose decay lands clamped), and past an end the `rubber` band resists the notch and lets go 80ms after the last one. The wheel is gated on the pointer being over the viewport (Clay scrolled only the container under the pointer; the page keeps that rule itself, in `List`'s `wheel`) or over the visible thumb, which is the viewport's chrome. |
| The drag | a press inside the viewport (`onPress`) grabs the offset and the host's `onPointer` makes it 1:1 from the press point — no track in between — with the same `rubber` past an end; the release hands the last frames' speed to a decay. Travel past 4px is a drag and not a click; the drag never selects (the selection is the keyboard's). |
| The scrollbar | `viewScroll.thumb()` is the press's: a visible thumb grabs the offset where it is and its travel is the offset's whole range (`max/(view - thumbHeight)`), clamping at both ends, no fling. The machine writes its box and its fade every frame (see `solid/src/vscroll.ts` and `native/README.md`, "The scrollbar"): height `max(24, 240²/898)` = 64.14, top `offset/658·175.86`, 4px wide 2px in from the right edge, as a float on the viewport so it does not scroll with the rows; 600ms after the offset stops moving it fades out, and a press on the invisible strip is the page's. |
| A finger | the host's `touch` flag (SDL's finger events, one pointer) drops the 4px click threshold to 0: a touch drag starts at once, and a touch that never moves still clicks. The List's rows have no click, so here it changes only when a press becomes a drag (and therefore whether its release flings). |
| The keys | one Tab stop. Up and Down move the selection a row, PageUp and PageDown eight (the viewport holds eight), Home and End to the ends, clamped: no wrap, never out of 0..29. Each move asks the track for the least offset that shows the row — the reveal — measured from the row's and the viewport's `ui.bounds` of the last frame and against the track's *target* (not what it presents), so a key pressed mid-animation still lands with the row in view. The active row also comes into view when the list takes the focus, as a browser's does. |
| The selection | a signal: the selected row is the panel's `surface` with its label in the `accent` (the tree's selected node) and takes the same 2px `ring` while the list has the focus. The wheel does not touch it, so scrolling and the selection only agree when a key moves it. |

| Frame | Keys | Shows |
| --- | --- | --- |
| `list-top` | `--warm 30` | the page at rest: `Room A1 — 1 of 30`, rows 1..8 of 30, no ring, no thumb (it faded out) |
| `list-entry` | `--settle 3` | four frames into the first mount: the page `5/6/8` of its `16/18/24`, the selected row `12/14/18` of its `36/40/52` (still lighter), the top 8px the ground |
| `list-wheel` | `--wheel 32 --settle 90` | rows 12..19 at offset -320: the row above cut to its last 8px and row 19 cut at the viewport's bottom (its glyphs stop at the border), the header still `1 of 30` |
| `list-select` | Tab, ArrowDown ×12, `--settle 90` | `Room A3 — 13 of 30`, the view scrolled by 148px so that row 13 is the last in view, the ring on it |
| `list-light` | the same, light | the light theme: the white selected row, the blue ring |

Checked by `bun solid/list.test.ts`: the viewport 240 and its rows 28 on a 30px pitch (898 of content), the wheel moving
the offset 10px a notch with the rows moving by exactly that, the offset stopping at 0 and at -658 (both clamps), the
clip (a selected row 10px above the viewport: its bounds are not clipped, the pixel just above the viewport is the page
and the one 5px inside it the row's fill; past the bottom the page again), the keyboard selection scrolling into view
(12 Downs scroll by 148, PageDown to 21, End to 30 at -658, Home back to 0 and never past the ends), the wheel leaving the
selection alone and a key bringing it back, a held pointer dragging the viewport 1:1 and stopping at the release (clamped
at both ends; a press above the viewport grabs nothing; the wheel and the keys still work beside it), the page's first
mount (four frames in the page is `5/6/8` of its `16/18/24` and the selected row `12/14/18` of its `36/40/52`, the frame
is `frames/list-entry.png`, the boxes are the settled ones and the literals come back at rest; reduced motion has no
entry), the header and footer unmoved by the scroll, the ring's pixels (the row's
edge is its fill before Tab and the ring after), the wheel only reaching the container under the pointer, **the scrollbar**
(its box `314,4x64.14` at the top, `314,189.7` at 330 and its bottom on the viewport's bottom at 658; the fade's pixels
from the row's `36/40/52` into the muted `149/154/169` and back out; a 10px drag on the thumb moving the offset 37.4 and
clamping at 658 and 0; the invisible strip at rest being the page's own drag), **a finger** (a 1:1 drag, and a 2px one
that flings where the mouse's rests at 2), reduced motion (no band, no fling, a key at once, and the thumb shown at once
and dropped at once — 600ms, no fade), and the page fitting its window. The stored frames are taken after `--warm 30`,
which is the settled page the frames before the entry were: all four are byte-identical, the `--settle 90` ones
included (90, not 60, because the fade needs 600ms plus its 0.15s after the track stops; the pixels at rest are the
pixels they were).

**Mutation check.** Dropping `reveal(i)` from `select` (never scroll the selection into view) fails eleven asserts of
`solid/list.test.ts` (the arrows, PageDown, End and the wheel-then-key move); the file is compared with its backup after
the revert.

## The Sky page

`bun solid/main.ts sky` is **csssky's feed** (`apps/csssky` of this repository) as the first real app on this
renderer: a phone-shaped 360x760 page whose data is the app's own recorded fixtures, not a fetch. The bar holds the
wordmark and the three feeds as a **headless tablist** (`createTabs`: one Tab stop on the active tab, Left/Right and
Home/End move it and switch the feed); the feed is one Clay clip element (`sky-feed`, the rest of the window's height)
that the wheel scrolls and the keyboard scrolls through `ui_scroll_to`; the status line under it names the feed and its
post count, or the card a click selected.

| | |
| --- | --- |
| The posts | the same six `terminal/sky.c` carries, verbatim from `home-discover-1.json` (Michael Warburton, Titania, alexjungle), `home-science-1.json` (Erik Strub, David Blanchflower BSc, Jason GRIZZLED Bittel) and the app's empty News feed. `created` in seconds against the fixtures' capture moment (`SKY_NOW = 1790955571`), so `ago()` and a frame read the same today as when recorded; the counts are the app's compact numbers (`310`, `3.5K`), with words instead of the app's icons because Roboto has no retweet or heart glyph (`8 replies · 32 reposts · 310 likes`). |
| The cards | the panel, radius 12, padding 12, gap 8, the author's 40x40 avatar, the name and the handle with its age, the body, the media line and the counts; the palette is `terminal/sky_styles.ts`'s (the sky dark and light themes, not the web app's Mu theme). A click records the card in a signal (the status line names it) and nothing else: there is no thread screen yet. |
| The avatars | `css.image(path, { width: 40, height: 40 })` — the six committed 64x64 PNGs of `examples/sky/avatars.py` (a disc in the author's hue, transparent outside it, so the panel shows at the box's corners). The path is a literal per author because a css style is evaluated when its module loads: a page cannot build one from a loop variable. This is the first page that uses `css.image` in the Solid path. |
| Wrapping | new on this page: a body is a `text` with `whiteSpace("normal")` and `lineHeight(20)` inside a stretch box inside a card of percent width, and Clay wraps it. (A clip element lets its children grow past the viewport for their content, so a card that must wrap cannot take its width from a stretch inside the feed: the card is `width("100%")`.) |
| Scrolling | the feed's offset is a page-owned motion track (`solid/src/motion.ts`): a wheel notch is 10px on a spring that glides it, a burst of notches is a flick whose decay lands (clamped) at the end, and one Tab stop on the feed retargets the same track with Down/Up 40px, PageDown/PageUp a viewport and Home/End. The page turns `ui_auto_scroll` off, so Clay's own container does not also move; `ui.scrollTo("sky-feed", -x)` puts the value on it each frame. Discover's three short posts fit the 664px viewport (max 0), so the wheel frame and the test scroll **Science** (742px of content, 78px of travel). |
| The drag | a press inside the feed grabs the offset (`onPress`, then the host's `onPointer` on the same frame) and, while the button is held, the offset *is* `place(grabFrom - (y - grabY))` — the pointer's travel from the press point, 1:1, with the same `rubber` past an end as the wheel's pull, and no track in between. Travel past 4px makes the press a drag, and the card's `onClick` is dropped (`held && dragMoved`), so a drag never selects and a click that did not move still does. A **finger's** drag has no 4px threshold (the host's `touch` flag, 0 instead of 4): any travel is a drag, so a finger's 2px swipe does not select the card under it, while a finger's tap that never moves still does. The release hands the speed of the last five samples (no span under 1/120s) to a `decay`: the fling runs to its projection inside the content or springs to the clamp past an end, and a release in the band lets the band go. Reduced motion drags 1:1 and flings nothing. `main.ts --drag-feed X,Y,DY,...` scripts one headless. |
| The scrollbar | the feed has one too (`sky-thumb`, the machine's `thumbOf` at the feed's right edge): 4px wide 2px in, `max(24, 664²/742)` = 594.2 tall on Science (whose content is 742 in the 664 viewport), its top at `offset/78·69.8`, and **height 0 on Discover**, whose three short posts fit. It is a float on the feed, so it draws over the cards and does not scroll with them; it fades in while the offset moves and out 600ms after it stops; a press on it drags the offset by the thumb's travel (`78/69.8` a px) and the cards under it are not pressed. `solid/sky.test.ts` checks the box, the fade's pixels, the drag and the 0 on Discover. |
| The rubber band | a notch past an end is a **pull** of that end, not a scroll: while the content is at the end (or already past it) the wheel moves it by Rune's and iOS's resistance, `f(x) = (1 - 1/(x·c/d + 1))·d` with `c = 0.55` and `d` the viewport's 664 (`motion.ts`'s `rubber`); `x` is the raw overshoot the notches have accumulated, so the first 10px past the end move 5.45 and the 40th only 21.29. Eight frames without a notch — 80ms — and it springs back on `spatial(0.35, 0.1)` to the clamp, settling exactly on it; a key drops it at once; a notch the other way walks it back. A notch that only *reaches* the end while the content is still travelling there is a scroll like any other (the flick's clamp), so nothing jumps. The band goes on Clay's clip element through `ui_scroll_put` (the unclamped sibling of `ui_scroll_to`, since Clay's own clamp is the content's). Reduced motion has no band: the wheel is clamped hard. |
| The entry | on mount (once — a tab switch draws its feed at rest) every card starts 12px low and at 0 opacity and settles on its literals in 0.3s: `TRANSLATE_Y` on `spatial(0.3)` and `ALPHA` on `effect(0.3)`, the group of the element's whole subtree, so not one box moves (`ui_bounds` is the settled one on the first frame). Each card starts 50ms (3 frames) after the one above it. Reduced motion starts no track at all: the settled frame at once. |
| Hover | the card's and the tab's hover is a 120ms fade (`effect`), not a style switch. The card fades its four background floats from the panel tone to the hover tone **and** its gradient's opacity (`GRADIENT_ALPHA`), so the resting gradient fades out under the hover one: the card alternates two styles (`card`, `cardHover`) and the page keeps the hover one while the fade runs either way (a `:hover` state would drop the gradient the moment the pointer left). A tab has no gradient, so its four channels are enough; a tab's 2px underline is its own border colour (`BORDER_ALPHA`), which fades in on the tab that becomes active and out of the one that was — a colour, not a slide. **The label beside the underline fades too**: a text's colour is not in the tab's box's floats, so the `<text id="sky-tabs-label-i">` carries an id and the page fades the text's own four floats (`FIELDS.TEXT_COLOR`, 51..54) on `effect(0.15)`, muted → accent on the tab that becomes active and back on the one that was, retargeted from the presented colour, so the label and its underline move together. A label that has settled writes nothing: its literal is the end it is on (the page swaps `tabText`/`tabTextOn` at the switch, and Clay's text command carries the colour, so the fading frames draw and the settled one is the literal's). The ends are read from the packed variants under the frame's theme, so the light palette fades between its own tones; a selected card keeps `cardOn` and does not fade. |

| Frame | Keys | Shows |
| --- | --- | --- |
| `sky` | `--settle 40` | Discover at rest: the bar, three cards (Michael, Titania, alexjungle), the status `Discover — 3 posts` |
| `sky-science` | a click on `(180, 32)`, `--settle 40` | Science: Erik's four-line body and its link line, David, Jason (cut at the feed's bottom), the ring on the clicked tab |
| `sky-light` | `THEME=light --settle 40` | the same Discover feed in the palette's light theme |
| `sky-scrolled` | the Science click, `--wheel 8 --wheel-over sky-feed --settle 90` | the Science feed eight notches down, settled at the clamped 78px: Erik's card cut at the top, Jason's at the bottom, the bar and status unmoved. 90 frames, not 60: the scrollbar's 600ms hold and 0.15s fade come after the track stops, so a frame at rest is a little later — and it is the same pixels as before, the thumb being out |
| `sky-entry` | `--settle 9` | ten frames in: the three cards arriving, 2, 4 and 10px of their 12 below their boxes, translucent, each further behind the one above it |
| `sky-hover` | `--settle 40 --move 180 300 3` | the pointer on the second card three frames into its 120ms fade: its colour between the panel and the hover tone |
| `sky-band` | `--warm 40 --wheel 4 --wheel-over sky-status` | Discover four notches past its end (its content is shorter than the viewport, so the first notch is already past it): the cards 21.3px out of the clamp, the top one cut, the bar and status unmoved |
| `sky-tab-mid` | `--warm 40 --keys Tab,ArrowRight --settle 2` | a tab switch two frames in: the ring on Science, its label between the muted token and the accent (`139/152/165 → 126/152/176`), Discover's label going the other way, both underlines mid-fade |

Checked by `bun solid/sky.test.ts`: `ago()`/`num()`, the bar 64 / feed 664 / status 32 layout with 8px card gaps, the
avatars' pixels (the panel at the box's corner where the PNG is transparent, the head's tint at the middle, the author's
exact hue in the disc — `74 132 214` for michaelwarburton, `126 108 200` for erikstrub — and the change of author with
the tab), the body and media wrapping (Erik's body four 20px lines, Titania's card one media line taller than
Michael's), hover on a card and a tab, **the entry** (the boxes are the settled ones while the cards arrive, the first
frame draws none of them, eight frames in they are 4, 8 and 12px low — each further behind the one above it, so the
stagger is there — and the last frame is the literal's; reduced motion draws them at rest at once), **the hover's fade**
(a mid frame strictly between the resting and the hover colour, the colour continuing the same way, the leave the same
path back to the literal, and a quick leave and re-enter whose widest frame is 3/255), **the tab's underline** (a mid
frame of the new tab's a blend of the page and the ring, the old one's a blend of the accent and the page, the tabs'
boxes unmoved, then the ring and the page), **the label's colour** (the ink's core found as the pixel furthest from the
page: `139/152/165` muted at rest, `126/152/176`, `106/153/195`, `89/154/211`, `77/155/222` and then exactly the accent
`59/156/240` on the new tab, the old one the same path back to the muted token, a quick switch back inside the two ends
with its widest frame 15/255), **the rubber band** (four notches past 78 land at 99.29 = the formula's
21.29 of the raw 40, a notch back walks it to 97.95, it is still out of the end for four frames and back on the clamp 22
frames later, a flick into the end never steps more than 20px and rests at 78, and reduced motion clamps hard), **the
drag** (each held frame's offset is the pointer's travel — 2, 4, 6, 8, 10 — released at 11.48, the next frame 12.9 and
the rest at 54.95, the speed of the last five samples projected; a 153px drag up presents rubber's f(75) on the clamp and
springs back to 78; a 30px drag on a card does not select it while a click without movement does; a press on the bar grabs
nothing; reduced motion drags 1:1 and stops at the release without a band), one wheel
notch gliding `2.59, 1.92, 1.42…` px a frame to exactly 10 (the bar and status still), eight notches flinging to the
clamped 78 and the settled frame matching `sky-scrolled.png` pixel for pixel, a wheel up mid-throw landing 10px back at
64.05 with no frame's step jumping, the keyboard (Down/Up 40, PageDown a viewport, Home/End, all on the same track and
clamped), the feed's focus ring's pixels, the tabs switching the feed, News' empty box and its centred muted line, the
status naming a clicked card, **the scrollbar** (Science's box `354,4x594.2` with its travel 69.8, its height 0 on
Discover, its fade's pixels in and out of the muted token, a 10px drag on it moving the offset by `78/69.8` a px and
clamping at 78 and 0), **a finger** (a 2px finger drag not selecting the card under it, a 2px mouse drag selecting it, a
finger's tap selecting it), and the page fitting 360x760. `bun solid/motion.test.ts` is the model itself: one path at
any dt, a retarget's continuity, the exact settle, `effect`'s clamp, the decay's projection, `presence` (the exit's
length to a frame, a revive mid-exit at the value the exit presented), `channel`'s one call an element, and reduced
motion (a retarget settled in the call that makes it, a presence that does not wait).

**Mutations.** Dropping `css.image` from Michael's avatar box (a bare 40x40 box) fails the two disc asserts (the middle
and the body are the panel `[23,27,32]`, not `[99,178,255]`/`[74,132,214]`). Making the body `nowrap` fails the wrap
asserts (alexjungle's body 20px, Erik's 60, David's 20) and, because the Science content then shrinks to 678, the scroll
asserts too (the offset stops at -14). `Track.retarget` resetting `v0` to 0 after sampling fails the mid-flight block
(`FAIL and it turns the throw back: the rest is 64, ten px above the 74 it was heading to: 27.87, wanted 64.05`).
Dropping the four `FIELDS.TEXT_COLOR` writes (the label keeps its style's literal and never fades) fails `FAIL and the
next frame is strictly between the muted token and the accent: false, wanted true` with every frame of both labels at
their ends (`59/156/240` and `139/152/165` throughout), and three more of that block. All files are compared with their
backup after the revert.

**What is not here.** No fetching and no paging: one recorded fixture per feed (three posts), News empty as in the app.
No thread screen, so a card click only selects. No images in post media — the media is a line (`[image]`, `[image: …]`,
`[video]`, `[link: …]`), as in the terminal. No avatars beyond the six committed PNGs (a real author's avatar is a remote
file). The drag is the window's mouse or a finger's events (SDL's finger events go into the same pointer; there is no
touchscreen here, so no finger has tried it). The name and the handle are two lines,
not the app's one row: the longest pair does not fit the 312px card and Clay has no ellipsis. A media line wraps at
spaces only, so a word wider than the card would run over the gutter: the Science link carries the app's own fallback
for an embed with no title, the host (`[link: sciencedirect.com]`), not its 60-character URI. And the light theme is the
TUI palette's light one, not the system's.

## The text sheet, and the oracles behind it

`app/Sheet.tsx` is not an app page: twelve lines of the strings and sizes the pages draw (11 to 32 px) in one column,
nothing that moves. It is the subject of the text oracles. `solid/text-oracle.swift` draws the same lines at the same
places with CoreText (at 1x into `frames/text-oracle.png`, at the window's density into `frames/text-oracle-2x.png`), and
`solid/text-canvas.mjs` the same with Chrome's Canvas2D (`frames/text-canvas.png`, the web target's rasteriser, through
Playwright). `solid/src/textmetric.ts` measures a line's **ink** — its coverage against the page's and the text's colour,
summed — and its **SSIM** against the reference at the best whole-pixel shift. `solid/text.test.ts` holds the frame to
all three references at their densities (no shift, a weight band per reference, an SSIM floor, the extent within a pixel
or two) and prints the tables; `bun solid/text-oracle.ts [--density 2|--canvas|--weight N|--sweep|--update]` prints and
re-stores.

The verdict is in `../README.md` ("Text: the oracles"): ThorVG's text weighs **1.008** of CoreText's on average (and
1.005 at the window's 2x density, where the glyphs are rasterised rather than enlarged), so the renderer's weight dial is
at 0; the browser target's Canvas2D is **1.37x** our ink and is recorded, not matched; and the one real defect is that
ThorVG has no fallback font (the ⅓ of the sheet's quote line is an empty box, SSIM 0.459 — asserted, not hidden).

## The accessibility tree

`solid/a11y.ts` is the tree a screen reader would walk: `snapshot(root, { parts, containers })` returns
`{ role, name?, value?, states, hasPopup?, level?, bounds?, children }` over the boxes that carry a role, in document
order. The fields are the box's own props first (`role`, `label`, `labelledBy`, `checked`, `expanded`, `selected`,
`disabled`, `focused`, `hidden`, `level`, `value`/`valueText`, `hasPopup`, `modal`), then the part `options.parts` names
by id. The pages spread their parts instead (`a11y(part)`: the part's `id` and each field above as a live getter,
`<box {...bind(part)} {...a11y(part)}>`), so a page's boxes are its parts' boxes and no `options.parts` table is needed;
`options.containers` still adopts a group part whose id is on no box at the lowest common ancestor of its items, but the
pages draw a box for every group now. The name is `label`, else `labelledBy` (the text of the element with that id, when
the tree has it), else the text of the box's descendants outside nested role nodes; a `text` element is never a node.
`hidden` prunes a box and its subtree, and so does an open modal dialog (role `dialog` / `alertdialog`, `modal` not
false): the page behind it is left out of the snapshot, as a screen reader does not see it. `bounds` is `ui.bounds(id)` of
the last frame, for a box with an id only.

`bun solid/a11y.test.ts` asserts the three pages' bare snapshots (`p.snap()`, no table of parts standing in for what a
page drops): every interactive box carries its part's role and the name a reader needs, so a dropped field fails the
test. It checks the Widgets page (the four checkboxes in their `group`, the radiogroup/tablist/toolbar/tree as the page's
own boxes with bounds, the disclosure named `Details` with no `+`/`-` in it, the menu button `Size: Medium` with
`hasPopup`, the tree's rows named by their nodes, the slider named by its caption with `40%` as its value, the mixed and
the disabled box, the disabled box no Tab stop, the tab-focused switch's path), the toolbar's open menu, the Field page
(textboxes named `Name` and `Read-only` through `labelledBy`, the value as typed), the Dialog page (closed: the zoom
trigger `Zoom: 100%` with `hasPopup`; open: the dialog alone, named by its title, the backdrop and the page behind not
nodes; and its menu), the rules on a hand-built tree, and two rules on every page: a role on every node, a non-empty name
on every role that requires one. Mutation: dropping `label` from the disclosure trigger fails the name assertions.

## Notes

- `bun solid/main.ts` needs no flag: Bun's `node` condition would load solid-js's server build (signals that never
  update), so `plugin.ts` loads the client build instead.
- `plugin.ts` runs the cssints plugin in a Node child (Vite, and `cssints/clay` as sources with the `development`
  condition), so a `styles.ts` costs about a second at start. A file is a style module by its name: `styles.ts` or
  `*.styles.ts`.
- Not here yet: reload on save, JSX types for `box` and `text`,
  a click quicker than one poll (the window's 16 ms loop
  keeps the last button state, so a press and a release inside one poll are lost), a menubar on a page (the headless
  `createMenubar` is ported and checked, but no page uses it: the toolbar's menu button is `createMenu`), a vertical
  radio, tabs or toolbar on the page (the parts take the option; the page has the horizontal ones), the tree's
  multi-select (`selection: 'multiple'` is in the part; the page is single) and its type-ahead (not ported), and disabled
  tree nodes (the part has none). The list scrolls one axis and one way: no horizontal scrolling, no momentum (Clay's
  wheel step is instant; the Sky feed has the first motion track, this page opts out), no pointer drag of its contents, no
  scrollbar to drag (the `n of 30` readout stands in for it), and the wheel reaches the viewport only while the pointer is
  over it: Clay scrolls the container under the pointer, and the window is not itself a scroll container.
- The text field is ours, not a port, and it stops at the simple text model: an index is a UTF-16 code unit (a `selection`
  can split a surrogate pair's halves when an arrow crosses it, as `selectionStart` does), no bidi handling and no
  right-to-left runs, no wrapping or multiline (a newline in `insert` is kept as a character; the row is one line that
  clips at the field's box), no undo/redo, and no IME composition *state* — SDL's text events are already committed
  characters, so a composition in progress is not drawn as one (the platform's IME window is what shows it, because
  `ui_text_input` starts SDL's text input). The clipboard is a single UTF-8 string up to 4 KB (the host's buffer), and
  copy/cut/paste are Cmd or Ctrl chords only (no middle-click or context menu). The caret's 1px is layout, not an
  overlay: the text after the caret sits 1px right.
