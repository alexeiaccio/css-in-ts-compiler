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
export const button = { border: true, borderStyle: "rounded", borderColor: "#585b70", paddingTop: 0, paddingRight: 1,
  paddingBottom: 0, paddingLeft: 1, color: "#cdd6f4", cursor: "pointer",
  ":hover": { backgroundColor: "#313244", borderColor: "#89b4fa" }, ":active": { bold: true } };
```

and is used through the adapter:

```tsx
import { use } from "@cssints/tui/opentui";

<box {...use(button)}><text>Save</text></box>;        // Solid: spread props, `ref` wires the states
new BoxRenderable(renderer, use(button)).               // core: same object; or attach(box, button)
```

`use(style)` returns the OpenTUI props of the current theme and no state, plus `ref`. On the instance it wires
`onMouseOver/Out` (`:hover`, and `cursor`), `onMouseDown/Up` (`:active`) and the `focused`/`blurred` events
(`:focus`), and sets the changed props on the renderable when a state or the theme changes. `attach(renderable,
style)` is the same for a renderable you made yourself.

## Property mapping

Neutral key = what the compiled object holds; OpenTUI = what the adapter sets.

| `css.*` member | values (types and build) | neutral key | OpenTUI |
| --- | --- | --- | --- |
| `color` | `<color>`, a colour token | `color` | `fg` |
| `backgroundColor`, `bg` | `<color>`, a colour token | `backgroundColor` | `backgroundColor` (box), `bg` (text) |
| `fontWeight` | `bold`, `normal`, `lighter` (dim) | `bold`, `dim` | `attributes` bits |
| `fontStyle` | `italic`, `normal` | `italic` | `attributes` |
| `textDecoration`, `textDecorationLine` | `underline`, `line-through`, both, `none` | `underline`, `strikethrough` | `attributes` |
| `textAlign` | `left`, `center`, `right` | `textAlign` | `textAlign` |
| `border` | style, then colour, each optional | `border`, `borderStyle`, `borderColor` | same |
| `borderStyle` | `solid` (single), `double`, `rounded`, `heavy`, `none` | `border`, `borderStyle` | same |
| `borderColor` | `<color>`, a colour token | `borderColor` | same |
| `padding`, `p`, `margin`, `m` | 1 to 4 cells (margin: or `auto`) | the four longhands | same |
| `paddingTop` … `marginLeft`, `pt pr pb pl mt mr mb ml`, `paddingInline/Block`, `marginInline/Block` | cells | longhands | same |
| `gap`, `rowGap`, `columnGap` | cells or `N%` | same | same |
| `width`, `height`, `min*`, `max*`, `flexBasis` | cells, `N%`, `auto` | same | same |
| `flexDirection`, `flexWrap`, `justifyContent`, `alignItems`, `alignSelf` | Yoga's keywords | same | same |
| `flexGrow`, `flexShrink` | `<number>` | same | same |
| `position` | `relative`, `absolute` | same | same |
| `top`, `right`, `bottom`, `left` | cells, `N%`, `auto` | same | same |
| `overflow` | `visible`, `hidden`, `scroll` | same | same |
| `display` | `flex`, `none` | `visible` | `visible` |
| `opacity` | `<number>` 0 to 1 | same | same |
| `zIndex` | integer | same | same |
| `cursor` | the CSS cursor keywords OpenTUI sends over OSC 22 | `cursor` | `renderer.setMousePointer` on over, `"default"` on out |
| `caretShape` | `auto`, `bar`, `block`, `underscore` | `caretShape` | `cursorStyle.style` (`default`, `line`, `block`, `underline`) |
| `caretColor` | `<color>` | `caretColor` | `cursorColor` |
| `caretAnimation` | `auto` (blinks), `manual` (steady) | `caretAnimation` | `cursorStyle.blinking` |

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
- `:hover` follows `onMouseOver`/`onMouseOut` (OpenTUI's top hit target, so a child under the pointer takes the hover
  from its parent unless it bubbles), `:active` `onMouseDown`/`onMouseUp` (and `out`), `:focus` the renderable's
  `focused`/`blurred` events. A box needs `focusable: true` to take focus; that is a renderable option, not a style.
- **Cursors.** `cursor` is set with `renderer.setMousePointer(value)` on over and back to `"default"` on out. The
  caret properties go to the focused editable's `cursorStyle` and `cursorColor` (Input, Textarea); OpenTUI itself then
  calls `setCursorStyle` while it has focus.

## Themes

- `css.createTokens(...)` and `css.createGlobalTheme(tokens, name, overrides)` are re-exported by `cssints/tui` with
  their web types and checks. A theme's second argument is its name (`"dark"`, a valid type selector); a `media()`
  condition is a build error in a terminal file (no media there).
- A terminal has no custom properties, so a token is resolved at build time: the site holds the default value and,
  under `themes`, what each theme changes (`{ backgroundColor: "#1e1e2e", themes: { light: { backgroundColor:
  "#eff1f5" } } }`), states included. The themes are those registered when the site runs: import the theme module
  first, as on the web.
- `setTheme(name)` of `@cssints/tui` swaps the resolved values of every attached renderable; `""` is the default.

## Packages

- **`cssints/tui`** (packages/cssints/src/tui.ts and tui-types.ts): the build-time members and their types. Plain
  code like lib.ts (user code calls the builders in expressions).
- **`@cssints/tui`** (packages/tui): `resolve(style, state, theme)`, `setTheme`, `onTheme` (renderer-neutral, no
  imports) and `@cssints/tui/opentui` (`use`, `attach`). A separate package because the engine must not depend on
  `@opentui/core`, and the second adapter goes beside this one.

## Out of scope in v1

Terminal HMR; inheritance of text styles; per-side borders (`borderTop`), titles and custom border characters (use
the renderable's options); `calc()` and units; `cv()` variants and `firstThatWorks()` on terminal styles;
`media()`, `container()`, `supports()`, `attr()`, `within()`, `group()`; transitions and animation; colour depth
downgrade (OpenTUI and the terminal do it); the bomb.sh adapter (cssints-kotl).
