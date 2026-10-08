# @cssints/stuck

Style what is inside a sticky element while it is stuck, for [cssints](../../README.md): `sticky()` makes an element
sticky and a scroll-state container, `stuck(...)` wraps styles of its descendants in
`@container scroll-state(stuck: top)` (Chrome 133). Where a target lacks scroll-state queries, `stuck(...)` also emits
the same styles under an attribute that a tiny IntersectionObserver sets, in the way of
[bramus/sticky-observer](https://github.com/bramus/sticky-observer).

```ts
import { cn, color, hover } from "cssints" with { type: "cssints" };
import { sticky, stuck } from "@cssints/stuck" with { type: "cssints" };

export const header = sticky().top("0"); // <header class={header}>
export const title = cn(color("gray"), stuck(color("red"))); //   <h1 class={title}>
export const footer = sticky().bottom(2);
export const link = stuck("bottom")(color("green"), hover(color("black")));
```

```css
@layer _.k {
  ._stuck-core {
    position: sticky;
    container-type: scroll-state;
  }
}
@layer _.a {
  ._4k81c2 {
    top: 0;
  }
  ._kg6w97 {
    bottom: 0.5rem;
  }
}
@layer _.b {
  @container scroll-state(stuck: top) {
    ._it4l7h {
      color: red;
    }
  }
  /* only when a browserslist target lacks scroll-state queries */
  :where(._g-stuck[data-stuck~="top"]) ._fec935 {
    color: red;
  }
}
```

`header` is `_stuck-core _g-stuck _4k81c2`, `title` holds both `_it4l7h` and `_fec935`.

## Browsers

- **Native**: `@container scroll-state()` and `container-type: scroll-state`, Chrome and Edge 133. Not in Firefox or
  Safari yet.
- **Fallback**: `@cssints/stuck/observer` (about 1.3 kB minified, no imports) sets `data-stuck="top"` (a list of the
  stuck edges) on each `sticky()` element while it is stuck, and the fallback rules read it. It checks
  `CSS.supports("container-type", "scroll-state")` first and does nothing where the browser has the queries. Nothing to
  import by hand: the runtime entry names it (`script`), so the module that uses `sticky()` imports it through
  `virtual:cssints/runtime/stuck.observer` when a target lacks the queries; that module is empty when none does.
- The fallback rules are in the sheet only when a browserslist target lacks the queries (`chrome 133` alone gets the
  `@container` rules only): `stuck()` asks `lacking()` of `cssints/plugin`, the same query and rules as the support
  warnings. The kernel's support warnings (its `requires`, the queries, and its declaration
  `container-type: scroll-state`) are covered by the observer, so a build for the default targets prints none.
- Checked in Chrome (native, and the observer with the queries cut out), Firefox and WebKit (the observer):
  `bun run test:browsers`.

## Rules

- **`sticky()`** is `position: sticky` and `container-type: scroll-state`, with methods for the insets, each once, in any
  order: `top()`, `right()`, `bottom()`, `left()`, a `<length-percentage>` (a lone number is a spacing step, 0.25rem).
  Its class list also holds `_g-stuck`, the group marker the fallback rules read.
- **`stuck(...styles)`** applies the styles while the nearest `sticky()` ancestor is stuck to its top edge;
  `stuck(side)(...styles)` to `top`, `right`, `bottom` or `left`. It is a condition: it counts as one (layer `_.b`),
  wraps others (`stuck(hover(...))`) and goes inside them.
- **Descendants only.** A scroll-state query matches the descendants of the container, never the container itself (the
  spec's rule), so `stuck()` styles go on an element inside the sticky one. To style the sticky box itself, put an inner
  wrapper in it.
- **Conflicts.** `sticky()` sets `position` and `container-type`: one `cn()` with `position`, `container` or
  `container-type` is a build error, derived from the kernel (written as styles): `cssints: stuck: kernel core sets
position, container-type (this style also sets position)`.
- **Errors**: a bad inset is the grammar's, in the types and at build time (`sticky.top: unexpected "red" in "red",
expected <length-percentage>`), a method twice is `cssints: sticky().top() is used twice`, and an unknown side is a type
  error and `cssints: stuck: stuck() takes top, right, bottom or left, got "middle"`. Each points at the call.

## Limits

- **The fallback reads the insets once**, when it first sees the element: an inset that a media query changes later is
  not followed. A sticky element taller than its scroll container is not reported stuck. Shadow roots are not crossed.
- The fallback's root is the nearest ancestor whose `overflow` is not `visible`, else the viewport; the native query
  follows the real scroll container.
- No logical sides (`block-start`, `inline-end`), and no `scrollable` or `snapped` scroll-state queries.

```bash
cd packages/stuck && bun run test            # fixtures through the engine (output, targets, errors, observer size)
cd packages/stuck && bun run typecheck       # the type test
cd packages/stuck && bun run test:browsers   # Chrome, Firefox and WebKit through playwright-core
```
