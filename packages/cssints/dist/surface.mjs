import { n as frameScope } from "./frame-BoBKjgBB.mjs";
import { scope } from "cssints/plugin";
//#region src/surface.ts
const registered = (names, inherits) => names.map((n) => `@property --_${n} { syntax: "<color>"; inherits: ${inherits}; initial-value: canvas; }`).join("\n");
const shift = (parent) => `oklch(from var(--_k, var(${parent})) calc(l + var(--_d)) c h)`;
const css = `
& {
  --_k: initial;
  --_d: 0;
  background-color: var(--_s);
}
@container (style(--_p: e)) or (not style(--_p)) {
  & { --_p: o; --_s: ${shift("--_e")}; --_o: var(--_s); }
}
@container style(--_p: o) {
  & { --_p: e; --_s: ${shift("--_o")}; --_e: var(--_s); }
}`;
const fallback = `
:root[data-cssints-poly] & {
  --_s: ${shift("--_u")};
  --_v: var(--_s);
  --_t: var(--_v);
  background-color: var(--_s);
  transition: --_t 1ms;
}
:root[data-cssints-poly] &&(frame.core) { transition: --_t 1ms, --frame-t 1ms; }`;
const pivot = "(0.5636 - l) * 1e6";
const step = "<number [0,1]>";
/**
* `surface().color(t.color.canvas).lighten(0.06).ink()`: a background that follows from the surface around it, however
* many plain wrappers sit between. `color(<color>)` is an absolute base (default: the parent surface); `lighten(step)`,
* `darken(step)` and `contrast(step)` (away from the parent: a light parent is darkened, a dark one lightened) move its
* OKLCH lightness by `step` in [0, 1], and only one of them goes in a chain. `ink()` is black or white text by the
* lightness of the surface. These are tonal steps, not a contrast guarantee: for a ratio, check declared tokens with
* `css.check.contrast`. It stands for `background-color`, so mixing it with `bg()`, `background` or `backgroundColor` in
* one `cn()` is a build error.
*/
const surfaceScope = scope("surface", {
	frame: frameScope,
	core: {
		css,
		atProperty: [registered(["e", "o"], true), registered([
			"u",
			"v",
			"t"
		], false)].join("\n"),
		requires: ["css.at-rules.property", {
			key: "css.types.color.oklch.relative_syntax",
			exact: true
		}]
	},
	fallback: {
		polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
		parentVars: [{
			marker: "&",
			read: "--_v",
			write: "--_u",
			watch: "--_t"
		}],
		css: fallback
	},
	noBackground: {
		props: ["background", "background-color"],
		message: "surface() sets the background colour: use its methods"
	},
	surface: {
		uses: [
			"core",
			"fallback",
			"noBackground"
		],
		chain: {
			color: {
				args: "<color>",
				emit: (v) => [["--_k", v]]
			},
			lighten: {
				args: step,
				excludes: ["darken", "contrast"],
				emit: (v) => [["--_d", v]]
			},
			darken: {
				args: step,
				excludes: ["lighten", "contrast"],
				emit: (v) => [["--_d", `calc(${v} * -1)`]]
			},
			contrast: {
				args: step,
				excludes: ["lighten", "darken"],
				emit: (v) => [["--_d", `calc(${v} * clamp(-1, ${pivot}, 1))`]]
			},
			ink: {
				args: "",
				emit: () => [["color", `oklch(from var(--_s) clamp(0, ${pivot}, 1) 0 0)`]]
			}
		}
	}
});
const { surface } = surfaceScope.export();
//#endregion
export { surface, surfaceScope };
