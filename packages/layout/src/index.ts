// @cssints/layout: the layout primitives of Every Layout and smolcss as chain members of one `scope()`. Each primitive has
// two kernels: `-core`, written as styles, sets the container's properties (so a `cn()` that also sets one of them is a
// derived conflict), and `-base`, raw CSS, sets the defaults of the primitive's custom properties on the element (a nested
// primitive does not inherit its parent's values) and, for sidebar and switcher, the rules of the children, which a
// kernel written as styles cannot address. The methods set the custom properties (`--_stack-gap` is `--layout-stack-gap`).
import { scope } from "cssints/plugin";

const space = "<length-percentage [0,∞]>" as const;
const gap = { args: space, spacing: true } as const;

// The sidebar's children read `--_sidebar-f*` (the first child) and `--_sidebar-l*` (the last): `flex` and the min size.
// The defaults make the first child the sidebar; `side("right")` swaps them.
const narrow = { flex: "1 1 var(--_sidebar-width)", min: "auto" };
const wide = { flex: "999 1 0", min: "var(--_sidebar-content)" };
const sides = (first: typeof narrow, last: typeof narrow) =>
  Object.entries({
    "--_sidebar-ff": first.flex,
    "--_sidebar-fm": first.min,
    "--_sidebar-lf": last.flex,
    "--_sidebar-lm": last.min,
  });
const declare = (decls: [string, string][]) => decls.map(([k, v]) => `${k}: ${v};`).join(" ");

const layout = scope("layout", {
  "#stack-core": {
    css: (css) => [css.display("flex"), css.flexDirection("column"), css.gap("var(--_stack-gap)")],
  },
  "#stack-base": { css: "& { --_stack-gap: 1rem; }" },
  stack: {
    uses: ["stack-core", "stack-base"],
    chain: { gap: { ...gap, emit: (v) => [["--_stack-gap", v]] } },
  },

  "#cluster-core": {
    css: (css) => [
      css.display("flex"),
      css.flexWrap("wrap"),
      css.gap("var(--_cluster-gap)"),
      css.justifyContent("var(--_cluster-justify)"),
      css.alignItems("var(--_cluster-align)"),
    ],
  },
  "#cluster-base": {
    css: "& { --_cluster-gap: 1rem; --_cluster-justify: flex-start; --_cluster-align: center; }",
  },
  cluster: {
    uses: ["cluster-core", "cluster-base"],
    chain: {
      gap: { ...gap, emit: (v) => [["--_cluster-gap", v]] },
      justify: {
        args: "start | end | center | space-between | space-around | space-evenly",
        emit: (v) => [["--_cluster-justify", v]],
      },
      align: {
        args: "start | end | center | baseline | stretch",
        emit: (v) => [["--_cluster-align", v]],
      },
    },
  },

  "#sidebar-core": {
    css: (css) => [css.display("flex"), css.flexWrap("wrap"), css.gap("var(--_sidebar-gap)")],
  },
  "#sidebar-base": {
    css: `& { --_sidebar-gap: 1rem; --_sidebar-width: auto; --_sidebar-content: 50%; ${declare(sides(narrow, wide))} }
& > :first-child { flex: var(--_sidebar-ff); min-inline-size: var(--_sidebar-fm); }
& > :last-child { flex: var(--_sidebar-lf); min-inline-size: var(--_sidebar-lm); }`,
  },
  sidebar: {
    uses: ["sidebar-core", "sidebar-base"],
    chain: {
      side: {
        args: "left | right",
        emit: (v) => (v === "right" ? sides(wide, narrow) : sides(narrow, wide)),
      },
      width: { args: space, emit: (v) => [["--_sidebar-width", v]] },
      content: { args: "<percentage [0,100]>", emit: (v) => [["--_sidebar-content", v]] },
      gap: { ...gap, emit: (v) => [["--_sidebar-gap", v]] },
    },
  },

  "#switcher-core": {
    css: (css) => [css.display("flex"), css.flexWrap("wrap"), css.gap("var(--_switcher-gap)")],
  },
  "#switcher-base": {
    css: `& { --_switcher-gap: 1rem; --_switcher-threshold: 30rem; }
& > * { flex-grow: 1; flex-basis: calc((var(--_switcher-threshold) - 100%) * 999); }`,
  },
  switcher: {
    uses: ["switcher-core", "switcher-base"],
    chain: {
      threshold: { args: "<length [0,∞]>", emit: (v) => [["--_switcher-threshold", v]] },
      gap: { ...gap, emit: (v) => [["--_switcher-gap", v]] },
    },
  },

  "#cover-core": {
    css: (css) => [
      css.display("flex"),
      css.flexDirection("column"),
      css.justifyContent("center"),
      css.minBlockSize("var(--_cover-min)"),
      css.gap("var(--_cover-gap)"),
    ],
  },
  "#cover-base": { css: "& { --_cover-min: 100vh; --_cover-gap: 1rem; }" },
  cover: {
    uses: ["cover-core", "cover-base"],
    chain: {
      minHeight: { args: space, emit: (v) => [["--_cover-min", v]] },
      gap: { ...gap, emit: (v) => [["--_cover-gap", v]] },
    },
  },

  "#grid-core": {
    css: (css) => [
      css.display("grid"),
      css.gridTemplateColumns("repeat(auto-fit, minmax(min(var(--_grid-min), 100%), 1fr))"),
      css.gap("var(--_grid-gap)"),
    ],
  },
  "#grid-base": { css: "& { --_grid-min: 16rem; --_grid-gap: 1rem; }" },
  autoGrid: {
    uses: ["grid-core", "grid-base"],
    chain: {
      min: { args: space, emit: (v) => [["--_grid-min", v]] },
      gap: { ...gap, emit: (v) => [["--_grid-gap", v]] },
    },
  },
}).export();

/**
 * Layout primitives, each a chain whose methods are used once: `stack().gap(4)`, `cluster().gap(2).justify("space-between")
 * .align("center")`, `sidebar().side("left").width("20rem").content("50%").gap(4)`, `switcher().threshold("30rem").gap(4)`,
 * `cover().minHeight("100vh").gap(4)`, `autoGrid().min("16rem").gap(4)`. A lone number in `gap` is a step of the spacing
 * scale. A primitive sets `display` and the container's properties, so a `cn()` that sets one of them too is a build error.
 */
export const { stack, cluster, sidebar, switcher, cover, autoGrid } = layout;
