# @cssints/data

Statistics over runtime values, computed by the browser's layout for [cssints](../../README.md): `max`, `sum` and
`count` of a list, the [dCSS](https://noscript.ing/compute) idea as one call member of `cssints/plugin` `scope()`. It
prints a small global rig and no class; there is no runtime. The browser lays the values out as widths, reads the
resulting width back as a number with a container query, and prints it with a counter.

```ts
import { data } from "@cssints/data" with { type: "cssints" };

// at a module's top level, once: the rig, and no class
data();
```

```css
@layer _.k {
  [data-data] {
    display: inline-grid;
    grid-template-columns: auto;
    width: max-content;
    overflow: clip;
  }
  [data-data] > ul {
    margin: 0;
    padding: 0;
    list-style: none;
    height: 0;
  }
  [data-data="max"] > ul {
    display: grid;
  }
  [data-data="max"] > ul > li {
    width: calc(var(--value) * 1px);
    height: 0;
  }
  [data-data="sum"] > ul {
    display: flex;
    width: max-content;
  }
  [data-data="sum"] > ul > li {
    flex: none;
    width: calc(var(--value) * 1px);
    height: 0;
  }
  [data-data="count"] > ul {
    display: flex;
    width: max-content;
  }
  [data-data="count"] > ul > li {
    width: 1px;
    height: 0;
  }
  [data-read] {
    display: block;
    container-type: inline-size;
  }
  [data-read] > * {
    --data-result: round(100cqw / 1px);
  }
  [data-data="max"] [data-read] output::after,
  [data-data="sum"] [data-read] output::after,
  [data-data="count"] [data-read] output::after {
    counter-reset: out var(--data-result);
    content: counter(out);
  }
}
```

## The DOM contract

```html
<figure data-data="max">
  <ul aria-hidden="true">
    <li style="--value: 12"></li>
    <li style="--value: 40"></li>
    <li style="--value: 30"></li>
  </ul>
  <b data-read><output></output></b>
</figure>
```

- **The figure** picks the statistic with `data-data`: `max`, `sum` or `count`. Any other value matches no statistic
  rule and prints nothing.
- **The measuring list** is a ruler, not content: it is `aria-hidden` and has no height. Each `<li>` carries `--value`,
  a unitless number of pixels. Nothing reads the list's text; the rig reads its widths.
- **The reader** is a `<b data-read>` (any element): a block that fills the figure's single auto column and is a
  `container-type: inline-size` size container. Its children get `--data-result`, the reader's width in pixels as a
  number; its `<output>` prints that number with a counter. Put the output inside the reader: CSS cannot hand a number
  to a sibling.

## A worked example

`max` of 12, 40 and 30:

- the list is a grid of one implicit column, so its width is its widest item;
- each `<li>` is `calc(var(--value) * 1px)` wide and `0` tall: 12px, 40px, 30px, so the column is **40px**;
- the reader is a block in that column, so it is 40px wide; `round(100cqw / 1px)` is `40`;
- `counter-reset: out var(--data-result)` sets the counter to 40, and `content: counter(out)` paints `40`.

`sum` makes the list a hug-width flex row instead, so the row is `12 + 40 + 30 = 82px` and the counter prints `82`.
`count` is a row of `1px` items, so its width is the number of items: `3`.

## What layout computes

| `data-data` | The layout that is the answer          | A list of 12, 40, 30 |
| ----------- | -------------------------------------- | -------------------- |
| `max`       | the widest item (one auto grid column) | `40`                 |
| `sum`       | the total (a hug-width flex row)       | `82`                 |
| `count`     | the number of items (a row of 1px)     | `3`                  |

The reader's inline size is its width in the figure's column. Because it is `container-type: inline-size` (size
containment on the inline axis), its own contents cannot widen it: it is sized by the measuring list, not by the printed
answer. `round(100cqw / 1px)` divides the container width by a pixel, so the result is the width as a unitless number,
rounded to an integer.

## The rules

- **One member, no arguments.** `data()` is called at a module's top level; it prints no class and no import.
- **Once per sheet.** Each rule is a global identified by its text: `data()` in two modules, or twice in one, prints the
  rig once.
- **The three names.** The statistic rules match only `max`, `sum` and `count`; the counter rule only applies inside
  those figures. An unknown `data-data` gets the base figure and the measuring list, and prints nothing.
- **In `_.k`.** The rules are global rules, in the engine's kernel layer, like `global()`. A class layer beats them; do
  not style the rig's own elements.

## Accessibility

The measuring list is `aria-hidden="true"`: it is a ruler, not content, and a reader should not hear three empty items.
The printed answer is **generated content** (`output::after`): no screen reader reads it as text, find-in-page does not
find it, and it is not copied. Do not make it the only place the number exists. Put the number in a `<figcaption>`, as
[dCSS](https://noscript.ing/compute) does, so the figure has a name and a value a reader and a search can reach:

```html
<figure data-data="max">
  <ul aria-hidden="true">
    <li style="--value: 12"></li>
    <li style="--value: 40"></li>
    <li style="--value: 30"></li>
  </ul>
  <b data-read><output></output></b>
  <figcaption>Busiest hour: 40 requests</figcaption>
</figure>
```

The caption is text; keep it in step with the same values. When the host can render both (server-side or at the same
moment it writes `--value`), write the number there too.

## Limits

- **Needs container query units and `round()`.** `cqw` is Chrome 105, Firefox 110 and Safari 16; `round()` is Chrome
  125, Firefox 118 and Safari 15.4. A browser without them prints nothing or an empty answer.
- **The answer only reaches the reader's subtree.** `--data-result` is a custom property on the reader's children; CSS
  cannot hand a number to a sibling or to the figure. A `<figcaption>` outside the reader cannot read it. To show the
  number elsewhere, put another reader there or use a script.
- **Pixels.** `--value` is a unitless, non-negative number that the rig multiplies by `1px`; widths cannot be negative
  (a max of negatives is `0`), and the printed answer is a whole pixel because `round()` rounds it.
- **`count` counts `<li>` elements**, whether or not they carry `--value`. `max` and `sum` read `--value` only.
- **No median, average or sort.** This is the three primitives: a maximum, a sum and a count. The article's sorting,
  `anchor()` and `sibling-index()` are not here.
- **The rig is global.** Its selectors target `[data-data]` and `[data-read]`, which a page may use for its own
  content; do not repurpose those attributes. One figure per statistic.

```bash
cd packages/data && bun run test            # the sheet through the engine: the rig once for two calls, no class, the rules
cd packages/data && bun run test:browsers   # Chromium through playwright-core: 40, 82 and 3, then a changed value
cd packages/data && bun run typecheck
cd packages/data && bun run build
```

## Credits

The idea and the DOM contract are [Computing with CSS Layout](https://noscript.ing/compute) by Agustin Capeletto and
[dCSS](https://github.com/noscripting/dCSS): an auto grid column is a maximum, a hug-width flex row is a sum, a row of
1px items is a count, and a container query read back through `round(100cqw / 1px)` is the number, printed by a counter.
The rules are written here, as globals of `scope()`; no code is copied.
