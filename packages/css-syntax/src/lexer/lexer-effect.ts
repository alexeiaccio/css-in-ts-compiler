import { Effect, Data } from "effect";

import type { TokenValue } from "./token.js";

import { LexContext } from "./contexts.js";
import { Lexer } from "./lexer.js";
import { Token } from "./token.js";

class LexerError extends Data.TaggedError("LexerError")<{
	readonly message: string;
	readonly position: number;
	readonly source: string;
}> {}

/**
 * Options for creating a lexer instance
 */
export interface LexerOptions {
	/** The CSS source code to tokenize */
	readonly source: string;
}

/**
 * Execute a function with a lexer instance, handling errors effectfully
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 *
 * const result = withLexer("color: red", (lexer) =>
 *   Effect.sync(() => lexer.next(LexContext.Normal))
 * );
 * ```
 */
export const withLexer = <A, E>(
	source: string,
	f: (lexer: Lexer) => Effect.Effect<A, E>,
): Effect.Effect<A, LexerError | E> =>
	Effect.try({
		try: () => {
			const lexer = new Lexer(source);
			return Effect.runSync(f(lexer));
		},
		catch: (e) => new LexerError({ message: String(e), position: 0, source }),
	});

/**
 * Tokenize a CSS string using the Normal lexing context
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 *
 * const tokens = Effect.runSync(lexAll(".foo { color: red }"));
 * // [{ token: "Delim", value: ".", ... }, { token: "Ident", value: "foo", ... }, ...]
 * ```
 */
export const lexAll = (source: string): Effect.Effect<readonly TokenValue[], LexerError> =>
	withLexer(source, (lexer) =>
		Effect.sync(() => {
			const tokens: TokenValue[] = [];
			while (lexer.getPos() < lexer.length) {
				const token = lexer.next(LexContext.Normal);
				tokens.push(token);
				if (token.token === Token.EOF) break;
			}
			return tokens;
		}),
	);

/**
 * Tokenize a CSS value definition using the ValueDef lexing context
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 *
 * const tokens = Effect.runSync(lexValue("10px solid red"));
 * // [{ token: "Dimension", value: "10px", number: 10, unit: "px" }, ...]
 * ```
 */
export const lexValue = (source: string): Effect.Effect<readonly TokenValue[], LexerError> =>
	withLexer(source, (lexer) =>
		Effect.sync(() => {
			const tokens: TokenValue[] = [];
			while (lexer.getPos() < lexer.length) {
				const token = lexer.next(LexContext.ValueDef);
				tokens.push(token);
				if (token.token === Token.EOF) break;
			}
			return tokens;
		}),
	);

/**
 * Create a new Lexer instance for a given CSS source
 *
 * @example
 * ```ts
 * const lexer = createLexer("color: red");
 * const token = lexer.next(LexContext.Normal);
 * ```
 */
export const createLexer = (source: string): Lexer => new Lexer(source);

export { LexerError };
export { Lexer, LexContext, Token, type TokenValue };
