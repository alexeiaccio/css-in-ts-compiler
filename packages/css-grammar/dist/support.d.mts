import { BrowsersError } from "./errors.mjs";
import { Effect } from "effect";
import { Identifier } from "@mdn/browser-compat-data";
//#region src/support.d.ts
export type Target = [agent: string, version: string];
export declare const targets: (query?: string | undefined, path?: string | undefined) => Effect.Effect<Target[], BrowsersError, never>;
declare global {
  var __cssintsTargets: Target[] | undefined;
}
/**
 * Sets the targets the functions here default to (cssints: those of the Vite root, before each evaluation).
 * @param {Target[] | undefined} ts the targets, or `undefined` for those of process.cwd()
 */
export declare const useTargets: (ts: Target[] | undefined) => void;
export declare const get: (key: string) => Identifier | undefined;
export interface Warning {
  feature: string;
  key: string;
  lacking: string[];
}
export declare const lackingOf: (key: string, ts?: Target[], exact?: boolean) => Target[];
export declare const lacking: (key: string, ts?: Target[] | undefined, exact?: boolean | undefined) => Effect.Effect<Target[], never, never>;
/**
 * The BCD key of a keyword or function in a value of a property, by the lookup above.
 * @param {string} p the property
 * @param {string} k the keyword, or the name of the function
 * @param {boolean} fn whether `k` is a function
 * @returns {string | undefined} the key, or `undefined` when BCD has none
 */
export declare const tokenKey: (p: string, k: string, fn: boolean) => string | undefined;
export declare function supportOf(p: string, v: string, ts?: Target[]): Warning[];
export declare function browsers(lacking: string[]): string;
export declare const support: (p: string, v: string, ts?: Target[] | undefined) => Effect.Effect<Warning[], never, never>;
export declare const messageOf: (p: string, v: string, w: Warning) => string;
export declare const message: (p: string, v: string, w: Warning) => Effect.Effect<string, never, never>;
//#endregion