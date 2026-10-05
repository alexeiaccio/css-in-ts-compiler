import { BrowsersError } from "./errors.mjs";
import { Effect } from "effect";
import { Identifier } from "@mdn/browser-compat-data";
//#region src/support.d.ts
export type Target = [agent: string, version: string];
export declare const targets: (query?: string | undefined) => Effect.Effect<Target[], BrowsersError, never>;
export declare const get: (key: string) => Identifier | undefined;
export interface Warning {
  feature: string;
  key: string;
  lacking: string[];
}
export declare const lackingOf: (key: string, ts?: Target[], exact?: boolean) => Target[];
export declare const lacking: (key: string, ts?: Target[] | undefined, exact?: boolean | undefined) => Effect.Effect<Target[], never, never>;
export declare function supportOf(p: string, v: string, ts?: Target[]): Warning[];
export declare function browsers(lacking: string[]): string;
export declare const support: (p: string, v: string, ts?: Target[] | undefined) => Effect.Effect<Warning[], never, never>;
export declare const messageOf: (p: string, v: string, w: Warning) => string;
export declare const message: (p: string, v: string, w: Warning) => Effect.Effect<string, never, never>;
//#endregion