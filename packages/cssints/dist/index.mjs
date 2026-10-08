import { C as addRuntime, D as covers, F as MacroError, I as MemberError, M as registry, O as relation, _ as standIn, c as byOrder, h as requireLayer, j as forgetKernels, k as Registry, o as addGlobal, s as addLayers, t as CV_CALL, y as addKernel } from "./instrument-QavwPakv.mjs";
import { createRequire } from "node:module";
import { checkDeclarationNow, checkQuery, checkSelector, checkValueNow, isDeclarationError } from "@cssints/css-grammar/check";
import { browsers, messageOf, supportOf } from "@cssints/css-grammar/support";
import { CSS, CSSColorValue, CSSImageValue, CSSStyleValue, CSSStyleValue as CSSStyleValue$1, CSSUnitValue } from "@cssints/css-grammar/values";
import { Cause, Effect, Exit, Formatter, Predicate, Result, Schema } from "effect";
import { createHash } from "node:crypto";
import { functions } from "@cssints/css-grammar/functions";
import { properties } from "@cssints/css-grammar/mdn";
import { relative } from "node:path";
import { DTCG_TYPES, TOKEN_TYPES, grammarOf } from "@cssints/css-grammar/token";
import { matches } from "@cssints/css-grammar/twin";
import { browserslistToTargets, transform } from "lightningcss";
import { checkSelectorNow } from "@cssints/css-grammar/selector";
//#region src/node.ts
const plain = (method) => {
	throw fail(`cssints: plain styles do not chain (.${method}); merge them with cn(...) or cx(...)`);
};
const node = (decls, { markers, kernels, globals, themes, layers, plugs } = {}, chain = (name) => plain(name)) => new Proxy({
	__cssints: decls,
	markers,
	kernels,
	globals,
	themes,
	layers,
	plugs
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
	const { properties, defs, warned, warnings } = registry;
	for (const [, name] of text.matchAll(RAW_VAR)) {
		if (name.startsWith("--_") || !properties.has(name)) continue;
		const path = defs.get(name)?.path;
		const key = `var ${where} ${name}`;
		if (warned.has(key)) continue;
		warned.add(key);
		warnings.push(`${where}: "var(${name})" is the token ${path === name ? `declared as ${name}` : path}: pass the token itself, and css.var(token, fallback) for a fallback`);
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
//#region src/lowered.ts
const first = (css) => /^[^{]*\{([^;}]*)/.exec(css)?.[1];
const lower = (prop, value, lacking, feature) => {
	const code = Buffer.from(prop.startsWith("--") ? `:root{${prop}:${value}}` : `x{${prop}:${value}}`);
	const out = first(transform({
		filename: "x.css",
		code,
		minify: true,
		targets: browserslistToTargets(lacking)
	}).code.toString());
	const holds = new RegExp(`(?<![\\w-])${feature.replace(/\(\)$/, "")}(?![\\w-])`);
	return out !== void 0 && holds.test(`${prop}:${value}`) && !holds.test(out) ? out.slice(out.indexOf(":") + 1) : void 0;
};
const fallbackOf = (prop, value, w) => {
	const key = `${prop}\0${value}\0${w.feature}\0${w.lacking.join()}`;
	let hit = registry.lowered.get(key);
	if (hit === void 0) {
		hit = Result.getOrElse(Result.try(() => lower(prop, value, w.lacking, w.feature)), () => void 0) ?? false;
		registry.lowered.set(key, hit);
	}
	return hit || void 0;
};
const loweredOf = (prop, value, w) => fallbackOf(prop, value, w) !== void 0;
//#endregion
//#region src/token.ts
var CSSTokenValue = class extends CSSStyleValue$1 {
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
	const { warned, warnings } = registry;
	const ws = supportOf(prop, text).filter((w) => w.feature !== prop);
	const lacking = [...new Set(ws.flatMap((w) => w.lacking))];
	const lowered = ws.map((w) => variable && fallbackOf(variable, text, {
		...w,
		lacking
	}));
	if (ws.length && lowered.every(Boolean)) return lowered[0] || void 0;
	for (const [i, w] of ws.entries()) {
		const k = `${who} ${w.key}`;
		if (warned.has(k) || lowered[i]) continue;
		warned.add(k);
		warnings.push(`${who}: "${w.feature}" in "${text}" is not supported by ${browsers(w.lacking)} (${w.key})`);
	}
});
const checkSyntax = (what, syntax, text) => {
	edge(checkSyntaxFx(what, syntax, text));
};
const NAME$2 = /^(?:--)?([A-Za-z_][\w-]*)$/;
const nameOf = (name) => {
	const { var: v, inherit = true } = typeof name === "string" ? { var: name } : name;
	const m = typeof v === "string" ? NAME$2.exec(v) : null;
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
//#region src/functions.ts
var CSSFunctionValue = class extends CSSStyleValue$1 {
	value;
	constructor(value) {
		super();
		this.value = value;
	}
	toString() {
		return this.value;
	}
};
const MATH = "<number> | <length-percentage> | <angle-percentage> | <time> | <resolution>";
const OPERATORS = /* @__PURE__ */ new Set([
	"+",
	"-",
	"*",
	"/"
]);
const isGroup = (p) => Array.isArray(p);
const build = (member, name) => {
	const { sep, math } = functions[name];
	const grammar = math ? MATH : `<${name}()>`;
	return (...parts) => {
		const atom = (p) => {
			if (typeof p === "string") checkVars(`${member}()`, p);
			else if (typeof p !== "number" && !(p instanceof CSSStyleValue$1)) throw fail(`cssints: ${member}() takes strings, numbers and Typed OM values (tokens, other calls), got ${Formatter.formatJson(p)}`);
			return String(p);
		};
		const texts = parts.map((p, i) => isGroup(p) ? p.map(atom).join(" ") : name === "var" && !i && p instanceof CSSTokenValue ? p.name : atom(p));
		const value = `${name}(${texts.reduce((acc, t, i) => i ? `${acc}${OPERATORS.has(t) || OPERATORS.has(texts[i - 1]) ? " " : sep}${t}` : t, "")})`;
		const first = parts[0];
		if (name === "var") {
			if (!registry.properties.has(texts[0] ?? "")) throw fail(`cssints: var() takes a token and an optional fallback, got ${Formatter.formatJson(texts[0])}`);
			if (first instanceof CSSTokenValue && texts.length > 1) checkText(`var(${first.name}) fallback`, `<${first.syntax}>`, texts.slice(1).join(sep));
		} else checkText(`${name}()`, grammar, value);
		return new CSSFunctionValue(value);
	};
};
const checkText = (label, grammar, text) => {
	for (const v of probed(text, registry.properties)) try {
		checkValueNow(label, grammar, v);
	} catch (e) {
		if (!isDeclarationError(e)) throw e;
		throw new MacroError({
			message: `${e.message.replace(`, expected ${MATH}`, "")}${v === text ? "" : ` ("${text}" is checked as "${v}": a token stands for a value of its type)`}`,
			cause: e,
			...registry.at
		});
	}
};
/** The members of `css` that are functions, by name. */
const fns = Object.fromEntries(Object.entries(FUNCTIONS).map(([member, name]) => [member, build(member, name)]));
//#endregion
//#region src/scope-engine.ts
const NAME$1 = /^[a-z][a-z0-9-]*$/;
const KEY = /^[A-Za-z][\w-]*$/;
const RESERVED = /* @__PURE__ */ new Set(["cssints", "derived"]);
const OWN_VAR = /--_([\w-]*)/g;
const MARKER = /&\(([\w.-]+)\)|&/g;
const isScope = (v) => !!v && typeof v === "object" && typeof v["~scope"] === "string";
const isRecord = (v) => !!v && typeof v === "object" && !isTyped(v);
const isTyped = (v) => !!v && typeof v === "object" && v["~arg"] === 1;
const strip = (k) => k.startsWith("#") ? k.slice(1) : k;
const isPrivate = (k) => k.startsWith("#");
const has = (v, k) => !!v && typeof v === "object" && Object.hasOwn(v, k);
const kindOf = (k, v) => {
	if (typeof v === "string") return k.startsWith("-") ? "prop" : "alias";
	if (isScope(v)) return "module";
	if (has(v, "chain")) return "chain";
	if (has(v, "args") && has(v, "value")) return "value";
	if (has(v, "args")) return "call";
	if (has(v, "tokens")) return "tokens";
	if (has(v, "polyfills")) return "runtime";
	if (has(v, "props")) return "conflicts";
	if (has(v, "rule")) return "global";
	if (has(v, "layers")) return "layers";
	if (has(v, "css")) return "kernel";
	return "?";
};
const expand = (g, a, depth = 0) => depth > 5 || !g.includes("<") ? g : g.replace(/<([^>]*)>/g, (m, n) => Object.hasOwn(a, n) ? `[ ${expand(a[n], a, depth + 1)} ]` : m);
const tokenSyntaxes = (tokens, prefix, out) => {
	if (tokens && typeof tokens === "object") for (const [k, v] of Object.entries(tokens)) if (v && typeof v === "object" && typeof v["syntax"] === "string") out[`${prefix}${k}`] = grammarOf(v["syntax"]);
	else tokenSyntaxes(v, `${prefix}${k}.`, out);
	return out;
};
const canon = (v) => {
	if (typeof v === "function") return v.toString();
	if (v instanceof RegExp) return String(v);
	if (isScope(v)) return `scope(${v.name},${canon(v["~text"])})`;
	if (Array.isArray(v)) return `[${v.map(canon).join(",")}]`;
	if (v && typeof v === "object") {
		const json = v.toJSON;
		if (typeof json === "function") return canon(json.call(v));
		return `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}:${canon(x)}`).join(",")}}`;
	}
	return JSON.stringify(v) ?? "undefined";
};
const check$1 = (plugin, label, grammar, value) => {
	for (const v of probed(value, registry.properties)) Result.getOrThrowWith(Result.try({
		try: () => checkValueNow(label, grammar, v),
		catch: (e) => isDeclarationError(e) ? failIn(plugin, e.message) : e
	}), (e) => e);
};
const valueOf = (plugin, label, args, spacing = false) => {
	if (!args.length) throw failIn(plugin, `cssints: ${label}() expects a value`);
	if (args.some(isNode)) throw failIn(plugin, `cssints: ${label}() takes values, not styles; merge styles with cn(...) or cx(...)`);
	const [only] = args;
	return spacing && args.length === 1 && typeof only === "number" ? `${only * .25}rem` : args.join(" ");
};
const ran = (plugin, run) => Result.getOrThrowWith(Result.try({
	try: run,
	catch: (e) => e instanceof MemberError ? e : failIn(plugin, e instanceof Error ? e.message : String(e))
}), (e) => e);
const thrown = (name, message) => failIn(name, `cssints: ${message}`);
var Compiler = class {
	name;
	table;
	impl;
	compiled;
	carries = /* @__PURE__ */ new Map();
	kernels = /* @__PURE__ */ new Map();
	derived = /* @__PURE__ */ new Map();
	atRules = /* @__PURE__ */ new Map();
	constructor(s, compiled) {
		this.name = s.name;
		this.table = s.table;
		this.impl = s.impl;
		this.compiled = compiled;
	}
	own = (s) => s.includes("--_") ? s.replace(OWN_VAR, (_, n) => `--${this.name}-${n}`) : s;
	grammar = (g) => expand(g, this.compiled.aliases);
	find(path) {
		const dot = path.indexOf(".");
		if (dot < 0) return [this, path];
		const mod = this.table[path.slice(0, dot)];
		if (!isScope(mod)) throw thrown(this.name, `${this.name}: ${path} is not an entry of this scope`);
		return compile(mod).find(path.slice(dot + 1));
	}
	entry(key) {
		const k = Object.hasOwn(this.table, key) ? key : `#${key}`;
		const v = this.table[k];
		return [kindOf(k, v), v];
	}
	marker = (path) => {
		const [s, key] = this.find(path);
		return `_${s.name}-${key}`;
	};
	mark = (css, own) => css.includes("&") ? css.replace(MARKER, (_, path) => `.${path ? this.marker(path) : own}`) : css;
	kernel(key) {
		let k = this.kernels.get(key);
		if (k) return k;
		const [, def] = this.entry(key);
		const d = def;
		const marker = this.marker(key);
		let css = d.css;
		if (typeof d.css === "function") {
			const lib = registry.lib;
			if (!lib) throw thrown(this.name, `${this.name}.${key}: the css library is not loaded`);
			const made = ran(this.name, () => d.css(lib.css));
			const nodes = Array.isArray(made) ? made : [made];
			const merged = lib.css["cn"](...nodes);
			const built = lib.kernelOf(`${this.name}.${key}`, merged, marker);
			css = built.css;
			if (built.kernels) this.atRules.set(key, built.kernels);
			this.derived.set(key, {
				props: Object.keys(properties).filter((p) => built.props.some((k) => relation(p, k) !== "apart")),
				message: `kernel ${key} sets ${built.props.join(", ")}`
			});
		}
		k = {
			key: `${this.name}.${key}`,
			css: this.own(this.mark(css, marker)),
			atProperty: d.atProperty && this.own(d.atProperty),
			requires: d.requires
		};
		this.kernels.set(key, k);
		return k;
	}
	carry(uses) {
		const id = uses.join(",");
		let c = this.carries.get(id);
		if (c) return c;
		c = {};
		const kinds = uses.map((u) => {
			const [s, key] = this.find(u);
			return [
				u,
				s,
				key,
				...s.entry(key)
			];
		});
		const first = kinds.find((k) => k[3] === "kernel");
		const explicit = kinds.some((k) => k[3] === "conflicts");
		for (const [u, s, key, kind, def] of kinds) if (kind === "kernel") {
			const k = s.kernel(key);
			(c.kernels ??= []).push(...s.atRules.get(key) ?? [], k);
			(c.markers ??= []).push([s.marker(key), k.key]);
			const conflicts = explicit ? void 0 : s.derived.get(key);
			if (conflicts) (c.plugs ??= []).push({
				name: k.key,
				label: s.name,
				marker: s.marker(key),
				conflicts
			});
		} else if (kind === "global") {
			const g = def;
			(c.globals ??= []).push({
				css: s.own(g.rule),
				layer: g.layer
			});
		} else if (kind === "layers") {
			const l = def;
			(c.layers ??= []).push({
				names: l.layers,
				before: l.before
			});
		} else if (kind === "runtime" || kind === "conflicts") {
			const r = def;
			if (!first && kind === "runtime" && (r.parentVars?.length || r.css?.includes("&"))) throw thrown(this.name, `${this.name}: ${u} uses & but no kernel goes with it in uses`);
			const own = first ? first[1].marker(first[2]) : "";
			const plug = {
				name: `${s.name}.${key}`,
				label: s.name,
				marker: own
			};
			if (kind === "conflicts") plug.conflicts = def;
			else plug.runtime = {
				polyfills: r.polyfills,
				parentVars: r.parentVars?.map((p) => ({
					marker: own,
					read: s.own(p.read),
					write: s.own(p.write),
					watch: p.watch && s.own(p.watch)
				})),
				css: r.css && s.own(s.mark(r.css, own))
			};
			(c.plugs ??= []).push(plug);
		}
		this.carries.set(id, c);
		return c;
	}
};
const hashOf = (text) => {
	let a = 5381;
	let b = 52711;
	for (let i = 0; i < text.length; i++) {
		const c = text.charCodeAt(i);
		a = Math.imul(a ^ c, 2654435761);
		b = Math.imul(b ^ c, 1597334677);
	}
	return (a >>> 0).toString(36) + (b >>> 0).toString(36);
};
const register = (s) => {
	if (s["~hash"]) return s["~hash"];
	const table = s.table;
	for (const v of Object.values(table)) if (isScope(v)) register(v);
	const text = canon([table, s.impl]);
	const hash = hashOf(text);
	s["~text"] = text;
	s["~hash"] = hash;
	const old = registry.scopes.get(s.name);
	if (old && old !== hash) {
		const prefix = `${s.name}.`;
		const users = /* @__PURE__ */ new Set();
		for (const [key, e] of registry.kernels) if (key.startsWith(prefix)) e.users.forEach((u) => users.add(u));
		for (const [name, e] of registry.runtimes) if (name.startsWith(prefix)) e.users.forEach((u) => users.add(u));
		if (users.size) throw thrown(s.name, `scope "${s.name}" is defined twice with different content (${old}, now ${hash}) while ${[...users].join(", ")} still uses the old one: pick another name`);
	}
	registry.scopes.set(s.name, hash);
	return hash;
};
const compiled = /* @__PURE__ */ new WeakMap();
const compile = (s) => {
	const hit = compiled.get(s);
	if (hit) return hit;
	const own = {};
	const mods = {};
	for (const [k, v] of Object.entries(s.table)) {
		const kind = kindOf(k, v);
		if (kind === "alias") own[strip(k)] = v;
		else if (kind === "tokens") Object.assign(mods, tokenSyntaxes(v.tokens, `${k}.`, {}));
		else if (isScope(v)) for (const [n, g] of Object.entries(compile(v).compiled.exposed)) mods[`${k}.${n}`] = g;
	}
	const aliases = {
		...own,
		...mods
	};
	const exposed = {};
	for (const k of Object.keys(s.table)) if (!isPrivate(k) && kindOf(k, s.table[k]) === "alias") exposed[k] = expand(s.table[k], aliases);
	const c = new Compiler(s, {
		aliases,
		exposed
	});
	compiled.set(s, c);
	return c;
};
const member$1 = (c, key, kind, def) => {
	const name = c.name;
	const d = def;
	if (kind === "prop") {
		if (Object.hasOwn(properties, key)) throw thrown(name, `${key} is a CSS property already, with its own grammar`);
		const grammar = c.grammar(d);
		return (...args) => {
			const value = valueOf(name, key, args);
			check$1(name, key, grammar, value);
			registry.userProps.add(key);
			return node([[key, value]]);
		};
	}
	if (kind === "value") {
		const def = d;
		const { args: spec, label = key } = def;
		return (...args) => {
			const given = argsOf(c, label, spec, args);
			const out = ran(name, () => def.value(typeof spec === "string" ? args.map(String) : given));
			if (typeof out !== "string" && !(out instanceof CSSStyleValue$1)) throw thrown(name, `${label}() value must return a string or a Typed OM value`);
			return out;
		};
	}
	if (kind === "chain") return chainOf(c, key, d);
	return callOf(c, key, d);
};
const chainOf = (c, key, def) => {
	const { name } = c;
	const methods = def.chain;
	const grammars = /* @__PURE__ */ new Map();
	let base;
	const next = (used) => (m, args, self) => {
		const meth = Object.hasOwn(methods, m) ? methods[m] : void 0;
		if (!meth) throw failIn(name, `cssints: ${key}() has no .${m}(); it chains ${Object.keys(methods).filter((k) => !used.has(k)).join(", ")}`);
		const by = used.get(m);
		if (by === m) throw failIn(name, `cssints: ${key}().${m}() is used twice`);
		if (by) throw failIn(name, `cssints: ${key}().${m}() cannot go with .${by}()`);
		let value = "";
		if (meth.args === "") {
			if (args.length) throw failIn(name, `cssints: ${key}().${m}() takes no value`);
		} else {
			value = valueOf(name, `${key}.${m}`, args, meth.spacing);
			let g = grammars.get(m);
			if (g === void 0) grammars.set(m, g = c.grammar(meth.args));
			check$1(name, `${key}.${m}`, g, value);
		}
		const taken = new Map(used).set(m, m);
		for (const x of meth.excludes ?? []) taken.set(x, m);
		return node([...self.__cssints, ...ownDecls(c, meth.emit(value))], self, next(taken));
	};
	return () => node([], base ??= def.uses ? c.carry(def.uses) : {}, next(/* @__PURE__ */ new Map()));
};
const ownDecls = (c, emitted) => emitted.map(([p, v]) => [c.own(p), c.own(v)]);
const argOf = (c, label, def, v, tokens) => {
	const { name } = c;
	if (def === "$tokens") {
		if (!v || typeof v !== "object" || isNode(v) || v instanceof CSSStyleValue$1) throw failIn(name, `cssints: ${label} expects a token set (createTokens)`);
		return v;
	}
	if (def === "$overrides") {
		if (!tokens || !v || typeof v !== "object" || Array.isArray(v)) throw failIn(name, `cssints: ${label} expects an object of values by token path`);
		return v;
	}
	if (def === "$selector") {
		if (typeof v !== "string") throw failIn(name, `cssints: ${label} expects a selector`);
		Result.getOrThrowWith(Result.try({
			try: () => checkSelectorNow(v),
			catch: (e) => isDeclarationError(e) ? failIn(name, `cssints: ${label}: ${e.message}`) : e
		}), (e) => e);
		return v;
	}
	if (typeof def === "string") {
		const value = valueOf(name, label, [v]);
		check$1(name, label, c.grammar(def), value);
		return value;
	}
	if (isTyped(def)) return v;
	if (!v || typeof v !== "object" || Array.isArray(v)) throw failIn(name, `cssints: ${label} expects an object`);
	const out = {};
	const rec = def;
	for (const [k, leaf] of Object.entries(rec)) {
		const optional = k.endsWith("?");
		const field = optional ? k.slice(0, -1) : k;
		const x = v[field];
		if (x === void 0) {
			if (!optional) throw failIn(name, `cssints: ${label}: ${field} is missing`);
			continue;
		}
		out[field] = argOf(c, `${label}.${field}`, leaf, x);
	}
	for (const k of Object.keys(v)) if (!(k in out) && !(k in rec) && !(`${k}?` in rec)) throw failIn(name, `cssints: ${label}: no argument ${k}`);
	return out;
};
const argsOf = (c, label, spec, args) => {
	const { name } = c;
	if (typeof spec === "string") {
		const value = valueOf(name, label, args);
		check$1(name, label, c.grammar(spec), value);
		return [value];
	}
	if (isTyped(spec)) return args;
	const list = spec;
	if (args.length > list.length) throw failIn(name, `cssints: ${label}() takes at most ${list.length} arguments`);
	let tokens;
	return list.map((d, i) => {
		const v = argOf(c, `${label}(${i + 1})`, d, args[i] ?? (isRecord(d) ? {} : void 0), tokens);
		if (d === "$tokens") tokens = v;
		return v;
	});
};
const callOf = (c, key, def) => {
	const { name } = c;
	const build = c.impl?.[key];
	if (!build) throw thrown(name, `${name}.${key} has no function in build()`);
	const spec = def.args;
	const uses = def.uses ?? [];
	let base;
	return (...args) => {
		const given = argsOf(c, key, spec, args);
		const made = ran(name, () => build(...given));
		const carry = made.uses ? c.carry([...uses, ...made.uses]) : base ??= c.carry(uses);
		return node(made.decls ? ownDecls(c, made.decls) : [], {
			...carry,
			globals: made.globals ? [...carry.globals ?? [], ...made.globals] : carry.globals,
			themes: made.themes,
			layers: made.layers ? [...carry.layers ?? [], has(made.layers, "layers") ? {
				names: made.layers.layers,
				before: made.layers.before
			} : { names: made.layers }] : carry.layers
		});
	};
};
const exportOf = (s) => {
	const c = compile(s);
	register(s);
	const calls = Object.keys(s.table).filter((k) => kindOf(k, s.table[k]) === "call");
	if (calls.length && !s.impl) throw thrown(s.name, `${s.name}: call .build({ ${calls.join(", ")} }) before .export()`);
	const out = {};
	for (const [k, v] of Object.entries(s.table)) {
		if (isPrivate(k)) continue;
		const kind = kindOf(k, v);
		if (isScope(v)) out[k] = exportOf(v);
		else if (kind === "prop") out[camel(k.slice(1))] = member$1(c, k, kind, v);
		else if (kind === "chain" || kind === "call" || kind === "value") out[k] = member$1(c, k, kind, v);
	}
	return out;
};
function scope(name, table) {
	if (!NAME$1.test(name) || RESERVED.has(name)) throw thrown(name, RESERVED.has(name) ? `scope "${name}" is reserved by the engine` : `scope(${JSON.stringify(name)}): a name is lowercase letters, digits and -, and starts with a letter`);
	for (const k of Object.keys(table)) {
		if (!KEY.test(strip(k)) && !k.startsWith("-")) throw thrown(name, `${name}: the entry ${JSON.stringify(k)} is not a name`);
		if (isPrivate(k) && Object.hasOwn(table, strip(k))) throw thrown(name, `${name}: ${k} and ${strip(k)} share a name: rename one`);
	}
	const s = {
		name,
		table,
		"~scope": name,
		"~table": table,
		build(impl) {
			const keys = Object.keys(table).filter((k) => kindOf(k, table[k]) === "call");
			if (Object.keys(impl).filter((k) => !keys.includes(k)).length || keys.some((k) => !Object.hasOwn(impl, k))) throw thrown(name, `${name}: build() takes a function for each call member: ${keys.join(", ")}`);
			s.impl = impl;
			return s;
		},
		export: () => exportOf(s)
	};
	return s;
}
/** What the front (scope.ts) calls; macro.ts puts it in the registry. */
const engine = { scope };
//#endregion
//#region src/runtime.ts
const cx = (...a) => a.flat(Infinity).filter(Boolean).join(" ");
function _cv(config) {
	return (props = {}) => {
		const out = [config.base];
		const gone = [];
		const val = {};
		const take = (c, d) => {
			if (c) out.push(c);
			if (c && d) gone.push(...d.split(" "));
		};
		for (const name in config.variants) {
			const v = val[name] = String(props[name] ?? config.defaultVariants[name]);
			take(config.variants[name][v], config.drops?.[name]?.[v]);
		}
		for (const m of config.compound ?? []) if (Object.keys(m.when).every((k) => val[k] === m.when[k])) take(m.class, m.drops);
		return out.join(" ").split(" ").filter((c) => c && !gone.includes(c)).join(" ");
	};
}
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
const collect = Effect.fnUntraced(function* (node, path, type, out) {
	const here = path.join(".") || "the root";
	const own = node["$type"];
	if (own !== void 0 && typeof own !== "string") return yield* fail(`cssints: createTokens(): $type of ${here} is a string, got ${Formatter.formatJson(own)}`);
	const inherited = own ?? type;
	for (const [key, child] of Object.entries(node)) {
		if (key === "$type" || key === "$value" || IGNORED.has(key)) continue;
		if (key.startsWith("$")) return yield* fail(`cssints: createTokens(): ${key} of ${here} is not supported (${[
			"$root",
			"$extends",
			"$ref"
		].join(", ")} are not, $description, $extensions and $deprecated are ignored)`);
		if (/[{}.]/.test(key)) return yield* fail(`cssints: createTokens(): the name "${key}" in ${here} has a { } or . (DTCG names cannot)`);
		const at = [...path, key];
		if (!Predicate.isObject(child)) return yield* fail(`cssints: createTokens(): ${at.join(".")} is a group or a token ({ $value }), got ${Formatter.formatJson(child)}`);
		if (Object.hasOwn(child, "$value")) {
			const stray = Object.keys(child).filter((k) => !k.startsWith("$"));
			if (stray.length) return yield* fail(`cssints: createTokens(): ${at.join(".")} has a $value and so is a token; it cannot hold ${stray.join(", ")}`);
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
		if (leaf.type !== void 0 && !Object.hasOwn(DTCG_TYPES, leaf.type)) return yield* fail(`cssints: createTokens(): ${leaf.dotted} has $type "${leaf.type}", which has no token type (no @property syntax); supported: ${SUPPORTED}`);
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
		for (const [key, v] of Object.entries(values)) {
			const child = Object.hasOwn(node, key) ? node[key] : void 0;
			const dotted = [...path, key].join(".");
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
//#region src/macro.ts
const flexChain = (ctx) => (name, args, self) => node([...self.__cssints, chainDecl(ctx, name, args)], self, flexChain(ctx));
const member = (k) => (...args) => CONTEXTS[k] && !args.length ? node(toDecls(k, args), {}, flexChain(k)) : node(toDecls(k, args), { kernels: kernelsOf(args) });
const firstThatWorks = (...values) => {
	if (values.length < 2) throw fail("cssints: firstThatWorks() takes at least two values: the one you want, then what to use where it fails");
	for (const v of values) {
		if (v instanceof CSSAtRuleValue) throw fail(`cssints: firstThatWorks() cannot hold ${v.name}: a keyframes() or positionTry() name carries its at-rule, which a fallback would drop`);
		if ((typeof v !== "string" || !v.trim()) && !(v instanceof CSSStyleValue)) throw fail(`cssints: firstThatWorks() takes non-empty strings and Typed OM values (tokens), got ${Formatter.formatJson(v)}`);
	}
	return { __fallback: values.map((v) => String(v).trim()) };
};
var CSSAtRuleValue = class extends CSSStyleValue {
	kernel;
	name;
	constructor(name, kernel) {
		super();
		this.name = name;
		this.kernel = kernel;
	}
	toString() {
		return this.name;
	}
};
const kernelsOf = (args) => {
	let out;
	for (const a of args) if (a instanceof CSSAtRuleValue) (out ??= []).push(a.kernel);
	return out;
};
const POSITION_TRY = /^(?:top|right|bottom|left|inset(?:-(?:block|inline)(?:-(?:start|end))?)?|margin(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|(?:min-|max-)?(?:width|height|block-size|inline-size)|align-self|justify-self|place-self|position-anchor|position-area)$/;
const STEP = /^(?:from|to|\d+(?:\.\d+)?%)$/;
const blockOf = (what, style, allowed) => {
	if (!isNode(style)) throw fail(`cssints: ${what} takes css.* declarations (a member call or cn(...)), got ${Formatter.formatJson(style)}`);
	return declsOf(what, style, false, allowed).map(([prop, value]) => `${prop}:${value}`).join(";");
};
const declsOf = (what, style, conditions, allowed) => {
	if (!style.__cssints.length) throw fail(`cssints: ${what} takes css.* declarations (a member call or cn(...)), got ${Formatter.formatJson(style)}`);
	if (style.markers || style.plugs || style.kernels && !(conditions && style.kernels.every((k) => k.key.startsWith("@")))) throw fail(`cssints: ${what} takes plain declarations: no marker class or kernel of a member`);
	for (const d of style.__cssints) {
		const [prop, , conds, fallbacks] = d;
		if (!conditions && conds?.length || fallbacks) throw fail(`cssints: ${what} takes declarations without ${conditions ? "" : "conditions or "}firstThatWorks(...), got ${prop}`);
		if (allowed && !allowed.test(prop)) throw fail(`cssints: ${what}: ${prop} is not allowed in @position-try, which takes inset, margin, sizing and self-alignment properties, position-anchor and position-area`);
		Result.getOrThrowWith(Result.try({
			try: () => checkNow(d, true, registry),
			catch: (e) => isDeclarationError(e) ? new MacroError({
				message: `cssints: ${what}: ${e.message}`,
				cause: e,
				...registry.at
			}) : e
		}), (e) => e);
	}
	return style.__cssints;
};
const atRule = (rule, prefix, body) => {
	const name = `${prefix}${createHash("sha1").update(body).digest("hex").slice(0, 8)}`;
	return new CSSAtRuleValue(name, {
		key: `@${rule} ${name}`,
		css: `@${rule} ${name}{${body}}`,
		requires: [`css.at-rules.${rule}`]
	});
};
const keyframes = (steps) => {
	const entries = Predicate.isObjectOrArray(steps) ? Object.entries(steps) : [];
	if (!entries.length) throw fail("cssints: keyframes() takes { from: style, to: style }: the steps are css.* styles");
	const body = entries.map(([step, style]) => {
		if (!STEP.test(step) || parseFloat(step) > 100) throw fail(`cssints: keyframes() step "${step}" is not from, to or a percentage from 0% to 100%`);
		return `${step}{${blockOf(`keyframes() "${step}"`, style)}}`;
	});
	return atRule("keyframes", "kf-", body.join(""));
};
const positionTryProp = member("positionTry");
const positionTry = (...args) => args.length === 1 && isNode(args[0]) ? atRule("position-try", "--pt-", blockOf("positionTry()", args[0], POSITION_TRY)) : positionTryProp(...args);
const cn = (...args) => {
	const decls = toDecls("cn", args);
	return node(decls, carried(args));
};
const flex = member("flex");
const grid = member("grid");
const isWrapper = (v) => typeof v === "function" && Predicate.hasProperty(v, "__cond");
const wrapper = (cond) => Object.assign((...styles) => {
	if (!styles.length || !styles.every(isNode)) throw fail(`cssints: ${cond.text} wraps css.* styles, got ${Formatter.formatJson(styles.filter((s) => !isNode(s)))}`);
	return node(merged(styles.flatMap((n) => n.__cssints.map(([p, v, inner = [], fallbacks]) => {
		if (inner.length >= 4) throw fail(`cssints: a style takes at most 4 conditions (layers ${LAYER[0]} to ${LAYER[4]}); this one has ${inner.length + 1}: ${[cond, ...inner].map((c) => c.text).join(" > ")}`);
		return [
			p,
			v,
			[cond, ...inner],
			fallbacks
		];
	}))), carried(styles));
}, {
	__cond: true,
	cond
});
const query = (kind, q) => {
	if (typeof q !== "string") throw fail(`cssints: ${kind}() takes a query string, got ${Formatter.formatJson(q)}`);
	const exit = Effect.runSyncExit(checkQuery(kind, q));
	if (Exit.isFailure(exit)) {
		const e = Cause.squash(exit.cause);
		throw new MacroError({
			message: e.message,
			cause: e,
			...registry.at
		});
	}
	const text = q.trim();
	return wrapper({
		text: `@${kind} ${text}`,
		rank: kind === "supports" ? 0 : minWidth(text)
	});
};
const condition = (kind) => (...args) => {
	const [only] = args;
	if (!args.length) throw fail(`cssints: ${kind}() expects a query string`);
	if (args.length > 1) return args.map((q) => query(kind, q));
	if (Predicate.isObject(only)) return Object.fromEntries(Object.entries(only).map(([k, q]) => [k, query(kind, q)]));
	return query(kind, only);
};
const NAME = /^-?[A-Za-z_][\w-]*$/;
const OPS = [
	"=",
	"~=",
	"|=",
	"^=",
	"$=",
	"*="
];
const attr = (...args) => {
	const [name, value, given] = args;
	const op = typeof given === "string" ? given : "=";
	if (args.length > 3 || typeof name !== "string" || !NAME.test(name) || value !== void 0 && typeof value !== "string" || !OPS.includes(op) || given !== void 0 && (typeof given !== "string" || value === void 0)) throw fail(`cssints: attr(name, value?, op?) takes an attribute name, then a string value and one of ${OPS.join(" ")}, got ${Formatter.formatJson(args)}`);
	const quoted = value?.replace(/["\\]/g, "\\$&").replace(/\n/g, "\\a ");
	return wrapper({
		text: `[${name}${quoted === void 0 ? "" : `${op}"${quoted}"`}]`,
		rank: 1e3
	});
};
const markerOf = (what, name) => {
	if (name !== void 0 && (typeof name !== "string" || !NAME.test(name))) throw fail(`cssints: ${what} takes a name such as "row", got ${Formatter.formatJson(name)}`);
	return name === void 0 ? "_g" : `_g-${name}`;
};
const group = (name) => node([], { markers: [[markerOf("group()", name), "group"]] });
const within = (state, name) => {
	if (!isWrapper(state) || state.cond.ancestor || !/^[:[]/.test(state.cond.text)) throw fail("cssints: within() takes a pseudo-class wrapper (hover) or attr(...), then the name of the group");
	return wrapper({
		text: `:where(.${markerOf("within()", name)}${state.cond.text})`,
		rank: state.cond.rank - 2e3,
		ancestor: true
	});
};
const nest = (...args) => {
	const [selector] = args;
	if (typeof selector !== "string" || !/^&\s*[>+~\s]/.test(selector)) throw fail(`cssints: nest() takes a selector that starts with & and a combinator ("& > *", "& > * + *", "& p"), got ${Formatter.formatJson(selector)}`);
	const text = selector.trim().replace(/\s+/g, " ");
	const exit = Effect.runSyncExit(checkSelector(`._${text.slice(1)}`));
	if (Exit.isFailure(exit)) {
		const e = Cause.squash(exit.cause);
		throw new MacroError({
			message: `cssints: nest(): ${e.message}`,
			cause: e,
			...registry.at
		});
	}
	return wrapper({
		text,
		rank: 3e3,
		nest: true
	});
};
const vars = (...args) => {
	const [set] = args;
	const entries = Predicate.isObject(set) ? Object.entries(set) : [];
	const bad = entries.find(([k, v]) => !/^--[\w-]+$/.test(k) || !(typeof v === "string" || typeof v === "number" || v instanceof CSSStyleValue));
	if (!entries.length || bad) throw fail(`cssints: vars() takes { "--_name": value }, values strings, numbers or Typed OM values, got ${Formatter.formatJson(bad ?? set)}`);
	const decls = entries.map(([k, v]) => [k, String(v)]);
	return node(decls, { kernels: kernelsOf(entries.map(([, v]) => v)) });
};
const globalRule = (selector, ...styles) => {
	const at = registry.at;
	if (!at || typeof selector !== "string") throw fail("cssints: global(selector, ...styles) takes a selector string and css.* styles");
	const exit = Effect.runSyncExit(checkSelector(selector));
	if (Exit.isFailure(exit)) {
		const e = Cause.squash(exit.cause);
		throw new MacroError({
			message: `cssints: global(): ${e.message}`,
			cause: e,
			...at
		});
	}
	if (!styles.length || !styles.every(isNode)) throw fail(`cssints: global() takes css.* styles after the selector, got ${Formatter.formatJson(styles.filter((s) => !isNode(s)))}`);
	if (styles.some((s) => s.markers || s.kernels || s.plugs)) throw fail("cssints: global() takes plain declarations: no marker class or kernel of a member");
	const blocks = /* @__PURE__ */ new Map();
	for (const d of merged(styles.flatMap((s) => s.__cssints))) {
		const [prop, value, conds = [], fallbacks] = d;
		const state = conds.find((c) => !c.text.startsWith("@"));
		if (state) throw fail(`cssints: global() takes media(), container() and supports() conditions, not ${state.text}: write the state in the selector`);
		Result.getOrThrowWith(Result.try({
			try: () => checkNow(d, true, registry),
			catch: (e) => isDeclarationError(e) ? located(at)(e) : e
		}), (e) => e);
		const key = conds.map((c) => c.text).join("{");
		const block = blocks.get(key) ?? blocks.set(key, {
			conds,
			body: []
		}).get(key);
		for (const v of fallbacks ? [...fallbacks.toReversed(), value] : [value]) block.body.push(`${prop}:${v}`);
	}
	const css = [...blocks.values()].map(({ conds, body }) => conds.toReversed().reduce((r, c) => `${c.text}{${r}}`, `${selector.trim()}{${body.join(";")}}`)).join("").replace(/[\t\n\r\f]/g, " ");
	const n = registry.tokens++;
	registry.themed.set(`${at.file}#${at.site}.${n}`, {
		file: at.file,
		key: `-:${at.file}#${String(at.site).padStart(6, "0")}.${n}`,
		css,
		names: []
	});
	return DONE;
};
const layersRule = (...args) => {
	const at = registry.at;
	const last = args.at(-1);
	const options = Predicate.isObject(last) ? last : void 0;
	const names = options ? args.slice(0, -1) : args;
	if (!at || !names.every((n) => typeof n === "string") || options && typeof options.before !== "boolean") throw fail("cssints: layers(...names, { before? }) takes the names of layers, strings, and at the end { before: true } or none");
	return edge(addLayers({
		names,
		before: options?.before === true
	}, at).pipe(Effect.as(DONE)));
};
const conditions = {
	media: condition("media"),
	container: condition("container"),
	supports: condition("supports"),
	attr,
	within,
	...Object.fromEntries(Object.entries(PSEUDOS).map(([n, c]) => [n, wrapper(c)]))
};
const isCv = (v) => Predicate.hasProperty(v, "__cv");
const located = (at) => (e) => (Predicate.isTagged(e, "MacroError") || Predicate.isTagged(e, "MemberError")) && e.file !== void 0 ? e : Predicate.isTagged(e, "MemberError") ? new MemberError({
	message: e.message,
	pluginName: e.pluginName,
	cause: e,
	...at
}) : new MacroError({
	message: e.message,
	cause: e,
	...at
});
const ruleOf = (cls, [prop, value, conds = [], fallbacks]) => {
	const wrap = [];
	const ranks = [];
	let before = "";
	const sel = [`.${cls}`];
	let width = 0;
	for (const c of conds) if (c.text.startsWith("@")) {
		wrap.push(c.text);
		width = Math.max(width, c.rank);
	} else {
		if (c.ancestor) before += `${c.text} `;
		else sel.push(c.nest ? c.text.slice(1) : c.text);
		ranks.push(c.rank);
	}
	const all = fallbacks ? `${value};${fallbacks.join(";")}` : value;
	const tokens = all.includes("var(--") ? [...all.matchAll(VAR)].map((m) => m[1]) : void 0;
	return {
		layer: LAYER[conds.length],
		cond: conds.length ? [width, ...ranks] : [],
		wrap,
		prop,
		css: `${before}${sel.join("")}{${fallbacks ? [...fallbacks.toReversed(), value].map((v) => `${prop}:${v}`).join(";") : `${prop}:${value}`}}`,
		tokens
	};
};
const kernelOf = (what, style, cls) => {
	const decls = declsOf(what, style, true);
	const blocks = [];
	const open = /* @__PURE__ */ new Map();
	for (const r of decls.map((d) => ({
		cls,
		...ruleOf(cls, d)
	})).sort(byOrder)) {
		const brace = r.css.indexOf("{");
		const selector = r.css.slice(0, brace);
		const body = r.css.slice(brace + 1, -1);
		const key = `${r.layer}|${r.cond.join()}|${r.wrap.join("{")}|${selector}`;
		const block = open.get(key);
		if (block) block.body.push(body);
		else {
			const b = {
				wrap: r.wrap,
				selector,
				body: [body]
			};
			blocks.push(b);
			open.set(key, b);
		}
	}
	return {
		css: blocks.map((b) => b.wrap.reduceRight((css, w) => `${w}{${css}}`, `${b.selector}{${b.body.join(";")}}`)).join(" "),
		props: [...new Set(decls.flatMap(([prop, , conds]) => prop.startsWith("--") || conds?.some((c) => c.nest) ? [] : [prop]))],
		kernels: style.kernels
	};
};
const checkValue = (prop, value, fresh, properties) => {
	let out = [];
	for (const v of probed(value, properties)) {
		const found = Result.getOrThrowWith(Result.try({
			try: () => checkDeclarationNow(prop, v, fresh),
			catch: (e) => {
				if (v !== value && isDeclarationError(e)) Object.assign(e, { message: `${e.message} ("${value}" is checked as "${v}": a token stands for a value of its type)` });
				return e;
			}
		}), (e) => e);
		out = out.length ? out.concat(found) : found;
	}
	return out;
};
const checkNow = ([prop, value, , fallbacks], fresh, { warnings, warned, properties, userProps }, sheet = true) => {
	if (userProps.has(prop)) return;
	let found = checkValue(prop, value, fresh, properties);
	if (fallbacks) {
		const lacking = [value, ...fallbacks].map((v, i) => new Set((i ? checkValue(prop, v, fresh, properties) : found).flatMap((w) => w.lacking)));
		found = found.map((w) => ({
			...w,
			lacking: w.lacking.filter((t) => lacking.every((s) => s.has(t)))
		})).filter((w) => w.lacking.length);
	}
	for (const w of found) {
		const k = `${prop} ${w.key}${fallbacks ? ` ${w.lacking.join()}` : ""}`;
		if (!warned.has(k) && !(sheet && loweredOf(prop, value, w))) {
			warned.add(k);
			warnings.push(messageOf(prop, value, w) + (fallbacks ? ", and no fallback of its firstThatWorks covers them" : ""));
		}
	}
};
const classesNow = (decls, registry, markers) => {
	const { rules } = registry;
	const out = markers ? [...new Set(markers.map((m) => m[0]))] : [];
	for (const d of decls) {
		const cls = hashClass(d);
		const fresh = !rules.has(cls);
		checkNow(d, fresh, registry);
		if (!out.includes(cls)) out.push(cls);
		if (fresh) rules.set(cls, ruleOf(cls, d));
	}
	return out.join(" ");
};
const conflictOf = ({ name, label = name, conflicts }, decls, at) => {
	const hit = conflicts && decls.find(([p]) => conflicts.props.some((c) => typeof c === "string" ? c === p : c.test(p)));
	return hit ? new MemberError({
		message: `cssints: ${label}: ${conflicts.message} (this style also sets ${hit[0]})`,
		pluginName: label,
		...at
	}) : void 0;
};
const classesOf = Effect.fnUntraced(function* ({ __cssints: decls, markers, kernels, globals, themes, layers, plugs }, at) {
	const registry = yield* Registry;
	if (kernels) {
		const runtimes = plugs?.flatMap((p) => p.runtime ? [p.runtime] : []);
		for (const k of kernels) yield* addKernel(k, markers ?? [], at, runtimes);
	}
	if (layers) for (const l of layers) yield* addLayers(l, at);
	if (globals) for (const g of globals) yield* addGlobal(g, at);
	if (themes && at) for (const t of themes) yield* addTheme(t, at);
	if (plugs) for (const plug of plugs) {
		const conflict = conflictOf(plug, decls, at);
		if (conflict) return yield* conflict;
		if (plug.runtime) yield* addRuntime(plug, at);
	}
	return yield* Effect.try({
		try: () => classesNow(decls, registry, markers),
		catch: (e) => {
			if (isDeclarationError(e)) return e;
			throw e;
		}
	});
});
const styleOf = Effect.fnUntraced(function* (s, where, at) {
	if (!isNode(s)) return yield* new MacroError({ message: `cssints: cv() ${where} must be a css.* value (cn(...), a flex() chain or one property), got ${Formatter.formatJson(s)}. CSS strings are gone: write cn(p(4), fontSize("1rem"))` });
	return yield* classesOf(s, at);
});
const cvOf = Effect.fnUntraced(function* (config, at) {
	const variants = {};
	const base = config.base === void 0 ? "" : yield* styleOf(config.base, "base", at);
	for (const [k, vs] of Object.entries(config.variants ?? {})) {
		const classes = {};
		for (const [n, s] of Object.entries(vs)) classes[n] = yield* styleOf(s, `variant ${k}.${n}`, at);
		variants[k] = classes;
	}
	const compound = [];
	const whens = [];
	for (const [i, { class: style, ...values }] of (config.compoundVariants ?? []).entries()) {
		const when = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)]));
		compound.push({
			when,
			class: yield* styleOf(style, `compoundVariants[${i}] class`, at)
		});
		whens.push({
			when,
			decls: style.__cssints
		});
	}
	const declsOf = (s) => s.__cssints;
	const { drops, compound: gone } = yield* Effect.try({
		try: () => settled(config.base === void 0 ? [] : declsOf(config.base), Object.fromEntries(Object.entries(config.variants ?? {}).map(([k, vs]) => [k, Object.fromEntries(Object.entries(vs).map(([n, s]) => [n, declsOf(s)]))])), whens),
		catch: (e) => {
			if (e instanceof MacroError) return e;
			throw e;
		}
	});
	return Formatter.formatJson({
		base,
		variants,
		defaultVariants: config.defaultVariants ?? {},
		...Object.keys(drops).length && { drops },
		...compound.length && { compound: compound.map((c, i) => gone[i] ? {
			...c,
			drops: gone[i]
		} : c) }
	});
});
const fromJson = Schema.decodeSync(Schema.fromJsonString(Schema.Unknown));
const cv = (config) => {
	const built = [];
	const build = () => {
		const exit = Effect.runSyncExit(cvOf(config));
		if (Exit.isFailure(exit)) throw Cause.squash(exit.cause);
		return _cv(fromJson(exit.value));
	};
	return Object.assign((props) => (built[0] ??= build())(props), { __cv: config });
};
const named = {
	cn,
	firstThatWorks,
	...fns,
	keyframes,
	positionTry,
	flex,
	grid,
	cv,
	group,
	global: globalRule,
	layers: layersRule,
	...conditions,
	token,
	style,
	createTokens,
	createGlobalTheme,
	check,
	CSS,
	CSSColorValue,
	CSSImageValue,
	CSSStyleValue,
	CSSUnitValue
};
const css = new Proxy(named, { get: (t, k) => Object.hasOwn(t, k) ? t[k] : member(String(k)) });
named.css = css;
const kernelCss = new Proxy({
	...named,
	nest,
	vars
}, { get: (t, k) => Object.hasOwn(t, k) ? t[k] : member(String(k)) });
registry.lib = {
	css: kernelCss,
	kernelOf
};
registry.engine = engine;
const inertOf = (v) => {
	if (isWrapper(v) || isFallback(v)) return "null";
	if (Array.isArray(v) && v.length && v.every(isWrapper)) return `[${v.map(() => "null").join(",")}]`;
	if (!Predicate.isObject(v)) return void 0;
	const entries = Object.entries(v);
	return entries.length && entries.every(([, w]) => isWrapper(w)) ? `{${entries.map(([k]) => `${Formatter.formatJson(k)}:null`).join(",")}}` : void 0;
};
const inlineOf = Effect.fnUntraced(function* ({ __style: { sets, decls } }) {
	const registry = yield* Registry;
	return yield* Effect.try({
		try: () => {
			for (const d of decls) checkNow(d, true, registry, false);
			return `{ ${[...new Map([...sets, ...decls.map(([p, v]) => [camel(p), v])])].map(([k, v]) => `${k.startsWith("--") ? Formatter.formatJson(k) : k}: ${Formatter.formatJson(v)}`).join(", ")} }`;
		},
		catch: (e) => {
			if (isDeclarationError(e)) return e;
			throw e;
		}
	});
});
const isPluginValue = Predicate.isObjectKeyword;
const replacementOf = Effect.fnUntraced(function* (at, value) {
	if (isNode(value)) return Formatter.formatJson(yield* classesOf(value, at));
	if (isCv(value)) return `${CV_CALL}${yield* cvOf(value.__cv, at)})`;
	if (isStyle(value)) return yield* inlineOf(value);
	const tokens = tokensOf(value);
	if (tokens !== void 0) return tokens;
	if (isDone(value)) return "undefined";
	if (value instanceof CSSStyleValue) return Formatter.formatJson(String(value));
	if (typeof value === "string") return Formatter.formatJson(value);
	const inert = inertOf(value);
	if (inert !== void 0) return inert;
	if (isPluginValue(value)) return void 0;
	return yield* new MacroError({ message: `cssints: site ${at.site} in ${at.file} did not produce a css.*, cv(), style(), condition or Typed OM value` });
});
const recordSite = Effect.fnUntraced(function* (at, value) {
	const { sites } = yield* Registry;
	const replacement = yield* replacementOf(at, value).pipe(Effect.mapError(located(at)));
	if (replacement === void 0) return value;
	if (!sites.has(at.file)) sites.set(at.file, /* @__PURE__ */ new Map());
	sites.get(at.file).set(at.site, replacement);
	return value;
});
function __at(file, site, offset) {
	const key = `${file}#${site}`;
	if (registry.site !== key) {
		registry.site = key;
		registry.tokens = 0;
	}
	if (registry.seen.get(file) !== registry.gen) {
		registry.seen.set(file, registry.gen);
		forgetKernels(file);
	}
	return registry.at = {
		file,
		site,
		offset
	};
}
const __unseen = (file, site) => !registry.sites.get(file)?.has(site);
function __site(at, value) {
	registry.at = void 0;
	const exit = Effect.runSyncExit(recordSite(at, value));
	if (Exit.isFailure(exit)) throw Cause.squash(exit.cause);
	return exit.value;
}
//#endregion
export { CSS, CSSAtRuleValue, CSSColorValue, CSSImageValue, CSSStyleValue, CSSUnitValue, __at, __site, __unseen, cn, css, cv, cx, firstThatWorks, flex, grid, keyframes, positionTry };
