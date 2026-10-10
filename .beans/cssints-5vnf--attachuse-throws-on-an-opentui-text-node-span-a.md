---
# cssints-5vnf
title: attach()/use() throws on an OpenTUI text node (<span>, <a>)
status: todo
type: bug
created_at: 2026-10-10T15:50:40Z
updated_at: 2026-10-10T15:50:40Z
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

- [ ] attach() on a text node: set the props and follow the theme, skip the mouse and focus hooks (or a clear error)
- [ ] a test in test/render.ts with a TextNodeRenderable
