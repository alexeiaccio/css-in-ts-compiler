import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

import type { Hex } from "../../../packages/rybitten/src/index.ts";

import { dark, dim, light } from "./modes.ts";
import { ACCENTS, CUBES, DEFAULT_HUE, HUES, IDS, palettes } from "./palettes.ts";
import type { Colors } from "./palettes.ts";
import tokens from "./tokens.json" with { type: "json" };

// tokens.json is the light theme and the default of every token; the page follows the system (see "system" below). The colours
// of tokens.json point at the group `pal`, the colours of the three modes of the palette in use: it starts as the logo palette
// (cssints), and a palette theme (below) sets it.
const leaves = <K extends string>(c: Record<K, Hex>) =>
  Object.fromEntries(Object.entries(c).map(([k, $value]) => [k, { $value }])) as {
    [P in K]: { $value: Hex };
  };
const start = palettes.cssints(DEFAULT_HUE);
export const t = createTokens({
  ...tokens,
  pal: {
    $type: "color",
    light: leaves(start.light),
    dark: leaves(start.dark),
    dim: leaves(start.dim),
  },
});

// The mode is classes on <html>: none is "system", which follows prefers-color-scheme. A selector theme beats a condition
// theme on the same element, so a class always wins over the system; `.dim` comes after `.dark`, which it is laid over.
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), dark);
createGlobalTheme(t, ".light", light);
createGlobalTheme(t, ".dark", dark);
createGlobalTheme(t, ".dim", dim);

// The palette is data attributes on <html> (settings.ts), and sets only `pal`: the palette's own theme (a RYBitten cube at the
// default hue, or a whole set of @cssints/tokens), and for a cube one theme per step of the wheel with just its accents, later.
// The mode picks which of the three groups the page reads. A theme declares the aliases of the tokens it sets again (the colours
// above point at `pal`), so a palette's rule would carry `--color-bg: var(--pal-light-bg)` and beat the dark and dim modes by
// order: `:where()` gives it no specificity, and every mode rule above wins.
const accents = (c: Colors) =>
  Object.fromEntries(ACCENTS.map((k) => [k, c[k]])) as Pick<Colors, (typeof ACCENTS)[number]>;
// Two loops, not one nested: the engine numbers the themes of a site from 0 each time the running site changes (__at), so a loop
// that alternates between two sites would give them the same key and keep the last (cssints-et4y, "Engine gaps").
for (const id of IDS)
  createGlobalTheme(t.pal, `:where([data-palette="${id}"])`, palettes[id](DEFAULT_HUE));
for (const id of CUBES)
  for (let hue = 0; hue < HUES; hue++) {
    const { light, dark } = palettes[id](hue);
    createGlobalTheme(t.pal, `:where([data-palette="${id}"][data-hue="${hue}"])`, {
      light: accents(light),
      dark: accents(dark),
    });
  }

// Text size, density and corners are attributes on <html> (settings.ts): each value that is not "normal" sets one scale
// of tokens.json, and fontSize, space and radius follow it.
createGlobalTheme(t, '[data-text="small"]', { scale: { font: "0.875" } });
createGlobalTheme(t, '[data-text="large"]', { scale: { font: "1.125" } });
createGlobalTheme(t, '[data-density="compact"]', { scale: { space: "0.75" } });
createGlobalTheme(t, '[data-density="comfortable"]', { scale: { space: "1.25" } });
createGlobalTheme(t, '[data-radius="sharp"]', { scale: { radius: "0" } });
createGlobalTheme(t, '[data-radius="round"]', { scale: { radius: "2" } });

// Text on the backgrounds it sits on, in the default values and in every theme above (the palettes' light values).
// The other palettes and the hues of the wheel are themes of `pal`: test/contrast.mjs measures every pair for each of them in each mode.
for (const bg of [t.color.bg, t.color.bgSubtle, t.color.bgMuted]) {
  check.contrast(t.color.text, bg, { min: 7 });
  check.contrast(t.color.textMedium, bg, { min: 4.5 });
}
for (const bg of [t.color.bg, t.color.bgSubtle]) check.contrast(t.color.textLow, bg, { min: 4.5 });
check.contrast(t.color.link, t.color.bg, { min: 4.5 });
check.contrast(t.color.link, t.color.bgSubtle, { min: 4.5 });
check.contrast(t.color.accentStrong, t.color.accentSoft, { min: 4.5 });
// the landing hero's shader (src/landing/shader.ts) runs from bg to accentSoft behind its text
check.contrast(t.color.text, t.color.accentSoft, { min: 4.5 });
check.contrast(t.color.textMedium, t.color.accentSoft, { min: 4.5 });
// accent is a fill, a border and the focus ring: 3 is the floor for graphics (WCAG 1.4.11)
check.contrast(t.color.accent, t.color.bg, { min: 3 });
check.contrast(t.color.onAccent, t.color.accent, { min: 4.5 });
