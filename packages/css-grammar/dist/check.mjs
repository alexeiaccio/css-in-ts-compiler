import { InvalidValueError, RuleError, isTwinError } from "./errors.mjs";
import { syntaxes } from "./mdn.mjs";
import { ENTRY } from "./query.mjs";
import { consume, parseGrammar, spaced, valid } from "./twin-core.mjs";
import { violation } from "./rules.mjs";
import { checkSelectorNow } from "./selector.mjs";
import { supportOf } from "./support.mjs";
import { Effect } from "effect";
//#region src/check.ts
const isDeclarationError = (e) => isTwinError(e) || e instanceof RuleError;
const passed = /* @__PURE__ */ new Set();
function checkDeclarationNow(p, v, warnings) {
	if (p.startsWith("--")) return [];
	const key = `${p}\0${v}`;
	if (!passed.has(key)) {
		valid(p, v);
		const error = violation(p, v);
		if (error) throw error;
		passed.add(key);
	}
	return warnings ? supportOf(p, v) : [];
}
const checkValueNow = (label, grammar, v) => {
	valid(label, v, grammar);
};
/** The support warnings of `p: v` (none unless `warnings`), or why the declaration is invalid. */
const checkDeclaration = Effect.fnUntraced(function* (p, v, warnings) {
	return yield* Effect.try({
		try: () => checkDeclarationNow(p, v, warnings),
		catch: (e) => {
			if (isDeclarationError(e)) return e;
			throw e;
		}
	});
});
function checkQueryNow(kind, q) {
	const syntax = syntaxes;
	const v = spaced(q).trimStart();
	const ctx = {
		len: v.length,
		far: -1,
		expected: /* @__PURE__ */ new Set()
	};
	const rs = consume(parseGrammar(syntax[ENTRY[kind]]), v, ctx);
	if (rs.has("")) return;
	for (const r of rs) {
		const at = v.length - r.length;
		if (at > ctx.far) Object.assign(ctx, {
			far: at,
			expected: /* @__PURE__ */ new Set()
		});
		if (at === ctx.far) ctx.expected.add("end of query");
	}
	const token = /^[^ ,)]*/.exec(v.slice(ctx.far))[0];
	const expected = [...ctx.expected];
	throw new InvalidValueError({
		message: `@${kind}: ${token ? `unexpected "${token}"` : "unexpected end"} in "${q}", expected ${expected.join(" | ")}`,
		property: `@${kind}`,
		value: q,
		position: ctx.far,
		expected
	});
}
/** Twin of ValidQuery<K, S> (query.ts): the query of a media(), container() or supports() call is valid, or why not. */
const checkQuery = Effect.fnUntraced(function* (kind, q) {
	return yield* Effect.try({
		try: () => checkQueryNow(kind, q),
		catch: (e) => {
			if (isTwinError(e)) return e;
			throw e;
		}
	});
});
/** The selector of a `css.global()` call is a <complex-selector-list>, or why not (selector.ts). */
const checkSelector = Effect.fnUntraced(function* (selector) {
	return yield* Effect.try({
		try: () => checkSelectorNow(selector),
		catch: (e) => {
			if (isTwinError(e)) return e;
			throw e;
		}
	});
});
//#endregion
export { checkDeclaration, checkDeclarationNow, checkQuery, checkQueryNow, checkSelector, checkValueNow, isDeclarationError };
