// @cssints/masonry: a masonry layout as one chain member of `scope()`. The kernel is CSS Grid Level 3's grid lanes
// (`display: grid-lanes`, Safari 26.4); cssints' grammar (mdn-data) does not know that value yet, so the kernel is raw CSS
// and lists its conflicts. For a target that lacks grid lanes the build adds a fallback of CSS only: multi-column layout,
// kept by `@supports not`, so a browser that has grid lanes ignores it. Its items run down each column, not across rows.
import { scope } from "cssints/plugin";

const LANES = "css.properties.display.grid-lanes";

const lanes = scope("masonry", {
  "#lanes": {
    css:
      "&{--_min:16rem;--_gap:1rem;display:grid-lanes;" +
      "grid-template-columns:repeat(auto-fill,minmax(min(var(--_min),100%),1fr));gap:var(--_gap)}",
    requires: [LANES],
  },
  // `gap` already sets `column-gap`, which the columns use; the rows get a margin. The items are inline blocks a column
  // wide: a block's margin before a column break moves the next column down by a gap in WebKit.
  "#columns": {
    polyfills: [LANES],
    css:
      "@supports not (display:grid-lanes){&{columns:var(--_min)}" +
      "&>*{display:inline-block;inline-size:100%;vertical-align:top;break-inside:avoid;margin-block-end:var(--_gap)}}",
  },
  "#conflicts": {
    props: [
      /^display$/,
      /^grid(-template)?(-columns)?$/,
      /^(row-|column-)?gap$/,
      /^column(s|-count|-width)$/,
    ],
    message: "masonry() sets display, the columns and the gap: use its methods",
  },
  masonry: {
    uses: ["lanes", "columns", "conflicts"],
    chain: {
      columns: { args: "<length [0,∞]>", emit: (v) => [["--_min", v]] },
      gap: { args: "<length [0,∞]>", spacing: true, emit: (v) => [["--_gap", v]] },
    },
  },
}).export();

/**
 * A masonry layout, `masonry().columns("16rem").gap(4)`: as many columns of at least `columns` as fit (16rem), items
 * packed into the shortest column, `gap` between them (1rem; a lone number is a step of the spacing scale). Native grid
 * lanes where the browser has them, CSS columns elsewhere (items ordered down each column). It sets `display`, the columns
 * and the gap, so a `cn()` that also sets one of them is a build error.
 */
export const { masonry } = lanes;
