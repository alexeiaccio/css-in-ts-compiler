import { scope } from "cssints/plugin";
//#region src/frame.ts
const registered = (names) => names.map((n) => `@property --_${n} { syntax: "<length>"; inherits: false; initial-value: 0px; }`).join("\n");
const inner = "max(var(--_x) - var(--_p) - var(--_b), 0px)";
const outer = (parent) => `max(var(${parent}, calc(var(--_r) + var(--_m))) - var(--_m), 0px)`;
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
const fallback = `
:root[data-cssints-poly] & {
  --_u: calc(var(--_r) + var(--_m));
  --_i: max(max(var(--_u) - var(--_m), 0px) - var(--_p) - var(--_b), 0px);
  --_t: var(--_i);
  border-radius: max(var(--_u) - var(--_m), 0px);
  transition: --_t 1ms;
}`;
const length = "<length [0,∞]>";
/**
* `frame().radius(t.radius.lg).padding(4).border("1px").margin(2)`: a box whose radius follows from the frames around it
* (`radius` is the radius of the outermost frame; inside, it is the parent's inner radius less the margin). `padding` and
* `margin` take a step of the spacing scale; each method once. It stands for `padding`, `margin`, `border-radius` and the
* border widths and styles, so mixing it with them in one `cn()` is a build error (border colours are fine).
*/
const frameScope = scope("frame", {
	core: {
		css,
		atProperty: registered([
			"r",
			"p",
			"b",
			"m",
			"u",
			"i",
			"t"
		]),
		requires: ["css.at-rules.property", "css.types.max"]
	},
	fallback: {
		polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
		parentVars: [{
			marker: "&",
			read: "--_i",
			write: "--_u",
			watch: "--_t"
		}],
		css: fallback
	},
	noBox: {
		props: [/^(padding|margin)(-|$)/, /^border(?!.*color)/],
		message: "frame() sets padding, margin, border-radius and the border: use its methods"
	},
	frame: {
		uses: [
			"core",
			"fallback",
			"noBox"
		],
		chain: {
			radius: {
				args: length,
				emit: (v) => [["--_r", v]]
			},
			padding: {
				args: length,
				spacing: true,
				emit: (v) => [["--_p", v]]
			},
			border: {
				args: length,
				emit: (v) => [["--_b", v]]
			},
			margin: {
				args: "<length>",
				spacing: true,
				emit: (v) => [["--_m", v]]
			}
		}
	}
});
const { frame } = frameScope.export();
//#endregion
export { frameScope as n, frame as t };
