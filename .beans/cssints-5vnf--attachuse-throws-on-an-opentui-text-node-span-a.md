---
# cssints-5vnf
title: attach()/use() throws on an OpenTUI text node (<span>, <a>)
status: completed
type: bug
priority: normal
created_at: 2026-10-10T15:50:40Z
updated_at: 2026-10-10T17:47:35Z
parent: cssints-06ws
---

Found by cssints-m0yj (sky-tui on cssints/tui).

`attach(renderable, style)` of @cssints/tui/opentui throws on a text node: `<span>`, `<a>`, `<b>` of @opentui/solid are TextNodeRenderable (a BaseRenderable, not a Renderable): no `onMouseEvent`, no `ctx`, no `requestRender` of a Renderable's kind, no focused/blurred events. So `<span {...use(style)}>` fails when Solid calls the ref.

Repro (bun, in apps/sky-tui):

```ts
import { TextNodeRenderable } from "@opentui/core";
import { attach } from "../../packages/tui/src/opentui.ts";
attach(new TextNodeRenderable({}), { color: "#ff0000" } as never);
// TypeError: undefined is not an object (evaluating 'hooked.onMouseEvent.bind')
```

A text node has fg, bg and attributes setters, so the base props and the theme could be set; the states cannot (no mouse events).

Workaround in sky-tui (src/styles.ts `span()`): `props(resolve(style, {}, theme))` passed as `style`, with a Solid signal fed by `onTheme`.

## Todo

- [x] attach() on a text node: set the props and follow the theme, skip the mouse and focus hooks (or a clear error)
- [x] a test in test/render.ts with a TextNodeRenderable

## Summary of Changes

attach() and use() take a TextNodeRenderable: a node without onMouseEvent gets the props (fg, bg, attributes; `backgroundColor` is `bg` there already) and follows the theme, and skips the mouse, pointer and focus hooks (a text node has none of those events). A text node emits no `destroyed`, so the adapter wraps its destroyRecursively (what @opentui/solid calls on a removed node) to stop the theme listener, and passes it on to child text nodes. test/render.ts: a TextNodeRenderable in a <text>, through use(): the attributes, the drawn colour in both themes, and no theme change after it is destroyed. sky-tui: span(style) and its theme signal are gone; every <span> and <a> is `{...use(s.x)}`; screens.mjs checks the drawn colour of the title span in both themes.

Checked with it: should use() follow a changing style (the active tab of sky-tui)? Not small: the adapter is framework-neutral and Solid calls a ref once, so it needs a restyle() of its own. Left for cssints-332g.
