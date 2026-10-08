# @cssints/layout

Layout primitives for [cssints](../../README.md), after [Every Layout](https://every-layout.dev) and
[smolcss](https://smolcss.dev): `stack()`, `cluster()`, `sidebar()`, `switcher()`, `cover()` and `autoGrid()`. Each one is a
chain member of `cssints/plugin` `scope()`: a call gives the primitive's kernel classes, and each method sets one custom
property. No runtime, no media queries: the layouts respond to the space they have.

```ts
import { cn, p } from "cssints" with { type: "cssints" };
import {
  autoGrid,
  cluster,
  sidebar,
  stack,
  switcher,
} from "@cssints/layout" with { type: "cssints" };

export const page = cn(stack().gap(6), p(4));
export const toolbar = cluster().gap(2).justify("space-between");
export const layout = sidebar().width("20rem").content("50%").gap(4);
export const buttons = switcher().threshold("30rem");
export const cards = autoGrid().min("16rem").gap(4);
```

```css
@layer _.k {
  ._layout-stack-base {
    --layout-stack-gap: 1rem;
  }
  ._layout-stack-core {
    gap: var(--layout-stack-gap);
    display: flex;
    flex-direction: column;
  }
  ._layout-sidebar-base {
    --layout-sidebar-gap: 1rem;
    --layout-sidebar-width: auto;
    --layout-sidebar-content: 50%;
    --layout-sidebar-ff: 1 1 var(--layout-sidebar-width);
    --layout-sidebar-fm: auto;
    --layout-sidebar-lf: 999 1 0;
    --layout-sidebar-lm: var(--layout-sidebar-content);
  }
  ._layout-sidebar-base > :first-child {
    flex: var(--layout-sidebar-ff);
    min-inline-size: var(--layout-sidebar-fm);
  }
  ._layout-sidebar-base > :last-child {
    flex: var(--layout-sidebar-lf);
    min-inline-size: var(--layout-sidebar-lm);
  }
  ._layout-sidebar-core {
    gap: var(--layout-sidebar-gap);
    display: flex;
    flex-wrap: wrap;
  }
  ._layout-switcher-base > * {
    flex-grow: 1;
    flex-basis: calc((var(--layout-switcher-threshold) - 100%) * 999);
  }
  ._layout-grid-core {
    gap: var(--layout-grid-gap);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(var(--layout-grid-min), 100%), 1fr));
  }
  /* ... the other kernels */
}
@layer _.a {
  ._x {
    --layout-stack-gap: 1.5rem;
  }
  ._y {
    --layout-sidebar-width: 20rem;
  }
  /* ... one class per method and value */
}
```

## The primitives

| Primitive    | Methods (each once, in any order)                                             | What it is                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `stack()`    | `gap` (1rem)                                                                  | a flex column with a gap                                                                                                           |
| `cluster()`  | `gap` (1rem), `justify` (`flex-start`), `align` (`center`)                    | a wrapping row: tags, buttons, a toolbar                                                                                           |
| `sidebar()`  | `side` (`left`), `width` (`auto`, its content), `content` (50%), `gap` (1rem) | two children side by side; they stack when the content child would be narrower than `content` of the container                     |
| `switcher()` | `threshold` (30rem), `gap` (1rem)                                             | its children in one row while the container is wider than `threshold`, else one column (Heydon Pickering's Flexbox Holy Albatross) |
| `cover()`    | `minHeight` (100vh), `gap` (1rem)                                             | a flex column of a min height with its content centred vertically                                                                  |
| `autoGrid()` | `min` (16rem), `gap` (1rem)                                                   | as many columns of at least `min` as fit, `repeat(auto-fit, minmax(min(min, 100%), 1fr))`, which never overflows                   |

- **Values.** `gap` takes a length or a percentage, and a lone number is a step of the spacing scale (0.25rem), as in
  `padding`. `width`, `minHeight` and `min` take a length or a percentage, `threshold` a length, `content` a percentage from
  0 to 100. `justify` is `start | end | center | space-between | space-around | space-evenly`, `align` is `start | end |
center | baseline | stretch`, `side` is `left | right`. Tokens go where a length does. The types check each method, and
  the build checks it again (ranges included: `content("120%")` fails at the call).
- **Conditions.** A method in `media()`, `hover()` and the others sets the custom property under that condition:
  `media("(width >= 40rem)")(stack().gap(8))`.

## Rules

- **Kernels.** Each primitive is two kernels in layer `_.k`, once: `-core`, written as styles, sets the container's
  properties; `-base`, raw CSS, sets the defaults of the custom properties on the element and, for `sidebar()` and
  `switcher()`, the rules of the children. A call is the two classes (`_layout-stack-core _layout-stack-base`), and each
  method one class in `_.a` (or `_.b` under a condition), which wins over the defaults.
- **Conflicts.** A `cn()` that holds a primitive and a property its core sets is a build error at the call, derived from
  the kernel: `cn(stack(), display("grid"))` is
  `cssints: layout: kernel stack-core sets display, flex-direction, gap (this style also sets display)`, and `cn(autoGrid(), rowGap("1rem"))` fails as well (a longhand of `gap`). Padding, sizes and
  colours do not conflict. Conflicts across `cx()` are not seen, as for any plugin.
- **No leak into nested primitives.** The defaults are set on every primitive, so a `stack()` inside a `stack().gap(8)`
  has a gap of 1rem, not 2rem.
- **The children.** `sidebar()` sizes its first and last child (the first is the sidebar, or the last with
  `side("right")`; the order in the DOM stays the reading order), `switcher()` every child. Those rules are one class
  strong in `_.k`, so a class on a child wins over them.

## Limits

- `sidebar()` and `switcher()` pass their settings to the children by inheritance. A child that is itself a sidebar
  (or a switcher) reads its own defaults or settings in its role as a child, not its parent's: wrap it in a plain element
  when the parent's values are not the defaults.
- `cover()` centres all its content; Every Layout's centred child between a header and a footer is `margin-block: auto`
  on that child, which you write yourself.
- Not here: Every Layout's `center`, `box`, `frame`, `reel`, `imposter` and `icon` (`box` and `center` are a few plain
  properties; `frame()` in cssints is the concentric radius), and the switcher's limit on the number of items.

```bash
cd packages/layout && bun run test   # fixtures through the engine (output, conflicts, build errors), and the type test via bun run typecheck
```
