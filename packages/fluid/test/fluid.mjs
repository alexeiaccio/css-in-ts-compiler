// @cssints/fluid through the engine: the clamp() it computes, the container variant, and the build errors (WCAG 1.4.4,
// units, ranges, grammar). Run: node test/fluid.mjs
import assert from "node:assert/strict";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

const root = `${import.meta.dirname}/fixtures`;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("warn"),
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${root}/${f}`]);
const failure = async (f) => {
  try {
    await code(f);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};

const transformed = await code("use.ts");
const css = sheet("use.ts");
console.log(css);
const has = (decl) => assert.ok(css.includes(decl), `${decl}\n${css}`);

// 1rem at 20rem, 1.5rem at 80rem: slope 0.5/60 per rem of width, intercept 1 - 20 * 0.5/60
has("font-size:clamp(1rem, 0.8333vw + 0.8333rem, 1.5rem)");
// px is 1/16 rem; the bounds keep the units written
has("font-size:clamp(16px, 1vw + 0.6rem, 24px)");
// the container variant grows with the container's inline size
has("padding:clamp(1rem, 2.5cqi + 0.5rem, 2rem)");
// a value that shrinks: the bounds are sorted, the slope is negative
has("font-size:clamp(1.5rem, -0.8333vw + 2.1667rem, 2rem)");
has("font-size:clamp(1rem, 1.25vw + 0.5rem, 1.25rem)");
// a negative intercept is subtracted
has("font-size:clamp(2rem, 5vw - 1rem, 3rem)");
// nothing of the package reaches the client
assert.ok(!transformed.includes("fluid"), `no runtime import\n${transformed}`);

const fails = async (f, message, line = 4) => {
  const e = await failure(f);
  assert.equal(e.message.split("\n")[0], message);
  assert.equal(e.loc?.line, line, f);
};
// fluid-tailwind's check: 1rem to 4rem cannot be zoomed to 200% at 80rem
await fails(
  "bad-zoom.ts",
  "cssints: fluid: 1rem to 4rem between 20rem and 80rem fails WCAG 1.4.4: at 80rem wide, 500% zoom gives 5rem, under twice 4rem; narrow the range of sizes or widen the widths",
);
await fails(
  "bad-unit.ts",
  "cssints: fluid: 1em is not in px or rem: the slope is computed at build time",
  5,
);
await fails(
  "bad-same.ts",
  "cssints: fluid: 1rem and 16px are the same size: use the length itself",
);
await fails("bad-range.ts", "cssints: fluid: from 80rem must be below to 20rem");
await fails(
  "bad-grammar.ts",
  'fluidContainer: unexpected "red" in "1rem red 20rem 80rem", expected <length>',
  5,
);
// a length, so it is checked where it lands
await fails(
  "bad-property.ts",
  'color: unexpected "clamp(1rem" in "clamp(1rem, 1.6667vw + 0.6667rem, 2rem)", expected <color>',
  5,
);

await server.close();
console.log("fluid: ok");
process.exit(0);
