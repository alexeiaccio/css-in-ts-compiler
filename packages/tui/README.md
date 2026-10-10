# @cssints/tui

[cssints](../../README.md) in a terminal: the runtime of `cssints/tui` styles (states, the mouse pointer, the caret,
themes) and its adapters for [OpenTUI](https://opentui.com) and [@bomb.sh/tty](https://bomb.sh/docs/tty/api/). The styles are written with `cssints/tui`, which the cssints
Vite plugin compiles to prop objects; this package puts them on renderables. The design is in
[docs/research/tui.md](../../docs/research/tui.md).

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
};
```

```tsx
import { attach, setTheme, use } from "@cssints/tui/opentui";

<box {...use(button)}>
  <text>Save</text>
</box>; // Solid or React
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
- A text node (`<span>`, `<a>`, `<b>`) takes the props and the theme. It has no mouse events and no focus, so it has
  no states: put `:hover` on the `<text>` around it.
- `resolve(style, state, theme)` of `@cssints/tui` is the renderer-neutral part: the props of a style in a state and a
  theme, for another adapter.

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

## Limits

No terminal HMR, no inheritance of text styles, no per-side borders or titles (the renderable's own options), no
units or `calc()`. See "Out of scope" in docs/research/tui.md.

## Tests

```bash
bun run test        # node test/tui.mjs (the plugin: dev transform, SSR build, errors), bun test/render.ts (OpenTUI's test renderer),
                    # node test/bomb.ts (bomb.sh's renderer at 30x8, the cells read back from its output)
bun run example     # examples/bomb.ts: a list with hover, press and click, `t` swaps the theme, `q` quits
bun run typecheck   # src and test/types/tui.ts (what the types reject)
```
