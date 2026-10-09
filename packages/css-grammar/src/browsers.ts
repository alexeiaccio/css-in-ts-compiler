// The target browsers, one query for the BCD support warnings (support.ts) and the LightningCSS targets: the
// browserslist config found from a directory (the Vite root of a build: cssints sets it per evaluation, support.ts
// `useTargets`), else from process.cwd() (cssints/vite `targets` and `cssTarget`, computed when vite.config.ts is
// imported, before the root is known). BROWSERSLIST overrides both.
import { Effect } from "effect";

import { BrowsersError } from "./errors.ts";
import type browserslistT from "browserslist";

// Node's require, not import: imported through the Vite Module Runner, browserslist left the runner's
// server.close() pending (run.mjs exited 13 on risk5 + risk6). Cause not found; require sidesteps it.
// getBuiltinModule, not `import "node:module"`: the client build scans macro.ts and warns on node: imports.
const browserslist = process.getBuiltinModule("node:module").createRequire(import.meta.url)(
  "browserslist",
) as typeof browserslistT;

// No query: browserslist's own lookup, `BROWSERSLIST`, then the config found upward from `path` (default
// process.cwd(); package.json "browserslist", .browserslistrc; the section of BROWSERSLIST_ENV, NODE_ENV or
// production), else `defaults`.
export const browsers = Effect.fn("browsers")(function* (
  query?: string,
  path?: string,
): Effect.fn.Return<string[], BrowsersError> {
  return yield* Effect.try({
    try: () => browserslist(query, path === undefined ? undefined : { path }),
    catch: (e) => new BrowsersError({ message: e instanceof Error ? e.message : String(e), query }),
  });
});
