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
@layer reset;
@layer _.k, _.a, _.b, _.c, _.d, _.e;
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
  :where(button, input[type="button"], input[type="submit"], input[type="reset"]) {
    border: 0;
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
```

## The rules

- **The base** is what most modern resets agree on ([Josh Comeau](https://www.joshwcomeau.com/css/custom-css-reset/),
  [Jake Lazaroff](https://jakelazaroff.com/words/my-modern-css-reset/), [Vale](https://vale.rocks/posts/css-reset)):
  `border-box`, no margins, a readable line height, no text inflation on mobile, form controls in the page's font and
  colour, buttons without the border of the browser (its bevel; text fields, text areas and selects keep theirs), long
  words that wrap, balanced headings and paragraphs without orphans. A button keeps the background and the padding of the
  browser (Tailwind's preflight drops the background; this reset does not). The paddings stay (a list keeps room
  for its markers), and the markers of a list go only with `role="list"` (Andy Bell's), since Safari stops announcing a
  list that has `list-style: none`.
- **`media: true`** makes images, videos, canvases and SVGs blocks that never overflow their container, and keeps the
  aspect ratio of an image or video whose `height` attribute is set.
- **`prose: true`** adds back the space of text: 1em between flow elements that follow each other (Andy Bell's
  [flow](https://piccalil.li/blog/my-favourite-3-lines-of-css/)), and tighter headings, only on elements that have no
  class (Jake Lazaroff's `:not([class])`), as in rendered Markdown. An element with a cssints class is left alone.
- **Below everything.** The rules are in a top-level layer `reset`, declared before the engine's layers (a `layers`
  entry with `before: true`), so the reset is below the kernels, `global()` and token rules of `_.k`, below the class
  layers and the layers you declare with `layers()`; an unlayered stylesheet beats it as well.
- **A layer of your own between.** Declare it after `reset`, before the engine's:
  `layers("reset", "base", { before: true })` puts `base` above the reset and below every cssints style.
- **Once.** Each block is a global rule identified by its text: `reset()` in two modules, or `reset()` and
  `reset({ media: true })`, print the base once.

## Baseline variants

`@cssints/reset` is the whole reset. `@cssints/reset/<group>` is the same call with the declarations of a
[Baseline group of cssints](../../docs/API.md) only (`inGroup` of `cssints/plugin`, from the group data of cssints):
`widely-available`, `newly-available`, `baseline-2015` to `baseline-2026` (what was Baseline at the end of that year), and
each of them `/with-downstream` (also checked against Opera, Samsung Internet, Android WebView, UC and QQ). A
declaration whose property or value the group does not have is left out, and a rule left with no declaration goes.
`limited-availability` is everything, as `@cssints/reset`. `not-discouraged` has no variant: it bans three properties and
four keywords that the reset does not use. A name that is no Baseline group is a type error.

```ts
import { reset } from "@cssints/reset/widely-available" with { type: "cssints" };

reset({ media: true, prose: true });
```

What each variant drops (written by `node test/reset.mjs --write`, checked by `bun run test`):

<!-- variants -->

| Dropped                                                                                                                                                                  | Variants                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nothing                                                                                                                                                                  | `limited-availability`                                                                                                                                                                                                                                         |
| `text-size-adjust: none`, `text-wrap: balance`, `text-wrap: pretty`                                                                                                      | `widely-available`, `widely-available/with-downstream`, `baseline-2020`, `baseline-2020/with-downstream`, `baseline-2021`, `baseline-2021/with-downstream`, `baseline-2022`, `baseline-2022/with-downstream`, `baseline-2023`, `baseline-2023/with-downstream` |
| `text-size-adjust: none`, `text-wrap: pretty`                                                                                                                            | `newly-available`, `newly-available/with-downstream`, `baseline-2024`, `baseline-2024/with-downstream`, `baseline-2025`, `baseline-2025/with-downstream`, `baseline-2026`, `baseline-2026/with-downstream`                                                     |
| `text-size-adjust: none`, `overflow-wrap: break-word`, `text-wrap: balance`, `text-wrap: pretty`, `margin-block-start: 1em`, `max-inline-size: 100%`, `block-size: auto` | `baseline-2015`, `baseline-2015/with-downstream`, `baseline-2016`, `baseline-2016/with-downstream`, `baseline-2017`, `baseline-2017/with-downstream`                                                                                                           |
| `text-size-adjust: none`, `text-wrap: balance`, `text-wrap: pretty`, `margin-block-start: 1em`, `max-inline-size: 100%`, `block-size: auto`                              | `baseline-2018`, `baseline-2018/with-downstream`, `baseline-2019`, `baseline-2019/with-downstream`                                                                                                                                                             |

<!-- /variants -->

A dropped declaration is not replaced. `text-wrap: balance` and `pretty` are progressive: without them a heading wraps
as it always did. The unprefixed `text-size-adjust` is only for browsers that do not read `-webkit-text-size-adjust`,
which every variant keeps (a property cssints has no member for is in every group).

## Limits

- **The selectors are not checked.** The group data has the pseudo-classes without arguments (`:hover`), and no
  functional pseudo-class (`:where()`, `:not()`), pseudo-element (`::before`, `::backdrop`), attribute selector or
  combinator. A variant keeps every selector as written, so `baseline-2015` to `baseline-2020` keep rules with `:where()`
  (Baseline 2021) and `:not()` with a selector list, and drop only their declarations.

- `reset` is a contract name: a `layers("reset")` without `before`, or another plugin that declares `reset` after the
  engine's layers, is a build error.
- The rule set is fixed: there is no option per rule. A rule you do not want is overridden by any style of yours.
- Call it at a module's top level, in a module that the pages load (the entry): the reset is in the sheet of the modules
  that call it, and leaves with them.

```bash
cd packages/reset && bun run test   # fixtures through the engine (the order of the sheet, the flags, each variant), and the type test via bun run typecheck
cd packages/reset && bun run variants   # rewrite src/groups after a bun run groups in packages/cssints
```

## Credits

The base follows what [Josh Comeau](https://www.joshwcomeau.com/css/custom-css-reset/),
[Jake Lazaroff](https://jakelazaroff.com/words/my-modern-css-reset/) and [Vale](https://vale.rocks/posts/css-reset)
publish; `role="list"` and the flow rule are [Andy Bell's](https://piccalil.li/blog/my-favourite-3-lines-of-css/). The
declarations are those that these resets share. They are written here, as globals of `scope()`; no file is copied.
