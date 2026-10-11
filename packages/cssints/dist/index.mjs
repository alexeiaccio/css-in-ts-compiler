import { a as registry, d as MacroError, f as MemberError, o as warn, r as forgetKernels, t as Registry } from "./registry-CTumHB8p.mjs";
import { A as camel, C as hashClass, D as settled, E as minWidth, F as probed, M as failIn, N as isNode, O as toDecls, P as node, S as edge, T as merged, _ as PSEUDOS, a as createTokens, b as checkVars, c as tokensOf, d as style, f as token, g as PROPS, h as LAYER, i as createGlobalTheme, j as fail, k as VAR, l as CSSTokenValue, m as FUNCTIONS, n as addTheme, o as isDone, p as CONTEXTS, r as check$1, t as DONE, u as isStyle, v as carried, w as isFallback, x as dropsOf, y as chainDecl } from "./theme-BsP2E4LB.mjs";
import { D as relation, S as addRuntime, _ as addKernel, i as byOrder, n as addGlobal, r as addLayers, y as kernelWarnings } from "./sheet-BKsMTa0c.mjs";
import { n as loweredOf } from "./lowered-D2KusPLp.mjs";
import { n as CX_CALL, s as groups$1, t as CV_CALL } from "./instrument-gCazujmb.mjs";
import { checkDeclarationNow, checkQuery, checkSelector, checkValueNow, isDeclarationError } from "@cssints/css-grammar/check";
import { lackingOf, messageOf } from "@cssints/css-grammar/support";
import { CSS, CSSColorValue, CSSImageValue, CSSStyleValue, CSSStyleValue as CSSStyleValue$1, CSSUnitValue } from "@cssints/css-grammar/values";
import { Cause, Effect, Exit, Formatter, Predicate, Result, Schema } from "effect";
import { createHash } from "node:crypto";
import { functions } from "@cssints/css-grammar/functions";
import { properties } from "@cssints/css-grammar/mdn";
import { grammarOf } from "@cssints/css-grammar/token";
import { checkSelectorNow } from "@cssints/css-grammar/selector";
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
const isGroup$1 = (p) => Array.isArray(p);
const build = (member, name) => {
	const { sep, math } = functions[name];
	const grammar = math ? MATH : `<${name}()>`;
	return (...parts) => {
		const atom = (p) => {
			if (typeof p === "string") checkVars(`${member}()`, p);
			else if (typeof p !== "number" && !(p instanceof CSSStyleValue$1)) throw fail(`cssints: ${member}() takes strings, numbers and Typed OM values (tokens, other calls), got ${Formatter.formatJson(p)}`);
			return String(p);
		};
		const texts = parts.map((p, i) => isGroup$1(p) ? p.map(atom).join(" ") : name === "var" && !i && p instanceof CSSTokenValue ? p.name : atom(p));
		const join = (ts) => ts.reduce((acc, t, i) => i ? `${acc}${OPERATORS.has(t) || OPERATORS.has(ts[i - 1]) ? " " : sep}${t}` : t, "");
		const value = `${name}(${join(texts)})`;
		const first = parts[0];
		if (name === "var") {
			if (!registry.properties.has(texts[0] ?? "")) throw fail(`cssints: var() takes a token and an optional fallback, got ${Formatter.formatJson(texts[0])}`);
			if (first instanceof CSSTokenValue && texts.length > 1) checkText(`var(${first.name}) fallback`, `<${first.syntax}>`, texts.slice(1).join(sep));
		} else checkText(`${name}()`, grammar, value, math ? void 0 : () => argumentOf(name, grammar, texts, sep, join));
		return new CSSFunctionValue(value);
	};
};
const argumentOf = (name, grammar, texts, sep, join) => {
	const fits = (s) => {
		try {
			checkValueNow(name, grammar, s);
			return true;
		} catch (e) {
			if (!isDeclarationError(e)) throw e;
			return false;
		}
	};
	const i = texts.findIndex((t, n) => probed(join(texts.slice(0, n + 1)), registry.properties).some((h) => !fits(`${name}(${h}${OPERATORS.has(t) ? " " : sep}var(--x))`) && !fits(`${name}(${h})`)));
	return !texts.length ? "" : i < 0 ? ` (after argument ${texts.length})` : ` (argument ${i + 1})`;
};
const checkText = (label, grammar, text, where) => {
	for (const v of probed(text, registry.properties)) try {
		checkValueNow(label, grammar, v);
	} catch (e) {
		if (!isDeclarationError(e)) throw e;
		throw new MacroError({
			message: `${e.message.replace(`, expected ${MATH}`, "")}${where?.() ?? ""}${v === text ? "" : ` ("${text}" is checked as "${v}": a token stands for a value of its type)`}`,
			cause: e,
			...registry.at
		});
	}
};
/** The members of `css` that are functions, by name. */
const fns = Object.fromEntries(Object.entries(FUNCTIONS).map(([member, name]) => [member, build(member, name)]));
//#endregion
//#region src/group.ts
const CONDITIONS = [
	"media",
	"container",
	"supports"
];
const TIED = /* @__PURE__ */ new Set([
	...Object.keys(PROPS),
	...Object.keys(FUNCTIONS),
	...Object.keys(PSEUDOS),
	...CONDITIONS,
	"keyframes",
	"positionTry"
]);
const WORDS = /[^ ,)/:;"'<>=+*[\]{}!#%.⟨⟩&|\n\t(]+\(?/g;
const words = (s) => new Set(s ? s.split(" ") : []);
const groups = new Map(Object.entries(groups$1));
const compiled$1 = /* @__PURE__ */ new Map();
const compile$1 = (id) => {
	const g = groups.get(id);
	if (!g) throw fail(`cssints: no export group cssints/${id}`);
	const members = words(g.members);
	const units = g.ban.unit ? g.ban.unit.split(" ") : [];
	return {
		id,
		members,
		props: new Set([...members].flatMap((m) => PROPS[m] ? [PROPS[m]] : [])),
		kw: new Map(Object.entries(g.ban.kw).map(([p, ws]) => [p, words(ws)])),
		fn: new Set((g.ban.fn ? g.ban.fn.split(" ") : []).map((f) => `${f}(`)),
		unit: units.length ? new RegExp(`^[0-9]+(?:e[0-9]+)?(?:${units.toSorted((a, b) => b.length - a.length).join("|")})$`) : void 0,
		query: {
			media: words(g.ban.media),
			container: words(g.ban.container),
			supports: words(g.ban.supports)
		}
	};
};
const hit = (c, own, text) => text.match(WORDS)?.find((w) => own?.has(w) || c.fn.has(w) || c.unit?.test(w));
const said = (w) => w.endsWith("(") ? `${w.slice(0, -1)}()` : w;
const refuse = (c, label, w) => fail(`cssints: ${label}: "${said(w)}" is not in cssints/${c.id}`);
const guard = (c, n) => {
	for (const [prop, value, , fallbacks] of n.__cssints) {
		const own = c.kw.get(prop);
		for (const v of fallbacks ? [value, ...fallbacks] : [value]) {
			const w = hit(c, own, v);
			if (w) throw refuse(c, prop, w);
		}
	}
	return n;
};
const chained = (c, n) => new Proxy(n, { get: (t, k) => {
	const v = Reflect.get(t, k);
	if (typeof k !== "string" || k in t || typeof v !== "function") return v;
	return (...args) => {
		const next = guard(c, v(...args));
		const prop = next.__cssints.at(-1)?.[0];
		if (prop && !c.props.has(prop)) throw fail(`cssints: ${prop} is not in cssints/${c.id} (.${k}())`);
		return chained(c, next);
	};
} });
const texts = (q) => typeof q === "string" ? [q] : q && typeof q === "object" ? Object.values(q).flatMap(texts) : [];
const wrap = (c, name, member) => {
	const fn = member;
	if (CONDITIONS.includes(name)) return (...qs) => {
		const kind = name;
		for (const q of qs.flatMap(texts)) {
			const w = hit(c, c.query[kind], q);
			if (w) throw refuse(c, `@${kind}`, w);
		}
		return fn(...qs);
	};
	if (!(name in PROPS) || typeof member !== "function") return member;
	return (...args) => {
		const made = fn(...args);
		if (!isNode(made)) return made;
		return name in CONTEXTS ? chained(c, guard(c, made)) : guard(c, made);
	};
};
/**
* The members of an export group.
* @param {Record<string, unknown>} css `css` of macro.ts, passed in so that this file imports no engine module
* @param {string} id the group: `widely-available`, `css-grid-2`, ...
* @returns {Record<string, unknown>} `css` with the members of the group, as they are, and the ones it has not throwing, naming the group, when called
*/
const groupOf = (css, id) => {
	if (id === "limited-availability") return css;
	const c = compiled$1.get(id) ?? compiled$1.set(id, compile$1(id)).get(id);
	return new Proxy(css, { get: (t, k) => {
		if (typeof k !== "string") return Reflect.get(t, k);
		if (TIED.has(k) && !c.members.has(k)) return () => {
			throw fail(`cssints: ${k} is not in cssints/${id}`);
		};
		return wrap(c, k, t[k]);
	} });
};
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
const check = (plugin, label, grammar, value) => {
	for (const v of probed(value, registry.properties)) Result.getOrThrowWith(Result.try({
		try: () => checkValueNow(label, grammar, v),
		catch: (e) => isDeclarationError(e) ? failIn(plugin, e.message) : e
	}), (e) => e);
};
const valueOf = (plugin, label, args, spacing = false) => {
	if (!args.length) throw failIn(plugin, `cssints: ${label}() expects a value`);
	if (args.some(isNode)) throw failIn(plugin, `cssints: ${label}() takes values, not styles; merge styles with cn(...)`);
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
	sets = /* @__PURE__ */ new Map();
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
		let warnings = [];
		if (typeof d.css === "function") {
			const lib = registry.lib;
			if (!lib) throw thrown(this.name, `${this.name}.${key}: the css library is not loaded`);
			const made = ran(this.name, () => d.css(lib.css));
			const nodes = Array.isArray(made) ? made : [made];
			const merged = lib.css["cn"](...nodes);
			const built = Result.getOrThrowWith(Result.try({
				try: () => lib.kernelOf(`${this.name}.${key}`, merged, marker),
				catch: (e) => e instanceof Error ? Object.assign(e, { message: this.own(e.message) }) : e
			}), (e) => e);
			css = built.css;
			warnings = built.warnings.map((w) => ({
				...w,
				value: this.own(w.value)
			}));
			if (built.kernels) this.atRules.set(key, built.kernels.map((r) => {
				if (!r.css.includes("--_")) return r;
				const name = r.key.slice(r.key.indexOf(" ") + 1);
				const scoped = `${name}-${this.name}`;
				css = css.replaceAll(name, scoped);
				return {
					...r,
					key: r.key.replace(name, scoped),
					css: this.own(r.css.replace(name, scoped))
				};
			}));
			this.sets.set(key, built.props);
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
		if (warnings.length) kernelWarnings.set(k, warnings);
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
		const set = [];
		for (const [u, s, key, kind, def] of kinds) if (kind === "kernel") {
			const k = s.kernel(key);
			const props = s.sets.get(key);
			if (props) {
				const meets = (a, b) => a.filter((p) => b.some((q) => relation(p, q) !== "apart"));
				for (const [v, other, ps] of set) {
					const both = [.../* @__PURE__ */ new Set([...meets(ps, props), ...meets(props, ps)])];
					if (other !== k.key && both.length) throw thrown(this.name, `${this.name}: kernels ${v} and ${u} both set ${both.join(", ")} (they are one element's styles and print in no set order): write those in one kernel`);
				}
				set.push([
					u,
					k.key,
					props
				]);
			}
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
				css: r.css && s.own(s.mark(r.css, own)),
				script: r.script
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
			check(name, key, grammar, value);
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
			check(name, `${key}.${m}`, g, value);
		}
		const taken = new Map(used).set(m, m);
		for (const x of meth.excludes ?? []) taken.set(x, m);
		const emitted = ran(name, () => meth.emit(value));
		return node([...self.__cssints, ...ownDecls(c, emitted)], self, next(taken));
	};
	return () => node([], base ??= grouped(c, def, def.uses ? c.carry(def.uses) : {}), next(/* @__PURE__ */ new Map()));
};
const grouped = (c, def, carry) => def.group ? {
	...carry,
	markers: [...carry.markers ?? [], [`_g-${c.name}`, "group"]]
} : carry;
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
		check(name, label, c.grammar(def), value);
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
		check(name, label, c.grammar(spec), value);
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
		const carry = made.uses ? grouped(c, def, c.carry([...uses, ...made.uses])) : base ??= grouped(c, def, c.carry(uses));
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
const lacking$1 = (keys) => [...new Set(keys.flatMap((k) => lackingOf(k).map((t) => t.join(" "))))];
const dependsOn = (path) => {
	registry.files.add(path);
};
/** What the front (scope.ts) calls; macro.ts puts it in the registry. */
const engine = {
	scope,
	lacking: lacking$1,
	dependsOn
};
//#endregion
//#region src/runtime.ts
function _cx(drops, ...a) {
	const on = a.flat(Infinity).filter(Boolean).join(" ").split(" ");
	const gone = drops.flatMap(([by, c]) => on.includes(by) ? c.split(" ") : []);
	return on.filter((c) => c && !gone.includes(c)).join(" ");
}
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
const declsOf = (what, style, conditions, allowed, sink) => {
	if (!style.__cssints.length) throw fail(`cssints: ${what} takes css.* declarations (a member call or cn(...)), got ${Formatter.formatJson(style)}`);
	if (style.markers || style.plugs || style.kernels && !(conditions && style.kernels.every((k) => k.key.startsWith("@")))) throw fail(`cssints: ${what} takes plain declarations: no marker class or kernel of a member`);
	for (const d of style.__cssints) {
		const [prop, , conds, fallbacks] = d;
		if (!conditions && conds?.length || fallbacks) throw fail(`cssints: ${what} takes declarations without ${conditions ? "" : "conditions or "}firstThatWorks(...), got ${prop}`);
		if (allowed && !allowed.test(prop)) throw fail(`cssints: ${what}: ${prop} is not allowed in @position-try, which takes inset, margin, sizing and self-alignment properties, position-anchor and position-area`);
		Result.getOrThrowWith(Result.try({
			try: () => checkNow(d, registry, true, sink),
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
const cn = (...all) => {
	const args = all.filter(Boolean);
	return node(toDecls("cn", args), carried(args));
};
const flex = member("flex");
const grid = member("grid");
const isWrapper = (v) => typeof v === "function" && Predicate.hasProperty(v, "__cond");
const wrapper = (cond) => Object.assign((...styles) => {
	if (!styles.length || !styles.every(isNode)) throw fail(`cssints: ${cond.text} wraps css.* styles, got ${Formatter.formatJson(styles.filter((s) => !isNode(s)))}`);
	const carry = carried(styles);
	const [bare] = carry.bare ?? [];
	if (bare) throw fail(`cssints: ${cond.text} wraps ${bare[0]}, the marker of kernel ${bare[1]}, with no declaration of its own: a kernel is global CSS keyed to its marker class and cannot be conditional, so the marker would apply everywhere. Put the member outside the condition; a condition can wrap the declarations a member sets (its methods)`);
	return node(merged(styles.flatMap((n) => n.__cssints.map(([p, v, inner = [], fallbacks]) => {
		if (inner.length >= 4) throw fail(`cssints: a style takes at most 4 conditions (layers ${LAYER[0]} to ${LAYER[4]}); this one has ${inner.length + 1}: ${[cond, ...inner].map((c) => c.text).join(" > ")}`);
		return [
			p,
			v,
			[cond, ...inner],
			fallbacks
		];
	}))), carry);
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
	const text = typeof selector === "string" ? selector.trim().replace(/\s+/g, " ") : "";
	let depth = 0;
	let own = false;
	let list = false;
	for (const ch of text) if (ch === "(" || ch === "[") depth++;
	else if (ch === ")" || ch === "]") depth--;
	else if (depth) continue;
	else if (ch === "&") own = true;
	else if (ch === ",") list = true;
	else if (" >+~".includes(ch)) own = false;
	if (!text.includes("&") || list) throw fail(`cssints: nest() takes one selector with & (the kernel's class): "& > *", "& p", ":root:has(&)", ".x &", got ${Formatter.formatJson(selector)}`);
	const exit = Effect.runSyncExit(checkSelector(text.replaceAll("&", "._k")));
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
		nest: true,
		...own ? { own: true } : {}
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
			try: () => checkNow(d, registry),
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
	let sel = `.${cls}`;
	let width = 0;
	for (const c of conds) if (c.text.startsWith("@")) {
		wrap.push(c.text);
		width = Math.max(width, c.rank);
	} else {
		if (c.ancestor) before += `${c.text} `;
		else if (!c.nest) sel += c.text;
		else if (c.text.lastIndexOf("&") === 0) sel += c.text.slice(1);
		else {
			const amp = `${before}${sel}`;
			sel = c.text.replaceAll("&", /[\s>+~]/.test(amp) ? `:is(${amp})` : amp);
			before = "";
		}
		ranks.push(c.rank);
	}
	const all = fallbacks ? `${value};${fallbacks.join(";")}` : value;
	const tokens = all.includes("var(--") ? [...all.matchAll(VAR)].map((m) => m[1]) : void 0;
	return {
		layer: LAYER[conds.length],
		cond: conds.length ? [width, ...ranks] : [],
		wrap,
		prop,
		css: `${before}${sel}{${fallbacks ? [...fallbacks.toReversed(), value].map((v) => `${prop}:${v}`).join(";") : `${prop}:${value}`}}`,
		tokens
	};
};
const kernelOf = (what, style, cls) => {
	const warnings = [];
	const decls = declsOf(what, style, true, void 0, warnings);
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
		props: [...new Set(decls.flatMap(([prop, , conds]) => prop.startsWith("--") || conds?.some((c) => c.nest && !c.own) ? [] : [prop]))],
		kernels: style.kernels,
		warnings
	};
};
const checkValue = (prop, value, properties) => {
	let out = [];
	for (const v of probed(value, properties)) {
		const found = Result.getOrThrowWith(Result.try({
			try: () => checkDeclarationNow(prop, v, true),
			catch: (e) => {
				if (v !== value && isDeclarationError(e)) Object.assign(e, { message: `${e.message} ("${value}" is checked as "${v}": a token stands for a value of its type)` });
				return e;
			}
		}), (e) => e);
		out = out.length ? out.concat(found) : found;
	}
	return out;
};
const checkNow = ([prop, value, , fallbacks], registry, sheet = true, sink) => {
	const { properties, userProps } = registry;
	if (userProps.has(prop)) return;
	let found = checkValue(prop, value, properties);
	if (fallbacks) {
		const lacking = [value, ...fallbacks].map((v, i) => new Set((i ? checkValue(prop, v, properties) : found).flatMap((w) => w.lacking)));
		found = found.map((w) => ({
			...w,
			lacking: w.lacking.filter((t) => lacking.every((s) => s.has(t)))
		})).filter((w) => w.lacking.length);
	}
	for (const w of found) {
		if (sink) {
			if (!(sheet && loweredOf(prop, value, w))) sink.push({
				prop,
				value,
				warning: w
			});
			continue;
		}
		const k = `${prop} ${w.key}${fallbacks ? ` ${w.lacking.join()}` : ""}`;
		if (!(sheet && loweredOf(prop, value, w))) warn(registry, k, messageOf(prop, value, w) + (fallbacks ? ", and no fallback of its firstThatWorks covers them" : ""));
	}
};
const classesNow = (decls, registry, markers) => {
	const { rules } = registry;
	const out = markers ? [...new Set(markers.map((m) => m[0]))] : [];
	for (const d of decls) {
		const cls = hashClass(d);
		checkNow(d, registry);
		if (!out.includes(cls)) out.push(cls);
		if (!rules.has(cls)) rules.set(cls, ruleOf(cls, d));
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
const isGroup = (v) => Predicate.hasProperty(v, "__cnGroup");
const headOf = Effect.fnUntraced(function* ({ __cnGroup: { statics, parts } }, at) {
	const { nodes } = yield* Registry;
	const merged = cn(...statics.map(([, s]) => s));
	const where = /* @__PURE__ */ new Map();
	for (const [pos, s] of statics) if (isNode(s)) for (const d of s.__cssints) where.set(d, pos);
	const all = nodes.get(at.file) ?? nodes.set(at.file, /* @__PURE__ */ new Map()).get(at.file);
	all.set(at.site, merged.__cssints);
	const drops = yield* Effect.try({
		try: () => dropsOf([...merged.__cssints.map((decl) => ({
			at: where.get(decl),
			decl,
			conditional: false
		})), ...parts.flatMap(([pos, site]) => (all.get(site) ?? []).map((decl) => ({
			at: pos,
			decl,
			conditional: true
		})))]),
		catch: (e) => {
			if (e instanceof MacroError) return e;
			throw e;
		}
	});
	const classes = yield* classesOf(merged, at);
	return `${CX_CALL}${Formatter.formatJson(drops)}, ${classes ? `${Formatter.formatJson(classes)}, ` : ""}`;
});
const __cnGroup = (statics, parts) => ({ __cnGroup: {
	statics,
	parts
} });
const __nocn = () => void 0;
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
	check: check$1,
	CSS,
	CSSColorValue,
	CSSImageValue,
	CSSStyleValue,
	CSSUnitValue
};
const css = new Proxy(named, { get: (t, k) => Object.hasOwn(t, k) ? t[k] : member(String(k)) });
named.css = css;
const __group = (id) => groupOf(css, id);
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
			for (const d of decls) checkNow(d, registry, false);
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
	if (isGroup(value)) return yield* headOf(value, at);
	if (isStyle(value)) return yield* inlineOf(value);
	const tokens = tokensOf(value);
	if (tokens !== void 0) return tokens;
	if (isDone(value)) return "undefined";
	if (value instanceof CSSStyleValue) return Formatter.formatJson(String(value));
	if (typeof value === "string") return Formatter.formatJson(value);
	const inert = inertOf(value);
	if (inert !== void 0) return inert;
	if (registry.tui && Predicate.hasProperty(value, "__tui")) return yield* Effect.try({
		try: () => registry.tui(value),
		catch: (e) => {
			if (e instanceof MacroError) return e;
			throw e;
		}
	});
	if (isPluginValue(value)) return void 0;
	return yield* new MacroError({ message: `cssints: site ${at.site} in ${at.file} did not produce a css.*, cv(), style(), condition or Typed OM value` });
});
const recordSite = Effect.fnUntraced(function* (at, value) {
	const { sites } = yield* Registry;
	const replacement = yield* replacementOf(at, value).pipe(Effect.mapError(located(at)));
	if (replacement === void 0) return value;
	if (isNode(value)) {
		const { nodes } = yield* Registry;
		(nodes.get(at.file) ?? nodes.set(at.file, /* @__PURE__ */ new Map()).get(at.file)).set(at.site, value.__cssints);
	}
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
	registry.at = at;
	const exit = Effect.runSyncExit(recordSite(at, value));
	registry.at = void 0;
	if (Exit.isFailure(exit)) throw Cause.squash(exit.cause);
	return exit.value;
}
//#endregion
export { CSS, CSSAtRuleValue, CSSColorValue, CSSImageValue, CSSStyleValue, CSSUnitValue, __at, __cnGroup, __group, __nocn, __site, __unseen, _cv, _cx, cn, css, cv, firstThatWorks, flex, grid, keyframes, positionTry };
