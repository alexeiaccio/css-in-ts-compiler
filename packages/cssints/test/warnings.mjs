// Support warnings: each at the site that made it (Vite's `loc`), once per file of the site, property and feature per
// build; in dev again once that file is edited, not on the update of an unrelated module; `api.forgetWarnings` lets a
// tool hear them again. Run: node warnings.mjs
import assert from "node:assert/strict";

import { createLogger, createServer } from "vite";

import cssints from "../src/plugin.ts";

const root = import.meta.dirname;
const plugins = cssints();
const [main] = plugins;
const logs = [];
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("silent"),
  server: { middlewareMode: true, watch: null, ws: false, hmr: false },
  plugins: [
    {
      // the logs as the plugin hands them to Vite, before Vite formats them
      name: "spy",
      enforce: "pre",
      configResolved(c) {
        const plugin = c.plugins.find((p) => p.name === "cssints");
        const { handler } = plugin.transform;
        plugin.transform.handler = function (code, id) {
          const ctx = Object.create(this, { warn: { value: (w) => logs.push(w) } });
          return handler.call(ctx, code, id);
        };
      },
    },
    ...plugins,
  ],
});
const client = server.environments.client;
const std = `${root}/fixtures/line-clamp-std.ts`;
const again = `${root}/fixtures/line-clamp-again.ts`;
const transform = async (file) => {
  client.moduleGraph.invalidateAll();
  logs.length = 0;
  await client.transformRequest(file.slice(root.length));
  return logs.splice(0);
};
const hotUpdate = (file) =>
  main.hotUpdate.call({ environment: client }, { file, modules: [] });

// located: the file, the line (1-based) and the column (0-based) of the css.* call, as Vite's loc
const [first, ...rest] = await transform(std);
assert.deepEqual(rest, []);
assert.match(first.message, /^line-clamp: the property in "3" is not supported by /);
assert.equal(first.id, std);
assert.deepEqual(first.loc, { file: std, line: 3, column: 21 });

// once per build: the same module transformed again says nothing
assert.deepEqual(await transform(std), []);
// once per file: another file with the same declaration says it at its own site
assert.deepEqual(
  (await transform(again)).map((w) => w.loc),
  [{ file: again, line: 4, column: 30 }],
);

// dev: the update of an unrelated module repeats nothing; an edit of the file says its warnings again
hotUpdate(again);
assert.deepEqual(await transform(std), []);
hotUpdate(std);
assert.equal((await transform(std)).length, 1);

// a tool (the MCP's compile): every warning again, or those of some files
plugins[0].api.forgetWarnings([again]);
assert.deepEqual(await transform(std), []);
assert.equal((await transform(again)).length, 1);
plugins[0].api.forgetWarnings();
assert.equal((await transform(std)).length, 1);

await server.close();
console.log("warnings: located, once per file per build, again after an edit or forgetWarnings");
