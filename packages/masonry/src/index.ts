// @cssints/masonry: a masonry layout as one chain member of `scope()`. The kernel is CSS Grid Level 3's grid lanes
// (`display: grid-lanes`, Safari 26.4), written as styles, so its conflicts are derived. For a target that lacks grid
// lanes the build adds a fallback of CSS only: multi-column layout, whose children rules are kept by `@supports not`, so
// a browser that has grid lanes ignores them. Its items run down each column, not across rows.
import { scope } from "cssints/plugin";

/**
 * A masonry layout, `masonry().columns("16rem").gap(4)`: as many columns of at least `columns` as fit (16rem), items
 * packed into the shortest column, `gap` between them (1rem; a lone number is a step of the spacing scale). Native grid
 * lanes where the browser has them, CSS columns elsewhere (items ordered down each column). It sets `display`, the columns
 * and the gap, so a `cn()` that also sets one of them is a build error.
 */
export const { masonry } = scope("masonry", {
  // `columns` is the fallback's and sits in the kernel: a grid lanes container is not a block container, so it ignores
  // it, and the derived conflicts then cover the multi-column properties too
  "#lanes": {
    css: (css) => [
      css.vars({ "--_min": "16rem", "--_gap": "1rem" }),
      css.display("grid-lanes"),
      css.gridTemplateColumns("repeat(auto-fill,minmax(min(var(--_min),100%),1fr))"),
      css.gap("var(--_gap)"),
      css.columns("var(--_min)"),
    ],
  },
  // `gap` already sets `column-gap`, which the columns use; the rows get a margin. The items are inline blocks a column
  // wide: a block's margin before a column break moves the next column down by a gap in WebKit. It covers the support
  // warning of `display: grid-lanes` (the key the declaration warns with).
  "#columns": {
    polyfills: ["css.properties.display.grid-lanes"],
    css:
      "@supports not (display:grid-lanes){" +
      "&>*{display:inline-block;inline-size:100%;vertical-align:top;break-inside:avoid;margin-block-end:var(--_gap)}}",
  },
  masonry: {
    uses: ["lanes", "columns"],
    chain: {
      columns: { args: "<length [0,∞]>", emit: (v) => [["--_min", v]] },
      gap: { args: "<length [0,∞]>", spacing: true, emit: (v) => [["--_gap", v]] },
    },
  },
}).export();
