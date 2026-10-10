import { a as registry, d as MacroError, f as MemberError, o as warn } from "./registry-n9JCX4pl.mjs";
import { D as relation, E as covers, d as requireLayer, p as standIn } from "./sheet-CO7a-mdA.mjs";
import { t as fallbackOf } from "./lowered-CeoXbm0P.mjs";
import { createRequire } from "node:module";
import { checkSelector } from "@cssints/css-grammar/check";
import { browsers, supportOf } from "@cssints/css-grammar/support";
import { CSSStyleValue } from "@cssints/css-grammar/values";
import { Cause, Effect, Exit, Formatter, Predicate } from "effect";
import { createHash } from "node:crypto";
import { functions } from "@cssints/css-grammar/functions";
import { properties } from "@cssints/css-grammar/mdn";
import { relative } from "node:path";
import { DTCG_TYPES, TOKEN_TYPES, grammarOf } from "@cssints/css-grammar/token";
import { matches } from "@cssints/css-grammar/twin";
//#region src/node.ts
const plain = (method) => {
	throw fail(`cssints: plain styles do not chain (.${method}); merge them with cn(...) or cx(...)`);
};
const node = (decls, { markers, kernels, globals, themes, layers, plugs, bare } = {}, chain = (name) => plain(name)) => new Proxy({
	__cssints: decls,
	markers,
	kernels,
	globals,
	themes,
	layers,
	plugs,
	bare
}, { get: (t, k) => k in t || typeof k === "symbol" ? t[k] : (...args) => chain(k, args, t) });
const camel = (p) => p.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const fail = (message) => new MacroError({
	message,
	...registry.at
});
const failIn = (plugin, message) => new MemberError({
	message,
	pluginName: plugin,
	...registry.at
});
const isNode = (v) => !!v && typeof v === "object" && Array.isArray(v.__cssints);
const VAR = /var\((--[\w-]+)\)/g;
function probed(value, properties) {
	if (!value.includes("var(--")) return [value];
	const probesOf = (name) => properties.get(name)?.probes ?? [];
	let n = 1;
	for (const [, name] of value.matchAll(VAR)) n = Math.max(n, probesOf(name).length);
	return Array.from({ length: n }, (_, i) => value.replace(VAR, (m, name) => probesOf(name)[i] ?? probesOf(name)[0] ?? m));
}
//#endregion
//#region src/lib.ts
const isFallback = (v) => !!v && typeof v === "object" && "__fallback" in v;
const edge = (program) => {
	const exit = Effect.runSyncExit(program);
	if (Exit.isFailure(exit)) throw Cause.squash(exit.cause);
	return exit.value;
};
const PROPS = {
	...Object.fromEntries(Object.keys(properties).filter((p) => p !== "--*").map((p) => [camel(p), p])),
	p: "padding",
	pt: "padding-top",
	pr: "padding-right",
	pb: "padding-bottom",
	pl: "padding-left",
	m: "margin",
	mt: "margin-top",
	mr: "margin-right",
	mb: "margin-bottom",
	ml: "margin-left",
	bg: "background-color"
};
const CONTEXTS = {
	flex: [
		"flex-direction",
		"flex-wrap",
		"flex-flow",
		"align-items",
		"align-content",
		"justify-content",
		"place-content",
		"gap",
		"row-gap",
		"column-gap"
	],
	grid: [
		"grid-template-columns",
		"grid-template-rows",
		"grid-template-areas",
		"grid-template",
		"grid-auto-flow",
		"grid-auto-columns",
		"grid-auto-rows",
		"align-items",
		"justify-items",
		"place-items",
		"align-content",
		"justify-content",
		"place-content",
		"gap",
		"row-gap",
		"column-gap"
	]
};
const SELECTORS = createRequire(import.meta.url)("mdn-data/css/selectors.json");
const FIRST = [
	"link",
	"visited",
	"any-link",
	"focus-within",
	"hover",
	"focus",
	"focus-visible",
	"active"
];
const pseudoNames = Object.entries(SELECTORS).filter(([k, v]) => /^:[a-z-]+$/.test(k) && v?.status === "standard" && v.groups.includes("Selectors")).map(([k]) => k.slice(1)).filter((n) => n !== "default");
const PSEUDOS = Object.fromEntries([...FIRST, ...pseudoNames.filter((n) => !FIRST.includes(n))].map((n, i) => [camel(n), {
	text: `:${n}`,
	rank: i
}]));
const BUILDERS = /* @__PURE__ */ new Set([
	"cn",
	"firstThatWorks",
	"keyframes",
	"flex",
	"grid",
	"cv",
	"media",
	"container",
	"supports",
	"attr",
	"group",
	"within",
	"global",
	"layers",
	"token",
	"style",
	"createTokens",
	"createGlobalTheme",
	"check"
]);
const FUNCTIONS = Object.fromEntries(Object.keys(functions).map((f) => {
	const n = camel(f);
	return [n in PROPS || n in PSEUDOS || BUILDERS.has(n) ? `${n}Fn` : n, f];
}));
const LAYER = [
	"_.a",
	"_.b",
	"_.c",
	"_.d",
	"_.e"
];
function minWidth(q) {
	if (/,|\b(or|not)\b/.test(q)) return 0;
	let w = 0;
	for (const [, n, u] of q.matchAll(/\(\s*(?:min-)?width\s*(?::|>=?)\s*([\d.]+)(px|rem|em)\s*\)/g)) w = Math.max(w, Number(n) * (u === "px" ? 1 : 16));
	return w;
}
const RAW_VAR = /var\(\s*(--[\w-]+)/g;
function checkVars(where, text) {
	if (!text.includes("var(")) return;
	const { properties, defs } = registry;
	for (const [, name] of text.matchAll(RAW_VAR)) {
		if (name.startsWith("--_") || !properties.has(name)) continue;
		const path = defs.get(name)?.path;
		warn(registry, `var ${where} ${name}`, `${where}: "var(${name})" is the token ${path === name ? `declared as ${name}` : path}: pass the token itself, and css.var(token, fallback) for a fallback`);
	}
}
const SPACING = /^(padding|margin|inset|gap|row-gap|column-gap)(-|$)/;
const decl = (prop, name, args) => {
	if (!args.length) throw fail(`cssints: ${name}() expects a value`);
	if (args.some(isNode)) throw fail(`cssints: ${name}() takes values, not styles; merge styles with cn(...) or cx(...)`);
	for (const a of args) if (typeof a === "string") checkVars(name, a);
	const [fb, extra] = args.filter(isFallback);
	if (extra) throw fail(`cssints: ${name}() takes one firstThatWorks(...) per declaration`);
	if (fb) {
		const text = (v) => args.map((a) => a === fb ? v : a).join(" ");
		const [wanted, ...rest] = fb.__fallback;
		return [
			prop,
			text(wanted),
			void 0,
			rest.map(text)
		];
	}
	const [only] = args;
	return [prop, args.length === 1 && typeof only === "number" && SPACING.test(prop) ? `${only * .25}rem` : args.join(" ")];
};
function carried(nodes) {
	const out = {};
	for (const n of nodes) {
		if (n.markers) for (const m of n.markers) {
			const all = out.markers ??= [];
			if (!all.some((x) => x[0] === m[0] && x[1] === m[1])) all.push(m);
		}
		for (const m of n.bare ?? (n.__cssints.length ? [] : n.markers ?? [])) {
			const all = out.bare ??= [];
			if (!all.some((x) => x[0] === m[0] && x[1] === m[1])) all.push(m);
		}
		if (n.kernels) for (const k of n.kernels) {
			const all = out.kernels ??= [];
			if (!all.includes(k)) all.push(k);
		}
		if (n.globals) for (const g of n.globals) {
			const all = out.globals ??= [];
			if (!all.includes(g)) all.push(g);
		}
		if (n.themes) for (const t of n.themes) {
			const all = out.themes ??= [];
			if (!all.includes(t)) all.push(t);
		}
		if (n.layers) for (const l of n.layers) {
			const all = out.layers ??= [];
			if (!all.some((x) => x.names.join() === l.names.join() && x.before === l.before)) all.push(l);
		}
		if (n.plugs) for (const p of n.plugs) {
			const all = out.plugs ??= [];
			if (!all.includes(p)) all.push(p);
		}
	}
	return out;
}
function merged(decls) {
	const out = [];
	const at = (d) => (d[2] ?? []).map((c) => c.text).join(" > ");
	for (const d of decls) {
		const where = at(d);
		for (let i = out.length - 1; i >= 0; i--) {
			const o = out[i];
			if (at(o) !== where) continue;
			const r = relation(o[0], d[0]);
			if (r === "same") out.splice(i, 1);
			else if (r === "overlap") throw fail(`cssints: ${o[0]} and ${d[0]} overlap without one containing the other${where ? ` (under ${where})` : ""}, so the sheet cannot order them by the arguments: set one of them, or the longhands`);
		}
		out.push(d);
	}
	return out;
}
function settled(base, variants, compounds = []) {
	const at = (d) => (d[2] ?? []).map((c) => c.text).join(" > ");
	const under = (d) => at(d) ? ` (under ${at(d)})` : "";
	const meet = (o, d, who) => {
		if (at(o) !== at(d)) return "apart";
		const r = relation(o[0], d[0]);
		if (r === "overlap") throw fail(`cssints: cv() ${who} ${o[0]} and ${d[0]} overlap without one containing the other${under(d)}, so the sheet cannot order them: set one of them, or the longhands`);
		return r;
	};
	const replace = (olds, d, who, gone) => {
		for (const o of olds) {
			const cls = hashClass(o);
			if (meet(o, d, who) !== "apart" && covers(d[0], o[0]) && cls !== hashClass(d) && !gone.includes(cls)) gone.push(cls);
		}
	};
	const together = (o, d, a, b) => {
		for (const x of o) if (meet(d, x, `${a} and ${b}:`) === "same") throw fail(`cssints: cv() ${a} and ${b} both set ${x[0]}${under(d)} and can be active together, so nothing says which wins: set it in one of them, or in the base`);
	};
	const out = {};
	const keys = Object.entries(variants);
	keys.forEach(([k, vs], i) => {
		for (const [n, decls] of Object.entries(vs)) {
			const gone = [];
			for (const d of decls) {
				replace(base, d, `base and variant ${k}.${n}:`, gone);
				for (const [k2, vs2] of keys.slice(i + 1)) for (const [n2, decls2] of Object.entries(vs2)) together(decls2, d, `variants ${k}.${n}`, `${k2}.${n2}`);
			}
			if (gone.length) (out[k] ??= {})[n] = gone.join(" ");
		}
	});
	return {
		drops: out,
		compound: compounds.map(({ when, decls }, j) => {
			const gone = [];
			const me = `compoundVariants[${j}]`;
			for (const d of decls) {
				replace(base, d, `base and ${me}:`, gone);
				for (const [k, vs] of keys) for (const [n, vdecls] of Object.entries(vs)) if (!(k in when)) together(vdecls, d, me, `variant ${k}.${n}`);
				else if (when[k] === n) replace(vdecls, d, `variant ${k}.${n} and ${me}:`, gone);
				compounds.slice(j + 1).forEach((c, i) => {
					if (Object.keys(when).every((k) => !(k in c.when) || c.when[k] === when[k])) together(c.decls, d, me, `compoundVariants[${j + 1 + i}]`);
				});
			}
			return gone.join(" ");
		})
	};
}
function toDecls(member, args) {
	if (member === "cn") {
		if (!args.every(isNode)) throw fail(`cssints: cn() takes css.* values only, got ${JSON.stringify(args.filter((a) => !isNode(a)))}`);
		return merged(args.flatMap((n) => n.__cssints));
	}
	if (CONTEXTS[member]) return [args.length ? decl(member, member, args) : ["display", member]];
	const prop = PROPS[member];
	if (!prop) throw fail(`cssints: unknown css.${member}`);
	return [decl(prop, member, args)];
}
const chainNames = (ctx) => CONTEXTS[ctx].map((p) => camel(p.startsWith(`${ctx}-`) ? p.slice(ctx.length + 1) : p));
function chainDecl(ctx, method, args) {
	if (!ctx) throw fail(`cssints: plain styles do not chain (.${method}); merge them with cn(...) or cx(...)`);
	const i = chainNames(ctx).indexOf(method);
	if (i < 0) throw fail(`cssints: ${ctx}() has no .${method}(); it chains ${chainNames(ctx).join(", ")}`);
	return decl(CONTEXTS[ctx][i], method, args);
}
function hashClass([p, v, conds, fallbacks]) {
	let h = 5381;
	let text = conds ? `${conds.map((c) => c.text).join(">")}|${p}:${v}` : `${p}:${v}`;
	if (fallbacks) text += `|${fallbacks.join("|")}`;
	for (const c of text) h = (h << 5) + h + c.charCodeAt(0) | 0;
	return "_" + (h >>> 0).toString(36);
}
//#endregion
//#region src/token.ts
var CSSTokenValue = class extends CSSStyleValue {
	name;
	syntax;
	settable;
	constructor(name, syntax, settable) {
		super();
		this.name = name;
		this.syntax = syntax;
		this.settable = settable;
	}
	toString() {
		return `var(${this.name})`;
	}
	toJSON() {
		return this.toString();
	}
};
const SUPPORT_PROPERTY = {
	color: "color",
	length: "width",
	percentage: "width",
	"length-percentage": "width",
	number: "opacity",
	integer: "z-index",
	angle: "transform",
	time: "transition-duration",
	url: "background-image",
	image: "background-image",
	"transform-list": "transform",
	"easing-function": "transition-timing-function",
	shadow: "box-shadow"
};
const supportTest = (syntax, text) => `(${SUPPORT_PROPERTY[syntax]}:${text})`;
const checkSyntaxFx = Effect.fnUntraced(function* (what, syntax, text, who = what, variable) {
	const grammar = grammarOf(syntax);
	if (!(yield* matches(grammar, text).pipe(Effect.mapError((e) => new MacroError({
		message: e.message,
		cause: e,
		...registry.at
	}))))) return yield* fail(`cssints: ${what} "${text}" is not a ${grammar}`);
	const prop = SUPPORT_PROPERTY[syntax];
	if (!prop) return;
	const ws = supportOf(prop, text).filter((w) => w.feature !== prop);
	const lacking = [...new Set(ws.flatMap((w) => w.lacking))];
	const lowered = ws.map((w) => variable && fallbackOf(variable, text, {
		...w,
		lacking
	}));
	if (ws.length && lowered.every(Boolean)) return lowered[0] || void 0;
	for (const [i, w] of ws.entries()) if (!lowered[i]) warn(registry, `${who} ${w.key}`, `${who}: "${w.feature}" in "${text}" is not supported by ${browsers(w.lacking)} (${w.key})`);
});
const checkSyntax = (what, syntax, text) => {
	edge(checkSyntaxFx(what, syntax, text));
};
const NAME = /^(?:--)?([A-Za-z_][\w-]*)$/;
const nameOf = (name) => {
	const { var: v, inherit = true } = typeof name === "string" ? { var: name } : name;
	const m = typeof v === "string" ? NAME.exec(v) : null;
	if (!m || typeof inherit !== "boolean") throw fail(`cssints: a token name is a CSS identifier or { var, inherit }, got ${Formatter.formatJson(name)}`);
	return {
		name: `--${m[1]}`,
		inherit
	};
};
const privateName = () => {
	const at = registry.at;
	const key = `${relative(process.cwd(), at.file)}:${at.site}:${registry.tokens}`;
	return `--_${createHash("sha1").update(key).digest("hex").slice(0, 8)}`;
};
const FONT_RELATIVE = /(\d*\.?\d+(?:e[+-]?\d+)?)(r?em|r?ex|r?ch|r?cap|r?ic|r?lh)\b/gi;
const EM = {
	em: 1,
	ex: .5,
	ch: .5,
	cap: .7,
	ic: 1,
	lh: 1.2
};
const inPx = (text) => text.replace(FONT_RELATIVE, (_, n, unit) => {
	const u = unit.toLowerCase();
	return `${Number((Number(n) * 16 * (EM[u] ?? EM[u.slice(1)])).toFixed(4))}px`;
});
const declare = Effect.fnUntraced(function* (kind, text, variable, inherit, settable, what, live = false) {
	const at = registry.at;
	const { syntax, probes, property = `<${syntax}>` } = TOKEN_TYPES[kind];
	const name = what ?? `token.${kind}() initial value`;
	const fallback = yield* checkSyntaxFx(name, syntax, text, what ?? `${name} of ${variable}`, variable);
	const initial = property === "*" ? fallback ?? text : inPx(fallback ?? text);
	const n = registry.tokens++;
	const by = `${at.file}#${at.site}.${n}`;
	const css = `@property ${variable}{syntax:"${property}";inherits:${inherit};initial-value:${initial}}`;
	const prev = registry.properties.get(variable);
	if (prev && prev.css !== css && prev.by !== by && !(prev.file === at.file && prev.gen !== registry.gen)) return yield* fail(`cssints: ${variable} is already declared with another @property, in ${relative(process.cwd(), prev.file)}: ${prev.css}; here: ${css}`);
	registry.properties.set(variable, {
		css,
		probes,
		by,
		file: at.file,
		gen: registry.gen
	});
	registry.defs.set(variable, {
		kind,
		inherit,
		path: variable,
		value: text,
		fallback
	});
	if ((fallback || initial !== text) && !live) registry.themed.set(by, {
		file: at.file,
		key: `0:${at.file}#${String(at.site).padStart(6, "0")}.${n}`,
		css: `${inherit ? ":root" : ":where(*)"}{${variable}:${text}}`,
		names: [variable]
	});
	return new CSSTokenValue(variable, syntax, settable);
});
const make = (kind) => (...args) => {
	const [initial, name] = args;
	if (!registry.at || typeof initial !== "string" && typeof initial !== "number" || args.length > 2) throw fail(`cssints: token.${kind}(initial, name?) takes an initial value (a string) and an optional name`);
	const { name: variable, inherit } = name === void 0 ? {
		name: privateName(),
		inherit: true
	} : nameOf(name);
	return edge(declare(kind, String(initial).trim(), variable, inherit, name !== void 0));
};
const isStyle = (v) => Predicate.hasProperty(v, "__style");
const set = (...args) => {
	const [t, value] = args;
	if (args.length !== 2 || !(t instanceof CSSTokenValue) || typeof value !== "string" && typeof value !== "number") throw fail("cssints: token.set(token, value) takes a token and a value");
	if (!t.settable) throw fail(`cssints: ${t.name} is private, only a token with a name can be set: token.<type>(initial, "name")`);
	const text = String(value).trim();
	checkSyntax(`token.set() value of ${t.name}`, t.syntax, text);
	return { __style: {
		sets: [[t.name, text]],
		decls: []
	} };
};
const style = (...args) => {
	if (!args.length) throw fail("cssints: style() expects css.* values or token.set(...) results");
	const sets = [];
	const decls = [];
	for (const a of args) if (isStyle(a)) {
		sets.push(...a.__style.sets);
		decls.push(...a.__style.decls);
	} else if (isNode(a)) {
		if (a.markers || a.kernels) throw fail("cssints: style() takes plain declarations: an inline style has no marker class");
		if (a.__cssints.some(([, , conds]) => conds?.length)) throw fail("cssints: style() takes styles without conditions: an inline style has no media query or :hover");
		if (a.__cssints.some((d) => d[3])) throw fail("cssints: style() takes one value per property: an inline style cannot hold a firstThatWorks(...) fallback");
		decls.push(...a.__cssints);
	} else throw fail(`cssints: style() takes css.* values and token.set(...) results, got ${Formatter.formatJson(a)}`);
	return { __style: {
		sets,
		decls
	} };
};
const token = {
	...Object.fromEntries(Object.keys(TOKEN_TYPES).map((kind) => [kind, make(kind)])),
	set
};
//#endregion
//#region src/theme.ts
const accessOf = (key) => /^\d/.test(key) ? `_${key}` : key;
const SUPPORTED = Object.keys(DTCG_TYPES).join(", ");
const COLOR_FN = {
	hsl: [1, 2],
	hwb: [1, 2],
	lab: [],
	lch: [],
	oklab: [],
	oklch: []
};
const COLOR_SPACES = /* @__PURE__ */ new Set([
	"srgb",
	"srgb-linear",
	"display-p3",
	"a98-rgb",
	"prophoto-rgb",
	"rec2020",
	"xyz-d65",
	"xyz-d50"
]);
const FONT_WEIGHTS = {
	thin: 100,
	hairline: 100,
	"extra-light": 200,
	"ultra-light": 200,
	light: 300,
	normal: 400,
	regular: 400,
	book: 400,
	medium: 500,
	"semi-bold": 600,
	"demi-bold": 600,
	bold: 700,
	"extra-bold": 800,
	"ultra-bold": 800,
	black: 900,
	heavy: 900,
	"extra-black": 950,
	"ultra-black": 950
};
const SHADOW = [
	"color",
	"offsetX",
	"offsetY",
	"blur",
	"spread"
];
const UNITS = {
	dimension: ["px", "rem"],
	duration: ["ms", "s"]
};
const isNumber = (n) => typeof n === "number" && Number.isFinite(n);
const isComponent = (n) => isNumber(n) || n === "none";
const cssOf = Effect.fnUntraced(function* (type, value, what) {
	if (typeof value === "string") {
		const key = value.trim().toLowerCase();
		return type === "fontWeight" && Object.hasOwn(FONT_WEIGHTS, key) ? String(FONT_WEIGHTS[key]) : value.trim();
	}
	if (isNumber(value) && (type === "number" || type === "fontWeight")) return String(value);
	if (Predicate.isObject(value) && type === "color") {
		const { colorSpace: space, components: c, alpha } = value;
		const named = typeof space === "string" ? COLOR_FN[space] : void 0;
		if (!(named || COLOR_SPACES.has(space)) || !Array.isArray(c) || c.length !== 3 || !c.every(isComponent) || alpha !== void 0 && !isNumber(alpha)) return yield* fail(`cssints: ${what} is not a DTCG colour: { colorSpace, components: [3 numbers or "none"], alpha? } with a colorSpace of hsl, hwb, lab, lch, oklab, oklch or ${[...COLOR_SPACES].join(", ")}`);
		const parts = c.map((n, i) => named?.includes(i) && n !== "none" ? `${n}%` : n);
		const a = alpha === void 0 ? "" : ` / ${alpha}`;
		return named ? `${space}(${parts.join(" ")}${a})` : `color(${space} ${parts.join(" ")}${a})`;
	}
	if (type === "cubicBezier") {
		if (!Array.isArray(value) || value.length !== 4 || !value.every(isNumber)) return yield* fail(`cssints: ${what} is not a DTCG cubicBezier: [x1, y1, x2, y2]`);
		return `cubic-bezier(${value.join(", ")})`;
	}
	if (type === "shadow") {
		const layers = Array.isArray(value) ? value : [value];
		const out = [];
		for (const l of layers) {
			if (!Predicate.isObject(l) || SHADOW.some((k) => l[k] === void 0) || l.inset !== void 0 && typeof l.inset !== "boolean") return yield* fail(`cssints: ${what} is not a DTCG shadow: { color, offsetX, offsetY, blur, spread, inset? } or an array of them`);
			const parts = [];
			for (const k of SHADOW.slice(1)) parts.push(yield* cssOf("dimension", l[k], `${what} ${k}`));
			parts.push(yield* cssOf("color", l.color, `${what} color`));
			out.push(`${l.inset ? "inset " : ""}${parts.join(" ")}`);
		}
		return out.join(", ");
	}
	const units = UNITS[type];
	if (Predicate.isObject(value) && units) {
		const { value: n, unit } = value;
		if (!isNumber(n) || typeof unit !== "string" || !units.includes(unit)) return yield* fail(`cssints: ${what} is not a DTCG ${type}: { value: number, unit: ${units.join(" | ")} }`);
		return `${n}${unit}`;
	}
	return yield* fail(`cssints: ${what} is not a DTCG ${type} value: ${Formatter.formatJson(value)}`);
});
const PURE = /^var\(--[\w-]+\)$/;
const sets = /* @__PURE__ */ new WeakMap();
const ALIAS = /^\{([^{}]+)\}$/;
const REF = /\{([^{}]+)\}/g;
const IGNORED = /* @__PURE__ */ new Set([
	"$description",
	"$extensions",
	"$deprecated"
]);
const kebab = (s) => s.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();
const RECIPE = "see docs/API.md, JSON from Figma";
const STUDIO_TYPES = {
	spacing: "dimension",
	sizing: "dimension",
	borderRadius: "dimension",
	borderWidth: "dimension",
	fontSizes: "dimension",
	letterSpacing: "dimension",
	paragraphSpacing: "dimension",
	paragraphIndent: "dimension",
	fontWeights: "fontWeight",
	lineHeights: "number",
	opacity: "number",
	boxShadow: "shadow"
};
const extensionError = (token, what) => {
	const ext = token["$extensions"];
	if (!Predicate.isObject(ext)) return void 0;
	const studio = ext["studio.tokens"];
	if (Predicate.isObject(studio) && studio["modify"] !== void 0) return `cssints: ${what} has a Tokens Studio colour modifier ($extensions["studio.tokens"].modify), which cssints does not apply: write the colour as CSS (color-mix(), a relative colour) or resolve it with @tokens-studio/sd-transforms first (${RECIPE})`;
	if (ext["com.figma.type"] === "boolean") return `cssints: ${what} is a Figma boolean variable (com.figma.type "boolean"), which has no CSS value: leave it out of the tokens`;
	const figma = ext["com.figma"];
	const modes = ext["mode"] ?? (Predicate.isObject(figma) ? figma["modes"] : void 0);
	if (Predicate.isObject(modes) && Object.keys(modes).length > 1) return `cssints: ${what} has modes in $extensions (${Object.keys(modes).join(", ")}), which createTokens does not read: export one file per mode (TokensBrücke: "Split modes into separate files"; Figma: Export modes) and pass the others to createGlobalTheme (${RECIPE})`;
};
const collect = Effect.fnUntraced(function* (node, path, type, out) {
	const here = path.join(".") || "the root";
	const own = node["$type"];
	if (own !== void 0 && typeof own !== "string") return yield* fail(`cssints: createTokens(): $type of ${here} is a string, got ${Formatter.formatJson(own)}`);
	const inherited = own ?? type;
	for (const [key, child] of Object.entries(node)) {
		if (key === "$type" || key === "$value" || IGNORED.has(key)) continue;
		if (key === "$themes" || key === "$metadata") return yield* fail(`cssints: createTokens(): ${key} of ${here} is a Tokens Studio file: convert its token sets to DTCG (${RECIPE})`);
		if (key.startsWith("$")) return yield* fail(`cssints: createTokens(): ${key} of ${here} is not supported (${[
			"$root",
			"$extends",
			"$ref"
		].join(", ")} are not, $description, $extensions and $deprecated are ignored)`);
		if (/[{}.]/.test(key)) return yield* fail(`cssints: createTokens(): the name "${key}" in ${here} has a { } or . (DTCG names cannot)`);
		const at = [...path, key];
		if (!Predicate.isObject(child)) return yield* fail(`cssints: createTokens(): ${at.join(".")} is a group or a token ({ $value }), got ${Formatter.formatJson(child)}`);
		if (typeof child["type"] === "string" && Object.hasOwn(child, "value")) return yield* fail(`cssints: createTokens(): ${at.join(".")} has value and type without $, the legacy format of Tokens Studio (and of TokensBrücke without "DTCG 2025.10 format"): convert it to DTCG (${RECIPE})`);
		if (Object.hasOwn(child, "$value")) {
			const stray = Object.keys(child).filter((k) => !k.startsWith("$"));
			if (stray.length) return yield* fail(`cssints: createTokens(): ${at.join(".")} has a $value and so is a token; it cannot hold ${stray.join(", ")}`);
			const ext = extensionError(child, `createTokens(): ${at.join(".")}`);
			if (ext) return yield* fail(ext);
			const t = child["$type"] ?? inherited;
			out.push({
				path: at,
				dotted: at.join("."),
				type: t,
				value: child["$value"]
			});
		} else yield* collect(child, at, inherited, out);
	}
});
const createTokens = (...args) => edge(Effect.gen(function* () {
	const [tree, mapper] = args;
	if (!registry.at || !Predicate.isObject(tree) || args.length > 2 || mapper !== void 0 && typeof mapper !== "function") return yield* fail("cssints: createTokens(tokens, name?) takes a DTCG-shaped object and an optional function from a path to a name");
	const leaves = [];
	yield* collect(tree, [], void 0, leaves);
	if (!leaves.length) return yield* fail("cssints: createTokens(): the tokens have no leaf ({ $value })");
	const names = /* @__PURE__ */ new Map();
	const read = /* @__PURE__ */ new Map();
	const inherit = /* @__PURE__ */ new Map();
	for (const l of leaves) {
		const given = mapper ? mapper([...l.path]) : l.path.map(kebab).join("-");
		const n = yield* Effect.try({
			try: () => nameOf(given),
			catch: (e) => e
		});
		if (names.has(n.name)) return yield* fail(`cssints: createTokens(): ${names.get(n.name)} and ${l.dotted} are both ${n.name}`);
		names.set(n.name, l.dotted);
		inherit.set(l.dotted, n.inherit);
		const as = l.path.map(accessOf).join(".");
		if (read.has(as)) return yield* fail(`cssints: createTokens(): ${read.get(as)} and ${l.dotted} are both read as t.${as}`);
		read.set(as, l.dotted);
	}
	const variable = new Map([...names].map(([v, dotted]) => [dotted, v]));
	const byPath = new Map(leaves.map((l) => [l.dotted, l]));
	const resolved = /* @__PURE__ */ new Map();
	const resolve = Effect.fnUntraced(function* (leaf, stack) {
		const done = resolved.get(leaf.dotted);
		if (done) return done;
		if (leaf.type !== void 0 && !Object.hasOwn(DTCG_TYPES, leaf.type)) return yield* fail(`cssints: createTokens(): ${leaf.dotted} has $type "${leaf.type}", which has no token type (no @property syntax); supported: ${SUPPORTED}${Object.hasOwn(STUDIO_TYPES, leaf.type) ? ` ("${leaf.type}" is a Tokens Studio type: its DTCG type is "${STUDIO_TYPES[leaf.type]}")` : ""}`);
		const own = leaf.type;
		const [, ref] = (typeof leaf.value === "string" ? ALIAS.exec(leaf.value.trim()) : null) ?? [];
		let r;
		if (ref !== void 0) {
			const target = byPath.get(ref);
			if (!target) return yield* fail(`cssints: createTokens(): ${leaf.dotted} is an alias of {${ref}}, and there is no token at ${ref}${[...byPath.keys()].some((k) => k.startsWith(`${ref}.`)) ? " (it is a group)" : ""}`);
			const chain = [...stack, leaf.dotted];
			if (chain.includes(target.dotted)) return yield* fail(`cssints: createTokens(): aliases go round in a circle: ${[...chain.slice(chain.indexOf(target.dotted)), target.dotted].join(" -> ")}`);
			const t = yield* resolve(target, chain);
			if (own !== void 0 && own !== t.dtcg) return yield* fail(`cssints: createTokens(): ${leaf.dotted} is a ${own}, and its alias {${ref}} is a ${t.dtcg}`);
			r = {
				dtcg: t.dtcg,
				text: t.text,
				alias: target.dotted
			};
		} else if (typeof leaf.value === "string" && leaf.value.includes("{")) {
			if (own === void 0) return yield* fail(`cssints: createTokens(): ${leaf.dotted} is derived from other tokens and has no $type: give it one, or its group`);
			if (/^[^(]*\s[*/+-]\s/.test(leaf.value)) return yield* fail(`cssints: createTokens(): ${leaf.dotted} value "${leaf.value}" is math outside calc() (Tokens Studio math): write "calc(${leaf.value})"`);
			const refs = [];
			for (const [, ref] of leaf.value.matchAll(REF)) {
				const target = byPath.get(ref);
				if (!target) return yield* fail(`cssints: createTokens(): ${leaf.dotted} refers to {${ref}}, and there is no token at ${ref}`);
				const chain = [...stack, leaf.dotted];
				if (chain.includes(target.dotted)) return yield* fail(`cssints: createTokens(): aliases go round in a circle: ${[...chain.slice(chain.indexOf(target.dotted)), target.dotted].join(" -> ")}`);
				yield* resolve(target, chain);
				refs.push(target.dotted);
			}
			r = {
				dtcg: own,
				text: leaf.value.replace(REF, (_, ref) => resolved.get(ref).text),
				refs
			};
		} else {
			if (own === void 0) return yield* fail(`cssints: createTokens(): ${leaf.dotted} has no $type: give it one, or its group (a type is not guessed from the value)`);
			r = {
				dtcg: own,
				text: yield* cssOf(own, leaf.value, leaf.dotted)
			};
		}
		resolved.set(leaf.dotted, r);
		return r;
	});
	const root = {};
	const set = {
		tokens: /* @__PURE__ */ new Map(),
		types: /* @__PURE__ */ new Map(),
		aliases: []
	};
	const live = [];
	const guarded = [];
	for (const l of leaves) {
		const r = yield* resolve(l, []);
		const name = variable.get(l.dotted);
		const kind = DTCG_TYPES[r.dtcg];
		const token = yield* declare(kind, r.text, name, inherit.get(l.dotted), true, `createTokens(): ${l.dotted} value`, !!(r.alias ?? r.refs));
		registry.defs.get(name).path = l.dotted;
		const refs = r.alias === void 0 ? r.refs : [r.alias];
		if (refs) {
			const css = (r.alias === void 0 ? l.value : `{${r.alias}}`).replace(REF, (_, ref) => `var(${variable.get(ref)})`);
			const targets = [...new Set(refs.map((d) => variable.get(d)))];
			set.aliases.push({
				name,
				targets,
				css
			});
			const fb = r.alias === void 0 ? registry.defs.get(name).fallback : void 0;
			live.push(`${name}:${fb ?? css}`);
			const def = registry.defs.get(name);
			if (fb) {
				guarded.push(`@supports ${supportTest(TOKEN_TYPES[kind].syntax, r.text)}{:root{${name}:${css}}}`);
				if (yield* standIn(registry.at, l.dotted, kind, r.text, def.inherit, true)) def.poly = r.text;
			}
			Object.assign(def, {
				template: css,
				refs: targets
			});
		}
		set.tokens.set(l.dotted, token);
		set.types.set(name, r.dtcg);
		let group = root;
		for (const [i, key] of l.path.entries()) {
			const k = accessOf(key);
			if (i === l.path.length - 1) group[k] = token;
			else if (Predicate.isObject(group[k])) group = group[k];
			else {
				const g = group[k] = {};
				sets.set(g, set);
				group = g;
			}
		}
	}
	sets.set(root, set);
	if (live.length) {
		const { file, site } = registry.at;
		const n = registry.tokens++;
		registry.themed.set(`${file}#${site}.${n}`, {
			file,
			key: `0:${file}#${String(site).padStart(6, "0")}.${n}`,
			css: `:root{${live.join(";")}}${guarded.join("")}`,
			names: set.aliases.flatMap((a) => [a.name, ...a.targets])
		});
	}
	return root;
}));
const tokensOf = (v) => Predicate.isObject(v) && sets.has(v) ? Formatter.formatJson(v) : void 0;
const DONE = Object.freeze({ __done: true });
const isDone = (v) => v === DONE;
const isCondition = (v) => typeof v === "function" && Predicate.hasProperty(v, "__cond") && Predicate.hasProperty(v, "cond");
const SCOPE = {
	"@media": ":root",
	"@container": ":where(*)"
};
const addTheme = (t, at) => Effect.try({
	try: () => theme(at, [
		t.tokens,
		t.selector,
		t.overrides,
		{
			layer: t.layer,
			scope: t.scope
		}
	]),
	catch: (e) => e
});
const createGlobalTheme = (...args) => theme(registry.at, args);
const theme = (at, args) => edge(Effect.gen(function* () {
	const [tokens, condition, overrides, options] = args;
	const set = Predicate.isObject(tokens) ? sets.get(tokens) : void 0;
	const asked = Predicate.isObject(options) ? options.layer : void 0;
	const layer = typeof asked === "string" ? asked : void 0;
	const wanted = Predicate.isObject(options) ? options.scope : void 0;
	const scope = typeof wanted === "string" ? wanted.trim() : void 0;
	if (!at || !set || args.length < 3 || args.length > 4 || !Predicate.isObject(overrides) || args.length === 4 && (!Predicate.isObject(options) || asked !== void 0 && layer === void 0 || wanted !== void 0 && scope === void 0)) return yield* fail("cssints: createGlobalTheme(tokens, condition | selector, overrides, { layer, scope }?) takes tokens of createTokens, a media() or container() condition or a selector, the values to set, and optionally a declared top-level layer and a selector to scope them to");
	if (layer !== void 0) yield* requireLayer(layer, at);
	if (scope !== void 0) {
		if (typeof condition !== "string") return yield* fail("cssints: createGlobalTheme(): a scope goes with a selector, not a condition");
		yield* checkSelector(scope).pipe(Effect.mapError((e) => new MacroError({
			message: `cssints: createGlobalTheme(): scope: ${e.message}`,
			cause: e,
			...at
		})));
	}
	let label;
	let block;
	if (typeof condition === "string") {
		label = condition.trim();
		if (!/^[^{};@]+$/.test(label)) return yield* fail(`cssints: createGlobalTheme(): "${condition}" is not a selector`);
		block = (d) => `${label}{${d}}`;
	} else if (isCondition(condition)) {
		label = condition.cond.text;
		const prelude = /^@(media|container)\b/.exec(label)?.[0];
		if (!prelude) return yield* fail(`cssints: createGlobalTheme(): ${label} is not a theme, use a media() or container() condition, or a selector`);
		block = (d) => `${label}{${SCOPE[prelude]}{${d}}}`;
	} else return yield* fail(`cssints: createGlobalTheme(): the second argument is a media() or container() condition or a selector, got ${Formatter.formatJson(condition)}`);
	const changed = /* @__PURE__ */ new Map();
	const defaults = /* @__PURE__ */ new Map();
	const guards = /* @__PURE__ */ new Map();
	const poly = /* @__PURE__ */ new Map();
	const refs = /* @__PURE__ */ new Map();
	const walk = Effect.fnUntraced(function* (node, values, path) {
		for (const [key, given] of Object.entries(values)) {
			if (key.startsWith("$")) continue;
			const leaf = Predicate.isObject(given) && Object.hasOwn(given, "$value");
			const v = leaf ? given["$value"] : given;
			const own = Object.hasOwn(node, key) ? key : accessOf(key);
			const child = Object.hasOwn(node, own) ? node[own] : void 0;
			const dotted = [...path, key].join(".");
			const ext = leaf ? extensionError(given, `createGlobalTheme(): ${dotted}`) : void 0;
			if (ext) return yield* fail(ext);
			if (child instanceof CSSTokenValue) {
				const kind = registry.defs.get(child.name).kind;
				const text = yield* cssOf(set.types.get(child.name), v, dotted);
				const targets = /* @__PURE__ */ new Map();
				for (const [, ref] of text.matchAll(REF)) {
					const target = set.tokens.get(ref);
					if (!target) return yield* fail(`cssints: createGlobalTheme(): ${dotted} refers to {${ref}}, and there is no token at ${ref}`);
					targets.set(ref, target);
				}
				const whole = ALIAS.exec(text)?.[1];
				const other = whole && registry.defs.get(targets.get(whole).name).kind;
				if (other && other !== kind) return yield* fail(`cssints: createGlobalTheme(): ${dotted} is a ${kind}, and its reference {${whole}} is a ${other}`);
				const literal = text.replace(REF, (_, r) => registry.defs.get(targets.get(r).name).value);
				const css = text.replace(REF, (_, r) => `var(${targets.get(r).name})`);
				const fb = yield* checkSyntaxFx(`createGlobalTheme(): ${dotted} value`, TOKEN_TYPES[kind].syntax, literal, `createGlobalTheme(): ${dotted} value in ${label}`, child.name);
				if (fb && css !== literal && !PURE.test(css)) {
					const test = supportTest(TOKEN_TYPES[kind].syntax, literal);
					guards.set(test, [...guards.get(test) ?? [], `${child.name}:${css}`]);
					defaults.set(child.name, fb);
					const { inherit } = registry.defs.get(child.name);
					if (yield* standIn(at, `${dotted} in ${label}`, kind, literal, inherit, !label.startsWith("@container"))) poly.set(child.name, literal);
				}
				changed.set(child.name, css);
				if (targets.size) refs.set(child.name, [...targets.values()].map((t) => t.name));
			} else if (Predicate.isObject(child) && Predicate.isObject(v)) yield* walk(child, v, [...path, key]);
			else return yield* fail(child === void 0 ? `cssints: createGlobalTheme(): there is no token at ${dotted}` : `cssints: createGlobalTheme(): ${dotted} is a group, its values are an object`);
		}
	});
	yield* walk(tokens, overrides, []);
	if (!changed.size) return yield* fail("cssints: createGlobalTheme(): the theme sets no token");
	const deps = (n) => refs.get(n) ?? set.aliases.find((a) => a.name === n)?.targets ?? [];
	const done = /* @__PURE__ */ new Set();
	const visit = (n, stack) => {
		if (stack.includes(n)) return [...stack.slice(stack.indexOf(n)), n];
		if (done.has(n)) return void 0;
		for (const d of deps(n)) {
			const circle = visit(d, [...stack, n]);
			if (circle) return circle;
		}
		done.add(n);
	};
	for (const n of refs.keys()) {
		const circle = visit(n, []);
		if (circle) return yield* fail(`cssints: createGlobalTheme(): references go round in a circle: ${circle.map((c) => registry.defs.get(c).path).join(" -> ")}`);
	}
	const stale = new Set(changed.keys());
	for (let grew = true; grew;) grew = set.aliases.some((a) => a.targets.some((t) => stale.has(t)) && !stale.has(a.name) && !!stale.add(a.name));
	const decls = [...[...changed].map(([name, text]) => `${name}:${defaults.get(name) ?? text}`), ...set.aliases.filter((a) => stale.has(a.name) && !changed.has(a.name)).map((a) => `${a.name}:${a.css}`)];
	const n = registry.tokens++;
	const rules = block(decls.join(";")) + [...guards].map(([test, live]) => `@supports ${test}{${block(live.join(";"))}}`).join("");
	registry.themed.set(`${at.file}#${at.site}.${n}`, {
		file: at.file,
		key: `${typeof condition === "string" ? 2 : 1}:${at.file}#${String(at.site).padStart(6, "0")}.${n}`,
		css: scope === void 0 ? rules : `@scope (${scope}){${rules}}`,
		names: decls.map((d) => d.slice(0, d.indexOf(":"))),
		...layer === void 0 ? {} : { layer },
		theme: {
			label,
			scope,
			values: changed,
			poly: poly.size ? poly : void 0
		}
	});
	return DONE;
}));
const contrast = (...args) => edge(Effect.gen(function* () {
	const [fg, bg, options] = args;
	const min = options?.min;
	const at = registry.at;
	if (!at || args.length !== 3 || !(fg instanceof CSSTokenValue) || !(bg instanceof CSSTokenValue) || fg.syntax !== "color" || bg.syntax !== "color" || typeof min !== "number" || !(min >= 1 && min <= 21)) return yield* fail("cssints: check.contrast(fg, bg, { min }) takes two colour tokens and a minimum ratio from 1 to 21");
	registry.checks.set(`${at.file}#${at.site}.${registry.tokens++}`, {
		at,
		fg: fg.name,
		bg: bg.name,
		min,
		gen: registry.gen
	});
	return DONE;
}));
const check = { contrast };
//#endregion
export { isNode as A, minWidth as C, camel as D, VAR as E, probed as M, fail as O, merged as S, toDecls as T, chainDecl as _, createTokens as a, hashClass as b, CSSTokenValue as c, token as d, CONTEXTS as f, carried as g, PSEUDOS as h, createGlobalTheme as i, node as j, failIn as k, isStyle as l, LAYER as m, addTheme as n, isDone as o, FUNCTIONS as p, check as r, tokensOf as s, DONE as t, style as u, checkVars as v, settled as w, isFallback as x, edge as y };
