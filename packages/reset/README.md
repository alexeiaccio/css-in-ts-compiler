# @cssints/reset

A small modern CSS reset for [cssints](../../README.md), in a layer below every other style of the sheet, so any style
beats it whatever its specificity. It is one call member of `cssints/plugin` `scope()` that returns global rules. No
runtime.

```ts
import { reset } from "@cssints/reset" with { type: "cssints" };

// reset({ media?, prose? })
reset({ media: true, prose: true });
```

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@layer _.k {
  @layer reset {
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    * {
      margin: 0;
    }
    html {
      -webkit-text-size-adjust: none;
      text-size-adjust: none;
      line-height: 1.5;
    }
    :where(input, button, textarea, select) {
      font: inherit;
      letter-spacing: inherit;
      word-spacing: inherit;
      color: inherit;
    }
    :where(p, h1, h2, h3, h4, h5, h6) {
      overflow-wrap: break-word;
    }
    :where(h1, h2, h3, h4, h5, h6) {
      text-wrap: balance;
    }
    :where(p) {
      text-wrap: pretty;
    }
    :where(ul, ol)[role="list"] {
      list-style: none;
      padding: 0;
    }
  }
  /* prose: true */
  @layer reset {
    :where(h1, …, p, ul, ol, dl, blockquote, pre, figure, table, hr):not([class])
      + :where(h1, …, hr):not([class]) {
      margin-block-start: 1em;
    }
    :where(h1, h2, h3, h4, h5, h6):not([class]) {
      line-height: 1.25;
    }
  }
  /* media: true */
  @layer reset {
    :where(img, picture, video, canvas, svg) {
      display: block;
      max-inline-size: 100%;
    }
    :where(img, video) {
      block-size: auto;
    }
  }
}
```

## The rules

- **The base** is what most modern resets agree on ([Josh Comeau](https://www.joshwcomeau.com/css/custom-css-reset/),
  [Jake Lazaroff](https://jakelazaroff.com/words/my-modern-css-reset/), [Vale](https://vale.rocks/posts/css-reset)):
  `border-box`, no margins, a readable line height, no text inflation on mobile, form controls in the page's font and
  colour, long words that wrap, balanced headings and paragraphs without orphans. The paddings stay (a list keeps room
  for its markers), and the markers of a list go only with `role="list"` (Andy Bell's), since Safari stops announcing a
  list that has `list-style: none`.
- **`media: true`** makes images, videos, canvases and SVGs blocks that never overflow their container, and keeps the
  aspect ratio of an image or video whose `height` attribute is set.
- **`prose: true`** adds back the space of text: 1em between flow elements that follow each other (Andy Bell's
  [flow](https://piccalil.li/blog/my-favourite-3-lines-of-css/)), and tighter headings, only on elements that have no
  class (Jake Lazaroff's `:not([class])`), as in rendered Markdown. An element with a cssints class is left alone.
- **Below everything.** The rules are in a layer `reset` nested in the engine's `_.k`. A nested layer ranks below the
  rules of its parent, so the reset is below the kernels, `global()` and token rules of `_.k`, below the class layers and
  the layers you declare with `layers()`; an unlayered stylesheet beats it as well.
- **Once.** Each block is a global rule identified by its text: `reset()` in two modules, or `reset()` and
  `reset({ media: true })`, print the base once.

## Limits

- The layer is `_.k.reset`, not a top-level `reset`: the sheet declares the engine's layers first, so a top-level layer
  that a plugin or `layers()` declares ranks above the classes. A stylesheet of your own that wants to sit between the
  reset and cssints cannot name a layer there.
- The rule set is fixed: there is no option per rule. A rule you do not want is overridden by any style of yours.
- Call it at a module's top level, in a module that the pages load (the entry): the reset is in the sheet of the modules
  that call it, and leaves with them.

```bash
cd packages/reset && bun run test   # fixtures through the engine (the order of the sheet, the flags), and the type test via bun run typecheck
```
