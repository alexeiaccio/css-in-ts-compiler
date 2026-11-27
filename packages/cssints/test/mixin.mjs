import assert from "node:assert/strict";

import { createServer } from "vite";

import cssints from "../src/plugin.ts";

process.chdir(import.meta.dirname);
const root = `${import.meta.dirname}/fixtures`;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  logLevel: "error",
  server: { middlewareMode: true, ws: false },
  plugins,
});

try {
  const code = (await server.environments.client.transformRequest("/helper-use.ts")).code;
  const css = plugins[0].api.sheet([`${root}/helper-use.ts`]);
  const classes = (name) => new RegExp(`export const ${name} = "([^"]*)"`).exec(code)[1].split(" ");
  const rule = (declaration) => {
    const found = new RegExp(`\\.(_\\w+)\\{${declaration}\\}`).exec(css);
    assert.ok(found, `${declaration} is in the sheet`);
    return found[1];
  };

  const padding = rule("padding:1rem");
  assert.equal(
    css.match(/\{padding:1rem\}/g).length,
    1,
    "one rule for the helper's padding, not one per call site",
  );
  assert.ok(classes("b").includes(padding), "a call site gets the helper's class");
  assert.ok(
    !classes("overridden").includes(padding),
    "the caller's p(0) replaces the helper's p(4)",
  );
  assert.ok(classes("overridden").includes(rule("padding:0rem")));
  assert.ok(
    classes("overridden").includes(rule("border-radius:0.5rem")),
    "what the caller does not set stays",
  );
  assert.ok(
    new RegExp(`@media \\(width >= 40rem\\) \\{\\s*\\.${rule("inline-size:12rem")}\\{`).test(css),
    "a helper applies its condition to the block the caller passes",
  );
  console.log("mixin ok: a helper's declarations are shared, and a caller replaces what it sets");
} finally {
  await server.close();
}
