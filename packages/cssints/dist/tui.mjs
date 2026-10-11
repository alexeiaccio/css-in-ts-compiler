import { a as registry } from "./registry-CTumHB8p.mjs";
import { A as fail, a as createTokens$1, i as createGlobalTheme$1, s as sets } from "./theme-BaBywXBp.mjs";
import { g as evaluate, h as css } from "./sheet-BKsMTa0c.mjs";
import { n as valueOf, t as together } from "./contrast-DhK69Xak.mjs";
import { n as parseColor } from "./color-BYIxVLlS.mjs";
import { Formatter } from "effect";
import { clampRgb, formatHex, formatHex8 } from "culori/fn";
//#region src/tui.ts
const terminal = registry.terminal ??= {
	properties: /* @__PURE__ */ new Map(),
	defs: /* @__PURE__ */ new Map(),
	themed: /* @__PURE__ */ new Map()
};
const inTerminal = (f) => (...args) => {
	const web = {
		properties: registry.properties,
		defs: registry.defs,
		themed: registry.themed
	};
	Object.assign(registry, terminal);
	try {
		return f(...args);
	} finally {
		Object.assign(registry, web);
	}
};
const createTokens = inTerminal((...args) => {
	const root = createTokens$1(...args);
	sets.get(root).terminal = true;
	return root;
});
const createGlobalTheme = inTerminal(createGlobalTheme$1);
const isTui = (v) => !!v && typeof v === "object" && Array.isArray(v.__tui);
const node = (entries) => ({ __tui: entries });
const say = (v) => typeof v === "string" ? `"${v}"` : Formatter.formatJson(v);
const PERCENT = /^-?(?:\d+\.?\d*|\.\d+)%$/;
const LENGTH = /^-?(?:\d+\.?\d*|\.\d+)[a-z]+$/i;
const cells = (auto, percent = true) => (prop, v) => {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string") {
		if (percent && PERCENT.test(v)) return v;
		if (auto && v === "auto") return v;
		if (LENGTH.test(v)) throw fail(`cssints: ${prop}: a terminal counts cells: write a number, not ${say(v)}`);
	}
	throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected a number of cells${percent ? ", N%" : ""}${auto ? " or auto" : ""}`);
};
const number = (min, max = Infinity, integer = false) => (prop, v) => {
	if (typeof v === "number" && v >= min && v <= max && (!integer || Number.isInteger(v))) return v;
	throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected ${integer ? "an integer" : "a number"}${max < Infinity ? ` from ${min} to ${max}` : min > -Infinity ? ` of at least ${min}` : ""}`);
};
const keyword = (...words) => (prop, v) => {
	if (typeof v === "string" && words.includes(v)) return v;
	throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected ${words.join(" | ")}`);
};
const hexOf = (text) => {
	let c = parseColor(text);
	if (!c && /\b(?:color-mix|from)\b/.test(text)) {
		let rgb;
		try {
			rgb = css(evaluate(text));
		} catch {
			rgb = void 0;
		}
		c = rgb === void 0 ? void 0 : parseColor(rgb);
	}
	if (!c) return void 0;
	const clipped = clampRgb(c);
	return (c.alpha ?? 1) < 1 ? formatHex8(clipped) : formatHex(clipped);
};
const VAR = /var\((--[\w-]+)\)/g;
const colour = (prop, v) => {
	const text = String(v);
	for (const [, name] of text.matchAll(VAR)) {
		const def = terminal.defs.get(name);
		if (!def) throw fail(`cssints: ${prop}: ${name} is no token of createTokens`);
		if (def.kind !== "color" && text === `var(${name})`) throw fail(`cssints: ${prop}: ${def.path} is a ${def.kind} token, not a colour`);
	}
	if (!text.includes("var(") && hexOf(text) === void 0) throw fail(`cssints: ${prop}: ${say(v)} is not a colour a terminal can show (a name, hex, rgb(), hsl(), oklch(), color-mix(); not currentColor, a system colour or light-dark())`);
	return text;
};
const one = (key, read, isColour = false) => (prop, parts) => {
	if (parts.length !== 1) throw fail(`cssints: ${prop} takes one value, got ${parts.length}`);
	return [isColour ? [
		key,
		read(prop, parts[0]),
		"",
		true
	] : [
		key,
		read(prop, parts[0]),
		""
	]];
};
const sides = (base, read, which = [
	"Top",
	"Right",
	"Bottom",
	"Left"
]) => (prop, parts) => {
	const n = which.length === 4 ? 4 : 2;
	if (parts.length < 1 || parts.length > n) throw fail(`cssints: ${prop} takes 1 to ${n} values, got ${parts.length}`);
	const v = parts.map((p) => read(prop, p));
	const at = n === 4 ? [
		v[0],
		v[1] ?? v[0],
		v[2] ?? v[0],
		v[3] ?? v[1] ?? v[0]
	] : [v[0], v[1] ?? v[0]];
	return which.map((s, i) => [
		`${base}${s}`,
		at[i],
		""
	]);
};
const flags = (table, many = false) => (prop, parts) => {
	if (parts.length < 1 || !many && parts.length > 1) throw fail(`cssints: ${prop} takes ${many ? "a value" : "one value"}, got ${parts.length}`);
	const out = {};
	for (const p of parts) {
		const set = typeof p === "string" ? table[p] : void 0;
		if (!set || parts.length > 1 && p === "none") throw fail(`cssints: ${prop}: unexpected ${say(p)}, expected ${Object.keys(table).join(" | ")}`);
		for (const [k, b] of Object.entries(set)) out[k] = parts.length > 1 && out[k] || b;
	}
	return Object.entries(out).map(([k, b]) => [
		k,
		b,
		""
	]);
};
const BORDER = {
	none: [[
		"border",
		false,
		""
	]],
	solid: [[
		"border",
		true,
		""
	], [
		"borderStyle",
		"single",
		""
	]],
	double: [[
		"border",
		true,
		""
	], [
		"borderStyle",
		"double",
		""
	]],
	rounded: [[
		"border",
		true,
		""
	], [
		"borderStyle",
		"rounded",
		""
	]],
	heavy: [[
		"border",
		true,
		""
	], [
		"borderStyle",
		"heavy",
		""
	]]
};
const borderStyleOf = (prop, v) => {
	const e = typeof v === "string" ? BORDER[v] : void 0;
	if (!e) throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected ${Object.keys(BORDER).join(" | ")}`);
	return e;
};
const SIZE = cells(true);
const EDGE = cells(false);
const ALIGN = [
	"auto",
	"flex-start",
	"center",
	"flex-end",
	"stretch",
	"baseline",
	"space-between",
	"space-around",
	"space-evenly"
];
const JUSTIFY = [
	"flex-start",
	"center",
	"flex-end",
	"space-between",
	"space-around",
	"space-evenly"
];
const CURSORS = [
	"auto",
	"default",
	"none",
	"context-menu",
	"help",
	"pointer",
	"progress",
	"wait",
	"cell",
	"crosshair",
	"text",
	"vertical-text",
	"alias",
	"copy",
	"move",
	"no-drop",
	"not-allowed",
	"grab",
	"grabbing",
	"all-scroll",
	"col-resize",
	"row-resize",
	"n-resize",
	"e-resize",
	"s-resize",
	"w-resize",
	"ne-resize",
	"nw-resize",
	"se-resize",
	"sw-resize",
	"ew-resize",
	"ns-resize",
	"nesw-resize",
	"nwse-resize",
	"zoom-in",
	"zoom-out"
];
const MEMBERS = {
	color: one("color", colour, true),
	backgroundColor: one("backgroundColor", colour, true),
	bg: one("backgroundColor", colour, true),
	borderColor: one("borderColor", colour, true),
	caretColor: one("caretColor", colour, true),
	fontWeight: flags({
		bold: {
			bold: true,
			dim: false
		},
		normal: {
			bold: false,
			dim: false
		},
		lighter: {
			bold: false,
			dim: true
		}
	}),
	fontStyle: flags({
		italic: { italic: true },
		normal: { italic: false }
	}),
	textDecoration: flags({
		underline: {
			underline: true,
			strikethrough: false
		},
		"line-through": {
			underline: false,
			strikethrough: true
		},
		none: {
			underline: false,
			strikethrough: false
		}
	}, true),
	textAlign: one("textAlign", keyword("left", "center", "right")),
	borderStyle: (prop, parts) => {
		if (parts.length !== 1) throw fail(`cssints: ${prop} takes one value, got ${parts.length}`);
		return borderStyleOf(prop, parts[0]);
	},
	border: (prop, parts) => {
		if (parts.length < 1 || parts.length > 2) throw fail(`cssints: ${prop} takes a style and an optional colour, got ${parts.length} values`);
		const style = borderStyleOf(prop, parts[0]);
		if (parts.length === 2 && parts[0] === "none") throw fail(`cssints: ${prop}: a colour of no border`);
		return parts.length === 2 ? [...style, [
			"borderColor",
			colour(prop, parts[1]),
			"",
			true
		]] : style;
	},
	padding: sides("padding", EDGE),
	p: sides("padding", EDGE),
	paddingInline: sides("padding", EDGE, ["Left", "Right"]),
	paddingBlock: sides("padding", EDGE, ["Top", "Bottom"]),
	margin: sides("margin", SIZE),
	m: sides("margin", SIZE),
	marginInline: sides("margin", SIZE, ["Left", "Right"]),
	marginBlock: sides("margin", SIZE, ["Top", "Bottom"]),
	...Object.fromEntries([
		"Top",
		"Right",
		"Bottom",
		"Left"
	].flatMap((s) => [
		[`padding${s}`, one(`padding${s}`, EDGE)],
		[`p${s[0].toLowerCase()}`, one(`padding${s}`, EDGE)],
		[`margin${s}`, one(`margin${s}`, SIZE)],
		[`m${s[0].toLowerCase()}`, one(`margin${s}`, SIZE)],
		[s.toLowerCase(), one(s.toLowerCase(), SIZE)]
	])),
	gap: one("gap", EDGE),
	rowGap: one("rowGap", EDGE),
	columnGap: one("columnGap", EDGE),
	...Object.fromEntries([
		"width",
		"height",
		"minWidth",
		"maxWidth",
		"minHeight",
		"maxHeight",
		"flexBasis"
	].map((k) => [k, one(k, SIZE)])),
	flexDirection: one("flexDirection", keyword("row", "column", "row-reverse", "column-reverse")),
	flexWrap: one("flexWrap", keyword("nowrap", "wrap", "wrap-reverse")),
	justifyContent: one("justifyContent", keyword(...JUSTIFY)),
	alignItems: one("alignItems", keyword(...ALIGN)),
	alignSelf: one("alignSelf", keyword(...ALIGN)),
	flexGrow: one("flexGrow", number(0)),
	flexShrink: one("flexShrink", number(0)),
	position: one("position", keyword("relative", "absolute")),
	overflow: one("overflow", keyword("visible", "hidden", "scroll")),
	display: (prop, parts) => {
		const [d] = one("visible", keyword("flex", "none"))(prop, parts);
		return [[
			"visible",
			d[1] === "flex",
			""
		]];
	},
	opacity: one("opacity", number(0, 1)),
	zIndex: one("zIndex", number(-Infinity, Infinity, true)),
	cursor: one("cursor", keyword(...CURSORS)),
	caretShape: one("caretShape", keyword("auto", "bar", "block", "underscore")),
	caretAnimation: one("caretAnimation", keyword("auto", "manual"))
};
MEMBERS.textDecorationLine = MEMBERS.textDecoration;
const member = (name, build) => (...parts) => {
	if (parts.some(isTui)) throw fail(`cssints: ${name}: a style is not a value`);
	return node(build(name, parts));
};
const stylesOf = (what, styles) => {
	const bad = styles.find((s) => !isTui(s));
	if (bad !== void 0 || !styles.length) throw fail(`cssints: ${what} takes styles of cssints/tui, got ${bad === void 0 ? "nothing" : say(bad)}`);
	return styles.flatMap((s) => s.__tui);
};
/**
* Merges styles in argument order: a later prop wins.
*
* @returns {TuiNode} the merged style
*/
const cn = (...styles) => node(stylesOf("cn()", styles));
const state = (s) => (...styles) => node(stylesOf(s, styles).map(([k, v, inner, c]) => {
	if (inner) throw fail(`cssints: ${s} wraps ${inner}: terminal states do not nest (one state per style)`);
	return c ? [
		k,
		v,
		s,
		c
	] : [
		k,
		v,
		s
	];
}));
const hover = state(":hover");
const focus = state(":focus");
const active = state(":active");
const { color, backgroundColor, bg, borderColor, caretColor, fontWeight, fontStyle, textDecoration, textDecorationLine, textAlign, borderStyle, border, padding, p, paddingInline, paddingBlock, paddingTop, paddingRight, paddingBottom, paddingLeft, pt, pr, pb, pl, margin, m, marginInline, marginBlock, marginTop, marginRight, marginBottom, marginLeft, mt, mr, mb, ml, top, right, bottom, left, gap, rowGap, columnGap, width, height, minWidth, maxWidth, minHeight, maxHeight, flexBasis, flexDirection, flexWrap, justifyContent, alignItems, alignSelf, flexGrow, flexShrink, position, overflow, display, opacity, zIndex, cursor, caretShape, caretAnimation } = Object.fromEntries(Object.entries(MEMBERS).map(([k, b]) => [k, member(k, b)]));
const put = (out, state, key, value) => {
	if (!state) out[key] = value;
	else (out[state] ??= {})[key] = value;
};
const resolved = (text, values) => {
	const flat = text.replace(VAR, (m, n) => valueOf(terminal, n, values) ?? m);
	const hex = hexOf(flat);
	if (hex === void 0) throw fail(`cssints: ${say(text)} is ${say(flat)} here, not a colour a terminal can show`);
	return hex;
};
const LONE = /^var\(--([\w-]+)\)$/;
const replacement = (n) => {
	const out = {};
	const vars = {};
	for (const [k, v, s, c] of n.__tui) {
		put(out, s, k, c ? resolved(String(v)) : v);
		const token = c ? LONE.exec(String(v))?.[1] : void 0;
		if (token) put(vars, s, k, token);
		else if (c) delete (s ? vars[s] ?? {} : vars)[k];
	}
	const tokens = n.__tui.filter((e) => e[3] && String(e[1]).includes("var("));
	if (tokens.length) {
		const themes = {};
		const all = together({
			themed: terminal.themed,
			layers: registry.layers
		});
		for (const { label, values } of all) {
			if (label.startsWith("@")) continue;
			const overlay = {};
			for (const [k, v, s] of tokens) {
				const was = s ? out[s][k] : out[k];
				const now = resolved(String(v), values);
				if (now !== was) put(overlay, s, k, now);
			}
			if (Object.keys(overlay).length) themes[label] = overlay;
		}
		if (Object.keys(themes).length) out.themes = themes;
	}
	for (const s of [
		":hover",
		":focus",
		":active"
	]) if (vars[s] && !Object.keys(vars[s]).length) delete vars[s];
	if (Object.keys(vars).length) out.vars = vars;
	return `(${Formatter.formatJson(out)})`;
};
registry.tui = (v) => isTui(v) ? replacement(v) : void 0;
//#endregion
export { active, alignItems, alignSelf, backgroundColor, bg, border, borderColor, borderStyle, bottom, caretAnimation, caretColor, caretShape, cn, color, columnGap, createGlobalTheme, createTokens, cursor, display, flexBasis, flexDirection, flexGrow, flexShrink, flexWrap, focus, fontStyle, fontWeight, gap, height, hover, justifyContent, left, m, margin, marginBlock, marginBottom, marginInline, marginLeft, marginRight, marginTop, maxHeight, maxWidth, mb, minHeight, minWidth, ml, mr, mt, opacity, overflow, p, padding, paddingBlock, paddingBottom, paddingInline, paddingLeft, paddingRight, paddingTop, pb, pl, position, pr, pt, right, rowGap, textAlign, textDecoration, textDecorationLine, top, width, zIndex };
