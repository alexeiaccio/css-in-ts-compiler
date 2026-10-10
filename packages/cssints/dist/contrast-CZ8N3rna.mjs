import { a as registry, d as MacroError, o as warn } from "./registry-n9JCX4pl.mjs";
import { l as layerStatements } from "./sheet-CO7a-mdA.mjs";
import { Effect } from "effect";
//#region src/contrast.ts
const VAR = /var\((--[^\s,)]+)\)/g;
const valueOf = (state, name, values) => {
	const def = state.defs.get(name);
	const text = values?.get(name) ?? def?.template;
	return text === void 0 ? def?.value : text.replace(VAR, (m, n) => state.defs.has(n) ? valueOf(state, n, values) : m);
};
const affectedBy = (defs, names, out = /* @__PURE__ */ new Set()) => {
	for (const n of names) if (!out.has(n)) {
		out.add(n);
		affectedBy(defs, defs.get(n)?.refs ?? [], out);
	}
	return out;
};
const together = ({ themed, layers }) => {
	const side = (before) => layerStatements([...layers.values()].flatMap((l) => l.before === before ? [l.names] : [])).flat();
	const order = [
		...side(true),
		"",
		...side(false)
	];
	const rank = (layer) => order.indexOf(layer ?? "");
	const groups = /* @__PURE__ */ new Map();
	for (const t of [...themed.values()].sort((a, b) => rank(a.layer) - rank(b.layer) || (a.key < b.key ? -1 : 1))) {
		if (!t.theme) continue;
		const { label, scope, values } = t.theme;
		const key = `${label}\t${scope ?? ""}`;
		const group = groups.get(key) ?? groups.set(key, {
			label,
			values: /* @__PURE__ */ new Map()
		}).get(key);
		for (const [n, v] of values) group.values.set(n, v);
	}
	return groups.values();
};
const verify = (check, state, { luminance, ratio, shown }) => {
	const { fg, bg, min } = check;
	const path = (n) => state.defs.get(n)?.path ?? n;
	const affecting = affectedBy(state.defs, [fg, bg]);
	const subjects = [{ label: "the default values" }];
	for (const { label, values } of together(state)) if ([...values.keys()].some((n) => affecting.has(n))) subjects.push({
		label: `theme ${label}`,
		values
	});
	const errors = [];
	for (const { label, values } of subjects) {
		const pair = [fg, bg].map((n) => {
			const text = valueOf(state, n, values) ?? "";
			return {
				name: n,
				text,
				l: luminance(text)
			};
		});
		const [f, b] = pair;
		let ok = true;
		for (const p of pair) if (p.l.why !== void 0) {
			ok = false;
			warn(state, `contrast ${p.name} ${p.text}`, `cssints: contrast is not checked for ${path(p.name)} in ${label}: "${p.text}" ${p.l.why}`, check.at);
		}
		if (!ok || f.l.lum === void 0 || b.l.lum === void 0) continue;
		const r = ratio(f.l.lum, b.l.lum);
		if (r < min) errors.push(`cssints: contrast ${shown(r)} is below ${min}: ${path(fg)} ${f.text} on ${path(bg)} ${b.text}, in ${label}`);
	}
	return errors;
};
const verifyChecks = Effect.fnUntraced(function* (select) {
	const checks = [...registry.checks.values()].filter(select);
	if (!checks.length) return;
	const colours = yield* Effect.promise(() => import("./color-C208At51.mjs"));
	for (const check of checks) {
		const errors = verify(check, registry, colours);
		if (errors.length) return yield* new MacroError({
			message: errors.join("\n"),
			...check.at
		});
	}
});
//#endregion
export { valueOf as n, verifyChecks as r, together as t };
