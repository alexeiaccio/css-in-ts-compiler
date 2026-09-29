// The runtime twin of css.ts behind Effect: the recognizer itself is twin-core.ts (plain code, the hot path), and
// these are its boundaries. Failures are tagged errors (errors.ts) instead of thrown TypeErrors.
//
// `matches` and `valid` run once per declaration, so they are `Effect.fnUntraced`: a span each would cost ~4 µs a
// call (over the perf budget of a module with a few dozen declarations). Their callers are `Effect.fn`.
import { Effect } from "effect";

import { isTwinError, ParseError, type TwinError } from "./errors.ts";
import { matches as matchesCore, parseGrammar, valid as validCore, type Node } from "./twin-core.ts";

export { nullable } from "./twin-core.ts";
export type { Node };

const grammarError = (grammar: string, e: unknown) =>
  isTwinError(e) ? e : new ParseError({ message: `grammar: ${String(e)}`, grammar, position: 0, expected: [] });

/** The grammar as a tree, memoized by its text. */
export const parse = Effect.fn("twin.parse")(function* (grammar: string): Effect.fn.Return<Node, ParseError> {
  return yield* Effect.try({
    try: () => parseGrammar(grammar),
    catch: (e) => (e instanceof ParseError ? e : new ParseError({ message: `grammar: ${String(e)}`, grammar, position: 0, expected: [] })),
  });
});

/** Whether `s` is a complete value of the grammar `syntax`. */
export const matches = Effect.fnUntraced(function* (syntax: string, s: string): Effect.fn.Return<boolean, TwinError> {
  return yield* Effect.try({ try: () => matchesCore(syntax, s), catch: (e) => grammarError(syntax, e) });
});

/** Twin of Valid<P, S>: the value, or the furthest point it reached and what the grammar expected there. */
export const valid = Effect.fnUntraced(function* (p: string, s: string): Effect.fn.Return<string, TwinError> {
  return yield* Effect.try({ try: () => validCore(p, s), catch: (e) => grammarError(p, e) });
});
