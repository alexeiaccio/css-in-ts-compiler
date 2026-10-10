// A style module whose imports resolve through the app's config (cssints-qnif): `resolve.alias` and the ssr
// environment's conditions. The dev server evaluates it in its own ssr environment; a build on the plugin's evaluation
// server, which takes the same options. Both make the same classes. Run: node build-resolve.mjs
import assert from "node:assert/strict";

import { build, createServer, defaultServerConditions } from "vite";

import cssints from "../src/plugin.ts";

const root = `${import.meta.dirname}/fixtures/alias`;
const config = {
  root,
  configFile: false,
  logLevel: "warn",
  resolve: {
    alias: [
      { find: /^@space$/, replacement: `${root}/space.ts` },
      { find: /^tone$/, replacement: `${root}/tone` },
    ],
  },
  ssr: { resolve: { conditions: [...defaultServerConditions, "tone-custom"] } },
};

const plugins = cssints();
const server = await createServer({
  ...config,
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
await server.environments.client.transformRequest("/style.ts");
const dev = plugins[0].api.sheet([`${root}/style.ts`]);
await server.close();
assert.match(dev, /padding:3px/, dev);
assert.match(dev, /color:(?:rebeccapurple|#639)\b/, dev);

const out = await build({ ...config, plugins: cssints(), build: { write: false, minify: false } });
const files = [out].flat()[0].output;
const sheet = files.find((f) => f.fileName.endsWith(".css"))?.source;
assert.match(String(sheet), /padding:3px/, String(sheet));
assert.match(String(sheet), /color:(?:rebeccapurple|#639)\b/, String(sheet));
console.log("build resolve ok");
