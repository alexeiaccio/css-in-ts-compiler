import { ParseError, isTwinError } from "./errors.mjs";
import { matches as matches$1, nullable, parseGrammar, valid as valid$1 } from "./twin-core.mjs";
import { Effect } from "effect";
//#region src/twin.ts
const grammarError = (grammar, e) => isTwinError(e) ? e : new ParseError({
	message: `grammar: ${String(e)}`,
	grammar,
	position: 0,
	expected: []
});
/** The grammar as a tree, memoized by its text. */
const parse = Effect.fn("twin.parse")(function* (grammar) {
	return yield* Effect.try({
		try: () => parseGrammar(grammar),
		catch: (e) => e instanceof ParseError ? e : new ParseError({
			message: `grammar: ${String(e)}`,
			grammar,
			position: 0,
			expected: []
		})
	});
});
/** Whether `s` is a complete value of the grammar `syntax`; `pending`: a var(), env() or if() in it stands for any value. */
const matches = Effect.fnUntraced(function* (syntax, s, pending) {
	return yield* Effect.try({
		try: () => matches$1(syntax, s, pending),
		catch: (e) => grammarError(syntax, e)
	});
});
/** Twin of Valid<P, S>: the value, or the furthest point it reached and what the grammar expected there. */
const valid = Effect.fnUntraced(function* (p, s) {
	return yield* Effect.try({
		try: () => valid$1(p, s),
		catch: (e) => grammarError(p, e)
	});
});
//#endregion
export { matches, nullable, parse, valid };
