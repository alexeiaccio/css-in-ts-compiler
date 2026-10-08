// @cssints/gradient: the stop math, then through the engine (literal colours mixed at build time, token and
// currentColor endpoints as color-mix() stops, the four kinds of error). Run: node test/gradient.mjs
import assert from "node:assert/strict";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

import { samples } from "../src/stops.ts";

// the curve's parameter is sampled evenly: x places the stop, y is the share of the second colour
const round = (ps) => ps.map(({ x, y }) => [+x.toFixed(4), +y.toFixed(4)]);
assert.deepEqual(round(samples("linear", 3)), [
  [0, 0],
  [0.5, 0.5],
  [1, 1],
]);
assert.deepEqual(round(samples("ease-in-out", 5)), [
  [0, 0],
  [0.2744, 0.1563],
  [0.5, 0.5],
  [0.7256, 0.8438],
  [1, 1],
]);
// an overshooting curve is clamped to the two colours
const over = samples("cubic-bezier(0.3, -0.5, 0.7, 1.5)", 9).map((p) => p.y);
assert.ok(over.some((y) => y === 0) && over.every((y) => y >= 0 && y <= 1), String(over));
assert.equal(samples("ease", 13).length, 13);

const root = `${import.meta.dirname}/fixtures`;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("error"),
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
assert.ok(!transformed.includes("gradient"), `no runtime import\n${transformed}`);

// literal colours: the endpoints as written, the stops between them in sRGB hex (alpha as #rrggbbaa)
for (const value of [
  "linear-gradient(to bottom, #000, #000000d7 27.44%, #00000080 50%, #00000028 72.56%, transparent)",
  "radial-gradient(circle at top, red, #c44a6f 37.04%, #5348d0 62.96%, blue)",
  "conic-gradient(from 90deg, black, #00000080 50%, transparent)",
])
  assert.ok(css.includes(value), `${value}\n${css}`);
// the defaults: ease-in-out and 13 stops
const scrim = /linear-gradient\(180deg, [^}]*\)/.exec(css)?.[0];
assert.equal(scrim?.split(", ").length, 14, scrim);
assert.ok(scrim.includes("#00000066 50%"), scrim);
// an endpoint the build cannot read gives color-mix() stops for the browser
assert.ok(
  css.includes(
    "linear-gradient(to right, var(--color-ink), color-mix(in oklab, var(--color-ink), white 25.93%) 44.59%, color-mix(in oklab, var(--color-ink), white 74.07%) 83.41%, white)",
  ),
  css,
);
assert.ok(
  css.includes(
    "linear-gradient(to top, currentColor, color-mix(in oklab, currentColor, transparent 50%) 34.25%, transparent)",
  ),
  css,
);

// errors, at the call: the grammar of the parts, the argument order, and the property that takes the image
const errors = {
  "bad-easing.ts": [
    5,
    'gradient: unexpected "steps(4" in "linear to bottom red blue steps(4)", expected linear | <cubic-bezier-easing-function> | <integer> | end of value',
  ],
  "bad-stops.ts": [
    4,
    'gradient: unexpected "1" in "linear to bottom red blue ease 1", expected <integer [2,64]> | end of value',
  ],
  "bad-order.ts": [
    4,
    'cssints: gradient(): "blue" is not an easing (the arguments are kind, direction, from, to, easing?, stops?)',
  ],
};
for (const [f, [line, message]] of Object.entries(errors)) {
  const e = await failure(f);
  assert.equal(e.message.split("\n")[0], message, f);
  assert.deepEqual({ line: e.loc?.line, column: e.loc?.column }, { line, column: 17 }, f);
}
const e = await failure("bad-property.ts");
assert.match(
  e.message,
  /^color: unexpected "linear-gradient\(to" in "linear-gradient\(to bottom, red,/,
);
assert.equal(e.loc?.line, 5);

await server.close();
console.log("gradient: ok");
process.exit(0);
