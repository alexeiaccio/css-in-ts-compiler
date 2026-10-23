# @cssints/tui

> **Deprecated (2026-10-21).** The replacement is the `terminal/` target of
> [`native/`](../../native/README.md) in this repository ([native/terminal](../../native/terminal)): `cssints/clay` styles, laid out by
> [Clay](https://github.com/nicbarker/clay) and drawn into character cells on
> [termbox2](https://github.com/termbox/termbox2), with the keyboard focus layer in C. The package still works and is
> still published; importing it prints one warning ("`@cssints/tui` is deprecated: …"). The registry marks the version
> deprecated when the release runs `npm deprecate` (see [RELEASING.md](../../RELEASING.md)).

| Here                                            | There (`native/terminal/`)                                                                    |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `cssints/tui` styles, the Vite plugin           | `cssints/clay` styles, `generator/clay-header.ts` → a C header (`styles.h`)                   |
| the layout of an adapter (`resolve`, a flexbox) | Clay lays out; `terminal/measure.c` measures text as a monospace grid                         |
| OpenTUI (`/opentui`) or @bomb.sh/tty (`/bomb`)  | `terminal/render.c` fills cells, `terminal/tb2.c` is termbox2: truecolour or 256, keys, mouse |
| `:focus` from the renderable                    | `terminal/focus.c`: the Tab order, roving focus in a group, `focus(id)`                       |
| Solid or React trees                            | hand-written C pages: `terminal/page.c` (the Sensors page), `sky.c`, `thread.c`, `profile.c`  |

What carries over: styles as data (a `styles.ts` module, no sheet and no cascade), tokens and named themes (the static
dark and light ones), and the state names (`:hover`, `:active`, `:focus`) as overlays. What does not: OpenTUI and
bomb.sh, the run-time `setTheme` and the system theme, hover (termbox2 reports no motion), images, a body that wraps,
wide glyphs and emoji, floating overlays, sub-cell borders and radii. [native/docs/map.md](../../native/docs/map.md) step 6 is the full account.

```sh
cd ../../native
sh terminal/build.sh                    # styles.ts -> generator/clay-header.ts -> styles.h, then cc -> terminal/demo
./terminal/demo                         # the Sensors page in cells: Tab, Up/Down, Space, t, q
./terminal/demo --page sky              # apps/csssky-tui's feed; enter opens the thread
./terminal/demo --page profile          # apps/csssky's profile, the screen the tui never had
./terminal/demo --dump out.txt          # one frame headless, '.' is a fill
./terminal/demo --keys Tab,ArrowDown --dump out.txt   # a frame after each key
```

The rest of this file describes the deprecated package: [cssints](../../README.md) in a terminal, the runtime of
`cssints/tui` styles (states, the mouse pointer, the caret, themes) and its adapters for
[OpenTUI](https://opentui.com) and [@bomb.sh/tty](https://bomb.sh/docs/tty/api/). The styles are written with
`cssints/tui`, which the cssints Vite plugin compiles to prop objects; this package puts them on renderables. The design
is in [docs/research/tui.md](../../docs/research/tui.md).

```ts
// styles.ts
import * as css from "cssints/tui" with { type: "cssints" };

export const t = css.createTokens({
  color: { $type: "color", bg: { $value: "#1e1e2e" }, accent: { $value: "#89b4fa" } },
});
css.createGlobalTheme(t, "light", { color: { bg: "#eff1f5", accent: "#1e66f5" } });

export const button = css.cn(
  css.border("rounded", "#585b70"),
  css.p(0, 1),
  css.bg(t.color.bg),
  css.cursor("pointer"),
  css.hover(css.borderColor(t.color.accent)),
  css.active(css.borderStyle("double")),
);
```

The plugin replaces `button` by:

```js
export const button = {
  border: true,
  borderStyle: "rounded",
  borderColor: "#585b70",
  paddingTop: 0,
  paddingRight: 1,
  paddingBottom: 0,
  paddingLeft: 1,
  backgroundColor: "#1e1e2e",
  cursor: "pointer",
  ":hover": { borderColor: "#89b4fa" },
  ":active": { border: true, borderStyle: "double" },
  themes: { light: { backgroundColor: "#eff1f5", ":hover": { borderColor: "#1e66f5" } } },
  vars: { backgroundColor: "color-bg", ":hover": { borderColor: "color-accent" } }, // for a run-time theme
};
```

```tsx
import { attach, setTheme, use } from "@cssints/tui/opentui";

<box {...use(button)}>
  <text>Save</text>
</box>; // Solid or React
<text {...use(() => (active() ? tabActive : tab))}>Home</text>; // a style that changes
attach(new BoxRenderable(renderer, {}), button); // core
setTheme("light"); // every attached renderable
```

## Rules

- `attach(renderable, style)` sets the props of the style and keeps them in step with `:hover` (mouse `over` to
  `out`), `:active` (`down` to `up`) and `:focus` (`focused` to `blurred`; a box needs `focusable: true`), in that
  order of precedence, and with the theme of `setTheme`. Your own `onMouseOver` and the other handlers still run.
- `cursor` is the mouse pointer while over the renderable (`renderer.setMousePointer`, OSC 22), `"default"` again on out.
  `caretShape`, `caretColor` and `caretAnimation` are the `cursorStyle` and `cursorColor` of an Input or a Textarea.
- `color` is OpenTUI's `fg`; `backgroundColor` is `backgroundColor` on a box and `bg` on a text; the text attributes
  (`fontWeight`, `fontStyle`, `textDecoration`) are the bits of `attributes`. A prop the renderable does not have is
  not set, so a text style on a box does nothing: put it on the `<text>`. On an editable or a select, `color` is
  `textColor`.
- A focused renderable draws colours of its own: `focusedBorderColor` on a box (also while a descendant has the
  focus), `focusedBackgroundColor` and `focusedTextColor` on an editable or a select. Each one follows the style's
  colour in the current state, so a focused box draws its `:focus` border.
- `attach` on a renderable it has attached swaps the style: the states, the theme and the hooks stay, a prop only the
  old style set goes back to the renderable's own value, and under the mouse the pointer follows the new `cursor`.
  `use(() => style)` re-reads the accessor each time the ref runs: Solid runs a ref in a render effect, so a signal
  the accessor reads swaps the style; React calls the new ref of each render.
- A text node (`<span>`, `<a>`, `<b>`) takes the props and the theme. It has no mouse events and no focus, so it has
  no states: put `:hover` on the `<text>` around it.
- `resolve(style, state, theme)` of `@cssints/tui` is the renderer-neutral part: the props of a style in a state and a
  theme, for another adapter.

## The system theme

A theme computed at run time from the terminal's own colours: each colour token is a role, a hue source (an ANSI
colour, or the terminal's `fg`/`bg`) and contrast rules against the tokens it sits on.

```ts
// theme.ts: run time, not a cssints module
import { createSystemTheme } from "@cssints/tui/system";

import { t } from "./styles.ts";

export const system = createSystemTheme(
  t,
  {
    color: {
      bg: { surface: true }, // the terminal's background
      card: { surface: true, on: [t.color.bg], contrast: 1.1 }, // a panel 1.1:1 from it
      text: { hue: "fg", on: [t.color.bg, t.color.card], contrast: 7 },
      accent: { hue: "blue", on: [t.color.bg, t.color.card], contrast: 3 },
    },
  },
  { hues: { blue: "#89b4fa" }, themes: { light: "light" } },
);
```

```ts
// OpenTUI
import { followSystemTheme } from "@cssints/tui/opentui";

const renderer = await createCliRenderer();
await followSystemTheme(renderer, system); // the palette, or 100 ms; sets the theme "system"
```

- **A role.** `hue` (default `fg`, `bg` for a surface), `on` (tokens with a role), `contrast` (WCAG 2). A text role
  keeps its source colour when it meets every rule, else takes the lightness of the strictest one: the reversed
  WCAG ratio, bisected in OKHSL at the source's hue and saturation (the saturation falls off toward black and white),
  the OKLCH chroma capped at the source's, so a colour can move but never get more vivid. A `surface` sits at exactly
  `contrast` from its first `on`, toward the foreground. `ansi`: the index (or `"default"`) to draw when the terminal
  reports nothing.
- **What the terminal reports.** Its background, foreground and ANSI colours: every role from its colour, placed for
  the real background. Its background only: the app's hues (`options.hues`). Nothing: on OpenTUI, ANSI indices and the
  terminal's default colours (`ansi:4`, `default`, which the adapter turns into `RGBA.fromIndex` and
  `RGBA.defaultForeground`); on bomb.sh (no indexed colour) the static theme of the appearance.
- **Light or dark:** the background (darker than the foreground), else the colour-scheme report (`CSI ? 997 ; 1|2 n`,
  or OpenTUI's `themeMode`), else `COLORFGBG`, else dark. `options.themes` names the static theme under each: a token
  without a role keeps its value.
- **Changes.** OpenTUI turns on mode 2031 and emits `theme_mode` and `palette`; the follower rebuilds on both. On
  bomb.sh the follower writes `CSI ? 2031 h` and queries again on a notification; `stop()` turns it off.
- `theme.solve(report)` gives the values of a report (`{ fg, bg, ansi, scheme }`) without applying them;
  `defineTheme(name, values, base)` of `@cssints/tui` is the run-time table it fills (a colour per token name,
  `color-bg` for `var(--color-bg)`), for a theme of your own.

## @bomb.sh/tty

bomb.sh draws a frame from a list of ops (`open`, `text`, `close`) and returns the pointer events of that frame. The
adapter `@cssints/tui/bomb` turns a style, in the state of its element id, into the options of `open()` and `text()`,
and its tracker keeps the states across frames:

```ts
import { close, createTerm } from "@bomb.sh/tty";
import { createTracker, setTheme } from "@cssints/tui/bomb";

const term = await createTerm({ width: 80, height: 24 });
const ui = createTracker();
const build = () => [
  ui.open("save", button), // open("save", options of `button` in the state of "save")
  ui.text("Save", label, "save"), // text("Save", options of `label` in the state of "save")
  close(),
];
// each mouse event: the pointer is { x, y, down }
process.stdout.write(ui.render(term, build, { pointer }).output);
setTheme("light"); // the next frame takes the light values
process.stdout.write(ui.reset()); // on exit: the default pointer and caret
```

- `ui.render(term, build, options)` renders `build()`, reads the `pointerenter`/`pointerleave` events and, when a state
  changed, renders `build()` again, so a hover shows in the same frame. `output` holds both frames and the escape
  bytes of the pointer and the caret. The events of both frames are in `events` (`pointerclick` for a click).
- `:hover` is on from `pointerenter` to `pointerleave` (an element and its ancestors, as Clay reports them); `:active`
  is on from a press (`pointer.down` becomes true) over the element to the release or a leave; `:focus` is the id given
  to `ui.focus(id)` (bomb.sh has no focus of its own).
- `cursor` is the mouse pointer (OSC 22) of the innermost hovered element that has one, `default` when there is none.
  The caret of the focused element is DECSCUSR (`caretShape`, `caretAnimation`) and OSC 12 (`caretColor`); its place
  is the `caret` option of `text()`, which is yours. `ui.reset()` gives the terminal its pointer and caret back.
- `openProps(props)` and `textProps(props)` are the plain mapping of `resolve()` (no tracker): a number is `fixed(n)`,
  `N%` is `percent`, `auto` is `fit`, `flexGrow` is `grow` on each axis with no size, `min*`/`max*` are the bounds of
  `fit` and `grow`, `flexDirection` is `direction`, `justifyContent` and `alignItems` are `alignX` and `alignY` (by the
  direction), `borderStyle: "rounded"` is a `cornerRadius` of 1, `overflow` is `clip`, `position: "absolute"` is
  `floating` on the parent, `display: "none"` is a box of size 0 that clips. The full table, and what does not map, is
  in docs/research/tui.md.
- **What bomb.sh cannot draw:** `double` and `heavy` borders are a single line (bomb.sh has one line set and round
  corners), margins (wrap the element in a parent with padding), `flexShrink`, `flexBasis`, `flexWrap`, the
  `-reverse` directions (drawn forward), `space-*`, `stretch` and `baseline` alignment, `alignSelf`, `opacity`,
  percentages of padding and gap, scroll offsets (`overflow: scroll` clips), `zIndex` without `position: absolute`.
  They are left out at run time; the build cannot tell, since the same style may go to OpenTUI.
- Transitions are not a cssints/tui member: give bomb.sh's `transition` as the last argument of `ui.open` and render
  again while `animating`.
- The system theme: `followSystemTheme(system, { write })` writes the queries (OSC 10, 11, 4, `CSI ? 996 n`, mode
  2031); pass each chunk of stdin through `follow.feed(bytes)`, which takes the replies out and returns the rest for
  `input.scan()` (bomb.sh's parser does not report OSC replies). `await follow.ready`: the replies or 100 ms.

```ts
const follow = followSystemTheme(system, { write: (s) => process.stdout.write(s) });
process.stdin.on("data", (bytes) => dispatch(input.scan(follow.feed(bytes)).events));
await follow.ready;
```

## Limits

No terminal HMR, no inheritance of text styles, no per-side borders or titles (the renderable's own options), no
units or `calc()`. See "Out of scope" in docs/research/tui.md.

## Credits

The adapter is for [OpenTUI](https://opentui.com) (MIT). No code of it is copied.

## Tests

```bash
bun run test        # node test/system.ts (the solver on Gruvbox dark, Catppuccin Latte and Nord, the fallbacks, the replies
                    # as bytes, the bomb.sh follower), node test/tui.mjs (the plugin: dev transform, SSR build, errors),
                    # bun test/render.ts (OpenTUI's test renderer; the system theme on a fake terminal that answers OSC 4/10/11),
                    # node test/bomb.ts (bomb.sh's renderer at 30x8, the cells read back from its output)
bun run example     # examples/bomb.ts: a list with hover, press and click, `t` swaps the theme, `q` quits
bun run typecheck   # src and test/types/tui.ts (what the types reject)
```
