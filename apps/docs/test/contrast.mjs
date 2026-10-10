// The palettes of the settings panel (src/palettes.ts: three cubes of RYBitten at twelve hues, and four sets of @cssints/tokens)
// in each mode, with the engine's own colour maths (color.ts: culori's parser, WCAG 2.x luminance). Every pair the site reads
// text and accents in holds its floor: 7 for body text, 4.5 for small text, 3 for fills, borders and the focus ring (WCAG
// 1.4.3, 1.4.11). The build checks the default palette's light values in theme.ts; the rest of the cases are measured here, and
// test/browser.mjs measures the same pairs in Chrome on the built site.// import the sources of @cssints/ramp, rybitten and tokens.
import assert from "node:assert/strict";

import { luminance, ratio } from "../../../packages/cssints/src/color.ts";
import { dark, dim, light } from "../src/modes.ts";
import { ACCENTS, CUBES, DEFAULT_HUE, HUES, IDS, NEUTRALS, palettes } from "../src/palettes.ts";
import tokens from "../src/tokens.json" with { type: "json" };

const lum = (text) => {
  const r = luminance(text);
  assert.ok("lum" in r, `${text}: ${r.why}`);
  return r.lum;
};

// foreground, background and the floor
//   text, textMedium     body and secondary text on every paper (textLow: placeholders, on bg and bgSubtle)
//   accent / bg          the brand mark, the focus ring, the borders on hover: graphics
//   link / bg, bgSubtle  small text: the links of a page and of a note
//   onAccent / accent    a label on an accent fill: small text, black or white
//   accentStrong / soft  the current page in the sidebar: small text
const pairs = [
  ...["bg", "bgSubtle", "bgMuted"].flatMap((bg) => [
    { fg: "text", bg, min: 7 },
    { fg: "textMedium", bg, min: 4.5 },
  ]),
  { fg: "textLow", bg: "bg", min: 4.5 },
  { fg: "textLow", bg: "bgSubtle", min: 4.5 },
  { fg: "accent", bg: "bg", min: 3 },
  { fg: "accent", bg: "bgSubtle", min: 3 },
  { fg: "link", bg: "bg", min: 4.5 },
  { fg: "link", bg: "bgSubtle", min: 4.5 },
  { fg: "onAccent", bg: "accent", min: 4.5 },
  { fg: "accentStrong", bg: "accentSoft", min: 4.5 },
];

// the modes point at the group pal, and tokens.json (the light default) at the same names
assert.deepEqual(
  Object.fromEntries(
    Object.entries(tokens.color)
      .filter(([k]) => ACCENTS.includes(k) || NEUTRALS.includes(k))
      .map(([k, v]) => [k, v.$value]),
  ),
  Object.fromEntries([...NEUTRALS, ...ACCENTS].map((k) => [k, `{pal.light.${k}}`])),
);
for (const [mode, theme] of Object.entries({ light, dark, dim }))
  for (const k of Object.keys(theme.color))
    if (mode !== "dim" && (NEUTRALS.includes(k) || ACCENTS.includes(k)))
      assert.equal(theme.color[k], `{pal.${mode}.${k}}`, `${mode}.${k}`);
for (const k of Object.keys(dim.color))
  assert.equal(dim.color[k], NEUTRALS.includes(k) ? `{pal.dim.${k}}` : dark.color[k], `dim.${k}`);

const rows = [];
let cases = 0;
for (const id of IDS) {
  const hues = CUBES.includes(id) ? [...Array(HUES).keys()] : [DEFAULT_HUE];
  const worst = {};
  for (const hue of hues) {
    const p = palettes[id](hue);
    for (const k of [...NEUTRALS, ...ACCENTS])
      assert.match(p.light[k], /^#[0-9a-f]{6}$/, `${id} ${k}`);
    // dim is the dark page with its own neutrals
    for (const [mode, c] of Object.entries({
      light: p.light,
      dark: p.dark,
      dim: { ...p.dark, ...p.dim },
    }))
      for (const { fg, bg, min } of pairs) {
        const r = ratio(lum(c[fg]), lum(c[bg]));
        const key = `${mode} ${fg}/${bg}`;
        cases++;
        assert.ok(
          r >= min,
          `${id} ${mode} ${fg} on ${bg}: ${r.toFixed(2)} at hue ${hue} is below ${min}`,
        );
        if (!worst[key] || r - min < worst[key].r - min) worst[key] = { r, min };
      }
  }
  const tightest = Object.entries(worst).sort(([, a], [, b]) => a.r / a.min - b.r / b.min)[0];
  rows.push(
    `${id}: ${hues.length} hue${hues.length > 1 ? "s" : ""} x 3 modes, tightest ${tightest[0]} ${tightest[1].r.toFixed(2)} (floor ${tightest[1].min})`,
  );
}
// the wheel moves the accent: twelve different ones in each cube, light and dark
for (const id of CUBES)
  for (const mode of ["light", "dark"])
    assert.equal(
      new Set([...Array(HUES).keys()].map((h) => palettes[id](h)[mode].accent)).size,
      HUES,
      `${id} ${mode}`,
    );
// and the cubes differ: the same hue is another colour
assert.notEqual(palettes.itten(3).light.bg, palettes.munsell(3).light.bg);

console.log(`docs contrast over ${IDS.length} palettes (${cases} pairs):\n  ${rows.join("\n  ")}`);
