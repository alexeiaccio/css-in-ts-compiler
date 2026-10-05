// "cssints/frame": concentric geometry, written only on `scope()` of "cssints/plugin" (docs/research/surfaces-frames.md
// §2.1, plugins.md §3). A frame passes one number down the tree, its inner radius; a nested frame's radius is that number
// minus its own margin, so rounded boxes in rounded boxes stay concentric with no wiring.
//
// The kernel is the registered one (40 lines in the research, not the 24 of px/rem only): `@property` is the floor of the
// runtime anyway, and registration makes `em`, `rem`, `calc()` and tokens come out as exact lengths where the child
// inherits (an unregistered `em` padding is re-evaluated in the child's font size). Every custom property is the scope's own, `--_x` is `--frame-x`; `&` is the class of the kernel, `_frame-core`.
import { scope } from "cssints/plugin";

// inputs (set by the methods): r radius, p padding, b border, m margin. derived: x the radius used, e and o the inner radius
// for even and odd depth (a property cannot read itself, so a frame reads the other parity), c the parity.
// runtime: u the parent's inner radius, written by the script; i our inner radius, which it reads; t its sentinel.
const registered = (names: string[]) =>
  names
    .map((n) => `@property --_${n} { syntax: "<length>"; inherits: false; initial-value: 0px; }`)
    .join("\n");

const inner = "max(var(--_x) - var(--_p) - var(--_b), 0px)";
const outer = (parent: string) =>
  `max(var(${parent}, calc(var(--_r) + var(--_m))) - var(--_m), 0px)`;

const css = `
& {
  padding: var(--_p);
  margin: var(--_m);
  border: var(--_b) solid;
  border-radius: var(--_x);
}
@container (style(--_c: e)) or (not style(--_c)) {
  & { --_c: o; --_x: ${outer("--_e")}; --_o: ${inner}; }
}
@container style(--_c: o) {
  & { --_c: e; --_x: ${outer("--_o")}; --_e: ${inner}; }
}`;

// For a target without style queries: the script copies the nearest frame ancestor's `--_i` into our `--_u` (inline, so
// a root frame without it keeps the rule below), and these rules compute from it. The sentinel makes `:hover`, media and
// container changes visible to the script (`transitionrun`); a transition of your own on a frame replaces it.
const fallback = `
:root[data-cssints-poly] & {
  --_u: calc(var(--_r) + var(--_m));
  --_i: max(max(var(--_u) - var(--_m), 0px) - var(--_p) - var(--_b), 0px);
  --_t: var(--_i);
  border-radius: max(var(--_u) - var(--_m), 0px);
  transition: --_t 1ms;
}`;

const length = "<length [0,∞]>" as const;

/**
 * `frame().radius(t.radius.lg).padding(4).border("1px").margin(2)`: a box whose radius follows from the frames around it
 * (`radius` is the radius of the outermost frame; inside, it is the parent's inner radius less the margin). `padding` and
 * `margin` take a step of the spacing scale; each method once. It stands for `padding`, `margin`, `border-radius` and the
 * border widths and styles, so mixing it with them in one `cn()` is a build error (border colours are fine).
 */
export const frameScope = scope("frame", {
  core: {
    css,
    atProperty: registered(["r", "p", "b", "m", "u", "i", "t"]),
    requires: ["css.at-rules.property", "css.types.max"],
  },
  fallback: {
    polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
    parentVars: [{ marker: "&", read: "--_i", write: "--_u", watch: "--_t" }],
    css: fallback,
  },
  noBox: {
    props: [/^(padding|margin)(-|$)/, /^border(?!.*color)/],
    message: "frame() sets padding, margin, border-radius and the border: use its methods",
  },
  frame: {
    uses: ["core", "fallback", "noBox"],
    chain: {
      radius: { args: length, emit: (v) => [["--_r", v]] },
      padding: { args: length, spacing: true, emit: (v) => [["--_p", v]] },
      border: { args: length, emit: (v) => [["--_b", v]] },
      margin: { args: "<length>", spacing: true, emit: (v) => [["--_m", v]] },
    },
  },
});
export const { frame } = frameScope.export();
