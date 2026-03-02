import { Effect, Data } from "effect";

import { Lexer } from "./lexer.js";
import { LexContext } from "./contexts.js";
import type { TokenValue } from "./token.js";
import { Token } from "./token.js";

class LexerError extends Data.TaggedError("LexerError")<{
  readonly message: string;
  readonly position: number;
  readonly source: string;
}> {}

export interface LexerOptions {
  readonly source: string;
}

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

export const lexAll = (source: string): Effect.Effect<readonly TokenValue[], LexerError> =>
  withLexer(source, (lexer) =>
    Effect.gen(function* () {
      const tokens: TokenValue[] = [];
      while (lexer.getPos() < lexer.length) {
        const token = lexer.next(LexContext.Normal);
        tokens.push(token);
        if (token.token === Token.EOF) break;
      }
      return tokens;
    }));

export const lexValue = (source: string): Effect.Effect<readonly TokenValue[], LexerError> =>
  withLexer(source, (lexer) =>
    Effect.gen(function* () {
      const tokens: TokenValue[] = [];
      while (lexer.getPos() < lexer.length) {
        const token = lexer.next(LexContext.ValueDef);
        tokens.push(token);
        if (token.token === Token.EOF) break;
      }
      return tokens;
    }));

export const createLexer = (source: string): Lexer => new Lexer(source);

export { LexerError };
export { Lexer, LexContext, Token, type TokenValue };
