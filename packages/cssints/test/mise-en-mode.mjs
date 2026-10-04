// cssints/mise-en-mode at build time: a theme under [data-mode="…"], in the layer of its source (app < author < viewer),
// split by aspect (a bare marker or a `expression/aspect` fragment), and confined with @scope when asked.
// Run: node mise-en-mode.mjs
import assert from "node:assert/strict";

import { createLogger, createServer } from "vite";

const { default: cssints } = await import("../src/plugin.ts");

const plugins = cssints();
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  customLogger: createLogger("warn"),
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const sheet = (f) => plugins[0].api.sheet([`${import.meta.dirname}/fixtures/${f}`]);
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;

const transformed = await code("mise-en-mode-use.ts");
const css = sheet("mise-en-mode-use.ts");
console.log(css);

assert.ok(css.includes("@layer app, author, viewer;"), `layer order\n${css}`);

// fragments (Rule 4): each aspect matches the bare marker or its `expression/aspect` token
assert.ok(
  css.includes(
    '@layer app { :where([data-mode="dark"], [data-mode~="dark/color"]) { --color-bg: #0b0b0f } }',
  ),
  `color fragment\n${css}`,
);
assert.ok(
  css.includes(
    '@layer app { :where([data-mode="dark"], [data-mode~="dark/typography"]) { --typography-text-primary-size: 1.5rem } }',
  ),
  `typography fragment\n${css}`,
);
assert.ok(
  css.includes('@layer viewer { :where([data-mode="dark"], [data-mode~="dark/color"]) { --color-bg: #101018 } }'),
  `viewer color\n${css}`,
);
assert.ok(
  css.includes(
    '@layer author { :where([data-mode="com.alice.midnight"], [data-mode~="com.alice.midnight/color"]) { --color-bg: #0a0a12 } }',
  ),
  `dotted expression\n${css}`,
);

// containment (Rule 7): a foreign look confined to its content subtree
assert.ok(
  css.includes(
    '@layer author { @scope (article.post) { :where([data-mode="hero"], [data-mode~="hero/color"]) { --color-bg: #123456 } } }',
  ),
  `contained\n${css}`,
);

assert.ok(!transformed.includes("cssints/mise-en-mode"), `no runtime import\n${transformed}`);

await server.close();
console.log("mise-en-mode: ok");
