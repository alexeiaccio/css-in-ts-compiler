# @cssints/masonry

A masonry layout for [cssints](../../README.md): `masonry()`, a chain member of `cssints/plugin` `scope()`. Items of
different heights are packed into as many columns as fit, each item under the shortest column, with no row gaps. It is
CSS Grid Level 3's grid lanes (`display: grid-lanes`) where the browser has them, and CSS multi-column layout where it
does not. No JavaScript, no media queries.

```ts
import { cn, p } from "cssints" with { type: "cssints" };
import { masonry } from "@cssints/masonry" with { type: "cssints" };

export const photos = masonry();
export const wall = cn(masonry().columns("12rem").gap(4), p(2));
```

```css
@layer _.k {
  ._masonry-lanes {
    columns: var(--masonry-min);
    gap: var(--masonry-gap);
    --masonry-min: 16rem;
    --masonry-gap: 1rem;
    display: grid-lanes;
    grid-template-columns: repeat(auto-fill, minmax(min(var(--masonry-min), 100%), 1fr));
  }
  /* only when a browserslist target lacks grid lanes */
  @supports not (display: grid-lanes) {
    ._masonry-lanes > * {
      display: inline-block;
      inline-size: 100%;
      vertical-align: top;
      break-inside: avoid;
      margin-block-end: var(--masonry-gap);
    }
  }
}
@layer _.a {
  ._x {
    --masonry-min: 12rem;
  }
  ._y {
    --masonry-gap: 1rem;
  }
}
```

## Methods

Each once, in any order:

| Method    | Default | What it is                                                                                    |
| --------- | ------- | --------------------------------------------------------------------------------------------- |
| `columns` | 16rem   | the least width of a column: as many columns as fit, never wider than the container           |
| `gap`     | 1rem    | the space between columns and between an item and the next in its column (one value for both) |

Both take a length (no percentage: the fallback's `columns` and margins cannot use one the same way). A lone number in
`gap` is a step of the spacing scale (0.25rem), as in `padding`. Tokens go where a length does. The types check each
method, and the build checks it again. A method in `media()` or another condition sets the custom property under it.

## Browsers

- **Native: grid lanes.** `display: grid-lanes` is the syntax the CSS Working Group settled on for masonry (CSS Grid
  Level 3, 2025), in place of `grid-template-rows: masonry` and `display: masonry`. Safari 26.4 ships it; Chrome and Edge
  (since 140) and Firefox (since 77, still on the old `grid-template-*: masonry` syntax) have it only behind a flag (October
  2026). `@mdn/browser-compat-data` knows it as `css.properties.display.grid-lanes`.
- **Fallback: columns.** The kernel's `columns` is the fallback: a browser that has grid lanes ignores it (a grid lanes
  container is not a block container), one that lacks them drops `display: grid-lanes` and lays the items out in
  columns. For a target that lacks grid lanes (the default targets do: Chrome and Firefox), the build adds the
  `@supports not` rule above for the items: a fallback of CSS only, so it reaches every target and covers the support
  warning of `display: grid-lanes` (its `polyfills` name the same BCD key). For targets that all have grid lanes (`safari
26.4`), the rules are not in the sheet.
- Checked in Chrome 154 and Firefox 155 (columns) and Playwright's WebKit 26.6 (grid lanes, and the columns with the native
  value hidden): `bun run test:browsers`.

## Rules

- **Kernel.** One kernel in layer `_.k`, once, written as styles (`css.display("grid-lanes")`, `gridTemplateColumns`,
  `gap`, `columns`): the defaults of the custom properties on the element (a nested masonry does not inherit its
  parent's values), `display`, the columns and the gap. A call is its class (`_masonry-lanes`), and
  each method one class in `_.a` (or `_.b` under a condition), which wins over the defaults.
- **Conflicts**, derived from the kernel. A `cn()` that holds `masonry()` and `display`, `grid`, `grid-template`,
  `grid-template-columns`, `gap`, `row-gap`, `column-gap`, `columns`, `column-width` or `column-count` is a build error
  at the call:
  `cssints: masonry: kernel lanes sets display, grid-template-columns, gap, columns (this style also sets display)`.
  Padding, sizes and colours do not conflict. Conflicts with an opaque runtime string in `cn()` are not seen, as for any plugin.

## Limits

- **The order differs.** Grid lanes put each item in the shortest column, so the items read across, roughly row by row.
  The columns fallback fills the first column top to bottom, then the next: item 2 sits under item 1, not beside it.
  When the order matters (a feed, a timeline sorted by date), the fallback shows it down the columns.
- **The fallback sets the items' box.** Each child is an inline block as wide as its column, with a bottom margin of
  `gap` (a block's margin before a column break moves the next column down in WebKit). An item shorter than its line
  height gets that height; a `display` of your own on an item replaces the inline block, and in Safari before 26.4 its
  column may then start a gap lower. The columns are balanced, so the last items may leave one column longer.
- Not here: `flow-tolerance` (cssints has it, `flowTolerance()`, Safari 26.4 only: set it beside `masonry()`), rows as lanes (`grid-template-rows`, a horizontal masonry), items that span lanes, and a
  JavaScript polyfill (masonic, solid-mason: too heavy for a fallback that CSS gives).

```bash
cd packages/masonry && bun run test   # fixtures through the engine (output for both kinds of targets, conflicts, build errors, a build), and the type test via bun run typecheck
bun run test:browsers                 # Chrome, Firefox and WebKit through playwright-core: items pack with no row gaps
```

## Credits

The layout is CSS Grid Layout Module Level 3 (the W3C CSS Working Group), `display: grid-lanes` as WebKit ships
it. Nothing is copied.
