# The map: one UI, many targets

Styles in cssints, components in Solid 2 JSX, drawn on a desktop GPU, on an ESP32's CPU, in a browser and in a
terminal. This page says which layer does what on each target, what is proven, and the order of the work.

## Four layers

| Layer   | What it does                        | Where it runs                       |
| ------- | ----------------------------------- | ----------------------------------- |
| Author  | cssints styles, Solid JSX, state    | the editor (types catch errors)     |
| Compile | a style to a JS literal or to C     | the build (the cssints Vite plugin) |
| Layout  | boxes from styles and content       | the target: Clay                    |
| Raster  | pixels from boxes                   | the target: GPU or CPU              |

The rule (esp32 bean esp32-8j6y): **what can be computed at build time is computed at build time.** A style is data;
it needs no runtime on the device.

## Targets

| Target            | Styles          | Layout         | Raster                         | JS at run time | Status                        |
| ----------------- | --------------- | -------------- | ------------------------------ | -------------- | ----------------------------- |
| Desktop (macOS)   | `cssints/clay`  | Clay           | Clay's SDL3 renderer (GPU)     | optional (Bun) | a page in a window            |
| ESP32-S3          | `cssints/clay`  | Clay           | esp32's `render.c`, CPU bands  | none           | one element proven on board   |
| Browser (WASM)    | `cssints/clay`  | Clay (C→WASM)  | canvas 2D                      | none (the generated C) | a static frame and its `use_g` twin on a canvas |
| ESP32-P4          | `cssints/clay`  | Clay           | CPU + PPA (2D DMA)             | none           | later, needs a board          |
| Terminal          | `cssints/clay`  | Clay (cells)   | Clay's `termbox2` renderer     | optional (Bun) | after desktop; replaces `cssints/tui` |
| iOS, Android      | `cssints/clay`  | Clay           | ThorVG CPU, on a Metal/GLES surface (SDL3) | none (the generated C) | planned; the first slice is the section below |

Facts behind it:

- Clay ships renderers: `SDL3`, `SDL2`, `GLES3`, `sokol`, `raylib`, `cairo`, `web`, `win32_gdi`, `terminal`,
  `termbox2` (checked 2026-10-19). SDL3 3.4.14 is installed here.
- The ESP32-S3 has no GPU: raster is 17.8 ms of a 22.8 ms frame, layout 3.3 ms (board log, 2026-10-19).
- esp32's `ui.c` and `render.c` are plain C with no ESP-IDF; `host/test.c` already runs them on a Mac.

## Why desktop first

- It is where the framework has to grow: windows, input, text shaping, a GPU raster, live reload, Solid. The board
  only needs what the desktop already proved, compiled to C.
- The loop is seconds, not a flash. Every later target is checked against desktop frames.
- The board is proven at the one point that was risky (generated C equals hand-written C, on the device). It does
  not block anything, so it waits.

Other targets **later, not in parallel**: each one is a renderer choice under the same layout, so doing them after
the desktop costs a renderer, not a redesign. One exception runs alongside at no cost: `test.sh` keeps checking the
generated C against esp32's `clay.h`, so the board path cannot rot.

## The terminal

A Clay target like the others: Clay's numbers have no unit, so a measure function that returns one per character
lays out in cells, and Clay's `termbox2` renderer draws them. Focus, text input and the caret are built once in the
framework for the desktop and reused here; the system theme of `@cssints/tui/system` is renderer-neutral and comes
along.

It replaces `cssints/tui` and its OpenTUI and bomb.sh adapters, but not before it can carry what they carry today:
apps/csssky-tui and the docs' `/tui` page. Then `cssints/tui` is deprecated, csssky-tui moves over, and the old
subpath is removed in a breaking release with a migration. Lengths stay per target: a style in cells is not a style
in pixels, so a terminal page has its own styles under the same member names.

## Where Solid runs

| Target   | Solid                                                                     |
| -------- | ------------------------------------------------------------------------- |
| Desktop  | Solid 2 universal renderer building Clay's tree each frame (Bun FFI)      |
| ESP32    | none at run time: JSX evaluated at build time to C, state in C            |
| Browser  | none at run time yet: the same generated C as the ESP32, on a canvas      |
| Terminal | the desktop's universal renderer over Clay, cells for pixels              |

Measured for the ESP32: QuickJS 38 ms a UI turn (retired, esp32-mkn5); scriptc 0.3.6 has no Xtensa/RISC-V target and
segfaults on one Solid 2 `createSignal`; porffor is alpha.

## The contract

`ClayShape` of `cssints/clay`: the fields of `Clay_ElementDeclaration` and `Clay_TextElementConfig`. The plugin writes
it as a JS literal (desktop, browser) and `header()` as C (firmware). Text is per target: shaped glyphs on the
desktop, 4-bit bitmaps by `fontId` on the board.

## Order of work

Each step ends in a check that fails when it breaks.

1. **Done.** `cssints/clay`, `header()`, `generator/clay-header.ts`; `test.sh`: generated C gives the same render
   commands as hand-written C; the Units pill flashed and working on the board.
2. **Done: desktop window.** `vendor/clay` (clay.h and the SDL3 renderer at `e6cc369`, the same clay.h as the
   firmware's), `desktop/host.c`: a window on Metal, or one frame headless on SDL's software renderer.
   `examples/sensors`: the Sensors page from `styles.ts`, with a fixed sample. Check: two stored frames, before and
   after a scripted click on Units, compared pixel for pixel.
   **Done: the ThorVG raster.** `desktop/clay_renderer_thorvg.c`: Clay's commands as a ThorVG scene on its software
   canvas (brew thorvg 1.1.3, CPU engine only), `host --raster thorvg`, the default raster (`--raster sdl` is Clay's); text measured by ThorVG too.
    Check: two
   stored frames of its own (`expected-thorvg*.png`). Headless on an M2, the same 360x360 frame, one thread: ThorVG
   0.30 ms, SDL's software renderer 1.2 ms (2026-10-19; it does not transfer to the board). GL/WebGPU engines need a
   ThorVG built with them; then the ESP32-S3: ThorVG SW against `render.c`'s 17.8 ms, measured on the board.
   **Probed 2026-10-21: ThorVG's WebGPU engine is reachable on this Mac, and it is not the faster raster here.**
   `brew` builds thorvg with `-Dengines=cpu` (its formula; `nm` on the dylib has `GlCanvas`/`WgCanvas` as stubs and
   no GL/EGL/Dawn/Metal link, and a probe prints `swcanvas=<ptr> glcanvas=0x0 wgcanvas=0x0`), so the installed one
   cannot. Building 1.1.3 from source with `-Dengines=cpu,wg` against brew `wgpu-native` 29.0.1.1 (the version
   ThorVG's own CI pins; Metal backend, no Dawn, no EGL, no surface needed) works, and `tvg_wgcanvas_create` +
   `tvg_wgcanvas_set_target(device, instance, texture, w, h, ABGR8888, 1)` renders into a `BGRA8Unorm` texture (its
   blit pipeline is built for BGRA; read back and swapped to RGBA). That is `--raster thorvg-gpu` here:
   `desktop/thorvg_wg.c` (device, texture, copy-to-buffer, map, swizzle), `desktop/build-thorvg-gpu.sh` (ThorVG in
   `$TMPDIR`, then `build/<example>/app-gpu`, or `solid` for `build/solid/libui.dylib` with `ui_init_gpu`).
   `examples/sensors/expected-thorvg-gpu.png` is its own frame: shapes, colours and text land on the CPU frame's
   pixels (mean channel of the frame within 0.06/255), 3809 of 129600 pixels differ, every one of them on a glyph or
   rounded-corner edge and nowhere else (max 90/255, mean 16/255 there) — the GPU tessellates and anti-aliases edges
   its own way. Numbers, M2, one thread, `--bench 500`, same 360x360 Sensors frame: software 0.31-0.34 ms, WebGPU
   **0.85-0.87 ms** (submit + copy + map + swizzle back to CPU pixels), SDL's software renderer 1.30-1.43 ms; at
   1080x1080 it is 0.62 ms against 2.19 ms, so the readback dominates and the GPU does not catch up by frame size.
   Verdict: kept as an opt-in probe, not the default. The GPU path only wins if a frame never comes back to the CPU —
   i.e. ThorVG draws into the window's own WebGPU surface (`tvg_wgcanvas_set_target` type 0) and presents it, which
   means this host would have to own a WebGPU swapchain instead of SDL's renderer (the SDL Texture upload goes away,
   but SDL3's GPU API cannot host a WebGPU texture; either the window becomes wgpu-native's own, or the host stays on
   SDL and the readback stays). For the ESP32-S3 the CPU engine remains the target either way.
   **Tried 2026-10-21: that surface path, and it draws the page.** `desktop/wg_window.c` (opt-in:
   `sh desktop/build-wg-window.sh` -> `build/sensors/wg-window`) owns the window: SDL for the events and its
   `CAMetalLayer`, wgpu-native wraps that layer in a surface, ThorVG's WebGPU canvas targets it (type 0) and the loop
   presents it — no copy to a buffer, no map, no SDL texture upload. `--capture` draws one frame into a swapchain
   texture this file acquires itself (type 1) and reads it back once, which is how the frame is checked without a
   screen: **0 of 518400 channels differ from `expected-thorvg-gpu.png`**, so the window shows the CPU frame exactly.
   (The trap on the way there: a host that does not create `tvg.measurer` measures every run at width 0, Clay then
   stacks all the page's text in the middle of the window, and the frame differs in 58872 channels — that paint is
   `Clay_ThorVG_MeasureText`'s only state, and the surface path has nothing else to set it.)
   Numbers, M2, one thread, `--bench 200`, five runs each: the surface path is **12.4-16.4 ms a frame (61-81 fps) at
   1080x1080 and 12.7-16.4 ms at 360x360 — one range, the screen paces it, not the GPU**. Per frame, layout is
   0.02-0.09 ms and present 0.008-0.026 ms (it never waits); the rest sits in ThorVG's sync. Timed from inside a
   throwaway ThorVG build (temporary timers in `WgRenderer::sync`), that sync is 14.2 ms at 360x360 and 14.8 ms at
   1080x1080, of which the layer's next drawable is 13.7 and 13.3 ms: ThorVG's own frame work is **0.49 and 1.49 ms**,
   the wait is the compositor's — a 16x16 surface still takes 8.2 ms, and `--novsync` (a non-Fifo present mode on top
   of ThorVG's Immediate) does not lift it. So vsync cannot be separated from the frame here, only from its parts: what
   is left out of the wait is 0.5-1.5 ms of ThorVG's work. Against the readback path at the same sizes, CPU raster
   0.31 ms / readback 0.67-0.80 ms at 360x360 and 0.52-0.70 / 2.1-2.3 ms at 1080x1080: the surface path removes that
   readback (0.3-0.6 ms of it) and the texture upload, but ThorVG's WebGPU frame work is itself more than the CPU
   raster's 0.31-0.70 ms, so no raster gets faster for it — the frame just runs at the screen's pace. Kept as an opt-in
   experiment; the defaults (`--raster thorvg`, `--raster sdl`, `--raster thorvg-gpu`) are untouched.

3. **Done: states, tokens, fonts in `cssints/clay`.** `css.hover`/`focus`/`active` print as whole declarations of
   their own (`units_active`); `createTokens` and `createGlobalTheme(tokens, "light", ...)` print every style again
   per theme (`units_light`, `units_active_light`, `title_text_light`), so a page switches at run time by a suffix;
   `fonts("Roboto")` sets `fontId` and prints the font order as an enum. `examples/sensors`: colours as tokens, the
   the pill as `css.hover` and `css.active` (page.c picks `units_hover` over it, `units_active` when held), `THEME=light` for the light theme.
   The pressed look lifts the surface instead of the firmware's `ACCENT_DOWN` orange, which left the ink at 1.28:1; the
   ink on the base, hover and pressed fills is asserted at 4.5:1 and up in `solid/test.ts` (dark 15.8/10.3/7.9, light
   15.8/14.4/12.6). The firmware's `ACCENT_DOWN` is gone the same day: a pressed control sinks to `PRESSED` (28,31,40), since its rows
   carry DIM and ACCENT text too (TEXT 13.9, DIM 5.9, ACCENT 6.7). Flashed and seen on the board (2026-10-19):
   the pill and a settings row sink while held, no Clay errors, 55 commands, 22.8 ms a frame.
   Check: cssints test/clay.mjs; `expected-light.png`; and
   `examples/sensors/header.c`, the header's states and theme asserted in C99 against esp32's clay.h. In the window,
   the `t` key toggles the theme; `expected-pressed.png` stores the pressed frame (`--press`, held down). Seen in the live window (2026-10-19): `t` switches the theme, the pill presses and toggles the unit.

4. **Solid on the desktop.** A universal renderer over Clay through `bun:ffi`, live state, reload on save. Check:
   a click changes a signal and the next frame.
   **Done: the renderer and the Sensors page** (`solid/`, solid-js 2.0.0-rc.13, @solidjs/universal and
   @solidjs/compiler rc.13). The universal renderer keeps a JS tree; each frame it is declared to Clay through flat
   `bun:ffi` calls into a dylib (Clay + ThorVG + SDL3), styles from `examples/sensors/styles.ts` through the cssints
   plugin, theme and `:active` picked at run time. Check: `solid/test.sh` renders the Solid page headless and compares
   it with the C page's three ThorVG frames, pixel for pixel (identical), plus the pressed look and click rules. Cost:
   about 0.4 ms a frame on an Apple-silicon Mac, 0.006 ms of it the JS walk and FFI, the rest ThorVG's raster. Left: reload on save,
   JSX types, the window checked by eye.
   **Headless widgets** (`headless/`, between Solid and JSX to C). The first widgets of effects-of-atmosphere's
   `@eoa/headless` (button, switch, checkbox, disclosure, radio, tabs, toolbar, slider, tree) with no DOM: Solid 2 signals for state and, instead of aria-*
   attributes, parts of plain fields (`id`, `role`, `checked`, `selected`, `expanded`, `controls`, `tabIndex`, `hidden`, `disabled`, `focused`, `valueNow`, `level`, `posInSet`, `setSize`)
   with handlers (`press()`, `key(name)`, `focus()`, `blur()`) that a Clay renderer and an accessibility tree both read. Radio, tabs, toolbar and the tree are groups of the focus manager
   (`focus/`) on one page: roving focus inside, Tab between them. The slider is one entry.
   Check: the ported APG scenarios and a seeded random walk, replayed on the parts and on the generated Quint model,
   must agree (`bun test` in `headless/`, in `test.sh`); dropping a controlled request's callback fails 39 tests.
   **Dialog and menu** (`headless/src/dialog.ts`, `headless/src/menu.ts`): the modal dialog (a trap over the focus
   manager: opening moves focus to the first control, Tab and Shift+Tab cycle it, Escape closes and restores) and the
   menu button with the checkable menus (`createMenu`; the menubar is not ported). Check: the dialog's 161 scenarios (32
   replayed, 112 gated by the bridge — `modal: false`, focus attrs — 17 carried divergences) and five walks; the plain
   menu's 114 (19 / 86 / 9) and the checkable menu's 34 (16 / 14 / 4), with their walks. Left: the menubar, other
   overlays, tree type-ahead.
   **Done: the Widgets page** (`solid/app/Widgets.tsx`, `bun solid/main.ts widgets`): the headless widgets and the focus
   manager wired to one live page; the page's styles sit in `Widgets.tsx` itself (the loader compiles JSX, then cssints
   on the result, in one child: colocation without a separate `styles.ts`). SDL key events reach JS through a queue in the FFI; a key goes to the focus manager
   (Tab, Shift+Tab, arrows), then the focused part (Space fires on key up), then the page; a press focuses a part as a
   browser does and a press on empty space blurs; `:focus` is a style state like `:active` (a 2px ring, laid over the
   pressed look). Check: six stored frames (initial, Tab Tab, switch on, mixed, disclosure open, light) and
   `solid/widgets.test.ts` (Tab order, key timing, clicks and focus, the disabled box). Seen by eye: the frames; the live window
   was started, its keys and mouse not tried by hand.
   **Done: radio, tabs, slider, toolbar on the page.** The four groups of `headless/` on the same page (360x608), in the one
   shared focus manager: radio, tabs and toolbar are its groups (roving focus, one Tab stop each; the checked radio and
   the selected tab are the entry, the toolbar remembers its last item), the slider is one entry whose rail takes the
   focus ring (the value text stays outside it) and whose rail (or knob) takes a press (`ui_bounds` gives the ratio). A held press drags: each frame's
   pointer x is the ratio, so the knob follows and the value changes continuously; a release ends it. A key goes to the manager only for Tab; an arrow is the focused part's, which moves
   focus and checks or selects. Check: eleven stored frames (the old six regenerated at the new height, their old layout
   unchanged above the new widgets; radio, tabs, slider, slider dragged, toolbar re-entered) and asserts for the full Tab
   order, one stop a group, arrows, clamping, memory, a disabled radio, the rail, the drag, the rail's ring. Seen by
   eye: the eleven frames; the window was started (`--frames 60`), its keys and mouse not tried by hand.
   **Done: the tree on the page.** The sixth group is `headless/`'s settings tree (360x760 now): Network open with
   Wi-Fi and Bluetooth, Display closed with Brightness, Storage a leaf — six nodes, one level of nesting. It shares the
   page's focus manager, so it is one more Tab stop (the twelfth) entered at the first visible row, and its keys reach the
   part as any focused part's do (no page-level key handling): Up and Down, Home and End walk the visible rows only (a
   closed subtree's node has `tabIndex: -1` and is not even in the Solid tree), Right opens a closed parent and steps into
   an open one, Left closes or steps to the parent, Space selects, Enter opens and selects, a click does both and focuses.
   The row's left padding is 18px a level, `+`/`-` marks a parent, the selected row is the panel surface with an accent
   label, and the roving row takes the same 2px ring as the other rows (both themes; the accent on the surface is
   asserted at 4.5:1). The page grew to 760 so the tallest state (panel open and Display open) still fits and nothing is
   shrunk. Check: five tree frames (Tab in, Down, Right on the closed Display, Space, light) and asserts for the stop,
   the entry, the visible-only arrows, Right and Left, Home and End, Space, the ring following the roving row, a hidden
   node skipped, the indent, and the page fitting. Seen by eye: all sixteen frames; the window started with
   `--frames 60`, exit 0, its keys and mouse not tried by hand.
   **Done: the toolbar's menu button, and the menubar in `headless/`.** The toolbar's third item is now a menu button
   (`createMenu`, radio items Small/Medium/Large, Medium checked): the item's label shows the chosen size, it carries
   `aria-haspopup`, and Down, Up, Enter or Space open the menu as a capturing float under the item (`css.float({ parent:
   "format-item-2", ... })`), so the page under it is unreachable by that press. Inside, the arrows and Home/End move,
   Enter picks and closes, Escape closes and returns focus to the item, Tab closes and goes on; the page routes it through
   `input.modal`. The toolbar's roving focus treats it as one more item (Left/Right/Home/End, one Tab stop, memory), and
   the ring is now the slider's rail only, so the value text sits outside it. `headless/` also gained eoa's
   `createMenubar` (the roving bar, a menu per item, one more level of submenus, the focus manager in place of
   `document.activeElement`), its `menu-menubar.qnt` bridge, model and both scenario files vendored byte for byte from
   `09f2185`. Check: 74 menubar scenarios (26 replayed, 30 gated by the bridge, 18 carried divergences) and one walk;
   breaking Escape's focus return fails the walk and the unit test. The page: a new `widgets-toolbar-menu` frame and
   asserts for the ring on the rail only (and none on the readout), opening by Down/Up/Enter, the menu's arrows, Home/End,
   Enter picking, Escape returning focus, Tab closing, the float's `ui.bounds` under the item, a click picking, and the
   toolbar's roving with the menu button in it. Seen by eye: all seventeen Widgets frames; every frame that shows the
   toolbar changed with the third item's label (the change is confined to that item), and the two slider frames also with
   the ring. The window was started (`--frames 60`, exit 0); its keys and mouse were not tried by hand.
   **Done: floating overlays on a page** (`solid/app/Dialog.tsx`, `bun solid/main.ts dialog`). `css.float` is carried
   through `pack.ts` and `ui_open` (the style grew from 32 to 45 floats: what to attach to, the attach points, offset,
   expand, z-index, pointer capture, clip, and the parent id as two 16-bit halves, since a float32 cannot hold Clay's
   32-bit hash). A float is a layout root of its own, so the page behind it keeps its layout, and a capturing float hides
   what is under it from `Clay_PointerOver`: the modal's backdrop is a root float of the whole window and swallows every
   press, the dialog is a root float centred on the root, and the menu hangs off its trigger by id. The dialog's trap is
   the keyboard half (`input.modal`: Tab and Shift+Tab cycle its controls, Escape closes) and focus returns to the
   trigger. Check: four stored frames (closed, open, the light theme, the menu open) and `solid/dialog.test.ts` (the
   trap, Escape and Cancel, OK's write, the backdrop swallowing a press, `ui.bounds` of both floats, the page's layout
   unchanged, the menu's arrows, Escape back to the trigger, Enter and a click picking). Seen by eye: the four frames.
   The window was started for the page (`--frames 60`, exit 0); its keys and mouse were not tried by hand.
   **Done: a text field** (`solid/app/Field.tsx`, `bun solid/main.ts form`; `headless/src/textfield.ts`). Text is a
   second path beside the keys: while a text field has focus the host turns on SDL's text input (`ui_text_input` →
   `SDL_StartTextInput`/`Stop`), the poll queues every `SDL_EVENT_TEXT_INPUT` next to the keys (a composed run of UTF-8,
   never a keycode) and `ui_text_pop` hands it to `Input.textInput`, which inserts it into the focused part; the key
   queue is untouched. Editing keys stay keys — `Backspace` and `Delete` joined the names, and `selectionName` keeps
   Shift on the arrows/Home/End (the focus manager still only gets plain Tab, and `keyName`'s contract is unchanged) —
   and Cmd/Ctrl+C/X/V go through SDL's clipboard in C (`ui_clipboard_get`/`set`). The neutral `createTextField` is
   **ours, not a port**: eoa has no textfield and `specs/apg/` has no textbox, so there is no vendor file, model or walk
   and the conformance counts did not move. Its part is `role: "textbox"` with `value`, `caret`, `selection`, `valueText`,
   `readOnly`, `disabled`, `focused`, `tabIndex`, `editsText`; handlers `insert`, `keyDown`, `focus`/`blur`,
   `press(x, advance)`, `clipboard`. The page draws the caret and the selection by laying the value out as up to three
   text runs with a 1px caret box between them (Clay has no text attributes, so this needs no per-glyph measure; the
   caret costs that 1px of layout), and only a press needs an advance: the row's `ui.bounds` width over the text's
   length, an approximation a proportional font can be a character off. Check: five stored frames (empty with the caret,
   "Ada", Shift+ArrowLeft×2, submitted, light) and `solid/field.test.ts` (typing reaches only the focused field, the
   theme key after Escape blurs, the caret's and the selection run's pixels and x, the arrows, Backspace/Delete,
   `maxLength` 24, a press placing the caret, the read-only field refusing edits, Enter and Submit showing the value
   once, the page fitting); 26 unit tests in `headless/test/textfield.test.ts`. Inserting at the start instead of at the
   caret fails seven of them and two asserts of the page test. Seen by eye: the five frames, zoomed; the window started
   (`--frames 60`, exit 0) but typing in it was not tried by hand. Left: bidi, grapheme clusters (an index is a UTF-16
   unit), wrapping and multiline, undo, IME composition state (SDL's text events are committed characters), drag-select,
   and the caret's 1px layout cost.
   **Done: scrolling** (`solid/app/List.tsx`, `bun solid/main.ts list`). Clay's own scroll containers, driven by the host:
   `ui_window_poll` adds every SDL wheel event to the frame (`ui_wheel`), `ui_begin` calls
   `Clay_UpdateScrollContainers(false, delta, dt)` before `Clay_BeginLayout` so the container under the pointer moves by
   the wheel and clamps itself to its content, and `ui_open` gives each clip element its offset back through
   `Clay_GetScrollOffset()` before the declaration is configured — the two calls Clay's debug view makes, so the layout
   shifts the rows and the renderer's scissor cuts what leaves the box. `cssints/clay` needed **no new member**:
   `css.overflow("hidden")` was already the declaration and `pack.ts`/`ui_open` already carried the two clip flags for the
   floats. The page is 30 rows in a 240px viewport with the readout and the footer as its siblings, so they stay put; the
   wheel scrolls, and one Tab stop takes Up/Down, PageUp/PageDown and Home/End, which move the selection (clamped to
   0..29) and `ui_scroll_to` the view the least it takes to show the moved row, measured from the row's and the
   viewport's `ui.bounds` of the last frame. Check: four stored frames (the top, 32 notches down
   with both edges cut, the selection moved to row 13 with the view scrolled to it, the light theme) and
   `solid/list.test.ts` (10px a notch and the rows moving by exactly that, both clamps, the clip's pixels above the
   viewport, the keyboard reveal and its bounds, the wheel not moving the selection, the header and footer unmoved, the
   ring's pixels, the wheel only under the pointer, the page fitting). Dropping the scroll-into-view fails eleven of them.
   Seen by eye: the four frames; the window started (`--frames 60`, exit 0) but its wheel and keys were not tried by hand
   (the screen is not visible to me). Left: horizontal scrolling, momentum (the Sky feed got the first motion tracks,
   item 2; this page keeps Clay's instant wheel step), dragging the list with the pointer, a
   scrollbar (the page has a "n of 30" readout instead) and dragging one, and scrolling the page itself when the wheel is
   outside the viewport (Clay scrolls the container under the pointer only).
   **Done: the accessibility tree** (`solid/a11y.ts`, `solid/a11y.test.ts`). `snapshot(root, { parts, containers })`
   walks the rendered tree in document order and returns `{ role, name, value, states: { checked, expanded, selected,
   disabled, focused, hidden }, hasPopup, level, bounds, children }`: the name from the part's `label` / `labelledBy`
   (resolved to the text of the element it names) / the text of its descendants outside nested roles, `hidden` pruned
   with its subtree, and an open modal dialog's page pruned as a screen reader sees it (not marked hidden); `bounds` is
   `ui.bounds` of the box's id. `a11y(part)` is the other half: the part's `id` and each field as a live getter, spread
   by a page on the box that draws it (`{...bind(part)} {...a11y(part)}`), so a page's boxes are its parts' boxes and a
   field a page drops is a missing role, name or state in the snapshot. Still missing: `controls`/`describedBy` never
   reach the snapshot (no disclosure→panel, tab→panel or trigger→dialog link), no live regions, no trap order in the
   snapshot (the keys are tested in `dialog.test.ts`), `tree`/`toolbar`/`tablist`/the checkbox `group` have no accessible
   name, and the List and Sensors pages are not covered (they are not headless parts). Check: the three pages' bare snapshots
   (`p.snap()`, no table of parts) — the Widgets page (the four checkboxes in their `group`, the
   radiogroup/tablist/toolbar/tree as the page's own boxes with bounds, the mixed and the disabled box, the disabled box
   no Tab stop, the disclosure named `Details` with the `+`/`-` mark outside its name, the toolbar's `Size: Medium` with
   `hasPopup: "menu"`, the tree's rows named by their nodes, the slider named `Volume` with `40%` as its value, the
   Tab-focused switch's path), its open menu, the Field page (the textboxes named `Name`/`Read-only` through
   `labelledBy`, the value as typed), the Dialog page (closed, the zoom trigger `Zoom: 100%` with its `hasPopup`; open,
   the dialog alone named by its title, the backdrop and the page behind no nodes; and its open menu), a hand-built tree
   for `labelledBy`, `hidden`, nesting and absent bounds, and two rules on every page: a role on every node, a non-empty
   name on every role that requires one. Dropping the disclosure trigger's `label` fails the name asserts. Left:
   `aria-controls`/`describedBy` in the tree (the parts carry `controls` and `describedBy`; no field copies them, and no
   disclosure, dialog or menu exposes them), live regions, the focus trap in the snapshot (the dialog's Tab cycle is
   `dialog.test.ts`'s, not the tree's), the `tree`/`toolbar`/`tablist` containers unnamed (the page has no caption for
   them), and the List page, which is no headless part and so has no roles at all yet.
   **Done: the first real app** (`solid/app/Sky.tsx`, `bun solid/main.ts sky`). csssky's home feed at phone size
   (360x760): the wordmark and the three feeds as a headless tablist, a clip element (664px of the window) that the page's
   own motion track scrolls — 10px a wheel notch, a flick's decay, Down/Up 40px, PageDown/PageUp a viewport, Home/End,
   clamped to the cards' height (item 2's tracks; it is the first page that owns its offset and turns
   `ui_auto_scroll` off) — and six cards
   from the app's own recorded fixtures — three Discover, three Science, News empty — with the author's name and
   `@handle · age` (`ago()` pinned to the fixture's capture moment, not the clock), a body (14px/20) that **wraps** (the
   first page where text does: the body is a stretch text inside the card's percent width, because a clip element lets
   its children grow past the viewport for their content), the media as the terminal's line, the TUI's sky palette, counts in words
   (`8 replies · 32 reposts · 310 likes`, `3.5K` from 3,500) because Roboto has no retweet or heart glyph, and a **drawn
   avatar** per post: `css.image` over the six committed 64x64 PNGs, so the Solid path's image support (`5cf6477`) now
   carries a real screen. A card hovers to the next panel tone, a click records the selection in a signal (the status
   line names it; there is no thread screen), and the bar and status line are the feed's siblings, so they do not move.
   Check: four stored frames (Discover, Science after a click on its tab, the light theme, Science 8 notches down) and
   `solid/sky.test.ts` (the avatars' pixels — the panel at the box's transparent corner, the author's hue in the disc,
   michaelwarburton `74 132 214` and erikstrub `126 108 200`, and the change with the tab; Erik's body four 20px lines
   and the media line that makes Titania's card 18px taller than Michael's; hover on a card and a tab; the wheel's one
   notch gliding `2.59, 1.92, 1.42…` px a frame to exactly 10 with the bar and status still, eight notches flinging to
   the clamped 78 in 31 frames and the stored `sky-scrolled.png` matching that frame 0 pixels, a wheel up mid-throw
   landing 10px back at 64.05 with no step jumping; the keyboard's 40px a Down, a viewport a Page, Home/End on the same
   track, and the clamps; the feed's ring pixels;
   the tabs switching the feed and News' empty centred muted line; the page fitting). Mutations: a bare 40x40 avatar box
   fails the disc asserts, a `nowrap` body fails the wrap asserts and (the content then short) the scroll ones, and
   `Track.retarget` dropping the sampled velocity fails the mid-flight block. Seen
   by eye: the four frames, zoomed — the bar's underline, the name and handle, the counts' `·`, the avatar discs. Left:
   no fetching or paging (three recorded posts per feed), no thread screen, no post images (a media line), no avatars
   beyond the six committed, no drag scrolling (the wheel is the only input; touch has no host yet), the name and handle
   on two lines because the pair does not
   fit 312px (Clay has no ellipsis), and media lines that wrap at spaces only, so the Science link shows the embed's host
   instead of its 60-character URI (the app's own fallback when a link has no title).
5. **JSX to C.** The same component evaluated at build time to C calls, for targets with no JS. Check: its render
   commands equal step 4's for the same state.
   **Done: the evaluator** (`generator/page-to-c.ts`, `bun --conditions=development`). It imports `solid/plugin.ts`
   (JSX and cssints compile as in the app), renders a page with `solid/src/renderer.ts` into an `El` tree, replays the
   state's events, and walks the tree in tree order, one function per theme. A style is not printed again: the style
   object is looked up by identity among the exports of the modules passed with `--styles`, and the C names are the
   ones `generator/clay-header.ts` gave it in `styles.h` (`root`, `units`, `units_active`, `title_text`, `<name>_light`),
   so `header()` prints declarations (one per export, with its states and themes) and page-to-c prints only the frames.
   A style the page does not export (declared inside the .tsx) is printed by `header()` itself and named `style_<n>` in
   tree order: one printer, two sets of names, no second C printer. The state is a build-time input: `--state use_g=true`
   looks the key up in `examples/sensors/states.json`, which says how to reach it (a click on `Units`, i.e. the page's own
   `onClick`, called where the frame calls it on release), so the generator drives the page's signals the way the host
   does; a `pointer` action declares the pointer over an element, down or up, which is a build-time `:active`/`:hover` and
   picks `units_active`/`units_hover`. States stay overlays: the state that holds picks one declaration, and when two
   hold at once the generator checks that the last one's declaration equals their merge (pack.ts's order) and fails
   loudly when it does not.
   Emitted: `examples/sensors/page_generated.c` (the base), `page_generated_g.c` (use_g true) and
   `page_generated_pressed.c` (the pointer over Units, held), 36 lines each, six frame functions, no style declarations
   of their own.
   Check: `examples/sensors/gen.c` runs the three generated files and `page.c`'s hand-written frame through Clay at
   360x360 with one fixed measure and compares the command arrays field by field (type, id, z-index, box, colour, corner
   radius, border width, and the text's bytes, colour and font fields): six comparisons (dark and light × base, clicked,
   pressed), 10 commands each, identical. Step 4's frames already hold `page.c` equal to the Solid page pixel for pixel,
   so generated C = hand C = the desktop's frame. `test.sh` regenerates the committed C and `cmp`s it, so the file in
   git cannot rot; `InlineDemo.tsx` (styles in the .tsx, no styles module) is generated and compiled for the literal
   path. Mutation: `units` to `units_active` in the base frame fails at `renderData.rectangle.backgroundColor`, one digit
   of a value fails at the text's bytes. Cost: about 1.2 s a state (3.5 s for the three) plus one C compile.
   Left: **events are dropped** (`Clay_OnHover`, keys, `onPress`): the C page is one static frame and cannot toggle
   `use_g`; a host that wants the other frame builds it. No run-time signals for the same reason. Not emitted: Dialog and
   Widgets' menu (floats; `Clay_ElementDeclaration.floating` would print, but no page proves it and the pointer capture
   is the host's), List (the viewport's offset is `Clay_GetScrollOffset()`, which `ui_open` asks Clay for each frame, not
   a declaration), Field (typing is SDL's text events) and Widgets itself (12 Tab stops and keys; a static frame is
   possible but unproven). The style contract has no image config, so images cannot be emitted; `clip.childOffset` is
   the host's too. `:focus` comes from a prop, not a signal, so only a page rendered with `focused` gets it. The fonts
   enum (`font_Roboto = 0`) is the header's; the C page carries no font array, and text measure stays the host's
   (gen.c fixes one to compare layout). Text without a style is the renderer's white 14, printed as `white_14_text`.
6. **Done: the terminal renderer.** `terminal/`: Clay's commands into a grid of character cells (`cells.c`: a
   code point a cell, 8x16, a palette index each; ANSI truecolour with SGR runs merged, and a plain-text dump for
   tests), `render.c` (a box's cells: fill as their background, border as `─│┌┐└┘` on the rect's perimeter, text at
   `x/CELL_W` one row clipped, a scissor stack), `measure.c` (a code point a cell, a line a cell: a monospace grid)
   and `main.c` (no window: raw termios and a full repaint with `\x1b[H` in a terminal, `--dump`, `--ansi` and
   `--keys` headless). The page is the Sensors page plus a list in C (`terminal/page.c`), the generated `styles.h`
   from `examples/sensors/styles.ts` with only the root's padding/gap and the pill's height re-cut for cells; Tab,
   Up/Down, Space/Enter and `t` as on the desktop. Check: `terminal/test_cells.c` (clipping, the box characters,
   UTF-8, SGR merging, the scissor stack) and three stored dumps (dark, light, after `Tab,ArrowDown`) plus ANSI
   asserts (the title's and the pill label's truecolour; the surface fill is one escape a row, not one a cell) in
   `test.sh`; dropping the text colour fails the ANSI assert.
   **`csssky-tui` in cells**: `terminal/sky.c` is its home screen (the bar with the three feed tabs, the cards from
   `apps/csssky`'s recorded `home-discover-1`/`home-science-1`, the footer), `terminal/thread.c` its thread (the
   parent, the post with its full time and counts in words, the replies at their depth), and `terminal/profile.c`
   `apps/csssky`'s profile (the header, the Posts/Replies/Media tabs, those three fixtures) — the tui has no profile
   screen of its own, and that is the one honest gap in "port the app's screens". `terminal/focus.c` is the keyboard
   focus: stops in document order, Tab/Shift+Tab with the focus released at either end, a group as one stop with
   roving focus (an orientation, wrap and leave-at-the-edge), and `focus(id)` refusing a disabled stop — the semantics
   of `focus/src/focus.ts`, not shared code with it (the C page has no DOM to register into, so its stops are rebuilt
   when a feed or a tab changes the rows). `terminal/shell.c` is the screen stack (`enter` pushes, `esc` pops). The
   pages' rings are the focus state, not two ints. Check: `terminal/test_focus.c` (Tab order, the release, a roving
   group with and without wrap, leaving at an edge, memory, Home/End, a disabled stop), `terminal/expected-thread.txt`
   and `expected-profile.txt` (the two screens), `expected-sky-focus.txt` (the bar focused, its roving tab the active
   feed) and, in `test.sh`, the accent border's rows in the ANSI of focused/unfocused frames (a click and `ArrowDown`
   move the ring), the bar's wrap, the list leaving at its edge, a click on a control of each screen, and the scroll of
   the thread and of the profile. Breaking the group's wrap, or its leave, fails both a unit test and a page test.
   Left: **termbox2 is in** (`terminal/vendor/termbox2.h`, upstream master, MIT, sha256 `e019abb9`; `terminal/tb2.c`: truecolour or 256, keys and the mouse, checked through a pty in
   `test.sh`), and so are clicks; what a click cannot do is hover — termbox2 reports no motion events. Still left:
   `csssky-tui`'s own profile and notifications screens (it has neither; the profile here is the web app's), its data
   fetching and paging (every frame is one recorded fixture), images (a media line; counted and reported, not drawn),
   quote boxes, a body that wraps (one clipped row), the system theme of `src/system.ts` (the static dark/light ones
   are ported), the wheel and dragging, wide glyphs and emoji (a code point is one cell), floating overlays (untried),
   sub-cell borders and radii (a 1px and a 4px border are both one cell, a corner radius is a square corner),
   scrollback, and Solid on the terminal (the pages are C, as step 5's). The
   cell size is the cost: 8x16 makes a 38px pill 2.4 rows and a 200px pill 25 columns, so a page's pixel lengths
   have to be re-cut to land on cell boundaries, and text smaller or larger than a cell is the same cell.
7. **Back to the board.** esp32's `ui.c` reads generated `styles.h` and C from step 5; then the browser (WASM) and the
   ESP32-P4. Checked by hand in the live window (2026-10-19): Tab order and ring, Space on release, the switch, Select all and mixed, Details, click focus, `t`.
   **Done: the board draws the generated page** (esp32 branch `step7-generated`, cssints-native `b3b3e01`): the Sensors
   page is `main/generated/page_sensors.c` (+ the pressed variant), regenerated by `main/generated/regen.sh` and committed,
   not built at IDF time (`--text ui_sensors_text` hands the live sample to the page; `fontId` is remapped to the board's
   three faces). The hand-written page and the generated one give the same 10 commands on the host (`host/generated.c`,
   at rest and held), the firmware's own host test passes with the generated sources, and `idf.py build` gives 0 warnings,
   +1.5 KB. Flashed and seen on the board (2026-10-21): 55 commands, 0 Clay errors, 22 ms a frame. What the generated page
   cannot carry stays in `ui.c`: the strings, the press on `Units`/`Title`, the pressed frame, and the tab count; the
   page's pressed look is the desktop's lift (64,70,90), not the shell's sink.
   **Done: the browser** (`browser/`, step 8): the same generated C as WebAssembly (`zig cc -target wasm32-wasi`, 104 KB),
   Clay's measure callback answered by Canvas2D, `browser/render.js` drawing the commands; the wasm's 10 commands match the
   desktop's, the raster differs only in glyph and corner anti-aliasing (6.4% of pixels; per-region means within 14/255),
   0.07-0.12 ms a frame in headless Chromium. No Solid and no ThorVG in the page yet.
   **Done: ESP32-P4 builds** (esp32 branch `p4-target`): `set-target esp32p4` + build, 471,920 B against the S3's 1,248,176 B
   from the same sources, 0 warnings, no Wi-Fi/BLE symbol in the image, the pages untouched behind `#if CONFIG_IDF_TARGET_*`.
   No panel: `display_init()` refuses without a board, and the path is `esp_lcd_new_dsi_bus` + the `esp_lcd_st77916` 2.0.2
   driver + `esp_driver_ppa` for the blit (no `esp_lcd_p4` component exists in IDF 5.5.3).

8. **Done: the browser.** `browser/page.c` is Clay plus **step 5's generated C, unchanged** (`page_generated.c` and
   `page_generated_g.c`), compiled by `zig cc -target wasm32-wasi` (a libc; there is no emscripten and no `wasm-ld` on
   this machine, and Apple's clang has no wasm target) into 104,375 bytes: 10 commands, 19 slots each, read out of the
   wasm's memory by `browser/render.js` — type, id, box, colour, corner radii, border widths, text bytes. The one import
   is `env.measure`: Clay's measure callback calls Canvas2D, so the layout is the font the canvas draws with (Roboto
   from `vendor/fonts`), not a table from another raster. The draw is Canvas2D: `roundRect` fills, borders as the
   even-odd ring inside the box as ThorVG draws them, `fillText` on the alphabetic baseline one ascent below Clay's line
   box, `clip()` for a scissor. `frame(0)`/`frame(1)` are the two generated frames; `w` or the button toggles them, which
   is the only state on this target (the generated C has no events). No framework and no build step in the page: a static
   `index.html` plus the wasm, 8,505 bytes of page.
   Check: `browser/check.mjs`, Chromium through Playwright, in `test.sh`. (a) the command array against the desktop's own
   for the same C (`browser/dump-commands.c`, Clay + SDL_ttf/Roboto, the frame of `expected-thorvg.png`): 10 commands,
   same order, ids, colours, strings and font sizes; the worst box is 3.09 px out, because Canvas2D does not hint and
   SDL_ttf sums integer advances, so a 20 px line is up to 3 px wider and a centred box moves by half of that. (b) the
   raster against two stored frames, as per-region (command box) mean colours plus each text line's ink box, not per
   pixel: against its own `browser/expected.png` every 8×8 block is within 3/255 (identical here); against ThorVG's frame
   6.4 % (base) and 10.0 % (`use_g`) of pixels differ, every region mean within 13.9/255, every text ink box within 4 px,
   and the frame's mean colour within 1.17/255 — i.e. the same colours and layout with glyphs and rounded corners
   drawn by another rasteriser. The browser's own frame is the regression guard, ThorVG's the design. Cost, headless
   Chromium on an M2: 0.08 ms a frame for the layout, the commands and one readback (100 frames), so the raster is the
   cost and it is the compositor's.
   Limits: no Solid in the page (a static generated frame, as step 5's); no events beyond the unit toggle, so it cannot
   drive the other states; no ThorVG (Canvas2D instead); no touch, no scrolling, images or floats (the page has none, and
   an image command is counted and not drawn); DPR is one scale factor and nothing else; a browser refuses to fetch the
   wasm from `file://`, so the page is served (`node browser/check.mjs --serve`). What would make it real: the host's JS
   in the browser (Solid over Clay in the page, as on the desktop, with the same input path) and the generated C kept as
   the no-JS path, which is what the board already is.


## What Rune's research gives us (2026-10-23)

[Rune](https://github.com/anomalyco/rune) (Maukea) is a Rust UI framework with its own wgpu renderer, Taffy layout,
Parley text and per-platform shells — not our stack, and none of its code is portable. What is portable is the method:
25 documents in `research/`, with a handful of measured spikes. What we would take, by value for the price:

1. **Idle frames, and a frame on the input.** `solid/main.ts` sleeps 16 ms and declares, lays out and draws every frame
   whether anything changed or not; a key press waits for that tick. Take: poll, then draw at once if there was an
   event; if there was none and the packed tree did not change (a hash of the command array), skip `ui_draw` and sleep.
   On the desktop this stops a static page from burning a core; on the board it turns 22 ms a frame at rest into 0.
   Check: a frame counter with no input stays at 0 draws, one key draws one.
2. **Motion as a first-class track.** We have no animation at all. Rune's model transfers unchanged: a spring from
   `(duration, bounce)` (SwiftUI's parameterisation), a track `{t0, x0, v0, target, spring}` that retargets from the
   presented `(x, v)`, `spatial` and `effect` classes (colour and opacity never overshoot), a settle rule with a snap
   (`1/64 px` for geometry), a first mount that can arrive (the Sky page's cards do, staggered; reduced motion skips
   it), reduced motion, and a `Decay` track for scroll physics
   (`0.998/ms`, rubber band `0.55`). It is cheaper for us than for them: the value is packed into the style each frame
   anyway, so `solid/src/motion.ts` is ~150 lines and the Dialog, the menu, the tab underline, hover and the feed's
   scroll come alive. Checks are theirs too: `x` and `v` continuous at a retarget, `1x16.6 ms == 2x8.3 ms == seek`, and
   an exact stop.
   **Done: motion tracks (scroll)** (2026-10-23). `solid/src/motion.ts` has the model: a spring from
   `(duration = 0.35, bounce = 0)` with `ω = 2π/duration`, `ζ = 1 - bounce`, solved analytically in the three regimes
   (a decaying sinusoid, `e^(-ωt)(d0 + (v0 + ω d0)t)`, two real exponentials), so it is exact at any time and needs no
   integration; a track `{x0, v0, target, t0, spring}` whose `at(t)` is `{x, v, done}`, whose `retarget(t, target)`
   samples the presented `(x, v)` first (continuity), and whose settle is 0.5px and 0.5px/s with the value snapped to
   the target exactly; `spatial()` and `effect()` (the latter critically damped and clamped to the start..target range
   even when asked for a bounce); and a decay `v0·r^t`, `r = 0.998/ms` (`k = -1000 ln r ≈ 2.002`), landing at
   `x0 + v0/k`, stopping at `|v| < 5px/s` on that projection. The clock is passed in, never read. The first user is the
   Sky feed, which is also the first page to own its scroll offset: `ui_wheel` now feeds a second channel
   (`ui_wheel_pop`), `ui_auto_scroll(0)` keeps `ui_begin` from giving the same delta to Clay's containers (the default
   stays on, and only Sky turns it off — the List page and every other frame are untouched), `View.onWheel(dx, dy)` gets
   the polled delta before the frame (headless `--wheel` too) and `View.tick(dt)` runs before `flush()`. Sky: a notch is
   10px, accumulated and clamped to the last card's height (an explicit `maxScroll` from `ui.bounds`); a notch from rest
   glides from `ω·d` (no overshoot); a burst of two or more is a flick whose presented velocity goes to the decay, whose
   projection is clamped, and the motion then either decays to it or springs to the clamped end; keys retarget the same
   track. Measured: one notch `2.59, 1.92, 1.42, 1.05, 0.78, 0.58…` px a frame, exact 10px at rest; eight notches
   `2.59…5.79`, peak 6.60, rest at 78 after 31 frames; a wheel up 13.51px into the throw lands at 64.05, worst
   frame-to-frame increase 1.64px (the notch is 10); the four stored frames regenerated byte-identical (the settled
   -78 is what the old clamp had). Checks: `solid/motion.test.ts` (frame-rate independence, both limits at a retarget,
   the exact settle, effect's clamp, the decay's projection) and the sky test's four scroll blocks, whose stored-frame
   check is a 0-pixel `diffPng`. Mutation: `Track.retarget` setting `v0 = 0` after sampling makes the mid-flight block
   fail — `FAIL and it turns the throw back: the rest is 64, ten px above the 74 it was heading to: 27.87, wanted
   64.05`.
   **Done: the value channel, and the Dialog's menu and panel** (2026-10-24). A style is packed once, so a field could
   not move; now a page's `tick` calls `ui_value(id, len, field, value)` for an element and `ui_open` copies that
   element's 45 floats, applies the frame's overrides of its id and declares from the copy — a renderer-level side table
   as the shadow's and the backdrop's, cleared in `ui_begin`, no cache, 64 overrides and a 180-byte `memcpy` per
   overridden element (0.008 ms of declare for the Dialog's two). Fields 0..44 are the packed ones (`pack.ts`'s `FIELDS`
   names the offsets 38/39, the expand 40/41, `Z_INDEX` 42, radius, colours, padding, gap, width and height); 45 is
   `ui_shadow`'s blur. Offsets, expand, z and the blur are what reads as motion; a width, a gap or a colour re-lays-out
   the parent every frame (a layout change, not a transform) and is documented as such. The Dialog is the first user:
   the menu's float offset y slides -10 → its style's -20 on `spatial(0.22, 0.1)` with its shadow's blur 0 → 14 on
   `effect(0.22)`, the panel drops -14 → 0 and 0 → 32 on the same pair, both ending on the style's own literal (the
   settled `frames/dialog-menu.png` and `dialog-menu-light.png` came out byte-identical; `dialog-open`/`dialog-light`
   were regenerated, since the panel's own blur is now 32). The clock is the page's and stops with the element, so a
   reopen retargets from the value it froze on (measured: closed at -10.85, reopened at -10.85, a 0.000 jump). Measured
   per frame: the menu's offset `-10.00, -10.85, -12.58, -14.42, -16.04, -17.32, -18.26, -18.92, -19.36, -19.64,
   -19.82, -19.92, -19.97, -20.00` and at rest exactly -20, the pixel beside the menu 18.0 → 13.9 (the shadow's blur);
   the panel's y `149.88, 151.07, 153.49, …163.88` and still. Stored: `frames/dialog-menu-mid.png`, three frames in.
   Mutation: `ui_value` dropping `OFFSET_Y` gives offsets of -20 on every frame — `FAIL every frame of the slide moves
   it towards the offset: false, wanted true` — and the mid frame's menu sits at the settled place, only the shadow band
   differing.
   **Done: exits, presence and reduced motion** (2026-10-25). `motion.ts` gained `presence(when, exit)`:
   `update(when, dt)` returns `{ mounted, closing }`, the falling edge keeps the node mounted (that frame being the
   exit's first) for `exit` seconds and then unmounts it, and a return mid-exit revives it where it is — Rune's rule —
   since the tracks retarget from what they present (the reopen frame is the exit's own next value). `channel(write)`
   makes a page's tick one call an element (`write(id, t, [field, track], …)`), and a reduced-motion flag
   (`setReducedMotion`/`reduced`, `--reduced-motion` or `REDUCED_MOTION=1` in `main.ts`) makes a retarget land with
   v = 0 in the same call and a presence mount/unmount at once, so the pages carry no branch. The Dialog is the user:
   closing runs the arrival tracks backwards — panel offset y 0 → 14 (`spatial(0.2, 0)`) and blur 32 → 0, backdrop alpha
   140 → 0 through field 17 (its box is the window, so the alpha is the dim), menu -20 → -10 and 14 → 0 — for the
   presence's 0.35s (the 0.2s tracks settle at 0.333, so no frame is cut), then both nodes leave and the page's pixels
   are back (0 differ from the frame before opening). The trap stays the open state's timing: a Tab right after Escape
   reaches the page (the Zoom trigger) while the panel fades, and a closing overlay writes `CAPTURE` 43 = 1 so a press
   goes through it. Measured: the panel's y `163.88, 165.24, 167.82, 170.39, 172.54, 174.18 … 177.88` (rest 163.88),
   the title pixel behind the backdrop `103 … 230` (140 of 255 of dim to the page), the menu `-20.00, -19.03, -17.18,
   -15.34, -13.81, -12.64, -11.79, -11.19, -10.79, -10.51, -10.33`, and a reopen after four frames presenting 174.18
   (the exit's own next frame) and settling on 163.88. Reduced motion opens on the literal's frame and removes both
   nodes in the frame it closes. Stored: a new `frames/dialog-exit-mid.png` (three frames after Escape, the panel 3.94px
   into its exit, its blur at 22.9 of 32, the dim at 100.6 of 140), every other dialog frame byte-identical, and a
   `--reduced-motion` run against `frames/dialog-open.png`. Mutation: mounting the dialog on `dialog.open()` again
   (dropping the presence) fails `FAIL the panel is still in the layout right after Escape: false, wanted true`.
   **Done: group opacity and scale** (2026-10-25). The value channel moves one number of one element, and a text's
   colour is not in its parent's floats, so a panel could not fade its children; Clay has no opacity and no transform.
   `ui.c` now keeps the frame's **element tree** (`ui_open`/`ui_close`, and `ui_text`, as `{id, parent}` nodes in
   declaration order, cleared in `ui_begin`) and every declaration carries its node as `userData`, which Clay copies
   into each command it emits; the renderer turns an element's **subtree into the contiguous range of its commands** and
   gives the range a ThorVG scene: `tvg_paint_set_opacity(scene, alpha)` (fields **46 `ALPHA`**, 0..255, so a text fades
   with its own fill) and `tvg_paint_set_transform` about the **box centre** of the range's first command (field **47
   `SCALE`**, 1 = none, from `centre·(1 - scale)` in e13/e23 — ThorVG's matrix takes the translation in its third
   column and silently drops it from e31/e32, measured). Neither is a layout: `ui_bounds` does not move. A settled group
   (255, 1) makes no scene, so the Dialog's settled frames stayed byte-identical. Limits: four groups open at once (a
   fifth is ungrouped), 16 a frame, eight nested scissors, one backdrop cut a frame — a cut inside a group settles the
   open groups into pass 1 and makes them again after it (the menu's glass is exactly that), and a shadow is drawn
   inside its element's group, so it fades with the panel. The Dialog's panel and menu arrive and leave as a group
   beside their offsets (alpha 225 → 255 and 96% → 100% on `effect(0.2)` and `spatial(0.22, 0.1)`; the backdrop keeps its
   own dim through field 17). Measured (`solid/dialog.test.ts`, `dialog-entry-mid` three frames in): alpha 119 of 255,
   scale 97.8%, the panel's box `40, 156.1, 280x152.3` against `40, 163.9, 280x152.3` at rest (x, width and height the
   literal's on every frame), a flat spot `24,27,36` between the dimmed page `7,8,10` and the settled panel `36,40,52`,
   the title's brightest pixel `163,163,166` against `235,235,240`, the visible edges `43..316` inside `40..319`.
   Mutation: no `tvg_paint_set_opacity` fails the two blend checks and nothing else. Stored: `frames/dialog-entry-mid.png`,
   and `dialog-menu-mid`/`dialog-exit-mid` were re-stored (a mid-exit panel now fades and shrinks).
   **Done: the group's translate, the feed's entry and hover, and the rubber band** (2026-10-25). A group gained a
   **translate** (fields **48/49 `TRANSLATE_X`/`TRANSLATE_Y`**, px): the scene's one matrix is
   `x' = scale·(x - c) + c + t`, the scale about the box centre with the offset after it and unscaled, so a subtree
   slides without moving anything in the layout (`ui_bounds` is the settled box on every frame), and a group at
   255, scale 1 and offset 0 still makes no scene — the Dialog's frames stayed byte-identical. The Sky page is the user,
   with the three pieces of motion it was missing: **the entry** (on the first mount every card starts 12px low and at
   0 opacity and settles on its literals in 0.3s, `TRANSLATE_Y` on `spatial(0.3)` and `ALPHA` on `effect(0.3)`, each card
   50ms after the one above it; measured, eight frames in the offsets are 4, 8 and 12px of their 12 and thirty frames
   later exactly 0; only the first mount — a tab switch draws its feed at rest — and reduced motion starts no track at
   all), **the hover fades** (`effect(0.12)` through four background floats, and because a card's gradient is drawn
   *instead* of its solid fill, also through a new field **50 `GRADIENT_ALPHA`**: below 255 the renderer draws the solid
   fill under the gradient, so the resting and hover gradients cross-fade and a settled hover is the hover gradient
   pixel for pixel; the card alternates `card`/`cardHover` and the page keeps the hover one while the fade runs either
   way, since a `:hover` state would drop the gradient the moment the pointer left — the one cost is the 6/255 at the
   card's bottom edge where the gradient changes identity; a tab's 2px underline is its own border colour
   (**`BORDER_ALPHA` 29**), faded in on the tab that becomes active and out of the one that was — a colour, not a slide,
   and Clay draws a border inside the box, so no tab moves; a text's colour is not in its box's floats and its label
   swaps style instead), and **the rubber band** (a notch past an end is a pull of the edge while the content is at the
   end, `f(x) = (1 - 1/(x·c/d + 1))·d` with `c = 0.55` in `motion.ts` and `d` the viewport's 664 — the raw 10px of a
   notch is 5.45, the raw 40 is 21.29 — where a notch that only *reaches* the end while the content still glides is a
   scroll like any other, so nothing jumps; 80ms without a notch and it lets go on `spatial(0.35, 0.1)` from what it
   presents, settling exactly on the clamp; a key drops it, a notch back walks it in, a flick's release is a spring and
   not a decay, a feed switch is still a hard clamp, and reduced motion has no band). The band needed one host member,
   `ui_scroll_put(id, y)`: `ui_scroll_to` clamps to Clay's content range, and a band is past it on purpose. Measured
   (`solid/sky.test.ts`): the card's hover `28/33/41, 31/37/44, 32/37/46…` between its resting `26/31/36` and hover
   `34/40/49`, the leave the same path back, a quick leave and re-enter's widest frame 3/255; a new tab's underline
   `42/64/87` on the way up and the old one's `49/126/191` on the way down; four notches past the clamped 78 land at
   99.29 (+21.29 of the raw 40), a notch back at 97.95, the band held four frames and back on 78 twenty-two later.
   Stored: `frames/sky-entry.png` (ten frames in, the three cards at 2, 4 and 10px), `sky-hover.png` (the pointer on the
   second card three frames into its fade, `--move X Y N`, a new headless option) and `sky-band.png` (Discover four
   notches past a feed shorter than its viewport), and the four older `sky*.png` are **byte-identical** with
   `--settle 40` (the entry and a settled hover are their literals; `--warm N` is the other new option, rest before the
   input). Mutations: a hover that starts its track at the target rather than retargeting it fails `FAIL the third frame
   of the hover is between the resting colour and the hover's: false, wanted true` and three more of that block; a
   stagger of 0 fails `FAIL each card further behind the one above it: the entry is staggered: false, wanted true`; a
   band that clamps hard fails `FAIL a wheel past the end pushes the content out of it: false, wanted true`,
   `FAIL and exactly its f(40) on the 664px viewport: 78, wanted 99.29`, the hold and the exact return, and nothing
   else.
   Not covered yet: rotation (the same scene, a different matrix), text-colour transitions (a text's colour is its own
   fields, not its box's; a label swaps style — the tab's does), a drag (a pointer's velocity is the host's, so touch
   and drag scrolling are not here, and the List page keeps Clay's instant wheel step), first-mount entry on the other
   pages, a second gradient on one element, and the terminal, browser and board (no Solid page, no wheel and no value
   channel).
3. **Metamorphic tests of layout and raster.** ~30 lines each, and they catch the bug classes we actually have:
   wrapping a page in a style-less box leaves the pixels identical; shifting a subtree by whole px shifts the picture
   exactly; a wider container never adds a text line (the Sky body); building the tree fresh versus reusing it gives
   the same frame (ours lives across frames); a scroll offset, a resize and a theme are the same relations. Where:
   `solid/metamorphic.test.ts`, over the frames that already exist.
4. **A scene as a file (record/replay).** `--keys/--click/--wheel` are ad-hoc; Rune's scripts are a typed event log
   with timestamps, window size and theme. One `scenes/*.json` should drive the Solid page, the generated C page, the
   wasm in the browser and (where the handlers exist) the board build, so "the same commands on every target" is
   checked for a sequence of input, not only for one state. A bug report becomes a replay.
5. **Command-stream goldens, not only pixels.** When a frame differs by 300 pixels the image does not say what changed;
   a JSON of `cmds` plus the a11y snapshot does (Rune keeps `golden/*-tree.json`). We already compare command arrays
   field by field in `examples/sensors/gen.c` and `browser/dump-commands.c`; one `ui_dump_json` for every target, with
   the raster as the final gate, is a small step.
6. **Text quality against an oracle.** Rune built a CoreText oracle and an ink-weight + SSIM metric, and found its text
   thin; a centred emboldening of ~0.1 pt fixed most of it. We know our own drift (ThorVG against Canvas2D: 6-10 % of
   pixels, up to 3 px of line width), so the same method applies: one font and strings through Chrome's Canvas2D as the
   reference, the same metric, then a weight correction in ThorVG.
7. **Later:** a dev panel with the a11y tree, bounds and phase timings plus `tune!`-style live values; style reload
   without a restart (our "reload on save"); and a static first frame shown by the window before Bun and the first
   layout are ready.

Not taking: Rust, Taffy, wgpu, Parley, AccessKit, their per-OS shells, split-process development, subsecond
hot-patching, and animation owned by a render thread (we have no render thread). Their verdict on GPU-evaluated
springs — keep it opt-in, CPU stays the default — is independent confirmation of our own WebGPU probe.

### TypeGPU: checked, not adopted (2026-10-23)

[TypeGPU](https://docs.swmansion.com/TypeGPU/) is Software Mansion's TypeScript toolkit for WebGPU: shaders in TS with
`'use gpu'`, typed buffers and layouts, `tgpu.resolve` to WGSL. [`@typegpu/gl`](https://docs.swmansion.com/TypeGPU/ecosystem/typegpu-gl/)
adds a WebGL 2 backend for a subset (vertex and fragment stages, uniforms, 2D textures; no vertex buffers, bind groups
or compute) and a GLSL generator.

- **Browser: the only target where it runs for us, and it does run.** The headless Chrome our checks use exposes
  `navigator.gpu` on a served `https` page — adapter, device and a `webgpu` canvas context, no flags. (`about:blank`,
  `data:` URLs and `chrome://gpu` report no `navigator.gpu`, so a probe must serve the page; `browser/check.mjs`
  already does.) A TypeGPU renderer over the same Clay command array is therefore testable headlessly. It would not be
  faster: the page is 0.08 ms a frame and the compositor is the cost. It is worth it only for what Canvas2D cannot do
  (backdrop blur, dithered gradients, glass) or as a TS prototype of a GPU renderer we would port.
- **Desktop: no.** Bun and Node have no `navigator.gpu`; a Deno subprocess or Dawn (`webgpu`) would put a second
  runtime or a large binary between the C host and the page, and ThorVG's own WebGPU canvas already measured slower
  than its CPU raster (0.69-1.06 vs 0.31-0.47 ms) before the compositor.
- **`@typegpu/gl`**: WebGL 2 is everywhere, but the subset has no buffers, bind groups or compute, so it is a
  full-screen-effects path, not a UI renderer.
- **Board and terminal**: no GPU at all.

Verdict: keep as the named option for a browser effects layer or a GPU-renderer prototype, with `browser/render.js`
(the same commands, WebGPU instead of Canvas2D) as the entry point. Not a dependency of anything today.

## Effects (2026-10-23)

The raster can do more than we ask of it. ThorVG 1.1.3 (the installed one) already ships scene effects and masks, and
we use neither: `tvg_scene_add_effect_gaussian_blur(scene, sigma, direction, quality)`, `..._drop_shadow(r,g,b,a,
angle, distance, sigma, quality)`, `..._motion_blur`, `..._fill`, `..._tint`, `..._tritone`, and `Paint::mask()` with
alpha, luma and their inverses. An effect is not a Clay declaration, so it cannot be a style field Clay lays out: it is
a renderer side table keyed by Clay's element id. The command stream already carries that id, so `ui_effect(id, kind,
params)` (called from JS, or printed by `header()` for the C targets; the shadow is its first call,
`ui_shadow(x, y, blur, rgba)`) plus a lookup at draw time is the whole API, and the style keeps only its own layout.

What each target can actually do — the "no" cells are as important as the rest:

| Effect | Desktop (ThorVG, CPU) | Browser (WebGPU) | Board (S3/P4) | Terminal |
| --- | --- | --- | --- | --- |
| Card, panel, menu shadow | `drop_shadow` on a one-shape scene, drawn before the command | one pass | a pre-baked 9-slice sprite | none |
| Blur of the element itself (a menu, a card leaving in place) | `gaussian_blur` on its scene | one pass | none | none |
| Backdrop blur ("glass" over our own content) | our own buffer: copy the region under the panel, blur it, draw the panel over it | dual Kawase pass | none | none |
| Gradients | ThorVG linear and radial fills; a new style member, dithered | Canvas 2D or WGSL | banded, dithered | 256 colours, dithered |
| Group opacity | **done**: a scene per element subtree, at the alpha of value field 46 (and a scale, field 47) | yes | per-command alpha | none |
| Tint and tritone (themes, disabled states) | ThorVG effect | a pass | a palette swap | the palette |
| Grain, vignette | one tiled 64x64 alpha PNG | a pass | the same tile | none |

The order, each with its own frame and its own number:

1. **Done: shadow** (`css.shadow({ x, y, blur, color })`, 2026-10-23) — the largest felt difference for the smallest
   piece of work: the Dialog, the menu and the Sky cards float today on colour alone. The style's literal carries a
   sibling `shadow` key (`{ x, y, blur, color: { r, g, b, a } }`, defaults 0, 2, 12, `rgb(0 0 0 / 0.4)`); Clay 1.0's
   declaration has no such field, so `header()` prints nothing for it and the C pages are unchanged, `pack.ts`'s
   `variant()` pulls it out beside the image's path (the packed box stays 45 floats), `frame.ts` calls `ui_shadow(x, y,
   blur, r, g, b, a)` before `ui_open`, and `ui.c` hangs it on the renderer's table by the element id's 32-bit hash
   (`Clay_ElementId.id`), cleared at `ui_begin` with the rest of the frame. The renderer draws it for the element's
   first command with that id — the command's box and corner radii, offset and filled with the shadow's colour, a scene
   with `tvg_scene_add_effect_gaussian_blur` (sigma `blur / 2`, CSS's reading of a blur radius, quality 80), then the
   command itself, so the element covers its middle: a `drop_shadow` of a scene of the element's own silhouette would be
   the same pixels, and the blur of one shape is the smaller machine. Measured, sigma 8 in a scene under a root at
   scale 2 blurs twice as many device pixels as at scale 1: the sigma is in the scene's own units, so the root's scale
   carries it (it is not multiplied by the pixel density). Frames: the Dialog page's panel (280x152, `{ y: 12, blur: 24,
   color: "rgb(0 0 0 / 0.45)" }`) and its menu (150x133, `{ y: 6, blur: 14 }`), the three stored frames regenerated —
   23037 (dark), 23053 (light) and 8647 (menu) pixels differ from the frames without a shadow, every one outside the
   element's box except the four corner cut-outs of its radius, 11636 of the panel's below it against 4006 above (the
   12px offset), max channel 4/255 in the dark theme and 41/255 in the light one. Cost: the page at 360x480 is 1.07 ms
   a frame drawn without the panel's shadow and 1.93 ms with it (dark; light 1.00 → 1.76), so **about 0.8 ms a 280x152
   shadow at blur 24, quality 80** (Apple M2, one thread, `--bench 300`, `bun solid/main.ts dialog --keys Tab,Enter
   --png out.png --bench 300`); quality 50 is 1.47 ms and 30 1.31 ms for 5/255 and 15/255 at the shadow's edge, and the
   sigma is not the lever (sigma = blur, CSS's blur radius unhalved, spreads the same alpha over 44px instead of 25 and
   reads washed out). Checks: `solid/dialog.test.ts` and the four frames. Open: spread and inner shadows (the box is the
   element's own), a cache between frames (each frame blurs the shadow again), the element must have an `id`, and no C
   target draws one (the header and the C pages are untouched; the browser's Canvas2D `shadowBlur` and a 9-slice sprite
   on the board are the obvious ports).
2. **Done: backdrop blur** (`css.backdrop({ blur })`, 2026-10-23) — glass over our own content, the second effect. The
   style's literal carries a sibling `backdrop: { blur }` key (`header()` prints nothing, the C pages are unchanged),
   `variant()` pulls it out beside the shadow, `frame.ts` calls `ui_backdrop(blur)` before `ui_open`, and `ui.c` hangs it
   on the renderer's table by the element id, cleared at `ui_begin`. The renderer cuts the frame: at the element's first
   rectangle command it draws pass 1 (`tvg_canvas_draw(d->canvas, d->clear)`), blurs the element's box in `pixels`, and
   starts a new scene for the rest, so the element's fill, text, border and focus ring are drawn over blurred pixels and
   stay crisp. The blur is CPU-side and box-only: three box passes each way, sigma `blur / 2` as the shadow's, pass
   radius `r = (sqrt(1 + 4σ²) - 1) / 2`, both ends clamped so nothing outside the box is read or written, alpha carried
   through (255 everywhere, so a per-channel average is right). The menu of the Dialog page is the first glass: 150x133,
   blur 10 (r = 5), a `rgb(23 27 32 / 0.72)` fill (light `rgb(255 255 255 / 0.78)`), overlapping its trigger by 20px so
   the border and the text stroke under it are the proof. Measured: 5273 pixels of `dialog-menu.png` differ from the same
   page with the style dropped, bbox 40,214-189,347 (the menu's own box), worst channel 81; a light menu frame was added
   (`dialog-menu-light.png`); `dialog-closed.png`/`-open`/`-light` stay byte-identical. The A/B in `dialog.test.ts` puts
   the pixel over the trigger's border at 21,25,30 against 40,44,49 in the dark theme and 228,228,229 against
   210,211,213 in the light one, the 1px step down that edge 1 against 23 and 20, zero pixels changed outside the box,
   and the label's ink box identical (55,258-91,269, 166 px): the panel is not blurred with the page.
   Cost: the frame's draw is 2.2 ms without the glass and 3.0 ms with it in back-to-back 300-frame runs (Apple M2, one
   thread, a loaded machine, so 0.7-1.0 ms for one 150x133 glass); the radius is not the lever (blur 18 is ~0.2 ms more
   than 10, and blur 0 with the cut still made is the same within the noise), the second `tvg_canvas_draw` and the target
   re-seed are; the blur's own passes are six of about 20k pixels each. Two ThorVG facts the cut rests on, both measured: its software canvas seeds its
   working surface from the target on its first draw only (a later draw replaces what its paints touch, so the renderer
   sets the same target again before pass 2) and `tvg_paint_rel` on a canvas-owned scene is a double free (the pass-1
   scene is removed, not released). Open: nested backdrops and a backdrop inside a scissor scene (one cut a frame; a
   second is not drawn), the WebGPU canvas (no target to blur before the whole draw, so no cut at all there), the
   browser/board/terminal (a dual Kawase pass, a pre-baked sprite, none), a panel whose own alpha varies per pixel (the
   fill is one Clay colour), and what a backdrop over an image or another float would need (the box is the first
   rectangle command; a picture or a float in the cut is drawn into pass 1 and blurred like everything else under it).
3. **Done: gradients** (`css.backgroundImage("linear-gradient(...)")`, 2026-10-23) — the third effect, and the first that is
   a fill rather than work on the buffer. The style's literal carries a sibling `backgroundImage: { kind: "linear", angle,
   stops: [{ offset, color }] }` key; `header()` prints nothing for it (the C pages stay byte-identical), `variant()` pulls
   it out beside the shadow and the backdrop, `frame.ts` calls `ui.backgroundImage(kind, angle, count, stops)` before
   `ui_open`, and `ui.c` hangs it on the renderer's table by `Clay_ElementId.id`, cleared at `ui_begin`. The member is one
   string of CSS's own grammar: an optional direction (`<number>deg`, or `to top | to right | to bottom | to left`; 180deg
   by default) and two or more colour stops with an optional `<number>%` (a stop without one is spread as CSS spreads it);
   `radial-gradient`, `conic-gradient`, a repeating one, `url()`, colour hints, `px` stops, fewer than two stops and a
   backwards list are build errors. At the element's first **rectangle** command the renderer fills the box (its corner
   radii too) with ThorVG's linear gradient and does not draw the solid fill; a border is its own command and stays. The
   geometry is CSS's gradient line: direction `(sin θ, -cos θ)`, length `|w·sinθ| + |h·cosθ|`, the box's centre ± half of
   it, in Clay units (the root scene carries the scale). One gradient an element (16 a frame), 8 stops (a ninth is an
   error count), linear only. The page: the Sky cards (three of 336x190) are `180deg` from `rgb(27 32 38)` to
   `rgb(21 25 30)` in the dark theme and `255 255 255` to `240 243 246` in the light one, both top-lighter; the hover
   overrides the whole gradient with the hover tokens (`34 40 49` to `28 33 40`), since a state cannot unset one. The four
   stored frames were regenerated: of their pixels 187,898 (sky), 194,752 (science), 197,990 (light) and 198,952
   (scrolled) differ from the frames without a gradient, every one inside a card's box, worst channel 6, 6, 15 and 9/255.
   A card's column is 5/255 lighter at its top over 182px (14/255 in the light theme), a row varies by 0/255 across, and
   the page is one pixel beyond its edge. Cost: under 0.2 ms for the page's three cards (`--bench 1000`, the least-loaded
   of three back-to-back pairs: 3.735 against 3.631 ms a frame, light 3.625 against 3.458), i.e. what the solid fill of the
   same pixels costs, within the machine's noise. Checks: `test/clay.mjs` (the literal at 180deg and at `to right`, the
   even spreading, a themed stop, the offsets, the errors), `solid/sky.test.ts` (the vertical scan, the row, the edge, the
   hover, the light theme) and the four frames; a mutation of the angle to `90deg` fails the vertical scan. **It bands**:
   the dark card's 190px is 6 luminance steps of about 30px, the light one 12 of about 15px — a dither step is the cure
   and is not built. Open: radial and conic (ThorVG has both), dithering, a gradient under a translucent fill (one fill per
   element today), a gradient on text, a border or an image, and the browser, the board and the terminal (the board would
   band hardest; a dithered gradient is PPA work on the P4).
4. **Tint and tritone** for themes and disabled states, worth it once a theme switch is animated.
5. The terminal gets none of the blurs; its equivalents are the palette and the attributes it already has.
6. The board gets only what `render.c` can do without a filter: dithered gradients, shadows as pre-baked sprites, PPA
   for scaling and blending on the P4. A full-screen blur does not fit a 22 ms frame.

Rules to keep from Rune's research: blur only what enters or leaves in place, never persistent text; dither every
gradient; soft masks on clips; an effect is opt-in with a plain fallback, and ships with a measured cost on both the
desktop frame and the board where it exists. The GPU raster does not buy the cost back (0.69-1.06 vs 0.31-0.47 ms,
before the compositor), so the first pass is the CPU raster.

||||||| e044926a
## Mobile: iOS and Android (2026-10-23)

Status: not started. The first slice is **A: no JavaScript** — Clay, ThorVG, the C renderer and generated pages in a
platform shell, which is the board's shape on a phone. Solid on the device (a JS runtime and a bridge where
`bun:ffi` sits today) is a decision for later, and what decides it is the events debt of generated C.

What transfers, so the first slice is smaller than it looks:

- **Clay** is one C99 header with no dependencies, and **ThorVG** builds for both platforms; the software canvas means
  no GPU code of ours. `clay_renderer_thorvg.c` is plain C.
- **SDL3** is already the desktop's window, pointer and text input, and it has iOS and Android backends: touch, the
  system keyboard's committed text, the activity lifecycle. Our `Field` speaks the same text events.
- **The styles need no compiler on the device**: `cssints/clay` is a build-time literal and `header()` prints C.
- **The generated pages** are the board's path — `main/generated/*` in esp32 comes from `regen.sh` and `--text`, and the
  same generator runs for a mobile app.
- **`retarget(scale)`** already takes a pixel density, so 2x and 3x are a scale, not a rewrite.

What has to be built, in the order it hurts:

1. **Builds.** An Xcode project and a Gradle/NDK one, ThorVG per ABI (arm64 device, arm64 simulator, arm64-v8a,
   x86_64), the fonts in the bundle, SDL3's own mobile project shapes. Mechanical, and the slowest part in wall-clock
   time.
2. **Touch.** Down, move, up; a press that leaves its element; drag scrolling with decay and rubber band (`0.998/ms`,
   `0.55` from Rune's research); the drag takes the wheel's place.
3. **Text input.** The system keyboard and committed text come with SDL3 and the Field already handles them; marked
   text (composition), autocorrect, the caret's loupe and the selection handles do not, and are the largest single
   piece of work on a phone (Flutter's iOS text shim is ~3,400 lines).
4. **Insets.** Safe areas and the notch, the keyboard over the window, rotation: the root takes them as padding, and
   Clay lays out again.
5. **Accessibility.** VoiceOver and TalkBack cannot see a C raster. The tree we already snapshot (`solid/a11y.ts`, an
   element's `bounds`) has to be posted to `UIAccessibility` and to an `AccessibilityNodeProvider`; without it the app
   is not readable by a screen reader, which the stores require.
6. **Lifecycle and the platform bits.** Background and foreground, the first frame, memory pressure, Android's back
   button, haptics, the status bar, share and links.

The first slice, and what each step proves:

1. The generated Sensors page on the iOS simulator and the Android emulator through SDL3 and ThorVG at the device's
   pixel density, with a tap hit-tested on `ui_bounds` toggling `use_g`. Proves the toolchain, the raster and the DPI.
2. The Sky page with drag scrolling and a Field that raises the keyboard. Proves the interaction model.
3. The a11y bridge for those two pages. Proves that a store could ship it.
Roughly 1-2 weeks for the first step, 2 more for the second, a week for the third.

The decision left open (B): **Solid on the device** — the desktop's architecture, a JS bundle and a JSI module where
`bun:ffi` is. It keeps one UI codebase and the whole interaction layer, at the cost of a runtime (no JIT on iOS:
Hermes or JSC in interpreter mode, so our 0.3 ms a frame becomes 1-3), the bridge, and a bundle build. What forks the
decision is generated C's **events debt**: if `page-to-c` learns to carry state and handlers, A is enough and B is never
needed; if it does not, B is the only route to a real app. Either is 3-6 weeks to the same demo.

Not doing: React Native, and Skia with it (tens of megabytes and a second raster; the board's 1.25 MB firmware rules
it out), our own text shaping (HarfBuzz/Parley is its own project; ThorVG's text is thin, and it is what we have), and
pixel-exact goldens across architectures: float differences are real, so a mobile lane needs the tolerance model of
Rune's research 14 — a bounded per-channel error with a recorded budget, not a hash.

## Not doing

- JS on a microcontroller. A GPU path on the ESP32-S3. One style for cells and pixels. A layout engine of our own.
