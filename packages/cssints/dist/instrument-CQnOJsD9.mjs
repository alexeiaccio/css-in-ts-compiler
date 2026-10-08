import { browsers, lacking, supportOf } from "@cssints/css-grammar/support";
import { Context, Data, Effect, Formatter, Predicate, Result, Schema } from "effect";
import { longhands } from "@cssints/css-grammar/longhands";
import { parseSync } from "oxc-parser";
import MagicString from "magic-string";
//#region src/errors.ts
/** A css.* call, cv(), or a value in it is wrong. `file`, `site` (index) and `offset` name the call site, when known. */
var MacroError = class extends Data.TaggedError("MacroError") {};
/** A plugin member was called wrongly, or its styles conflict. `pluginName` is the member's name; the call site as in MacroError. */
var MemberError = class extends Data.TaggedError("MemberError") {};
/** `import ... from "cssints"` without the attribute names something that only exists at build time. */
var ImportError = class extends Data.TaggedError("ImportError") {};
/** Evaluating the module threw something that is not a MacroError, or did not finish in time. */
var EvalError = class extends Data.TaggedError("EvalError") {};
/** The module ran, but a site of it did not report a replacement. */
var SiteMissingError = class extends Data.TaggedError("SiteMissingError") {};
/** Vite refused something the plugin asked of it: the private server, the CSS pipeline. */
var HookError = class extends Data.TaggedError("HookError") {};
//#endregion
//#region src/registry.ts
const registry = globalThis.__cssints ??= {
	sites: /* @__PURE__ */ new Map(),
	rules: /* @__PURE__ */ new Map(),
	globals: /* @__PURE__ */ new Map(),
	layers: /* @__PURE__ */ new Map(),
	kernels: /* @__PURE__ */ new Map(),
	runtimes: /* @__PURE__ */ new Map(),
	scopes: /* @__PURE__ */ new Map(),
	userProps: /* @__PURE__ */ new Set(),
	seen: /* @__PURE__ */ new Map(),
	properties: /* @__PURE__ */ new Map(),
	defs: /* @__PURE__ */ new Map(),
	themed: /* @__PURE__ */ new Map(),
	checks: /* @__PURE__ */ new Map(),
	gen: 0,
	tokens: 0,
	warnings: [],
	warned: /* @__PURE__ */ new Set(),
	lowered: /* @__PURE__ */ new Map()
};
const Registry = Context.Reference("cssints/Registry", { defaultValue: () => registry });
const unuse = (entries, file) => {
	for (const [k, e] of entries) if (e.users.delete(file) && !e.users.size) entries.delete(k);
};
const forgetKernels = (file) => {
	for (const entries of [
		registry.kernels,
		registry.runtimes,
		registry.globals,
		registry.layers
	]) unuse(entries, file);
};
const forget = (file) => {
	forgetKernels(file);
	for (const [k, t] of registry.themed) if (t.file === file) registry.themed.delete(k);
	for (const [k, c] of registry.checks) if (c.at.file === file) registry.checks.delete(k);
};
//#endregion
//#region src/leaves.ts
const leaves = (p) => longhands[p] ?? [p];
const width = (p) => leaves(p).length;
const SIDE = [
	[/^border-(top|bottom)-(left|right)-radius$/, (m) => ["border-*-radius", `${m[1]}-${m[2]}`]],
	[/^border-(start|end)-(start|end)-radius$/, (m) => ["border-*-radius", `${m[1]}-${m[2]}`]],
	[/^(top|right|bottom|left)$/, (m) => ["inset-*", m[1]]],
	[/^inset-((?:block|inline)-(?:start|end))$/, (m) => ["inset-*", m[1]]],
	[/^(.+)-((?:block|inline)-(?:start|end))(-.+)?$/, (m) => [`${m[1]}-*${m[3] ?? ""}`, m[2]]],
	[/^(.+)-(top|right|bottom|left)(-.+)?$/, (m) => [`${m[1]}-*${m[3] ?? ""}`, m[2]]],
	[/^((?:min-|max-|contain-intrinsic-)?)(width|height)$/, (m) => [`${m[1]}size`, m[2]]],
	[/^((?:min-|max-|contain-intrinsic-)?)(inline|block)-size$/, (m) => [`${m[1]}size`, m[2]]],
	[/^(overflow|overscroll-behavior)-(x|y|inline|block)$/, (m) => [m[1], m[2]]]
];
const FAMILIES = [
	[
		"top",
		"right",
		"bottom",
		"left"
	],
	[
		"block-start",
		"block-end",
		"inline-start",
		"inline-end"
	],
	[
		"top-left",
		"top-right",
		"bottom-left",
		"bottom-right"
	],
	[
		"start-start",
		"start-end",
		"end-start",
		"end-end"
	],
	["width", "height"],
	["inline", "block"],
	["x", "y"]
];
const LOGICAL = new Set(FAMILIES.filter((_, i) => i % 2).flat());
const sideOf = (l) => {
	for (const [re, f] of SIDE) {
		const m = l.match(re);
		if (m) return f(m);
	}
};
const groups = (p) => {
	const out = /* @__PURE__ */ new Map();
	for (const l of leaves(p)) {
		const s = sideOf(l);
		if (s) (out.get(s[0]) ?? out.set(s[0], /* @__PURE__ */ new Set()).get(s[0])).add(s[1]);
	}
	return out;
};
const full = (sides) => !!sides && FAMILIES.some((f) => f.every((x) => sides.has(x)));
const covers = (a, b) => {
	const la = leaves(a);
	const ga = groups(a);
	return leaves(b).every((l) => la.includes(l) || full(ga.get(sideOf(l)?.[0] ?? "")));
};
const meet = (a, b) => {
	const lb = leaves(b);
	if (leaves(a).some((l) => lb.includes(l))) return true;
	const gb = groups(b);
	return [...groups(a)].some(([g, sa]) => gb.has(g) && [...sa].some((x) => LOGICAL.has(x)) !== [...gb.get(g)].some((x) => LOGICAL.has(x)));
};
function relation(a, b) {
	if (a === b) return "same";
	const ab = covers(a, b);
	const ba = covers(b, a);
	if (ab && ba) return "same";
	if (ab || ba) return "contains";
	return meet(a, b) ? "overlap" : "apart";
}
//#endregion
//#region src/delivery.ts
/** The name of the runtime of derived tokens (derived.ts): not a plugin's, the engine registers it (derived-data.ts). */
const DERIVED = "derived";
const RUNTIME_ID = "virtual:cssints/runtime/";
const FALLBACK = "@fallback	";
/** Registers the runtime of a member by plugin name, with the file that uses it. The same name with another runtime is an error. */
const addRuntime = Effect.fnUntraced(function* ({ name, runtime }, at) {
	const { runtimes } = yield* Registry;
	const entry = runtimes.get(name);
	if (entry && entry.runtime !== runtime && Formatter.formatJson(entry.runtime) !== Formatter.formatJson(runtime)) return yield* new MemberError({
		message: `cssints: ${name}: its runtime is registered twice with a different definition`,
		pluginName: name,
		...at
	});
	const e = entry ?? {
		runtime,
		users: /* @__PURE__ */ new Set()
	};
	runtimes.set(name, e);
	if (at) e.users.add(at.file);
});
/** Registers the runtime of derived tokens for the file that declares them; the features its literals need add up across calls. */
const addDerived = Effect.fnUntraced(function* (file, keys) {
	const { runtimes } = yield* Registry;
	const e = runtimes.get("derived") ?? {
		runtime: { polyfills: [] },
		users: /* @__PURE__ */ new Set()
	};
	e.runtime = { polyfills: [.../* @__PURE__ */ new Set([...e.runtime.polyfills, ...keys])] };
	e.users.add(file);
	runtimes.set(DERIVED, e);
});
/**
* Whether a target needs the runtime: it lacks a feature in `polyfills` and has `@property`, which the runtime stands
* on (a target without it gets nothing from a polyfill).
*/
const needed = Effect.fnUntraced(function* ({ polyfills }, ts) {
	const noProperty = new Set((yield* lacking("css.at-rules.property", ts)).map((t) => t.join(" ")));
	for (const key of polyfills) for (const t of yield* lacking(key, ts)) if (!noProperty.has(t.join(" "))) return true;
	return false;
});
const runtimeNames = ({ runtimes }, file) => [...runtimes].flatMap(([name, e]) => e.users.has(file) ? [name] : []);
/** What a module records of fallback CSS: that of the runtimes it uses, when the targets need them. */
const fallbackEntries = Effect.fnUntraced(function* ({ runtimes }, file) {
	const out = [];
	for (const e of runtimes.values()) {
		const { css } = e.runtime;
		if (css && e.users.has(file) && (yield* needed(e.runtime))) out.push(`${FALLBACK}${Formatter.formatJson(css)}`);
	}
	return out;
});
/** The text of `virtual:cssints/runtime/<name>`: nothing, or the shared engine configured with the runtime's families (derived tokens: their runtime). */
const runtimeModule = Effect.fnUntraced(function* (name) {
	const { runtimes } = yield* Registry;
	const runtime = runtimes.get(name)?.runtime;
	if (name === "derived" && runtime && (yield* needed(runtime))) return `import derived from "cssints/derived";\nderived();\n`;
	if (!runtime || !runtime.parentVars?.length || !(yield* needed(runtime))) return "export {};";
	return `import parentVars from "cssints/parent-vars";\nparentVars(${Formatter.formatJson(runtime.parentVars)});\n`;
});
//#endregion
//#region src/kernel.ts
const KERNEL = "@kernel	";
const VARS = /(--[\w-]+)\s*:|@property\s+(--[\w-]+)/g;
/**
* Registers a kernel by key, on first use (a global rule with atProperty: its css in _.k, its atProperty at the top
* of the sheet, both once however many styles use it). The same key with other css, another key that declares one of
* its custom properties, and another key for a marker it prints are build errors at `at`; a `requires` that a target
* lacks is a support warning.
*/
const addKernel = Effect.fnUntraced(function* (kernel, markers, at) {
	const { kernels, warnings, warned } = yield* Registry;
	const fail = (message) => new MacroError({
		message: `cssints: ${message}`,
		...at
	});
	const { key } = kernel;
	let entry = kernels.get(key);
	if (entry) {
		const k = entry.kernel;
		if (k.css !== kernel.css || k.atProperty !== kernel.atProperty) return yield* fail(`kernel ${key} is registered twice with different CSS: a kernel that changes needs a new key (name@version)`);
	} else {
		const vars = key.startsWith("@") ? [] : [...`${kernel.css}\n${kernel.atProperty ?? ""}`.matchAll(VARS)].map((m) => m[1] ?? m[2]);
		for (const [other, e] of kernels) {
			const v = vars.find((x) => e.vars.includes(x));
			if (v) return yield* fail(`kernels ${other} and ${key} both declare ${v}: a plugin picks its own short custom-property names`);
		}
		kernels.set(key, entry = {
			kernel,
			vars,
			markers: /* @__PURE__ */ new Set(),
			users: /* @__PURE__ */ new Set()
		});
		for (const r of kernel.requires ?? []) {
			const { key: feature, exact } = typeof r === "string" ? {
				key: r,
				exact: false
			} : r;
			const off = yield* lacking(feature, void 0, exact);
			const w = `${key} ${feature}`;
			if (off.length && !warned.has(w)) {
				warned.add(w);
				warnings.push(`kernel ${key} needs ${feature}, not supported by ${browsers(off.map((t) => t.join(" ")))}${exact ? " (a partial implementation counts as lacking)" : ""}`);
			}
		}
	}
	if (at) entry.users.add(at.file);
	for (const [marker, owner] of markers) {
		if (owner !== key) continue;
		for (const [other, e] of kernels) if (other !== key && e.markers.has(marker)) return yield* fail(`kernels ${other} and ${key} both print the marker ${marker}`);
		entry.markers.add(marker);
	}
});
const kernelEntries = ({ kernels }, file) => [...kernels.values()].flatMap((e) => e.users.has(file) ? [`${KERNEL}${Formatter.formatJson(e.kernel)}`] : []);
//#endregion
//#region src/derived.ts
/** The custom property of :root that carries the data (derived-data.ts writes it). */
const KEY = "--_derived";
const mul = (m, v) => [
	0,
	3,
	6
].map((r) => v.reduce((s, x, k) => s + m[r + k] * x, 0));
const lin = (c) => {
	const a = Math.abs(c);
	return (a <= .04045 ? a / 12.92 : ((a + .055) / 1.055) ** 2.4) * Math.sign(c);
};
const gam = (c) => {
	const a = Math.abs(c);
	return (a <= .0031308 ? a * 12.92 : 1.055 * a ** (1 / 2.4) - .055) * Math.sign(c);
};
const rad = Math.PI / 180;
const rect = ([l, c, h]) => [
	l,
	c * Math.cos(h * rad),
	c * Math.sin(h * rad)
];
const polar = ([l, a, b]) => {
	const h = Math.atan2(b, a) / rad;
	return [
		l,
		Math.hypot(a, b),
		h < 0 ? h + 360 : h
	];
};
const LMS = [
	.4122214708,
	.5363325363,
	.0514459929,
	.2119034982,
	.6806995451,
	.1073969566,
	.0883024619,
	.2817188376,
	.6299787005
];
const OK = [
	.2104542553,
	.793617785,
	-.0040720468,
	1.9779984951,
	-2.428592205,
	.4505937099,
	.0259040371,
	.7827717662,
	-.808675766
];
const LMS_I = [
	4.0767416621,
	-3.3077115913,
	.2309699292,
	-1.2684380046,
	2.6097574011,
	-.3413193965,
	-.0041960863,
	-.7034186147,
	1.707614701
];
const OK_I = [
	1,
	.3963377774,
	.2158037573,
	1,
	-.1055613458,
	-.0638541728,
	1,
	-.0894841775,
	-1.291485548
];
const XYZ = [
	.436065743,
	.385151469,
	.143078454,
	.222493192,
	.716887054,
	.0606197905,
	.0139239045,
	.0970812857,
	.714099358
];
const XYZ_I = [
	3.13413576,
	-1.61738568,
	-.49066242,
	-.978795456,
	1.91625419,
	.0334429841,
	.071955413,
	-.228976675,
	1.40538601
];
const D50 = [
	.9642956764295677,
	1,
	.8251046025104602
];
const E = 216 / 24389;
const K = 24389 / 27;
const to = {
	"srgb-linear": (c) => c,
	srgb: (c) => c.map(lin),
	oklab: (c) => mul(LMS_I, mul(OK_I, c).map((v) => v ** 3)),
	oklch: (c) => to.oklab(rect(c)),
	lab: ([l, a, b]) => {
		const y = (l + 16) / 116;
		const f = [
			a / 500 + y,
			y,
			y - b / 200
		];
		return mul(XYZ_I, f.map((v, i) => D50[i] * (v ** 3 > E ? v ** 3 : (116 * v - 16) / K)));
	}
};
const from = {
	"srgb-linear": (c) => c,
	srgb: (c) => c.map(gam),
	oklab: (c) => mul(OK, mul(LMS, c).map(Math.cbrt)),
	oklch: (c) => polar(from.oklab(c)),
	lab: (c) => {
		const f = mul(XYZ, c).map((v, i) => {
			const x = v / D50[i];
			return x > E ? Math.cbrt(x) : (K * x + 16) / 116;
		});
		return [
			116 * f[1] - 16,
			500 * (f[0] - f[1]),
			200 * (f[1] - f[2])
		];
	}
};
const conv = (c, s) => c.s === s ? c : {
	s,
	c: from[s](to[c.s](c.c)),
	a: c.a
};
const SPEC = {
	srgb: ["rgb", [
		1,
		1,
		1
	]],
	"srgb-linear": ["rgb", [
		1,
		1,
		1
	]],
	oklab: ["lab", [
		1,
		.4,
		.4
	]],
	oklch: ["lch", [
		1,
		.4,
		360
	]],
	lab: ["lab", [
		100,
		125,
		125
	]]
};
const NAMED = {
	black: "#000",
	white: "#fff",
	transparent: "#0000"
};
const TOKEN = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:%|deg)?|#\w+|(?:--|-?)[a-z_][\w-]*|[^\s]/gi;
const fail = (x) => {
	throw new Error(x);
};
const hex = (x) => {
	const h = x.slice(1);
	if (![
		3,
		4,
		6,
		8
	].includes(h.length) || /[^\da-f]/i.test(h)) return fail(x);
	const n = h.length < 5 ? h.replace(/./g, "$&$&") : h;
	const byte = (i) => parseInt(n.slice(i, i + 2), 16) / 255;
	return {
		s: "srgb",
		c: [
			byte(0),
			byte(2),
			byte(4)
		],
		a: n.length > 6 ? byte(6) : 1
	};
};
const evaluate = (text, get = (n) => fail(n)) => {
	const t = text.match(TOKEN) ?? [];
	let i = 0;
	let pct = 1;
	let env = {};
	const next = () => t[i++] ?? fail(t[i - 2]);
	const want = (s) => {
		if (next() !== s) fail(t[i - 1]);
	};
	const input = () => {
		want("(");
		const v = get(next());
		want(")");
		return v;
	};
	const list = () => {
		want("(");
		const out = [sum()];
		while (t[i] === ",") {
			i++;
			out.push(sum());
		}
		want(")");
		return out;
	};
	const atom = () => {
		const x = next();
		if (/^[+-]?[\d.]/.test(x)) return parseFloat(x) * (x.endsWith("%") ? pct / 100 : 1);
		if (x === "(") {
			const v = sum();
			want(")");
			return v;
		}
		if (x === "calc") return atom();
		if (x === "-") return -atom();
		if (x === "clamp") {
			const [lo, v, hi] = list();
			return Math.max(lo, Math.min(v, hi));
		}
		if (x === "min") return Math.min(...list());
		if (x === "max") return Math.max(...list());
		if (x === "var") {
			const v = input();
			return typeof v === "string" && v ? Number(v) : fail(x);
		}
		if (x === "none") return 0;
		return Object.hasOwn(env, x) ? env[x] : fail(x);
	};
	const prod = () => {
		let v = atom();
		for (let o = t[i]; o === "*" || o === "/"; o = t[i]) {
			i++;
			v = o === "*" ? v * atom() : v / atom();
		}
		return v;
	};
	const sum = () => {
		let v = prod();
		for (let o = t[i]; o === "+" || o === "-"; o = t[i]) {
			i++;
			v += o === "+" ? prod() : -prod();
		}
		return v;
	};
	const fn = (f) => {
		want("(");
		const origin = t[i] === "from" ? (i++, col()) : void 0;
		const space = f === "color" ? next() : f === "rgb" || f === "rgba" ? "srgb" : f;
		if (!Object.hasOwn(SPEC, space)) return fail(f === "color" ? space : f);
		const [names, base] = SPEC[space];
		const k = f[0] === "r" ? 255 : 1;
		const src = origin && conv(origin, space);
		env = src ? {
			alpha: src.a,
			...Object.fromEntries([...names].map((n, j) => [n, src.c[j] * k]))
		} : {};
		const c = base.map((b, j) => {
			if (j && t[i] === ",") i++;
			pct = b * k;
			return atom() / k;
		});
		let a = 1;
		if (t[i] === "/" || t[i] === ",") {
			i++;
			pct = 1;
			a = Math.min(1, Math.max(0, atom()));
		}
		want(")");
		return {
			s: space,
			c,
			a
		};
	};
	const mix = () => {
		want("(");
		want("in");
		const s = next();
		if (s === "oklch" || !Object.hasOwn(SPEC, s)) return fail(s);
		want(",");
		const one = () => {
			return [conv(col(), s), t[i]?.endsWith("%") ? parseFloat(next()) : void 0];
		};
		const [a, p] = one();
		want(",");
		const [b, q] = one();
		want(")");
		const x = p ?? 100 - (q ?? 50);
		const y = q ?? 100 - x;
		if (x + y !== 100) return fail("color-mix");
		const al = (a.a * x + b.a * y) / 100;
		return {
			s,
			c: a.c.map((v, j) => al ? (v * a.a * x + b.c[j] * b.a * y) / 100 / al : 0),
			a: al
		};
	};
	const col = () => {
		const x = next();
		if (x.startsWith("#")) return hex(x);
		if (NAMED[x]) return hex(NAMED[x]);
		if (x === "var") {
			const v = input();
			return typeof v === "string" ? evaluate(v, get) : v;
		}
		return x === "color-mix" ? mix() : fn(x);
	};
	const out = col();
	if (i < t.length) fail(t[i]);
	return out;
};
//#endregion
//#region src/derived-data.ts
const refuses = (literal) => {
	const tried = Result.try({
		try: () => evaluate(literal),
		catch: (e) => `does not evaluate "${e.message}"`
	});
	return Result.isFailure(tried) ? tried.failure : void 0;
};
const standIn = Effect.fnUntraced(function* (at, who, kind, literal, inherits, rooted) {
	const { warned, warnings } = yield* Registry;
	let why;
	if (kind !== "color") why = "computes colours only";
	else if (!inherits) why = "does not write tokens that do not inherit";
	else if (!rooted) why = "does not read container themes";
	else why = refuses(literal);
	const ws = kind === "color" ? supportOf("color", literal).filter((w) => w.feature !== "color") : [];
	if (why === void 0) {
		yield* addDerived(at.file, [...new Set(ws.map((w) => w.key))]);
		return true;
	}
	const key = `derived ${who} ${why}`;
	if (!warned.has(key)) {
		warned.add(key);
		const lacking = browsers([...new Set(ws.flatMap((w) => w.lacking))]);
		warnings.push(`${who}: "${literal}" stays at its static default${lacking ? ` in ${lacking}` : " in the older targets"}: the runtime for derived tokens ${why}`);
	}
	return false;
});
const usesDerived = ({ defs, themed }, names) => [...names].some((n) => defs.get(n)?.poly !== void 0 || [...themed.values()].some((t) => t.theme?.poly?.has(n)));
const derivedRule = Effect.fnUntraced(function* (properties, keys) {
	const { runtimes, defs, themed } = yield* Registry;
	const entry = runtimes.get(DERIVED);
	if (!entry || !(yield* needed(entry.runtime))) return;
	const used = new Set(properties.map((p) => /^@property (--[\w-]+)/.exec(p)?.[1]));
	const byKey = new Map([...themed.values()].map((t) => [t.key, t.theme]));
	const themes = keys.flatMap((k) => byKey.get(k) ?? []);
	const probes = /* @__PURE__ */ new Set();
	const base = {};
	const names = /* @__PURE__ */ new Set();
	for (const [n, d] of defs) if (used.has(n) && d.poly) {
		base[n] = d.template;
		probes.add(d.poly);
		names.add(n);
	}
	for (const { poly } of themes) for (const [n, literal] of poly ?? []) if (used.has(n)) {
		probes.add(literal);
		names.add(n);
	}
	if (!names.size) return;
	const t = themes.flatMap(({ label, values, poly }) => {
		const set = Object.fromEntries([...values].flatMap(([n, css]) => names.has(n) ? [[n, poly?.has(n) ? css : 0]] : []));
		return Object.keys(set).length ? [[label, set]] : [];
	});
	const json = Formatter.formatJson({
		p: [...probes],
		b: base,
		t
	});
	return `:root{${KEY}:'${json.replace(/[\\']/g, "\\$&")}'}`;
});
//#endregion
//#region src/sheet.ts
const fromJson = Schema.decodeSync(Schema.fromJsonString(Schema.Unknown));
const THEME = "@theme	";
const LAYERS = "@layer _.k, _.a, _.b, _.c, _.d, _.e;";
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const cmpCond = (a, b) => a.reduce((d, x, i) => d || (i < b.length ? x - b[i] : 0), 0) || a.length - b.length;
const wrapKey = (r) => r.wrap.join("{");
const byOrder = (a, b) => cmp(a.layer, b.layer) || cmpCond(a.cond, b.cond) || cmp(wrapKey(a), wrapKey(b)) || width(b.prop) - width(a.prop) || cmp(a.cls, b.cls);
const GLOBAL_RULE = "@global	";
const LAYER_LIST = "@layers	";
const LAYER_BEFORE = "@layers<	";
const LAYER_NAME = /^[A-Za-z_][\w-]*$/;
/** Adds a global rule (`*{box-sizing:border-box}`) of a plugin member, by its content, to the sheet of the module at `at`. `layer` names a declared top-level layer to wrap it in, no layer puts it in `_.k`. */
const addGlobal = Effect.fnUntraced(function* (g, at) {
	const { globals } = yield* Registry;
	if (g.layer !== void 0) yield* requireLayer(g.layer, at);
	const key = `${g.layer ?? ""}\t${g.css}`;
	const entry = globals.get(key) ?? globals.set(key, {
		global: g,
		users: /* @__PURE__ */ new Set()
	}).get(key);
	if (at) entry.users.add(at.file);
});
const globalEntries = ({ globals }, file) => [...globals.values()].flatMap((e) => e.users.has(file) ? [`${GLOBAL_RULE}${Formatter.formatJson([e.global.layer ?? "", e.global.css])}`] : []);
/**
* Declares top-level layers, in order: the statement `@layer a, b, c;`, printed after the engine's own layers, once
* whoever declares it, so what is in them beats the engine's `:root` fallbacks; with `before`, printed before them, so
* the engine's classes beat what is in them (a reset). Another statement may name the same layers in the same order, or
* hold or be held by this one; layers in another order, shared without one holding the other, or declared both before
* and after the engine's, are build errors at `at`, since the sheet could not say which comes first.
*/
const addLayers = Effect.fnUntraced(function* ({ names, before = false }, at) {
	const { layers } = yield* Registry;
	const fail = (message) => new MacroError({
		message: `cssints: ${message}`,
		...at
	});
	const list = names.join(", ");
	if (!names.length || new Set(names).size !== names.length || !names.every((n) => LAYER_NAME.test(n))) return yield* fail(`layers(${list}) takes names of layers, each once: letters, digits, _ and -`);
	for (const l of layers.values()) {
		const mine = names.filter((n) => l.names.includes(n));
		if (mine.length && l.before !== before) return yield* fail(`layers(${list}) declares ${mine.join(", ")} ${before ? "before" : "after"} the engine's layers, and layers(${l.names.join(", ")}) ${l.before ? "before" : "after"}`);
		if (mine.length && mine.join() !== l.names.filter((n) => names.includes(n)).join()) return yield* fail(`layers(${list}) names layers in another order than layers(${l.names.join(", ")})`);
		if (mine.length && mine.length < Math.min(names.length, l.names.length)) return yield* fail(`layers(${list}) and layers(${l.names.join(", ")}) share layers, and neither holds the other: declare them in one call`);
	}
	const key = names.join();
	const entry = layers.get(key) ?? layers.set(key, {
		names: [...names],
		before,
		users: /* @__PURE__ */ new Set()
	}).get(key);
	if (at) entry.users.add(at.file);
});
/** A build error at `at` unless `layer` is declared by a `layers()` that has run (this module, or one it imports). */
const requireLayer = Effect.fnUntraced(function* (layer, at) {
	const { layers } = yield* Registry;
	if (![...layers.values()].some((l) => l.names.includes(layer))) return yield* new MacroError({
		message: `cssints: the layer "${layer}" is not declared: call layers("${layer}", ...) in this module or in one it imports`,
		...at
	});
});
const layerEntries = ({ layers }, file) => [...layers.values()].flatMap((l) => l.users.has(file) ? [`${l.before ? LAYER_BEFORE : LAYER_LIST}${l.names.join()}`] : []);
const layerStatements = (lists) => [...new Map([...lists].map((l) => [l.join(), [...l]])).values()].sort((a, b) => b.length - a.length || cmp(a.join(), b.join()));
const themedEntries = (themed, file, names) => [...themed.values()].flatMap((t) => t.file === file || t.names.some((n) => names.has(n)) ? [`${THEME}${t.key}\t${t.layer ?? ""}\t${t.css}`] : []);
const globalNames = (themed, file) => [...themed.values()].filter((t) => t.file === file && t.key.startsWith("-:")).flatMap((t) => t.css.match(/--[\w-]+/g) ?? []);
const closeNames = (names, defs, themed) => {
	for (let size = -1; size !== names.size;) {
		size = names.size;
		for (const n of [...names]) defs.get(n)?.refs?.forEach((r) => names.add(r));
		for (const t of themed.values()) if (t.names.some((n) => names.has(n))) t.css.match(/--[\w-]+/g)?.forEach((n) => names.add(n));
	}
};
/** The rules of `entries`: class names, and the text of `@property` rules (once each, whichever module has them). */
const renderSheet = Effect.fn("cssints.renderSheet")(function* (entries) {
	const { rules, layers } = yield* Registry;
	const all = [...new Set(entries)];
	const properties = all.filter((e) => e.startsWith("@property")).sort();
	const themes = all.flatMap((e) => e.startsWith(THEME) ? [e.split("	")] : []).sort((a, b) => cmp(a[1], b[1]));
	const kThemes = themes.filter((t) => t[2] === "");
	const topThemes = themes.filter((t) => t[2] !== "");
	const used = all.flatMap((e) => e.startsWith("@kernel	") ? [fromJson(e.slice(8))] : []).sort((a, b) => cmp(a.key, b.key));
	const fallbacks = all.flatMap((e) => e.startsWith("@fallback	") ? [fromJson(e.slice(10))] : []).sort();
	const derived = yield* derivedRule(properties, themes.map((t) => t[1]));
	const sorted = all.flatMap((cls) => {
		const rule = rules.get(cls);
		return rule ? [{
			cls,
			...rule
		}] : [];
	}).sort(byOrder);
	const globals = all.filter((e) => e.startsWith(GLOBAL_RULE)).sort(cmp).map((e) => fromJson(e.slice(8)));
	const kGlobals = globals.flatMap(([layer, css]) => layer === "" ? [css] : []);
	const layered = globals.filter(([layer]) => layer !== "");
	const inUse = /* @__PURE__ */ new Set([...layered.map(([layer]) => layer), ...topThemes.map((t) => t[2])]);
	const statementsOf = (prefix, before) => layerStatements([...all.flatMap((e) => e.startsWith(prefix) ? [e.slice(prefix.length).split(",")] : []), ...[...layers.values()].flatMap((l) => l.before === before && l.names.some((n) => inUse.has(n)) ? [l.names] : [])]).map((s) => `@layer ${s.join(", ")};\n`);
	let out = `${LAYERS}\n${[...properties, ...used.flatMap((k) => k.atProperty ?? [])].map((p) => `${p}\n`).join("")}`;
	out = `${statementsOf(LAYER_BEFORE, true).join("")}${out.replace("\n", `\n${statementsOf(LAYER_LIST, false).join("")}`)}`;
	if (kGlobals.length || used.length || fallbacks.length || kThemes.length) out += `@layer _.k {\n${[
		...kGlobals,
		...used.map((k) => k.css),
		...fallbacks,
		...kThemes.map((t) => t[3]),
		...derived ? [derived] : []
	].map((g) => `  ${g}\n`).join("")}}\n`;
	for (const [layer, css] of layered) out += `@layer ${layer} {\n  ${css}\n}\n`;
	for (const t of topThemes) out += `@layer ${t[2]} {\n  ${t[3]}\n}\n`;
	let layer = "";
	let wrap = "";
	let depth = 0;
	const closeWrap = () => out += depth ? `  ${"}".repeat(depth)}\n` : "";
	for (const r of sorted) {
		const key = wrapKey(r);
		if (r.layer !== layer) {
			closeWrap();
			out += `${layer ? "}\n" : ""}@layer ${r.layer} {\n`;
			layer = r.layer;
			wrap = "";
			depth = 0;
		}
		if (key !== wrap) {
			closeWrap();
			wrap = key;
			depth = r.wrap.length;
			if (depth) out += `  ${r.wrap.map((w) => `${w} {`).join(" ")}\n`;
		}
		out += `${depth ? "    " : "  "}${r.css}\n`;
	}
	closeWrap();
	return layer ? `${out}}\n` : out;
});
//#endregion
//#region src/instrument.ts
const RUNTIME = "cssints";
const CV_CALL = "__cv(";
const rootIdent = (n) => n.type === "Identifier" ? n.name : n.type === "MemberExpression" ? rootIdent(n.object) : n.type === "CallExpression" ? rootIdent(n.callee) : null;
const RUNTIME_ONLY = /* @__PURE__ */ new Set(["cx"]);
const nameOf = (m) => m.type === "Identifier" ? m.name : m.value;
const isSiteImport = (s) => s.attributes.some((a) => (a.key.type === "Identifier" ? a.key.name : a.key.value) === "type" && a.value.value === "cssints");
const importedName = (x) => x.type === "ImportSpecifier" ? nameOf(x.imported) : null;
const isRuntime = (d, x) => d.source.value === "cssints" && x.type === "ImportSpecifier" && RUNTIME_ONLY.has(nameOf(x.imported));
const keptImport = (d, code) => {
	const names = d.specifiers.filter((x) => isRuntime(d, x)).map((x) => code.slice(x.start, x.end));
	return names.length ? `import { ${names.join(", ")} } from ${Formatter.formatJson(RUNTIME)};` : "";
};
const findCssImport = Effect.fnUntraced(function* (program, code, id) {
	const locals = /* @__PURE__ */ new Set();
	const decls = [];
	for (const s of program.body) {
		if (s.type !== "ImportDeclaration") continue;
		const old = s.source.value === "cssints" && s.specifiers.find((x) => importedName(x) === "_cv");
		if (old) return yield* new ImportError({
			message: `cssints: ${id} imports _cv from "cssints", which is gone: cv({ ... }) is the function now. Write const button = cv({ base, variants }) (cv from "cssints" with { type: "cssints" }), drop _cv, and call button({ size: "lg" })`,
			file: id,
			offset: old.start
		});
		if (isSiteImport(s)) {
			decls.push(s);
			s.specifiers.forEach((x) => isRuntime(s, x) || locals.add(x.local.name));
		} else if (s.source.value === "cssints" && s.importKind !== "type") {
			const bad = s.specifiers.filter((x) => x.type !== "ImportSpecifier" || x.importKind !== "type" && !RUNTIME_ONLY.has(importedName(x) ?? ""));
			if (!bad.length) continue;
			const names = bad.map((x) => code.slice(x.start, x.end));
			const fix = bad[0].type === "ImportNamespaceSpecifier" ? names[0] : `{ ${names.join(", ")} }`;
			return yield* new ImportError({
				message: `cssints: ${id} imports build-time ${names.join(", ")} from "cssints" without the attribute. Import it as: import ${fix} from "cssints" with { type: "cssints" }; (only cx is runtime)`,
				file: id,
				offset: s.start
			});
		}
	}
	return locals.size ? {
		locals,
		decls
	} : null;
});
const CONDITIONS = /* @__PURE__ */ new Set([
	"media",
	"container",
	"supports",
	"attr",
	"within"
]);
const boundNames = (id, out) => {
	if (!id) return;
	if (id.type === "Identifier") out.add(id.name);
	else if (id.type === "ArrayPattern") id.elements.forEach((e) => boundNames(e, out));
	else if (id.type === "ObjectPattern") id.properties.forEach((p) => boundNames(p.type === "Property" ? p.value : p.argument, out));
	else if (id.type === "AssignmentPattern") boundNames(id.left, out);
};
function withConditions(program, code, { locals, decls }) {
	if (!/\b(?:media|container|supports|attr|within)\b/.test(code)) return locals;
	const ctors = /* @__PURE__ */ new Set();
	for (const d of decls) for (const x of d.specifiers) if (x.type === "ImportSpecifier" && CONDITIONS.has(nameOf(x.imported))) ctors.add(x.local.name);
	const all = new Set(locals);
	const walk = (node) => {
		if (!Predicate.isObject(node) || typeof node.type !== "string") return;
		const n = node;
		if (n.type === "VariableDeclarator" && n.init?.type === "CallExpression") {
			const c = n.init.callee;
			if (c.type === "Identifier" && ctors.has(c.name) || c.type === "MemberExpression" && !c.computed && c.property.type === "Identifier" && CONDITIONS.has(c.property.name) && locals.has(rootIdent(c.object) ?? "")) boundNames(n.id, all);
		}
		for (const k in node) {
			const v = node[k];
			if (Array.isArray(v)) v.forEach(walk);
			else if (Predicate.isObject(v) && "type" in v) walk(v);
		}
	};
	walk(program);
	return all;
}
function findSites(program, locals) {
	const sites = [];
	const walk = (node, inFn) => {
		if (!Predicate.isObject(node) || typeof node.type !== "string") return;
		const n = node;
		if ((n.type === "CallExpression" || n.type === "NewExpression") && locals.has(rootIdent(n.callee) ?? "")) {
			sites.push({
				start: n.start,
				end: n.end,
				inFn
			});
			return;
		}
		const fn = inFn || /Function/.test(n.type);
		for (const k in node) {
			const v = node[k];
			if (Array.isArray(v)) v.forEach((c) => walk(c, fn));
			else if (Predicate.isObject(v) && "type" in v) walk(v, fn);
		}
	};
	walk(program, false);
	return sites;
}
const instrument = Effect.fn("cssints.instrument")(function* (code, id) {
	const { program } = parseSync(id, code);
	const imp = yield* findCssImport(program, code, id);
	if (!imp) return null;
	const sites = findSites(program, withConditions(program, code, imp));
	const ms = new MagicString(code);
	const hoisted = [];
	const file = Formatter.formatJson(id);
	sites.forEach((s, n) => {
		const site = `__site(__at(${file}, ${n}, ${s.start}), `;
		const expr = code.slice(s.start, s.end);
		if (s.inFn) hoisted.push(`${site}${expr});`);
		else {
			ms.prependLeft(s.start, site).appendRight(s.end, ")");
			hoisted.push(`__unseen(${file}, ${n}) && ${site}${expr});`);
		}
	});
	imp.decls.forEach((d, i) => {
		if (d.source.value !== "cssints") return;
		const ns = d.specifiers.find((x) => x.type === "ImportNamespaceSpecifier");
		const named = d.specifiers.filter((x) => !isRuntime(d, x));
		const bind = ns ? ns.local.name : `{ ${named.map((x) => `${Formatter.formatJson(importedName(x))}: ${x.local.name}`).join(", ")} }`;
		ms.overwrite(d.start, d.end, `import { css as __css${i} } from ${Formatter.formatJson(RUNTIME)}; const ${bind} = __css${i};${keptImport(d, code)}`);
	});
	ms.prepend(`import { __at, __site, __unseen } from ${Formatter.formatJson(RUNTIME)};\n`);
	if (hoisted.length) ms.append(`\nexport function __cssints_hoisted() {\n${hoisted.join("\n")}\n}\n`);
	return {
		code: ms.toString(),
		sites,
		imp
	};
});
//#endregion
export { forget as A, addRuntime as C, covers as D, runtimeNames as E, MacroError as F, MemberError as I, SiteMissingError as L, registry as M, EvalError as N, relation as O, HookError as P, RUNTIME_ID as S, runtimeModule as T, standIn as _, LAYERS as a, kernelEntries as b, byOrder as c, globalNames as d, layerEntries as f, themedEntries as g, requireLayer as h, keptImport as i, forgetKernels as j, Registry as k, closeNames as l, renderSheet as m, RUNTIME as n, addGlobal as o, layerStatements as p, instrument as r, addLayers as s, CV_CALL as t, globalEntries as u, usesDerived as v, fallbackEntries as w, DERIVED as x, addKernel as y };
