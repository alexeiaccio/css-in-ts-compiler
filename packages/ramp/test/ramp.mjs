// @cssints/ramp: the ramp maths (lightness monotone, steps in sRGB, contrast targets met on the hex as check.contrast reads
// it), then a contrast ramp through the engine: its pairs pass check.contrast in light and dark, a tight pair fails.
// Run: node test/ramp.mjs
import assert from "node:assert/strict";

import cssints from "cssints/vite";
import { converter, parse, wcagLuminance } from "culori";
import { createLogger, createServer } from "vite";

import { luminance, overrides, ramp, ratio } from "../src/index.ts";

const toOklch = converter("oklch");
const steps = (r) =>
  Object.entries(r)
    .filter(([k]) => k !== "$type")
    .map(([, v]) => v.$value);
const lightness = (hex) => toOklch(parse(hex)).l;
const bases = [
  "#2563eb",
  "#eab308",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#6b7280",
  "#000000",
  "#ffffff",
];

// lightness ramps: keys 1..N, hex, lightest first, deterministic
for (const base of bases) {
  const r = ramp(base, { mode: "lightness", steps: 9 });
  assert.equal(r.$type, "color");
  assert.deepEqual(
    Object.keys(r).filter((k) => k !== "$type"),
    ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  );
  const hex = steps(r);
  for (const h of hex) assert.match(h, /^#[0-9a-f]{6}$/);
  const ls = hex.map(lightness);
  for (let i = 1; i < ls.length; i++) assert.ok(ls[i] < ls[i - 1], `${base}: ${hex.join(" ")}`);
  assert.ok(
    Math.abs(ls[0] - 0.97) < 0.01 && Math.abs(ls[8] - 0.25) < 0.01,
    `${base}: ${ls.join(" ")}`,
  );
  assert.deepEqual(ramp(base, { mode: "lightness", steps: 9 }), r);
}
// the hue holds, and a vivid base stays vivid at its cusp (the 8-bit hex is within 1/255 of sRGB, never clipped)
const blue = steps(ramp("#2563eb", { mode: "lightness", steps: 5, lightness: [0.9, 0.4] }));
for (const h of blue) assert.ok(Math.abs(toOklch(parse(h)).h - toOklch(parse("#2563eb")).h) < 3, h);
assert.deepEqual(
  blue,
  steps(ramp("#2563eb", { mode: "lightness", steps: 5, lightness: [0.9, 0.4] })),
);
// a grey is neutral
for (const h of steps(ramp("#6b7280", { mode: "lightness", steps: 5 })))
  assert.ok(toOklch(parse(h)).c < 0.04, h);
for (const h of steps(ramp("#808080", { mode: "lightness", steps: 5 })))
  assert.ok(toOklch(parse(h)).c < 0.001, h);

// the contrast maths is check.contrast's: culori's wcagLuminance; ratio not rounded
assert.equal(luminance("#ffffff"), 1);
assert.equal(ratio(luminance("#000"), luminance("#fff")), 21);
assert.equal(luminance("#767676"), wcagLuminance(parse("#767676")));

// contrast ramps: each step at or above its ratio, by little (an 8-bit step), and monotone in lightness
const ratios = [1.2, 1.5, 2, 3, 4.5, 7, 10, 14];
for (const background of ["#ffffff", "#f5f5f4", "#111111", "#1e293b"])
  for (const base of bases) {
    const hex = steps(ramp(base, { mode: "contrast", ratios, background }));
    const got = hex.map((h) => ratio(luminance(h), luminance(background)));
    got.forEach((r, i) => {
      assert.ok(r >= ratios[i], `${base} on ${background}: ${hex[i]} ${r} < ${ratios[i]}`);
      assert.ok(
        r < ratios[i] * 1.02,
        `${base} on ${background}: ${hex[i]} ${r} overshoots ${ratios[i]}`,
      );
    });
    const ls = hex.map(lightness);
    const dark = luminance(background) > 0.18;
    for (let i = 1; i < ls.length; i++)
      assert.ok(
        dark ? ls[i] <= ls[i - 1] : ls[i] >= ls[i - 1],
        `${base} on ${background}: ${hex.join(" ")}`,
      );
  }
assert.deepEqual(
  steps(
    ramp("#2563eb", { mode: "contrast", ratios: [1.2, 1.5, 3, 4.5, 7], background: "#ffffff" }),
  ),
  ["#e1ebfc", "#bfd3f9", "#6593f0", "#356fec", "#164ecc"],
);
assert.deepEqual(overrides(ramp("#2563eb", { mode: "lightness", steps: 2 })), {
  _1: steps(ramp("#2563eb", { mode: "lightness", steps: 2 }))[0],
  _2: steps(ramp("#2563eb", { mode: "lightness", steps: 2 }))[1],
});

// errors
assert.throws(() => ramp("banana", { mode: "lightness", steps: 3 }), {
  message: '@cssints/ramp: the base "banana" is not a colour',
});
assert.throws(() => ramp("#2563eb", { mode: "lightness", steps: 0 }), /steps is a whole number/);
assert.throws(() => ramp("#2563eb", { mode: "contrast", ratios: [21], background: "#111" }), {
  message: "@cssints/ramp: ratio 21 is out of reach on #111: at most 18.88 (white)",
});
assert.throws(
  () => ramp("#2563eb", { mode: "contrast", ratios: [3], background: "#0000" }),
  /background "#0000" is translucent/,
);

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
for (const rule of [
  '@property --blue-4{syntax:"<color>";inherits:true;initial-value:#356fec}',
  '@property --bg{syntax:"<color>";inherits:true;initial-value:#ffffff}',
  "{color:var(--blue-4)}",
  "@media (prefers-color-scheme: dark){:root{--bg:#111111;--blue-1:#041e59;--blue-2:#092d7c;--blue-3:#1855db;--blue-4:#3d76ed;--blue-5:#719df2}}",
])
  assert.ok(css.includes(rule), `${rule}\n${css}`);
await assert.rejects(client.transformRequest("/contrast-fail.ts"), {
  message:
    "cssints: contrast 4.52 is below 4.6: blue.4 #356fec on bg #ffffff, in the default values\n" +
    "cssints: contrast 4.50 is below 4.6: blue.4 #3d76ed on bg #111111, in theme @media (prefers-color-scheme: dark)",
});
await server.close();
console.log("ramp: ok");
process.exit(0);
