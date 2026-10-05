import { browsers as browsers$1 } from "./browsers.mjs";
import { properties, syntaxes } from "./mdn.mjs";
import { Effect } from "effect";
//#region src/support.ts
const bcd = process.getBuiltinModule("node:module").createRequire(import.meta.url)("@mdn/browser-compat-data");
const props = properties;
const syns = syntaxes;
const BCD_NAME = {
	chrome: "chrome",
	and_chr: "chrome_android",
	edge: "edge",
	firefox: "firefox",
	and_ff: "firefox_android",
	safari: "safari",
	ios_saf: "safari_ios",
	opera: "opera",
	op_mob: "opera_android",
	samsung: "samsunginternet_android",
	android: "webview_android",
	ie: "ie"
};
const targets = Effect.fn("support.targets")(function* (query) {
	return (yield* browsers$1(query)).map((t) => [t.split(" ")[0], t.split(" ")[1].split("-")[0]]).filter(([a]) => BCD_NAME[a]);
});
const DEFAULT = Effect.runSync(targets());
const cmp = (a, b) => {
	const x = a.replace("≤", "").split("."), y = b.split(".");
	for (let i = 0; i < Math.max(x.length, y.length); i++) {
		const d = Number(x[i] ?? 0) - Number(y[i] ?? 0);
		if (d) return d;
	}
	return 0;
};
function supports(s, v, exact = false) {
	if (!s) return true;
	return [s].flat().some((x) => {
		if (x.prefix || x.alternative_name || x.flags || exact && x.partial_implementation) return false;
		const added = x.version_added;
		if (typeof added !== "string") return added !== false;
		if (added === "preview" || cmp(added, v) > 0) return false;
		return !(typeof x.version_removed === "string" && cmp(x.version_removed, v) <= 0);
	});
}
function reach(syntax, seen = /* @__PURE__ */ new Set()) {
	for (const [, q, n] of syntax.matchAll(/<('?)([a-z-]+)(?:\(\))?'?(?: \[[^\]]*\])?>/g)) {
		if (seen.has(q + n) || !q && n === "declaration") continue;
		seen.add(q + n);
		const g = q ? props[n] : syns[n] ?? syns[`${n}()`];
		if (g) reach(g, seen);
	}
	return seen;
}
const get = (key) => key.split(".").reduce((n, k) => n?.[k] ?? n?.[k.toLowerCase()], bcd);
const lacks = (c, on, exact = false) => on.filter(([a, ver]) => !supports(c.support[BCD_NAME[a]], ver, exact));
const lackingOf = (key, ts = DEFAULT, exact = false) => {
	const c = get(key)?.__compat;
	return c ? lacks(c, ts, exact) : [];
};
const lacking = Effect.fnUntraced(function* (key, ts = DEFAULT, exact = false) {
	return yield* Effect.sync(() => lackingOf(key, ts, exact));
});
const reached = /* @__PURE__ */ new Map();
const reachOf = (p) => {
	let r = reached.get(p);
	if (!r) {
		const all = [...reach(props[p] ?? "")];
		r = [all.filter((t) => get(`css.types.${t}`)), [p, ...all.filter((q) => q.startsWith("'")).map((q) => q.slice(1))]];
		reached.set(p, r);
	}
	return r;
};
const known = /* @__PURE__ */ new Map();
function supportOf(p, v, ts = DEFAULT) {
	if (ts !== DEFAULT) return compute(p, v, ts);
	const key = `${p}\0${v}`;
	let out = known.get(key);
	if (!out) known.set(key, out = compute(p, v, ts));
	return out;
}
function compute(p, v, ts) {
	const pc = get(`css.properties.${p}`)?.__compat;
	if (!pc) return [];
	const [types, owners] = reachOf(p);
	const found = [];
	const code = v.replace(/"[^"]*"|'[^']*'/g, "");
	for (const { 0: tok, 1: fn, index } of code.matchAll(/(?<![\w.#-])-?[A-Za-z_][\w-]*(\()?/g)) {
		const k = fn ? tok.slice(0, -1) : tok;
		const rel = tok === "from" ? /([a-z-]+)\(\s*$/.exec(code.slice(0, index))?.[1] : void 0;
		const key = (rel ? [`css.types.color.${rel}.relative_syntax`] : [
			...owners.map((q) => `css.properties.${q}.${fn ? `${k}_function` : k}`),
			...fn ? owners.map((q) => `css.properties.${q}.${k}`) : [],
			...fn ? [`css.types.${k}`] : [],
			...types.map((t) => `css.types.${t}.${k}`)
		]).find((x) => get(x)?.__compat);
		if (key) found.push([fn ? `${k}()` : k, key]);
	}
	if (/"[^"]*"|'[^']*'/.test(v)) {
		const key = owners.map((q) => `css.properties.${q}.string`).find((x) => get(x)?.__compat);
		if (key) found.push(["string", key]);
	}
	const off = lacks(pc, ts).map((t) => t.join(" "));
	const out = off.length ? [{
		feature: p,
		key: `css.properties.${p}`,
		lacking: off
	}] : [];
	const on = ts.filter((t) => !off.includes(t.join(" ")));
	for (const [feature, key] of found) {
		const c = get(key)?.__compat;
		if (!c || out.some((w) => w.key === key)) continue;
		const lacking = lacks(c, on).map((t) => t.join(" "));
		if (lacking.length) out.push({
			feature,
			key,
			lacking
		});
	}
	return out;
}
function browsers(lacking) {
	const by = /* @__PURE__ */ new Map();
	for (const t of lacking) {
		const [a, ver] = t.split(" ");
		by.set(a, [...by.get(a) ?? [], ver]);
	}
	return [...by].map(([a, vs]) => {
		vs.sort(cmp);
		return vs.length === 1 ? `${a} ${vs[0]}` : `${a} ${vs[0]}-${vs.at(-1)}`;
	}).join(", ");
}
const support = Effect.fnUntraced(function* (p, v, ts = DEFAULT) {
	return yield* Effect.sync(() => supportOf(p, v, ts));
});
const messageOf = (p, v, w) => `${p}: ${w.feature === p ? "the property" : `"${w.feature}"`} in "${v}" is not supported by ${browsers(w.lacking)} (${w.key})`;
const message = Effect.fn("support.message")(function* (p, v, w) {
	return yield* Effect.sync(() => messageOf(p, v, w));
});
//#endregion
export { browsers, get, lacking, lackingOf, message, messageOf, support, supportOf, targets };
