// "cssints/frame": concentric geometry, written only on the public helpers of "cssints/plugin" (docs/research/surfaces-frames.md
// §2.1, plugins.md §3). A frame passes one number down the tree, its inner radius; a nested frame's radius is that number
// minus its own margin, so rounded boxes in rounded boxes stay concentric with no wiring.
//
// The kernel is the registered one (40 lines in the research, not the 24 of px/rem only): `@property` is the floor of the
// runtime anyway, and registration makes `em`, `rem`, `calc()` and tokens come out as exact lengths where the child
// inherits (an unregistered `em` padding is re-evaluated in the child's font size). Every custom property is `--fr-*`.
import { context, method } from "cssints/plugin";

// inputs (set by the methods): r radius, p padding, b border, m margin. derived: x the radius used, e and o the inner radius
// for even and odd depth (a property cannot read itself, so a frame reads the other parity), c the parity.
// runtime: u the parent's inner radius, written by the script; i our inner radius, which it reads; t its sentinel.
const registered = (names: string[]) =>
  names
    .map((n) => `@property --fr-${n} { syntax: "<length>"; inherits: false; initial-value: 0px; }`)
    .join("\n");

const inner = "max(var(--fr-x) - var(--fr-p) - var(--fr-b), 0px)";
const outer = (parent: string) =>
  `max(var(${parent}, calc(var(--fr-r) + var(--fr-m))) - var(--fr-m), 0px)`;

const css = `
._f {
  padding: var(--fr-p);
  margin: var(--fr-m);
  border: var(--fr-b) solid;
  border-radius: var(--fr-x);
}
@container (style(--fr-c: e)) or (not style(--fr-c)) {
  ._f { --fr-c: o; --fr-x: ${outer("--fr-e")}; --fr-o: ${inner}; }
}
@container style(--fr-c: o) {
  ._f { --fr-c: e; --fr-x: ${outer("--fr-o")}; --fr-e: ${inner}; }
}`;

// For a target without style queries: the script copies the nearest frame ancestor's `--fr-i` into our `--fr-u` (inline, so
// a root frame without it keeps the rule below), and these rules compute from it. The sentinel makes `:hover`, media and
// container changes visible to the script (`transitionrun`); a transition of your own on a frame replaces it.
const fallback = `
:root[data-cssints-poly] ._f {
  --fr-u: calc(var(--fr-r) + var(--fr-m));
  --fr-i: max(max(var(--fr-u) - var(--fr-m), 0px) - var(--fr-p) - var(--fr-b), 0px);
  --fr-t: var(--fr-i);
  border-radius: max(var(--fr-u) - var(--fr-m), 0px);
  transition: --fr-t 1ms;
}`;

const length = "<length [0,∞]>" as const;

/**
 * `frame().radius(t.radius.lg).padding(4).border("1px").margin(2)`: a box whose radius follows from the frames around it
 * (`radius` is the radius of the outermost frame; inside, it is the parent's inner radius less the margin). `padding` and
 * `margin` take a step of the spacing scale; each method once. It stands for `padding`, `margin`, `border-radius` and the
 * border widths and styles, so mixing it with them in one `cn()` is a build error (border colours are fine).
 */
export const frame = context({
  name: "frame",
  marker: "_f",
  kernel: {
    key: "frame@1",
    css,
    atProperty: registered(["r", "p", "b", "m", "u", "i", "t"]),
    requires: ["css.at-rules.property", "css.types.max"],
  },
  runtime: {
    polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
    parentVars: [{ marker: "_f", read: "--fr-i", write: "--fr-u", watch: "--fr-t" }],
    css: fallback,
  },
  conflicts: {
    props: [/^(padding|margin)(-|$)/, /^border(?!.*color)/],
    message: "frame() sets padding, margin, border-radius and the border: use its methods",
  },
  methods: {
    radius: method({ grammar: length, emit: (v) => [["--fr-r", v]] }),
    padding: method({ grammar: length, spacing: true, emit: (v) => [["--fr-p", v]] }),
    border: method({ grammar: length, emit: (v) => [["--fr-b", v]] }),
    margin: method({ grammar: "<length>", spacing: true, emit: (v) => [["--fr-m", v]] }),
  },
});
