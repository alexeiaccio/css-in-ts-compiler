import { arg, inGroup, scope } from "cssints/plugin";
//#region src/make.ts
const HEADINGS = "h1, h2, h3, h4, h5, h6";
const FLOW = `${HEADINGS}, p, ul, ol, dl, blockquote, pre, figure, table, hr`;
const BASE = [
	["*, *::before, *::after", [["box-sizing", "border-box"]]],
	["*", [["margin", "0"]]],
	["html", [
		["-webkit-text-size-adjust", "none"],
		["text-size-adjust", "none"],
		["line-height", "1.5"]
	]],
	[":where(input, button, textarea, select)", [
		["font", "inherit"],
		["letter-spacing", "inherit"],
		["word-spacing", "inherit"],
		["color", "inherit"]
	]],
	[`:where(p, ${HEADINGS})`, [["overflow-wrap", "break-word"]]],
	[`:where(${HEADINGS})`, [["text-wrap", "balance"]]],
	[":where(p)", [["text-wrap", "pretty"]]],
	[":where(ul, ol)[role=\"list\"]", [["list-style", "none"], ["padding", "0"]]]
];
const MEDIA = [[":where(img, picture, video, canvas, svg)", [["display", "block"], ["max-inline-size", "100%"]]], [":where(img, video)", [["block-size", "auto"]]]];
const PROSE = [[`:where(${FLOW}):not([class]) + :where(${FLOW}):not([class])`, [["margin-block-start", "1em"]]], [`:where(${HEADINGS}):not([class])`, [["line-height", "1.25"]]]];
const layered = (rules, group) => {
	const css = rules.flatMap(([selector, declarations]) => {
		const kept = declarations.filter(([p, v]) => !group || inGroup(group, p, v));
		return kept.length ? [`${selector} { ${kept.map(([p, v]) => `${p}: ${v}`).join("; ")} }`] : [];
	}).join(" ");
	return css ? [{
		css,
		layer: "reset"
	}] : [];
};
const define = (group) => scope("reset", { reset: { args: [{
	"media?": arg(),
	"prose?": arg()
}] } }).build({ reset: (options) => ({
	layers: {
		layers: ["reset"],
		before: true
	},
	globals: [
		...layered(BASE, group),
		...options.media ? layered(MEDIA, group) : [],
		...options.prose ? layered(PROSE, group) : []
	]
}) });
const make = (group) => define(group).export().reset;
//#endregion
export { make as t };
