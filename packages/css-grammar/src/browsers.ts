// The target browsers, one query for the BCD support warnings (support.ts) and the LightningCSS targets
// (cssints/vite `targets`). BROWSERSLIST overrides it.
import { Effect } from "effect";

import { BrowsersError } from "./errors.ts";
import type browserslistT from "browserslist";

// Node's require, not import: imported through the Vite Module Runner, browserslist left the runner's
// server.close() pending (run.mjs exited 13 on risk5 + risk6). Cause not found; require sidesteps it.
// getBuiltinModule, not `import "node:module"`: the client build scans macro.ts and warns on node: imports.
const browserslist: typeof browserslistT = process
  .getBuiltinModule("node:module")
  .createRequire(import.meta.url)("browserslist");

export const browsers = Effect.fn("browsers")(function* (
  query = process.env.BROWSERSLIST ?? "defaults",
): Effect.fn.Return<string[], BrowsersError> {
  return yield* Effect.try({
    try: () => browserslist(query),
    catch: (e) => new BrowsersError({ message: e instanceof Error ? e.message : String(e), query }),
  });
});
