# @cssints/tui

[cssints](../../README.md) in a terminal: the runtime of `cssints/tui` styles (states, the mouse pointer, the caret,
themes) and its [OpenTUI](https://opentui.com) adapter. The styles are written with `cssints/tui`, which the cssints
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
  not set, so a text style on a box does nothing: put it on the `<text>`.
- `resolve(style, state, theme)` of `@cssints/tui` is the renderer-neutral part: the props of a style in a state and a
  theme, for another adapter.

## Limits

No terminal HMR, no inheritance of text styles, no per-side borders or titles (the renderable's own options), no
units or `calc()`. See "Out of scope" in docs/research/tui.md.

## Tests

```bash
bun run test        # node test/tui.mjs (the plugin: dev transform, SSR build, errors), then bun test/render.ts (OpenTUI's test renderer)
bun run typecheck   # src and test/types/tui.ts (what the types reject)
```
