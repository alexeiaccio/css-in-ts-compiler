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

// a colour token in a mode at a hue: the mode's value, else the default, references put in place. onAccent is a relative
// colour that culori cannot read, so it is computed as the token says: white when the accent (clipped to sRGB) is under
// CIE L* T, the T of tokens.json, else black; the luminance of L* T is ((T + 16) / 116) ** 3. test/browser.mjs holds this
// model against Chrome.
const T = Number(/\(([\d.]+) - l\)/.exec(base["color.onAccent"])?.[1]);
const colour = (over, name, hue) => {
  const resolve = (path) =>
    path === "hue.accent"
      ? String(hue)
      : String(over.color[path.replace(/^color\./, "")] ?? base[path]).replace(
          /\{([^}]+)\}/g,
          (_, p) => resolve(p),
        );
  if (name === "onAccent")
    return lum(resolve("color.accent")) <= ((T + 16) / 116) ** 3 ? "#ffffff" : "#000000";
  return resolve(`color.${name}`);
};
const lum = (text) => {
  const r = luminance(text);
  assert.ok("lum" in r, `${text}: ${r.why}`);
  return r.lum;
};

// foreground, background and the floor every mode holds: 4.5 for small text, 3 for large text (18.66 px bold and up), icons
// and fills (WCAG 1.4.3, 1.4.11). `known` is a mode that holds less, a documented exception: its worst case cut to 0.1, held
// both ways (the ratio never goes under it, and the worst hue is within 0.1 above it), so a change nobody meant fails.
//   accent / bg          the brand mark (20.6 px bold), the focus ring, the tab underline, the avatar and switch fills: large
//                        text and graphics. Mu's lightness is fixed (0.637) and a cyan-green hue is 2.76 on white in light.
//   link / bg            small text (links in a post): 4.5 in all three; light uses accentStrong, darker than Mu's primary_500
//   onAccent / accent    the label of a button: small text, 4.5, black or white by itself (token onAccent)
//   onAccent / hover     the same label on the hover step, which is darker than accent in light: a hair under 4.5
//   accentStrong / soft  the note in the rail: small text, 4.5, with a strong that is darker than Mu's primary_700
const pairs = [
  { fg: "accent", bg: "bg", min: 3, known: { light: 2.7 } },
  { fg: "link", bg: "bg", min: 4.5 },
  { fg: "onAccent", bg: "accent", min: 4.5 },
  { fg: "onAccent", bg: "accentHover", min: 4.5, known: { light: 4.4 } },
  { fg: "accentStrong", bg: "accentSoft", min: 4.5 },
];
const modes = { light, dim, dark };
const rows = [];
for (const { fg, bg, min, known = {} } of pairs)
  for (const [mode, over] of Object.entries(modes)) {
    let worst = { r: Infinity, shift: 0 };
    for (let shift = -180; shift <= 180; shift++) {
      const hue = hueOf(shift);
      const r = ratio(lum(colour(over, fg, hue)), lum(colour(over, bg, hue)));
      if (r < worst.r) worst = { r, shift };
    }
    const floor = known[mode] ?? min;
    assert.ok(
      worst.r >= floor,
      `${fg} on ${bg}, ${mode}: ${worst.r.toFixed(2)} at slider ${worst.shift} is below ${floor}`,
    );
    if (floor < min)
      assert.ok(
        worst.r < floor + 0.1,
        `${fg} on ${bg}, ${mode}: the floor ${floor} is lax, the worst is ${worst.r.toFixed(2)}`,
      );
    rows.push(
      `${fg}/${bg} ${mode}: ${worst.r.toFixed(2)} at slider ${worst.shift} (floor ${floor})`,
    );
  }

// the default hue is far from the worst one: the build check (theme.ts) holds it to 3 and 4.5
const at0 = (over, fg, bg) => ratio(lum(colour(over, fg, 345)), lum(colour(over, bg, 345)));
assert.ok(at0(light, "accent", "bg") >= 3 && at0(light, "accentStrong", "accentSoft") >= 4.5);

console.log(`sky contrast over the slider (361 hues x 3 modes):\n  ${rows.join("\n  ")}`);
