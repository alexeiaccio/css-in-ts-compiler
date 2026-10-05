import { QueryKind } from "./query.mjs";
import { RuleError, TwinError } from "./errors.mjs";
import { Warning } from "./support.mjs";
import { Effect } from "effect";
//#region src/check.d.ts
export type DeclarationError = TwinError | RuleError;
export declare const isDeclarationError: (e: unknown) => e is DeclarationError;
export declare function checkDeclarationNow(p: string, v: string, warnings: boolean): Warning[];
export declare const checkValueNow: (label: string, grammar: string, v: string) => void;
/** The support warnings of `p: v` (none unless `warnings`), or why the declaration is invalid. */
export declare const checkDeclaration: (p: string, v: string, warnings: boolean) => Effect.Effect<Warning[], DeclarationError, never>;
export declare function checkQueryNow(kind: QueryKind, q: string): void;
/** Twin of ValidQuery<K, S> (query.ts): the query of a media(), container() or supports() call is valid, or why not. */
export declare const checkQuery: (kind: "media" | "container" | "supports", q: string) => Effect.Effect<void, TwinError, never>;
/** The selector of a `css.global()` call is a <complex-selector-list>, or why not (selector.ts). */
export declare const checkSelector: (selector: string) => Effect.Effect<void, TwinError, never>;
//#endregion