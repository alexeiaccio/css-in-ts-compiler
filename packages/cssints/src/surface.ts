// "cssints/surface": parent-relative colour, written only on the public helpers of "cssints/plugin" (docs/research/
// surfaces-frames.md §2.2, plugins.md §3). A surface passes one colour down the tree; a nested surface is that colour
// moved in lightness (or an absolute base moved the same way). Tonal steps, not a contrast guarantee.
//
// The kernel is frame's trick: a property cannot read itself, so a surface reads the other of two parity colours. The
// two colours are registered <color> (they inherit; registration keeps the value one colour, not a growing token
// stream). The step `--sf-d` stays unregistered on purpose: it may contain `l`, which only resolves inside `oklch(from …)`.
// Every custom property is `--sf-*`, frame's are `--fr-*`.
import { context, method } from "cssints/plugin";

const registered = (names: string[], inherits: boolean) =>
  names
    .map(
      (n) =>
        `@property --sf-${n} { syntax: "<color>"; inherits: ${inherits}; initial-value: canvas; }`,
    )
    .join("\n");

// inputs (set by the methods): k the base colour (guaranteed-invalid unless color() is called, so var() falls through to
// the parent), d the signed lightness step. derived: s the colour used, p the parity, e and o the colour for even and odd depth.
// runtime: u the parent's colour, written by the script; v our colour, which it reads; t its sentinel.
const shift = (parent: string) =>
  `oklch(from var(--sf-k, var(${parent})) calc(l + var(--sf-d)) c h)`;

const css = `
._s {
  --sf-k: initial;
  --sf-d: 0;
  background-color: var(--sf-s);
}
@container (style(--sf-p: e)) or (not style(--sf-p)) {
  ._s { --sf-p: o; --sf-s: ${shift("--sf-e")}; --sf-o: var(--sf-s); }
}
@container style(--sf-p: o) {
  ._s { --sf-p: e; --sf-s: ${shift("--sf-o")}; --sf-e: var(--sf-s); }
}`;

// For a target without style queries (see frame.ts): the script copies the nearest surface ancestor's `--sf-v` into our
// `--sf-u`. A surface that is also a frame needs both sentinels in one `transition`.
const fallback = `
:root[data-cssints-poly] ._s {
  --sf-s: ${shift("--sf-u")};
  --sf-v: var(--sf-s);
  --sf-t: var(--sf-v);
  background-color: var(--sf-s);
  transition: --sf-t 1ms;
}
:root[data-cssints-poly] ._s._f { transition: --sf-t 1ms, --fr-t 1ms; }`;

// 0.5636 is the OKLCH lightness where black and white text have the same WCAG ratio on a grey; clamp(-1, x * 1e6, 1) is
// sign(x) without Chrome 138. A chromatic colour can fall short of 4.5:1 (research finding 6).
const pivot = "(0.5636 - l) * 1e6";
const step = "<number [0,1]>" as const;

/**
 * `surface().color(t.color.canvas).lighten(0.06).ink()`: a background that follows from the surface around it, however
 * many plain wrappers sit between. `color(<color>)` is an absolute base (default: the parent surface); `lighten(step)`,
 * `darken(step)` and `contrast(step)` (away from the parent: a light parent is darkened, a dark one lightened) move its
 * OKLCH lightness by `step` in [0, 1], and only one of them goes in a chain. `ink()` is black or white text by the
 * lightness of the surface. These are tonal steps, not a contrast guarantee: for a ratio, check declared tokens with
 * `css.check.contrast`. It stands for `background-color`, so mixing it with `bg()`, `background` or `backgroundColor` in
 * one `cn()` is a build error.
 */
export const surface = context({
  name: "surface",
  marker: "_s",
  kernel: {
    key: "surface@1",
    css,
    atProperty: [registered(["e", "o"], true), registered(["u", "v", "t"], false)].join("\n"),
    requires: [
      "css.at-rules.property",
      { key: "css.types.color.oklch.relative_syntax", exact: true },
    ],
  },
  runtime: {
    polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
    parentVars: [{ marker: "_s", read: "--sf-v", write: "--sf-u", watch: "--sf-t" }],
    css: fallback,
  },
  conflicts: {
    props: ["background", "background-color"],
    message: "surface() sets the background colour: use its methods",
  },
  methods: {
    color: method({ grammar: "<color>", emit: (v) => [["--sf-k", v]] }),
    lighten: method({
      grammar: step,
      excludes: ["darken", "contrast"],
      emit: (v) => [["--sf-d", v]],
    }),
    darken: method({
      grammar: step,
      excludes: ["lighten", "contrast"],
      emit: (v) => [["--sf-d", `calc(${v} * -1)`]],
    }),
    contrast: method({
      grammar: step,
      excludes: ["lighten", "darken"],
      emit: (v) => [["--sf-d", `calc(${v} * clamp(-1, ${pivot}, 1))`]],
    }),
    ink: method({
      grammar: "",
      emit: () => [["color", `oklch(from var(--sf-s) clamp(0, ${pivot}, 1) 0 0)`]],
    }),
  },
});
