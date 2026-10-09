// The accent colours are derived from a hue that the settings panel sets at run time, so no theme holds them and
// css.check.contrast (theme.ts) reads them at the default hue only. This test reads them at every position of the slider (the
// 360 integers of 0..359, which are all the hues a user can pick) in each mode, with the engine's own colour maths (color.ts:
// culori's parser, a colour outside sRGB clipped, WCAG 2.x luminance), and holds the worst case to a floor. Neutral pairs
// (text on backgrounds) do not depend on the hue; the build checks them in theme.ts.
import assert from "node:assert/strict";

import { luminance, ratio } from "../../../packages/cssints/src/color.ts";
import { dark, dim, light } from "../src/modes.ts";
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
// CIE L* T, the T of tokens.json, else black; the luminance of L* T is ((T + 16) / 116) ** 3. test/browser.mjs holds the
// result against Chrome.
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

// foreground, background and the floor every mode holds: 4.5 for small text, 3 for fills, borders and the focus ring (WCAG
// 1.4.3, 1.4.11).
//   accent / bg          the brand mark, the focus ring, the borders on hover: graphics
//   link / bg, bgSubtle  small text: the links of a page and of a note
//   onAccent / accent    a label on an accent fill: small text, black or white by itself (token onAccent)
//   accentStrong / soft  the current page in the sidebar: small text
const pairs = [
  { fg: "accent", bg: "bg", min: 3 },
  { fg: "accent", bg: "bgSubtle", min: 3 },
  { fg: "link", bg: "bg", min: 4.5 },
  { fg: "link", bg: "bgSubtle", min: 4.5 },
  { fg: "onAccent", bg: "accent", min: 4.5 },
  { fg: "accentStrong", bg: "accentSoft", min: 4.5 },
];
const modes = { light, dim, dark };
const rows = [];
for (const { fg, bg, min } of pairs)
  for (const [mode, over] of Object.entries(modes)) {
    let worst = { r: Infinity, hue: 0 };
    for (let hue = 0; hue < 360; hue++) {
      const r = ratio(lum(colour(over, fg, hue)), lum(colour(over, bg, hue)));
      if (r < worst.r) worst = { r, hue };
    }
    assert.ok(
      worst.r >= min,
      `${fg} on ${bg}, ${mode}: ${worst.r.toFixed(2)} at hue ${worst.hue} is below ${min}`,
    );
    rows.push(`${fg}/${bg} ${mode}: ${worst.r.toFixed(2)} at hue ${worst.hue} (floor ${min})`);
  }

console.log(`docs contrast over the hue slider (360 hues x 3 modes):\n  ${rows.join("\n  ")}`);
