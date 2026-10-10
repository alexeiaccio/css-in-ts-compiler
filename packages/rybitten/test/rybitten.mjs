// @cssints/rybitten: the cubes of RYBitten as hex (pinned: cube values may change in a minor release of rybitten), wheels and
// shades as DTCG groups, the errors, then a module through the engine. Run: node test/rybitten.mjs
import assert from "node:assert/strict";

import cssints from "cssints/vite";
import { cubes } from "rybitten/cubes";
import { createLogger, createServer } from "vite";

import { color, overrides, shades, wheel } from "../src/index.ts";

const steps = (g) =>
  Object.entries(g)
    .filter(([k]) => k !== "$type")
    .map(([, v]) => v.$value);

// the corners of Itten's cube: red, yellow, blue at full saturation; white and black at the ends of the lightness
assert.equal(color(0), "#e32421");
assert.equal(color(120), "#f3e600");
assert.equal(color(240), "#1699da");
assert.equal(color(0, { saturation: 0, lightness: 1 }), "#fdf6ed");
assert.equal(color(0, { saturation: 0, lightness: 0 }), "#1d1c1c");
assert.equal(color(360), color(0));
assert.equal(color(-120), color(240));
// a cube by name or by its corners; another cube, another colour
assert.equal(color(240, { cube: cubes.get("munsell").cube }), color(240, { cube: "munsell" }));
assert.equal(color(240, { cube: "munsell" }), "#3b8fab");
assert.notEqual(color(240, { cube: "albers" }), color(240));

// every cube gives hex, a wheel of 12 hues, all different
for (const name of cubes.keys()) {
  const hues = steps(wheel(12, { cube: name }));
  assert.equal(hues.length, 12);
  for (const h of hues) assert.match(h, /^#[0-9a-f]{6}$/, name);
  assert.equal(new Set(hues).size, 12, `${name}: ${hues.join(" ")}`);
}

// wheel: keys "1".."N" from `from`, deterministic
const w = wheel(12);
assert.equal(w.$type, "color");
assert.deepEqual(
  Object.keys(w).filter((k) => k !== "$type"),
  Array.from({ length: 12 }, (_, i) => String(i + 1)),
);
assert.equal(steps(w)[8], color(240));
assert.deepEqual(
  steps(wheel(4, { from: 30 })),
  [30, 120, 210, 300].map((h) => color(h)),
);
assert.deepEqual(wheel(12), w);

// shades: one step per lightness, in order, between the cube's white and black
const s = steps(shades(0, [1, 0.5, 0], { saturation: 0 }));
assert.deepEqual([s[0], s[2]], ["#fdf6ed", "#1d1c1c"]);
assert.equal(s[1], color(0, { saturation: 0 }));

// overrides: `_1` ...
assert.deepEqual(overrides(wheel(2)), { _1: color(0), _2: color(180) });

// errors
assert.throws(() => color(0, { cube: "nope" }), {
  message: `@cssints/rybitten: no cube "nope" in RYBitten's cubes`,
});
assert.throws(() => color(NaN), /hue is a number of degrees, got NaN/);
assert.throws(() => color(0, { saturation: 2 }), /saturation is from 0 to 1, got 2/);
assert.throws(() => color(0, { lightness: -1 }), /lightness is from 0 to 1, got -1/);
assert.throws(() => wheel(0), /steps is a whole number from 1, got 0/);
assert.throws(() => shades(0, [2]), /lightness is from 0 to 1, got 2/);

// through the engine
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
await client.transformRequest("/contrast.ts");
const css = plugins[0].api.sheet([`${root}/contrast.ts`]);
const mun = steps(wheel(4, { cube: "munsell" }));
for (const rule of [
  `@property --hue-3{syntax:"<color>";inherits:true;initial-value:${color(180)}}`,
  `@property --paper-1{syntax:"<color>";inherits:true;initial-value:#fdf6ed}`,
  "{color:var(--hue-3)}",
  `@media (prefers-color-scheme: dark){:root{--hue-1:${mun[0]};--hue-2:${mun[1]};--hue-3:${mun[2]};--hue-4:${mun[3]};--paper-1:#1d1c1c;`,
])
  assert.ok(css.includes(rule), `${rule}\n${css}`);
await assert.rejects(
  client.transformRequest("/contrast-fail.ts"),
  /cssints: contrast [\d.]+ is below 7: hue\.1 #e32421 on paper\.1 #fdf6ed/,
);
await server.close();
console.log("rybitten: ok");
process.exit(0);
