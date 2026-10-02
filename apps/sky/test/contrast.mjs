// The accent colours are derived from a hue that the slider sets at run time, so no theme holds them and css.check.contrast
// (theme.ts) reads them at the default hue only. This test reads them at every position of the slider (the 361 integers
// of -180..180, which are all the hues a user can pick) in each mode, with the engine's own colour maths (color.ts:
// culori's parser, a colour outside sRGB clipped, WCAG 2.x luminance), and holds the worst case to a floor.
// Neutral pairs (text on backgrounds) do not depend on the hue; the build checks them in theme.ts.
import assert from "node:assert/strict";

import { luminance, ratio } from "../../../packages/cssints/src/color.ts";
import { dark, dim, light } from "../src/modes.ts";
import { hueOf } from "../src/settings.ts";
import tokens from "../src/tokens.json" with { type: "json" };

// the token values by path, as tokens.json states them
const base = {};
const walk = (node, path) => {
  for (const [k, v] of Object.entries(node))
    if (k === "$value") base[path.join(".")] = v;
    else if (v && typeof v === "object" && !k.startsWith("$")) walk(v, [...path, k]);
};
walk(tokens, []);

// a colour token in a mode at a hue: the mode's value, else the default, references put in place
const colour = (over, name, hue) => {
  const resolve = (path) =>
    path === "hue.accent"
      ? String(hue)
      : String(over.color[path.replace(/^color\./, "")] ?? base[path]).replace(
          /\{([^}]+)\}/g,
          (_, p) => resolve(p),
        );
  return resolve(`color.${name}`);
};
const lum = (text) => {
  const r = luminance(text);
  assert.ok("lum" in r, `${text}: ${r.why}`);
  return r.lum;
};

// foreground, background and the floor per mode: the lowest ratio over the slider, cut to 0.1. A floor that is lower than
// what a mode reaches is a change nobody meant: the test holds both sides (the ratio never goes under it, and the worst
// hue is within 0.1 above it).
const pairs = [
  { fg: "accent", bg: "bg", floors: { light: 2.7, dim: 4.5, dark: 5.5 } },
  { fg: "link", bg: "bg", floors: { light: 2.7, dim: 5.8, dark: 7.1 } },
  { fg: "onAccent", bg: "accent", floors: { light: 2.7, dim: 2.7, dark: 2.7 } },
  { fg: "accentStrong", bg: "accentSoft", floors: { light: 3.6, dim: 4.8, dark: 4.8 } },
];
const modes = { light, dim, dark };
const rows = [];
for (const { fg, bg, floors } of pairs)
  for (const [mode, over] of Object.entries(modes)) {
    let worst = { r: Infinity, shift: 0 };
    for (let shift = -180; shift <= 180; shift++) {
      const hue = hueOf(shift);
      const r = ratio(lum(colour(over, fg, hue)), lum(colour(over, bg, hue)));
      if (r < worst.r) worst = { r, shift };
    }
    const floor = floors[mode];
    assert.ok(
      worst.r >= floor,
      `${fg} on ${bg}, ${mode}: ${worst.r.toFixed(2)} at slider ${worst.shift} is below ${floor}`,
    );
    assert.ok(
      worst.r < floor + 0.1,
      `${fg} on ${bg}, ${mode}: the floor ${floor} is lax, the worst is ${worst.r.toFixed(2)}`,
    );
    rows.push(`${fg}/${bg} ${mode}: ${worst.r.toFixed(2)} at slider ${worst.shift}`);
  }

// the default hue is far from the worst one: the build check (theme.ts) holds it to 3 and 4.5
const at0 = (over, fg, bg) => ratio(lum(colour(over, fg, 345)), lum(colour(over, bg, 345)));
assert.ok(at0(light, "accent", "bg") >= 3 && at0(light, "accentStrong", "accentSoft") >= 4.5);

console.log(`sky contrast over the slider (361 hues x 3 modes):\n  ${rows.join("\n  ")}`);
