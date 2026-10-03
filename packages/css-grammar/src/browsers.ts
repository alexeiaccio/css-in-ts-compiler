// The target browsers, one query for the BCD support warnings (support.ts) and the LightningCSS targets
// (cssints/vite `targets`, `cssTarget`), read once per process from the browserslist config of process.cwd(): the
// exports are computed when vite.config.ts is imported, before the Vite root is known, so the warnings read the same
// place. BROWSERSLIST overrides it.
import { Effect } from "effect";

import { BrowsersError } from "./errors.ts";
import type browserslistT from "browserslist";

// Node's require, not import: imported through the Vite Module Runner, browserslist left the runner's
// server.close() pending (run.mjs exited 13 on risk5 + risk6). Cause not found; require sidesteps it.
// getBuiltinModule, not `import "node:module"`: the client build scans macro.ts and warns on node: imports.
const browserslist = process.getBuiltinModule("node:module").createRequire(import.meta.url)(
  "browserslist",
) as typeof browserslistT;

// No query: browserslist's own lookup, `BROWSERSLIST`, then the config found upward from process.cwd() (package.json
// "browserslist", .browserslistrc; the section of BROWSERSLIST_ENV, NODE_ENV or production), else `defaults`.
export const browsers = Effect.fn("browsers")(function* (
  query?: string,
): Effect.fn.Return<string[], BrowsersError> {
  return yield* Effect.try({
    try: () => browserslist(query),
    catch: (e) => new BrowsersError({ message: e instanceof Error ? e.message : String(e), query }),
  });
});
