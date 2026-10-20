import { a as registry } from "./registry-ByrYF2v5.mjs";
import { a as createTokens$1, i as createGlobalTheme$1, j as fail, s as sets } from "./theme-WGcgMD4V.mjs";
import { n as valueOf, t as together } from "./contrast-DLi4pp25.mjs";
import { n as parseColor } from "./color-BYIxVLlS.mjs";
import { Formatter, Predicate } from "effect";
import { clampRgb, formatHex } from "culori/fn";
//#region src/clay.ts
const tables = registry.clayTokens ??= {
	properties: /* @__PURE__ */ new Map(),
	defs: /* @__PURE__ */ new Map(),
	themed: /* @__PURE__ */ new Map()
};
const inClay = (f) => (...args) => {
	const web = {
		properties: registry.properties,
		defs: registry.defs,
		themed: registry.themed
	};
	Object.assign(registry, tables);
	try {
		return f(...args);
	} finally {
		Object.assign(registry, web);
	}
};
const createTokens = inClay((...args) => {
	const root = createTokens$1(...args);
	sets.get(root).clay = true;
	return root;
});
const IDENT = /^[A-Za-z]\w*$/;
const createGlobalTheme = inClay((...args) => {
	if (args.length !== 3 || typeof args[1] !== "string" || !IDENT.test(args[1])) throw fail(`cssints: createGlobalTheme(tokens, name, overrides) of cssints/clay takes its tokens, a name that is a C identifier (header() names a themed declaration <style>_<name>) and the values to set, got the name ${say(args[1])}`);
	return createGlobalTheme$1(...args);
});
const STATES = [
	":hover",
	":focus",
	":active"
];
const isClay = (v) => !!v && typeof v === "object" && Array.isArray(v.__clay) && !("__fonts" in v);
const node = (entries) => ({ __clay: entries });
const say = (v) => typeof v === "string" ? `"${v}"` : Formatter.formatJson(v);
const PX = /^(\d+\.?\d*|\.\d+)(px)?$/;
const PERCENT = /^(\d+\.?\d*|\.\d+)%$/;
const px = (prop, v) => {
	const m = typeof v === "string" ? PX.exec(v) : null;
	const n = typeof v === "number" ? v : m ? Number(m[1]) : NaN;
	if (Number.isFinite(n) && n >= 0) return n;
	throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected a number of pixels (a number or "Npx", not negative)`);
};
const whole = (prop, v) => {
	const n = px(prop, v);
	if (Number.isInteger(n) && n <= 65535) return n;
	throw fail(`cssints: ${prop}: ${say(v)} is not a whole number of pixels (Clay stores it as uint16_t)`);
};
const size = (prop, v) => {
	if (v === "auto" || v === "stretch") return v;
	if (typeof v === "string" && PERCENT.test(v)) return v;
	return px(prop, v);
};
const keyword = (...words) => (prop, v) => {
	if (typeof v === "string" && words.includes(v)) return v;
	throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected ${words.join(" | ")}`);
};
const VAR = /var\((--[\w-]+)\)/g;
const NOT_A_COLOUR = "is not a colour Clay can draw (a name, hex, rgb(), hsl(), oklch() or a colour token of the createTokens of cssints/clay; not currentColor or light-dark())";
const colour = (prop, u) => {
	const v = String(u);
	for (const [, name] of v.matchAll(VAR)) {
		const def = tables.defs.get(name);
		if (!def) throw fail(`cssints: ${prop}: ${name} is no token of the createTokens of cssints/clay`);
		if (def.kind !== "color" && v === `var(${name})`) throw fail(`cssints: ${prop}: ${def.path} is a ${def.kind} token, not a colour`);
	}
	if (!v.includes("var(")) rgba(prop, v);
	return v;
};
const one = (key, read) => (prop, parts) => {
	if (parts.length !== 1) throw fail(`cssints: ${prop} takes one value, got ${parts.length}`);
	return [[key, read(prop, parts[0])]];
};
const COLOURS = /* @__PURE__ */ new Set([
	"backgroundColor",
	"color",
	"borderColor"
]);
const sides = (keys, read) => (prop, parts) => {
	if (parts.length < 1 || parts.length > 4) throw fail(`cssints: ${prop} takes 1 to 4 values, got ${parts.length}`);
	const v = parts.map((p) => read(prop, p));
	const at = [
		v[0],
		v[1] ?? v[0],
		v[2] ?? v[0],
		v[3] ?? v[1] ?? v[0]
	];
	return keys.map((k, i) => [k, at[i]]);
};
const pair = (start, end) => (prop, parts) => {
	if (parts.length < 1 || parts.length > 2) throw fail(`cssints: ${prop} takes 1 or 2 values, got ${parts.length}`);
	const v = parts.map((x) => whole(prop, x));
	return [[start, v[0]], [end, v[1] ?? v[0]]];
};
const POINTS = [
	"left",
	"center",
	"right"
].flatMap((x) => [
	"top",
	"center",
	"bottom"
].map((y) => `${x} ${y}`));
const FLOAT_OPTIONS = [
	"attach",
	"parent",
	"root",
	"offset",
	"expand",
	"zIndex",
	"capture",
	"clip"
];
const SIGNED = /^-?(?:\d+\.?\d*|\.\d+)(?:px)?$/;
const offset = (prop, v) => {
	const n = typeof v === "number" ? v : typeof v === "string" && SIGNED.test(v) ? Number.parseFloat(v) : NaN;
	if (Number.isFinite(n)) return n;
	throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected a number of pixels (a number or "Npx")`);
};
const clayId = (id) => {
	const h = Array.from(id, (ch) => ch.charCodeAt(0)).reduce((acc, byte) => {
		const sum = acc + byte >>> 0;
		const mixed = sum + (sum << 10) >>> 0;
		return (mixed ^ mixed >>> 6) >>> 0;
	}, 0);
	const a = h + (h << 3) >>> 0;
	const b = (a ^ a >>> 11) >>> 0;
	return b + (b << 15) + 1 >>> 0;
};
const options = (prop, v, keys) => {
	if (typeof v !== "object" || v === null || Array.isArray(v)) throw fail(`cssints: ${prop}: unexpected ${say(v)}, expected { ${keys.join(", ")} }`);
	const bad = Object.keys(v).find((k) => !keys.includes(k));
	if (bad !== void 0) throw fail(`cssints: ${prop}: unexpected ${say(bad)}, expected ${keys.join(" | ")}`);
	return v;
};
const upper = (v) => String(v).toUpperCase().replace(" ", "_");
const floating = (prop, parts) => {
	if (parts.length > 1) throw fail(`cssints: ${prop} takes one object of options, got ${parts.length} values`);
	const o = options(prop, parts[0] ?? {}, FLOAT_OPTIONS);
	const out = [["float", 1]];
	const set = (k, v) => out.push([k, v]);
	if (o.parent !== void 0 && o.root) throw fail(`cssints: ${prop}: parent and root are two places to attach to`);
	if (o.parent !== void 0) {
		if (typeof o.parent !== "string" || !/^[\x20-\x7e]+$/.test(o.parent)) throw fail(`cssints: ${prop}.parent: unexpected ${say(o.parent)}, expected the non-empty ASCII string of the parent's CLAY_ID()`);
		set("floatTo", "ELEMENT_WITH_ID");
		set("floatParentId", clayId(o.parent));
	}
	if (o.root !== void 0 && typeof o.root !== "boolean") throw fail(`cssints: ${prop}.root: unexpected ${say(o.root)}, expected true | false`);
	if (o.root) set("floatTo", "ROOT");
	if (o.attach !== void 0) {
		const a = options(`${prop}.attach`, o.attach, ["element", "parent"]);
		for (const k of ["element", "parent"]) if (a[k] !== void 0) set(`float${k === "element" ? "Element" : "Parent"}`, upper(keyword(...POINTS)(`${prop}.attach.${k}`, a[k])));
	}
	for (const [name, read] of [["offset", offset], ["expand", px]]) {
		if (o[name] === void 0) continue;
		const keys = name === "offset" ? ["x", "y"] : ["width", "height"];
		const v = options(`${prop}.${name}`, o[name], keys);
		for (const k of keys) if (v[k] !== void 0) set(`float${name === "offset" ? "Offset" : "Expand"}${k[0].toUpperCase()}${k.slice(1)}`, read(`${prop}.${name}.${k}`, v[k]));
	}
	if (o.zIndex !== void 0) {
		if (!Number.isInteger(o.zIndex) || Math.abs(o.zIndex) > 32767) throw fail(`cssints: ${prop}.zIndex: unexpected ${say(o.zIndex)}, expected a whole number (Clay stores it as int16_t)`);
		set("floatZIndex", o.zIndex);
	}
	if (o.capture !== void 0) {
		if (typeof o.capture !== "boolean") throw fail(`cssints: ${prop}.capture: unexpected ${say(o.capture)}, expected true | false`);
		set("floatCapture", o.capture ? "CAPTURE" : "PASSTHROUGH");
	}
	if (o.clip !== void 0) set("floatClip", keyword("none", "parent")(`${prop}.clip`, o.clip) === "none" ? "NONE" : "ATTACHED_PARENT");
	return out;
};
const PADDING = [
	"paddingTop",
	"paddingRight",
	"paddingBottom",
	"paddingLeft"
];
const BORDER = [
	"borderTop",
	"borderRight",
	"borderBottom",
	"borderLeft"
];
const RADIUS = [
	"topLeft",
	"topRight",
	"bottomRight",
	"bottomLeft"
];
const ALIGN = [
	"flex-start",
	"start",
	"center",
	"flex-end",
	"end"
];
const MEMBERS = {
	backgroundColor: one("backgroundColor", colour),
	bg: one("backgroundColor", colour),
	color: one("color", colour),
	borderColor: one("borderColor", colour),
	width: one("width", size),
	height: one("height", size),
	padding: sides(PADDING, whole),
	p: sides(PADDING, whole),
	paddingInline: pair("paddingLeft", "paddingRight"),
	paddingBlock: pair("paddingTop", "paddingBottom"),
	...Object.fromEntries([
		"Top",
		"Right",
		"Bottom",
		"Left"
	].flatMap((s) => [[`padding${s}`, one(`padding${s}`, whole)], [`p${s[0].toLowerCase()}`, one(`padding${s}`, whole)]])),
	gap: one("gap", whole),
	flexDirection: one("flexDirection", keyword("row", "column")),
	justifyContent: one("justifyContent", keyword(...ALIGN)),
	alignItems: one("alignItems", keyword(...ALIGN)),
	borderRadius: sides(RADIUS, px),
	borderWidth: sides(BORDER, whole),
	border: (prop, parts) => {
		if (parts.length !== 2) throw fail(`cssints: ${prop} takes a width and a colour, got ${parts.length} values`);
		const w = whole(prop, parts[0]);
		return [...BORDER.map((k) => [k, w]), ["borderColor", colour(prop, parts[1])]];
	},
	overflow: one("overflow", keyword("visible", "hidden")),
	fontSize: one("fontSize", whole),
	letterSpacing: one("letterSpacing", whole),
	lineHeight: one("lineHeight", whole),
	textAlign: one("textAlign", keyword("left", "center", "right")),
	whiteSpace: one("whiteSpace", keyword("normal", "pre-line", "nowrap")),
	float: floating
};
const member = (name, build) => (...parts) => {
	if (parts.some(isClay)) throw fail(`cssints: ${name}: a style is not a value`);
	return node(build(name, parts).map(([k, v]) => [
		k,
		v,
		""
	]));
};
const stylesOf = (what, styles) => {
	const bad = styles.find((s) => !isClay(s));
	if (bad !== void 0 || !styles.length) throw fail(`cssints: ${what} takes styles of cssints/clay, got ${bad === void 0 ? "nothing" : say(bad)}`);
	return styles.flatMap((s) => s.__clay);
};
/**
* Merges styles in argument order: a later prop wins.
*
* @returns {ClayNode} the merged style
*/
const cn = (...styles) => node(stylesOf("cn()", styles));
const state = (s) => (...styles) => node(stylesOf(s, styles).map(([k, v, inner]) => {
	if (inner) throw fail(`cssints: ${s} wraps ${inner}: Clay states do not nest (one state per style)`);
	return [
		k,
		v,
		s
	];
}));
const hover = state(":hover");
const focus = state(":focus");
const active = state(":active");
/**
* The fonts of the app, in the order of its font array: `fonts("Roboto", "Mono").Mono` is a style that sets Clay's
* `fontId` to 1, and header() prints the order as an enum, `<name>_Mono`.
*
* @returns {Record<string, unknown>} a style per font, by name, and the list
*/
const fonts = (...names) => {
	const bad = names.find((n) => typeof n !== "string" || !IDENT.test(n));
	if (bad !== void 0 || !names.length) throw fail(`cssints: fonts() takes the names of the app's fonts in order, each a C identifier, got ${bad === void 0 ? "nothing" : say(bad)}`);
	const twice = names.find((n, i) => names.indexOf(n) !== i);
	if (twice !== void 0) throw fail(`cssints: fonts(): ${say(twice)} is there twice`);
	return {
		__clay: [],
		__fonts: names,
		...Object.fromEntries(names.map((n, i) => [String(n), node([[
			"fontId",
			i,
			""
		]])]))
	};
};
const { backgroundColor, bg, color, borderColor, width, height, padding, p, paddingInline, paddingBlock, paddingTop, paddingRight, paddingBottom, paddingLeft, pt, pr, pb, pl, gap, flexDirection, justifyContent, alignItems, borderRadius, borderWidth, border, overflow, fontSize, letterSpacing, lineHeight, textAlign, whiteSpace, float } = Object.fromEntries(Object.entries(MEMBERS).map(([k, b]) => [k, member(k, b)]));
const rgba = (prop, text, values) => {
	const flat = text.replace(VAR, (m, n) => valueOf(tables, n, values) ?? m);
	const c = flat.includes("var(") ? void 0 : parseColor(flat);
	if (!c) throw fail(`cssints: ${prop}: ${say(text)}${flat === text ? "" : ` (${say(flat)} here)`} ${NOT_A_COLOUR}`);
	const hex = formatHex(clampRgb(c));
	const [r, g, b] = [
		1,
		3,
		5
	].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
	return {
		r,
		g,
		b,
		a: Math.round((c.alpha ?? 1) * 255)
	};
};
const axis = (v) => v === "auto" ? { type: "FIT" } : v === "stretch" ? { type: "GROW" } : typeof v === "string" ? {
	type: "PERCENT",
	percent: Number.parseFloat(v) / 100
} : {
	type: "FIXED",
	min: v,
	max: v
};
const X = {
	start: "LEFT",
	center: "CENTER",
	end: "RIGHT"
};
const Y = {
	start: "TOP",
	center: "CENTER",
	end: "BOTTOM"
};
const edge = (v) => v === "center" ? "center" : String(v).endsWith("end") ? "end" : "start";
const FLOATING = [
	"float",
	"floatTo",
	"floatElement",
	"floatParent",
	"floatParentId",
	"floatOffsetX",
	"floatOffsetY",
	"floatExpandWidth",
	"floatExpandHeight",
	"floatZIndex",
	"floatCapture",
	"floatClip"
];
const floatingOf = (p) => {
	const has = (...ks) => ks.some((k) => p.has(k));
	const to = p.get("floatTo") ?? "PARENT";
	if (to === "ROOT" && p.get("floatClip") === "ATTACHED_PARENT") throw fail(`cssints: float: clip "parent" does nothing on a float attached to the root (it has no clipping parent)`);
	return {
		...has("floatOffsetX", "floatOffsetY") && { offset: {
			x: p.get("floatOffsetX") ?? 0,
			y: p.get("floatOffsetY") ?? 0
		} },
		...has("floatExpandWidth", "floatExpandHeight") && { expand: {
			width: p.get("floatExpandWidth") ?? 0,
			height: p.get("floatExpandHeight") ?? 0
		} },
		...to === "ELEMENT_WITH_ID" && { parentId: p.get("floatParentId") },
		...p.has("floatZIndex") && { zIndex: p.get("floatZIndex") },
		...has("floatElement", "floatParent") && { attachPoints: {
			element: p.get("floatElement") ?? "LEFT_TOP",
			parent: p.get("floatParent") ?? "LEFT_TOP"
		} },
		...p.has("floatCapture") && { pointerCaptureMode: p.get("floatCapture") },
		attachTo: to,
		...p.has("floatClip") && { clipTo: p.get("floatClip") }
	};
};
const shapeOf = (entries, values) => {
	const p = new Map(entries.map(([k, v]) => [k, v]));
	const colourOf = (k) => rgba(k, String(p.get(k)), values);
	const out = {};
	const layout = {};
	const get = (k) => p.get(k);
	if (get("width") !== void 0 || get("height") !== void 0) layout.sizing = {
		...get("width") !== void 0 && { width: axis(get("width")) },
		...get("height") !== void 0 && { height: axis(get("height")) }
	};
	if (PADDING.some((k) => p.has(k))) layout.padding = {
		left: get("paddingLeft") ?? 0,
		right: get("paddingRight") ?? 0,
		top: get("paddingTop") ?? 0,
		bottom: get("paddingBottom") ?? 0
	};
	if (p.has("gap")) layout.childGap = get("gap");
	const column = get("flexDirection") === "column";
	if (p.has("flexDirection")) layout.layoutDirection = column ? "TOP_TO_BOTTOM" : "LEFT_TO_RIGHT";
	const main = get("justifyContent"), cross = get("alignItems");
	if (main !== void 0 || cross !== void 0) {
		const [x, y] = column ? [cross, main] : [main, cross];
		layout.childAlignment = {
			...x !== void 0 && { x: X[edge(x)] },
			...y !== void 0 && { y: Y[edge(y)] }
		};
	}
	if (Object.keys(layout).length) out.layout = layout;
	if (p.has("backgroundColor")) out.backgroundColor = colourOf("backgroundColor");
	if (RADIUS.some((k) => p.has(k))) out.cornerRadius = Object.fromEntries(RADIUS.map((k) => [k, get(k) ?? 0]));
	if (BORDER.some((k) => p.has(k)) || p.has("borderColor")) out.border = {
		...p.has("borderColor") && { color: colourOf("borderColor") },
		width: {
			left: get("borderLeft") ?? 0,
			right: get("borderRight") ?? 0,
			top: get("borderTop") ?? 0,
			bottom: get("borderBottom") ?? 0
		}
	};
	if (p.has("overflow")) out.clip = get("overflow") === "hidden" ? HIDDEN : VISIBLE;
	if (FLOATING.some((k) => p.has(k))) out.floating = floatingOf(p);
	const text = {};
	if (p.has("color")) text.textColor = colourOf("color");
	for (const k of [
		"fontId",
		"fontSize",
		"letterSpacing",
		"lineHeight"
	]) if (p.has(k)) text[k] = get(k);
	if (p.has("textAlign")) text.textAlignment = String(get("textAlign")).toUpperCase();
	const wrap = get("whiteSpace");
	if (wrap !== void 0) text.wrapMode = wrap === "nowrap" ? "NONE" : wrap === "pre-line" ? "NEWLINES" : "WORDS";
	if (Object.keys(text).length) out.text = text;
	return out;
};
const HIDDEN = {
	horizontal: 1,
	vertical: 1
};
const VISIBLE = {
	horizontal: 0,
	vertical: 0
};
const isLeaf = (v) => typeof v !== "object" || Object.hasOwn(v, "r") || Object.hasOwn(v, "type");
const pick = (full, mask) => Object.fromEntries(Object.keys(mask).map((k) => [k, isLeaf(mask[k]) ? full[k] : pick(full[k], mask[k])]));
const diff = (a, b) => {
	const out = {};
	for (const [k, v] of Object.entries(a)) if (isLeaf(v)) {
		if (Formatter.formatJson(v) !== Formatter.formatJson(b[k])) out[k] = v;
	} else {
		const d = diff(v, b[k]);
		if (Object.keys(d).length) out[k] = d;
	}
	return out;
};
const merge = (a, b) => {
	const out = { ...a };
	for (const [k, v] of Object.entries(b)) out[k] = isLeaf(v) || out[k] === void 0 ? v : merge(out[k], v);
	return out;
};
const literalOf = (n, values) => {
	const base = n.__clay.filter((e) => !e[2]);
	const out = shapeOf(base, values);
	for (const s of STATES) {
		const own = n.__clay.filter((e) => e[2] === s);
		if (!own.length) continue;
		const mask = shapeOf([...base.filter((e) => e[0] === "flexDirection"), ...own], values);
		const overlay = pick(shapeOf([...base, ...own], values), mask);
		const layout = overlay.layout;
		if (layout && !own.some((e) => e[0] === "flexDirection")) {
			delete layout.layoutDirection;
			if (!Object.keys(layout).length) delete overlay.layout;
		}
		out[s] = overlay;
	}
	return out;
};
const replacement = (n) => {
	const out = literalOf(n);
	if (!n.__clay.some(([k, v]) => COLOURS.has(k) && String(v).includes("var("))) return out;
	const themes = {};
	for (const { label, values } of together({
		themed: tables.themed,
		layers: registry.layers
	})) {
		const d = diff(literalOf(n, values), out);
		if (Object.keys(d).length) themes[label] = d;
	}
	if (Object.keys(themes).length) out.themes = themes;
	return out;
};
registry.clay = (v) => {
	if (Predicate.hasProperty(v, "__fonts")) return `(${Formatter.formatJson({ fonts: v.__fonts })})`;
	return isClay(v) ? `(${Formatter.formatJson(replacement(v))})` : void 0;
};
const ENUM = {
	type: (v) => `CLAY__SIZING_TYPE_${v}`,
	layoutDirection: (v) => `CLAY_${v}`,
	x: (v) => `CLAY_ALIGN_X_${v}`,
	y: (v) => `CLAY_ALIGN_Y_${v}`,
	textAlignment: (v) => `CLAY_TEXT_ALIGN_${v}`,
	wrapMode: (v) => `CLAY_TEXT_WRAP_${v}`,
	element: (v) => `CLAY_ATTACH_POINT_${v}`,
	parent: (v) => `CLAY_ATTACH_POINT_${v}`,
	pointerCaptureMode: (v) => `CLAY_POINTER_CAPTURE_MODE_${v}`,
	attachTo: (v) => `CLAY_ATTACH_TO_${v}`,
	clipTo: (v) => `CLAY_CLIP_TO_${v}`
};
const c = (key, v) => {
	if (typeof v === "number") return key === "parentId" ? `${v}u` : String(v);
	if (typeof v === "string") return ENUM[key](v);
	if (v.type !== void 0) return `{ .size = { ${v.percent !== void 0 ? `.percent = ${c("", v.percent)}` : `.minMax = { ${c("", v.min ?? 0)}, ${c("", v.max ?? 0)} }`} }, .type = ${c("type", v.type)} }`;
	return `{ ${Object.entries(v).map(([k, x]) => `.${k} = ${c(k, x)}`).join(", ")} }`;
};
const SHAPE = /* @__PURE__ */ new Set([
	"layout",
	"backgroundColor",
	"cornerRadius",
	"border",
	"clip",
	"floating",
	"text",
	"themes",
	...STATES
]);
const isShape = (v) => !!v && typeof v === "object" && Object.keys(v).every((k) => SHAPE.has(k)) && !Formatter.formatJson(v).includes("\"var(");
/**
* The styles of a module as C: a `Clay_ElementDeclaration` per export, and a `Clay_TextElementConfig` named
* `<name>_text` for one that sets text props, for `CLAY(id, name)` and `CLAY_TEXT(s, name_text)`. A state is a whole
* declaration of its own, `<name>_hover` (`_focus`, `_active`, and `<name>_hover_text`); a theme is a whole set of
* them again, its name last (`<name>_<theme>`, `<name>_hover_<theme>`, `<name>_text_<theme>`), for every style once
* the module has a theme, so a page picks a theme by appending its name. The fonts of `fonts()` are an enum, `<name>_<font>`, in their order.
*
* @param {Record<string, unknown>} styles the exports of a built module of cssints/clay styles
* @returns {string} a C header that includes clay.h
*/
const header = (styles) => {
	const lines = [
		"// Generated by cssints/clay. Do not edit.",
		"#pragma once",
		"",
		"#include \"clay.h\"",
		""
	];
	const print = (name, all, theme = "") => {
		const { themes: _, ...v } = all;
		const base = Object.fromEntries(Object.entries(v).filter(([k]) => !STATES.includes(k)));
		for (const [suffix, shape] of [["", base], ...STATES.flatMap((s) => v[s] ? [[`_${s.slice(1)}`, merge(base, v[s])]] : [])]) {
			const { text, ...decl } = shape;
			if (Object.keys(decl).length) lines.push(`static const Clay_ElementDeclaration ${name}${suffix}${theme} = ${c("", decl)};`);
			if (text) lines.push(`static const Clay_TextElementConfig ${name}${suffix}_text${theme} = ${c("", text)};`);
		}
	};
	const shapes = Object.entries(styles).filter((e) => isShape(e[1]));
	for (const [name, v] of Object.entries(styles)) if (Predicate.hasProperty(v, "fonts") && Array.isArray(v.fonts) && Object.keys(v).length === 1) lines.push(`enum { ${v.fonts.map((f, i) => `${name}_${String(f)} = ${i}`).join(", ")} };`);
	for (const [name, v] of shapes) print(name, v);
	const names = [...new Set(shapes.flatMap(([, v]) => Object.keys(v.themes ?? {})))];
	for (const theme of names) {
		lines.push("", `// theme ${theme}`);
		for (const [name, v] of shapes) print(name, merge(v, v.themes?.[theme] ?? {}), `_${theme}`);
	}
	return `${lines.join("\n")}\n`;
};
//#endregion
export { active, alignItems, backgroundColor, bg, border, borderColor, borderRadius, borderWidth, cn, color, createGlobalTheme, createTokens, flexDirection, float, focus, fontSize, fonts, gap, header, height, hover, justifyContent, letterSpacing, lineHeight, overflow, p, padding, paddingBlock, paddingBottom, paddingInline, paddingLeft, paddingRight, paddingTop, pb, pl, pr, pt, textAlign, whiteSpace, width };
