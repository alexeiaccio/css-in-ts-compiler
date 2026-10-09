import { BrowsersError } from "./errors.mjs";
import { Effect } from "effect";
//#region src/browsers.ts
const browserslist = process.getBuiltinModule("node:module").createRequire(import.meta.url)("browserslist");
const browsers = Effect.fn("browsers")(function* (query, path) {
	return yield* Effect.try({
		try: () => browserslist(query, path === void 0 ? void 0 : { path }),
		catch: (e) => new BrowsersError({
			message: e instanceof Error ? e.message : String(e),
			query
		})
	});
});
//#endregion
export { browsers };
