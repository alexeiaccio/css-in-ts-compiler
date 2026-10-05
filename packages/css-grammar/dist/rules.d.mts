import { RuleError } from "./errors.mjs";
import { Effect } from "effect";
//#region src/rules.d.ts
export declare function violation(p: string, v: string): RuleError | undefined;
export declare const checkRules: (p: string, v: string) => Effect.Effect<string, RuleError, never>;
//#endregion