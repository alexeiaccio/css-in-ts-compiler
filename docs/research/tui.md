# cssints in a terminal (cssints-3ff7, 2026-10-10)

A terminal target for cssints: the same Vite plugin, the same `css.*` calls and the same tokens, compiled to
**prop objects** for terminal renderables instead of class strings. There is no cascade: a small runtime applies
the states and the theme. OpenTUI is the first adapter; the core output is renderer-neutral so that a
`@bomb.sh/tty` adapter (cssints-kotl) can read the same objects.

## Opt-in: the subpath `cssints/tui`

```ts
import * as css from "cssints/tui" with { type: "cssints" };
```

- **Why a subpath, not `cssints({ target: "tui" })`.** The types must change (a terminal property set, cells for
  lengths), and a plugin option cannot change what TypeScript sees. A subpath can. It is also the smallest change to
  the engine: an attributed import of `cssints/tui` is a site import like any helper module, its builders return a
  node of their own (`{ __tui }`), and the engine's `replacementOf` gives that node its replacement, an object literal.
  The web path checks one more shape only after every web shape failed, so it is unchanged; no class is registered
  and no sheet entry is written for a terminal site.
- **One file can mix both** (web classes and terminal objects), but a terminal app imports only `cssints/tui`.
- **Build.** The same `cssints/vite` plugin. A Bun app is an SSR build (`vite build --ssr src/main.tsx`); the plugin
  treats the `ssr` environment of a build as an output (the evaluation runs on its own private server), so the sites
  are replaced there as in a client build. No terminal HMR in v1.

## What user code writes and gets

```ts
import * as css from "cssints/tui" with { type: "cssints" };

export const button = css.cn(
  css.border("rounded", "#585b70"),
  css.p(0, 1),
  css.color("#cdd6f4"),
  css.cursor("pointer"),
  css.hover(css.bg("#313244"), css.borderColor("#89b4fa")),
  css.active(css.fontWeight("bold")),
);
```

compiles to (the site is replaced by this literal, nothing of `cssints/tui` ships):

```js
export const button = {
  border: true,
  borderStyle: "rounded",
  borderColor: "#585b70",
  paddingTop: 0,
  paddingRight: 1,
  paddingBottom: 0,
  paddingLeft: 1,
  color: "#cdd6f4",
  cursor: "pointer",
  ":hover": { backgroundColor: "#313244", borderColor: "#89b4fa" },
  ":active": { bold: true, dim: false },
};
```

and is used through the adapter:

```tsx
import { use } from "@cssints/tui/opentui";

<box {...use(button)}>
  <text>Save</text>
</box>; // Solid (or React): the spread is a `ref`
attach(new BoxRenderable(renderer, {}), button); // core
```

`attach(renderable, style)` sets the props of the style (current theme, no state) on the renderable, and keeps them
in step: it hooks the renderable's mouse events (`over`/`out` for `:hover` and `cursor`, `down`/`up` for `:active`;
handlers of your own, `onMouseOver`, still run) and its `focused`/`blurred` events (`:focus`), and listens to the
theme. It sets only what changed, and gives a prop back its own value when no state sets it any more. `use(style)` is
`{ ref }` that calls `attach`: Solid calls a `ref` of a spread when it makes the renderable, before the first frame.

## Property mapping

Neutral key = what the compiled object holds; OpenTUI = what the adapter sets.

| `css.*` member                                                                                      | values (types and build)                               | neutral key                            | OpenTUI                                                       |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------- |
| `color`                                                                                             | `<color>`, a colour token                              | `color`                                | `fg`                                                          |
| `backgroundColor`, `bg`                                                                             | `<color>`, a colour token                              | `backgroundColor`                      | `backgroundColor` (box), `bg` (text)                          |
| `fontWeight`                                                                                        | `bold`, `normal`, `lighter` (dim)                      | `bold`, `dim`                          | `attributes` bits                                             |
| `fontStyle`                                                                                         | `italic`, `normal`                                     | `italic`                               | `attributes`                                                  |
| `textDecoration`, `textDecorationLine`                                                              | `underline`, `line-through`, both, `none`              | `underline`, `strikethrough`           | `attributes`                                                  |
| `textAlign`                                                                                         | `left`, `center`, `right`                              | `textAlign`                            | `textAlign`                                                   |
| `border`                                                                                            | a style, then an optional colour                       | `border`, `borderStyle`, `borderColor` | same                                                          |
| `borderStyle`                                                                                       | `solid` (single), `double`, `rounded`, `heavy`, `none` | `border`, `borderStyle`                | same                                                          |
| `borderColor`                                                                                       | `<color>`, a colour token                              | `borderColor`                          | same                                                          |
| `padding`, `p`, `margin`, `m`                                                                       | 1 to 4 cells (margin: or `auto`)                       | the four longhands                     | same                                                          |
| `paddingTop` … `marginLeft`, `pt pr pb pl mt mr mb ml`, `paddingInline/Block`, `marginInline/Block` | cells                                                  | longhands                              | same                                                          |
| `gap`, `rowGap`, `columnGap`                                                                        | cells or `N%`                                          | same                                   | same                                                          |
| `width`, `height`, `min*`, `max*`, `flexBasis`                                                      | cells, `N%`, `auto`                                    | same                                   | same                                                          |
| `flexDirection`, `flexWrap`, `justifyContent`, `alignItems`, `alignSelf`                            | Yoga's keywords                                        | same                                   | same                                                          |
| `flexGrow`, `flexShrink`                                                                            | `<number>`                                             | same                                   | same                                                          |
| `position`                                                                                          | `relative`, `absolute`                                 | same                                   | same                                                          |
| `top`, `right`, `bottom`, `left`                                                                    | cells, `N%`, `auto`                                    | same                                   | same                                                          |
| `overflow`                                                                                          | `visible`, `hidden`, `scroll`                          | same                                   | same                                                          |
| `display`                                                                                           | `flex`, `none`                                         | `visible`                              | `visible`                                                     |
| `opacity`                                                                                           | `<number>` 0 to 1                                      | same                                   | same                                                          |
| `zIndex`                                                                                            | integer                                                | same                                   | same                                                          |
| `cursor`                                                                                            | the CSS cursor keywords OpenTUI sends over OSC 22      | `cursor`                               | `renderer.setMousePointer` on over, `"default"` on out        |
| `caretShape`                                                                                        | `auto`, `bar`, `block`, `underscore`                   | `caretShape`                           | `cursorStyle.style` (`default`, `line`, `block`, `underline`) |
| `caretColor`                                                                                        | `<color>`                                              | `caretColor`                           | `cursorColor`                                                 |
| `caretAnimation`                                                                                    | `auto` (blinks), `manual` (steady)                     | `caretAnimation`                       | `cursorStyle.blinking`                                        |

- **Cells.** A number is a cell: a column for widths and horizontal edges, a row for heights and vertical edges, as
  Yoga in OpenTUI counts them. A percentage is of the parent. A CSS length (`2rem`, `10px`, `1em`, `5ch`) is a type
  error and a build error (`cssints: width: a terminal counts cells: write a number, not "10px"`); nothing is
  converted, since no unit has one right size in cells. `calc()` is out.
- **Colours** are read at build time and written as `#rrggbb`, or `#rrggbbaa` when translucent: any colour the
  web grammar takes and culori or the derived-token evaluator reads (names, hex, `rgb()`, `hsl()`, `oklch()`,
  `color-mix()` over tokens, relative colours). `currentColor`, system colours, `light-dark()` and `inherit` are build
  errors, since nothing resolves them in a terminal. The types check a colour with the web's `color` grammar.
- **Type errors** for a property a terminal cannot do: `cssints/tui` has no such member (`css.boxShadow`,
  `css.fontSize`, `css.transition`, `css.grid` are not there), and a value outside the table is an error on the part.
- **No inheritance.** `color` and the text attributes apply to the renderable that gets them (a `<text>`), not to the
  text inside a box.
- **`cn()` merges in argument order** (the later key wins, shorthands expand to longhands first): there is no sheet,
  so there is no "longhand beats shorthand whatever the order" of the web.

## States

- `css.hover(...)`, `css.focus(...)`, `css.active(...)` wrap styles, as on the web, and give `":hover"`, `":focus"`,
  `":active"` overlays. They do not nest (`hover(focus(...))` is a build error) and other conditions (`media()`,
  `attr()`, `within()`) are not members.
- The runtime merges: base, then the theme, then `:hover`, `:focus`, `:active` that are on, in that order (the web's
  order of those pseudo-classes, so `:active` wins).
- `:hover` follows `over`/`out` (OpenTUI's top hit target; the events bubble, so a box keeps its hover while the
  pointer is on a child), `:active` `down`/`up` (and `out`), `:focus` the renderable's `focused`/`blurred` events. A box needs `focusable: true` to take focus; that is a renderable option, not a style.
- **Cursors.** `cursor` is set with `renderer.setMousePointer(value)` on over and back to `"default"` on out. The
  caret properties go to the focused editable's `cursorStyle` and `cursorColor` (Input, Textarea); OpenTUI itself then
  calls `setCursorStyle` while it has focus.

## Themes

- `css.createTokens(...)` and `css.createGlobalTheme(tokens, name, overrides)` are re-exported by `cssints/tui` with
  their web types and checks. A theme's second argument is its name (`"dark"`, a valid type selector); a theme under
  `media()` is not read by terminal styles (a terminal has no media queries).
- A terminal has no custom properties, so a token is resolved at build time: the site holds the default value and,
  under `themes`, what each theme changes, states included: `{ backgroundColor: "#1e1e2e", themes: { light: {
backgroundColor: "#eff1f5" } } }`. Aliases, derived tokens (`color-mix()` over a token) and references in a theme
  are resolved per theme, as `check.contrast` reads them. The themes are those registered when the site runs: import the theme module
  first, as on the web.
- `setTheme(name)` of `@cssints/tui` (also exported by `/opentui`) sets the values of that theme on every attached
  renderable; `""` is the default.

## The @bomb.sh/tty adapter (cssints-kotl, 2026-10-10)

`@bomb.sh/tty` 0.9 (Clay compiled to WASM) draws a frame from a list of ops and returns the pointer events of that
frame; there are no renderables to attach to. So `@cssints/tui/bomb` maps a style, resolved in the state of its
element id, to the options of `open()` and `text()`, and `createTracker()` keeps the states between frames:

```ts
const ui = createTracker();
const build = () => [ui.open("save", button), ui.text("Save", label, "save"), close()];
process.stdout.write(ui.render(term, build, { pointer: { x, y, down } }).output);
```

- **States.** `pointerenter` turns `:hover` on and `pointerleave` turns it off (Clay reports an element and its
  ancestors). bomb.sh has no press event, so `:active` is read from `pointer.down`: when it becomes true, the hovered
  elements are active until the release (`pointerclick`) or a leave. `:focus` is the id of `ui.focus(id)`. The events
  of a frame come after it is drawn, so `ui.render` draws it again when a state changed: a hover shows at once.
- **Pointer and caret.** No setting of bomb.sh sets the mouse pointer, so the tracker writes OSC 22 (`ESC ] 22 ;
pointer ST`) when the innermost hovered element with a `cursor` changes, and `default` when there is none. The caret
  of the focused element is DECSCUSR (`ESC [ n SP q`: `block` 1/2, `underscore` 3/4, `bar` 5/6, blinking/steady by
  `caretAnimation`; `auto` 0) and OSC 12 for `caretColor`; bomb.sh places and shows the caret where a `text()` op has
  `caret: offset`. `ui.reset()` writes OSC 22 `default`, DECSCUSR 0 and OSC 112.
- **Output views.** `term.render().output` is a view of the WASM memory that the next render reuses, so the tracker
  copies it before it renders the second time (found by the test: the first frame was overwritten).

| neutral key                                                                                                | bomb.sh                                                                                                               |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `width`, `height`                                                                                          | number: `fixed(n)`; `N%`: `percent(N / 100)`; `auto`: `fit()`                                                         |
| `flexGrow` > 0                                                                                             | `grow()` on each axis without a size (Clay grows per axis, not along the parent's main axis)                          |
| `minWidth`, `maxWidth`, `minHeight`, `maxHeight`                                                           | the min and max of `fit` or `grow` (cells only; ignored on a `fixed` or `percent` axis)                               |
| `flexDirection`                                                                                            | `direction`: `row` `ltr`, `column` `ttb`; `-reverse` is drawn forward                                                 |
| `paddingTop` … `paddingLeft`                                                                               | `layout.padding` (cells only)                                                                                         |
| `gap`, `rowGap`, `columnGap`                                                                               | `layout.gap`: `rowGap` in a column, `columnGap` in a row, else `gap` (cells only)                                     |
| `justifyContent`, `alignItems`                                                                             | `alignX`/`alignY` by the direction: `flex-start` left/top, `center`, `flex-end` right/bottom                          |
| `textAlign` (on a box)                                                                                     | `alignX` when `justifyContent`/`alignItems` set none                                                                  |
| `backgroundColor`                                                                                          | `bg` of `open()` and of `text()`, `rgba()`                                                                            |
| `border`, `borderColor`                                                                                    | `border: { color, top: 1, right: 1, bottom: 1, left: 1 }`; no `borderColor`: the style's `color`, else white          |
| `borderStyle`                                                                                              | `rounded`: `cornerRadius` 1 on each corner; `solid`; `double` and `heavy` are drawn single (bomb.sh has one line set) |
| `overflow`                                                                                                 | `hidden`, `scroll`: `clip` on both axes (no scroll offset)                                                            |
| `position: absolute`, `top`, `right`, `bottom`, `left`, `zIndex`                                           | `floating` on the parent, at the corner of the edges given (`left`/`top` first), offset by them; `zIndex` only there  |
| `display: none` (`visible: false`)                                                                         | `fixed(0)` on both axes, clipped, no border (the element stays in the frame, so its id keeps its events)              |
| `color`                                                                                                    | `color` of `text()`                                                                                                   |
| `bold`, `dim`, `italic`, `underline`, `strikethrough`                                                      | the bits 1, 2, 4, 8, 64 of `attrs` (SGR 1, 2, 3, 4, 9)                                                                |
| `cursor`                                                                                                   | OSC 22 while hovered                                                                                                  |
| `caretShape`, `caretAnimation`, `caretColor`                                                               | DECSCUSR and OSC 12 while focused                                                                                     |
| `margin*`, `flexShrink`, `flexBasis`, `flexWrap`, `alignSelf`, `opacity`, `space-*`, `stretch`, `baseline` | not drawn: Clay has no such option; a margin is a parent with padding                                                 |

What does not map is left out at run time, not rejected at build time: the build cannot tell which adapter a style
goes to. Transitions are not a `cssints/tui` member; bomb.sh's `transition` is the last argument of `ui.open`.

## The system theme (cssints-q1j3, 2026-10-10)

A theme computed at run time from the terminal's own colours, after
[Pi's system theme](https://earendil.com/posts/system-theme/): the app keeps its tokens and its static themes, and a
`system` theme gives each colour token a value from the terminal's palette, placed by contrast rules.

### What the renderers report

- **OpenTUI** (0.5.17) does the queries itself. `renderer.getPalette({ size: 16 })` writes OSC 4 for the 16 ANSI
  colours and OSC 10/11 (and 12 to 19), and resolves with `TerminalColors` (`palette`, `defaultForeground`,
  `defaultBackground`, each `#rrggbb` or `null`). It first checks with OSC `4;0;?` and gives up after 300 ms, and
  returns `null`s at once when stdin or stdout is not a TTY. The native renderer turns on mode 2031 and queries OSC
  10/11 at start: `renderer.themeMode` is `"dark"`, `"light"` (from the OSC 11 background) or `null`. On a
  `CSI ? 997 ; 1|2 n` notification it queries OSC 10/11 again, clears its palette cache and emits `theme_mode` when
  the mode changed. It consumes those sequences: an app never sees them, and it does not send `CSI ? 996 n`.
  A colour prop takes an `RGBA`, and `RGBA.fromIndex(n)` and `RGBA.defaultForeground()`/`defaultBackground()`
  are drawn by the terminal (SGR 3x/9x/38;5 and 39/49), so an indexed colour can be passed.
- **@bomb.sh/tty** (0.9) has no query and no palette. `createInput().scan()` reports keys, the mouse, resize and
  cursor position reports, not OSC replies or `CSI ? 997 n`. A colour is a packed `rgba()` number: no indexed
  colour, no "terminal default". So the adapter writes the queries itself and takes the replies out of the bytes of
  stdin before `input.scan()` sees them.

### The API

Roles are written beside the tokens, at run time (a module the app imports, not a cssints module): a role is a
**hue source** (an ANSI slot, or the terminal's `fg`/`bg`) and **contrast rules** against the tokens it sits on.

```ts
import { createSystemTheme } from "@cssints/tui/system";

import { c } from "./styles.ts"; // createTokens of cssints/tui

export const system = createSystemTheme(
  c,
  {
    color: {
      bg: { surface: true }, // the terminal's background
      card: { surface: true, on: [c.color.bg], contrast: 1.1 }, // a panel: 1.1:1 from bg
      text: { hue: "fg", on: [c.color.bg, c.color.card], contrast: 7 },
      accent: { hue: "blue", on: [c.color.bg, c.color.card], contrast: 3 },
      error: { hue: "red", on: [c.color.bg, c.color.card], contrast: 4.5 },
    },
  },
  { themes: { light: "light" } }, // a token without a role: its value in this static theme
);
```

```ts
// OpenTUI
const renderer = await createCliRenderer(options);
await followSystemTheme(renderer, system); // queries, waits at most 100 ms, sets "system"

// @bomb.sh/tty
const follow = followSystemTheme(system, { write: (s) => process.stdout.write(s) });
process.stdin.on("data", (b) => handle(input.scan(follow.feed(b)).events));
await follow.ready;
```

- `createSystemTheme(tokens, roles, options?)` checks the roles (an `on` that is no role, a cycle) and returns a
  theme; `theme.solve(report)` gives the values of every role for a terminal report (`{ fg?, bg?, ansi?, scheme? }`)
  and is what the tests call. `followSystemTheme` (in `@cssints/tui/opentui` and `@cssints/tui/bomb`) feeds it.
- **A role.** `hue`: `"fg"`, `"bg"` or an ANSI name (`black` … `white`, `brightBlack` … `brightWhite`); the default is
  `"fg"`, and `"bg"` for a surface. `on`: the tokens it sits on. `contrast`: the WCAG 2 ratio. A text role is moved
  only when its source misses a rule, and then to the lightness of the strictest one; a `surface` is placed at
  exactly `contrast` from its first `on` (toward the foreground), or is the terminal's background without one. `ansi`:
  the colour index (or `"default"`) to draw when the terminal reports nothing.
- `options.hues`: the app's own colour per slot, used for a slot the terminal did not report (default: a neutral
  xterm-like palette). `options.themes`: the static theme whose values the tokens without a role keep, per
  appearance (default `""`). `options.name`: `"system"`.

### The solver

For each role, in the order of `on`: the source colour in OKHSL and OKLCH. If the source meets every rule it is kept.
Otherwise the target luminance is the reversed WCAG ratio, `(Y + 0.05) · k − 0.05` above or `(Y + 0.05) / k − 0.05`
below each surface, the strictest one taken, on the side of the source (the other side when that one is out of
reach). OKHSL lightness is bisected to that luminance at the source's hue and saturation, the saturation scaled by
a bell (`√(4l(1 − l))`, relative to the source's) so near-black panels get a hint of colour, and the OKLCH chroma
capped at the source's: a pastel moved darker never becomes more vivid (Pi's Catppuccin Frappé bug). The hex is
checked again after rounding. The contrast maths is culori's `wcagLuminance` and the ratio of `check.contrast`.

### Fallbacks and appearance

| The terminal reports      | The theme                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bg (and fg) and ANSI 0–15 | every role from its slot, placed for the real background                                                                                               |
| bg only                   | the app's hues (`options.hues`), placed for the real background                                                                                        |
| nothing                   | OpenTUI: ANSI indices and the terminal's default colours, drawn by the terminal. bomb.sh: the static theme of the appearance (no indexed colour there) |

- **Light or dark**: from the reported background (darker than the foreground, or luminance under 0.18 without
  one); else the terminal's colour-scheme report (`CSI ? 996 n` → `CSI ? 997 ; 1 n` dark, `2` light; bomb.sh only,
  OpenTUI's `themeMode` stands for it there); then `COLORFGBG` (its last field: 0–6 and 8 dark); then dark.
- **Timing**: the queries go out at start; `followSystemTheme` resolves after the replies or 100 ms, whichever is
  first, with the fallback in place; a late reply rebuilds the theme when it comes.
- **Appearance changes**: mode 2031 (`CSI ? 2031 h`) asks for `CSI ? 997 ; n n` on a palette change; then the
  queries go out again and the theme is rebuilt. OpenTUI does this itself (`theme_mode`), bomb.sh's follower on the
  notification in its bytes.

### The theme table (decided)

A site keeps its default values and its static `themes` overlays (build-time themes need no run-time registration
and no import order), and now also `vars`: the token of each colour prop set to a token, per state
(`vars: { backgroundColor: "color-bg", ":hover": { backgroundColor: "color-hover" } }`, named without `--`: a `--name` in a site would count as a token of the module for the web sheet). The run-time table
is one shared map in `@cssints/tui`: `defineTheme(name, values, base)` registers a theme of token values over the
static theme `base`, and `resolve` lays it over the site's props for every prop that has a token. `setTheme` and
`onTheme` are unchanged; `defineTheme` of the theme in use is a theme change. Weighed and left: moving the static
themes into the table too (the theme module's sites would have to register at run time, before any style resolves,
and every site would lose its self-contained values); a token value `css.system(...)` inside `createTokens` (the
rules would be build-time code, but the palette is only known at run time). A prop with a colour that is not a lone
token (`color-mix()` over one) keeps its static value.

## Packages

- **`cssints/tui`** (packages/cssints/src/tui.ts and tui-types.ts): the build-time members and their types. Plain
  code like lib.ts (user code calls the builders in expressions).
- **`@cssints/tui`** (packages/tui): `resolve(style, state, theme)`, `theme`, `setTheme`, `onTheme`, `defineTheme`
  (renderer-neutral, no imports), `@cssints/tui/system` (`createSystemTheme`, `scan`, `QUERY`, `contrast`; culori),
  `@cssints/tui/opentui` (`attach`, `use`, `props`, `followSystemTheme`) and `@cssints/tui/bomb` (`createTracker`,
  `openProps`, `textProps`, `rgbaOf`, `followSystemTheme`). A separate package because the engine must not depend on `@opentui/core` or
  `@bomb.sh/tty` (both optional peers).
- **Tests** are in packages/tui: `test/system.ts` (Node: the solver on Gruvbox dark, Catppuccin Latte and Nord, the
  fallbacks, the appearance, the replies as bytes, the bomb.sh follower, the run-time table), `test/tui.mjs` (Node: fixtures through a dev transform and an SSR build, the build
  errors), `test/render.ts` (Bun: the built styles on OpenTUI's test renderer, a simulated hover, press, theme switch and
  focus; the system theme on a fake terminal that answers OSC 4/10/11, then turns light), `test/bomb.ts` (Node: the built styles in a bomb.sh frame at 30x8, its ANSI output read back as cells, a
  pointer move, press and release, a theme switch, focus and the caret), `test/types/tui.ts` (what the types accept
  and reject). `examples/bomb.ts` is a list on bomb.sh (`bun run example`).

## Out of scope in v1

Terminal HMR; inheritance of text styles; per-side borders (`borderTop`), titles and custom border characters (use
the renderable's options); `calc()` and units; `cv()` variants and `firstThatWorks()` on terminal styles;
`media()`, `container()`, `supports()`, `attr()`, `within()`, `group()`; transitions and animation; colour depth
downgrade (OpenTUI and the terminal do it).
