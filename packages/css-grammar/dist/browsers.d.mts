import { BrowsersError } from "./errors.mjs";
import { Effect } from "effect";
//#region src/browsers.d.ts
export declare const browsers: (query?: string | undefined, path?: string | undefined) => Effect.Effect<string[], BrowsersError, never>;
//#endregion