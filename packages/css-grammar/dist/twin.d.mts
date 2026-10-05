import { ParseError, TwinError } from "./errors.mjs";
import { Node, nullable } from "./twin-core.mjs";
import { Effect } from "effect";
//#region src/twin.d.ts
/** The grammar as a tree, memoized by its text. */
export declare const parse: (grammar: string) => Effect.Effect<Node, ParseError, never>;
/** Whether `s` is a complete value of the grammar `syntax`; `pending`: a var(), env() or if() in it stands for any value. */
export declare const matches: (syntax: string, s: string, pending?: boolean | undefined) => Effect.Effect<boolean, TwinError, never>;
/** Twin of Valid<P, S>: the value, or the furthest point it reached and what the grammar expected there. */
export declare const valid: (p: string, s: string) => Effect.Effect<string, TwinError, never>;
//#endregion
export { type Node, nullable };