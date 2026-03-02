import { Effect } from "effect";

import { Lexer } from "./lexer.js";
import { LexContext } from "./contexts.js";
import type { TokenValue } from "./token.js";
import { Token } from "./token.js";

export interface ParseChunk {
  readonly start: number;
  readonly end: number;
  readonly source: string;
}

export interface ParseError {
  readonly message: string;
  readonly position: number;
}

export interface ParseResult<T> {
  readonly value: T;
  readonly errors: readonly ParseError[];
}

export const findBlockStarts = (source: string): readonly number[] => {
  const starts: number[] = [];
  let inString = false;
  let stringChar: string | null = null;
  let i = 0;

  while (i < source.length) {
    const code = source.charCodeAt(i);

    if (!inString && (code === 34 || code === 39)) {
      inString = true;
      stringChar = String.fromCharCode(code);
      i++;
      continue;
    }

    if (inString && code === source.charCodeAt(i - 1) && (stringChar === "'" || stringChar === '"')) {
      inString = false;
      stringChar = null;
      i++;
      continue;
    }

    if (inString) {
      i++;
      continue;
    }

    if (code === 92) {
      i += 2;
      continue;
    }

    if (code === 123) {
      starts.push(i + 1);
    }

    i++;
  }

  return starts;
};

export const splitIntoChunks = (source: string): readonly ParseChunk[] => {
  const chunks: ParseChunk[] = [];
  let currentStart = 0;
  let braceDepth = 0;
  let inString = false;
  let stringChar: string | null = null;

  for (let i = 0; i < source.length; i++) {
    const code = source.charCodeAt(i);

    if (!inString && (code === 34 || code === 39)) {
      inString = true;
      stringChar = String.fromCharCode(code);
      continue;
    }

    if (inString && code === source.charCodeAt(i - 1) && (stringChar === "'" || stringChar === '"')) {
      inString = false;
      stringChar = null;
      continue;
    }

    if (inString) continue;

    if (code === 92) {
      i++;
      continue;
    }

    if (code === 123) {
      braceDepth++;
      if (braceDepth === 1) {
        chunks.push({ start: currentStart, end: i, source: source.slice(currentStart, i) });
        currentStart = i + 1;
      }
    } else if (code === 125) {
      braceDepth--;
    }
  }

  if (currentStart < source.length) {
    chunks.push({ start: currentStart, end: source.length, source: source.slice(currentStart) });
  }

  return chunks;
};

export const parseChunk = (
  chunk: ParseChunk,
): Effect.Effect<ParseResult<readonly TokenValue[]>, never> =>
  Effect.gen(function* () {
    const lexer = new Lexer(chunk.source);
    const tokens: TokenValue[] = [];

    while (lexer.getPos() < lexer.length) {
      const token = lexer.next(LexContext.Normal);
      tokens.push(token);
      if (token.token === Token.EOF) break;
    }

    const lexerErrors = lexer.errors ?? [];
    return {
      value: tokens,
      errors: lexerErrors.map((e) => ({ message: e.message, position: e.pos })),
    };
  });

export const parseStylesheet = (source: string): Effect.Effect<readonly TokenValue[], Error> =>
  Effect.gen(function* () {
    const chunks = splitIntoChunks(source);
    const allTokens: TokenValue[] = [];

    for (const chunk of chunks) {
      const result = yield* parseChunk(chunk);
      if (result.errors.length > 0) {
        yield* Effect.fail(new Error(`Parse errors: ${result.errors.map((e) => e.message).join(", ")}`));
      }
      allTokens.push(...result.value);
    }

    return allTokens;
  });
