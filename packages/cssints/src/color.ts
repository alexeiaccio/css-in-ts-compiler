// The colour maths of css.check.contrast (contrast.ts): culori's parser and WCAG 2.x luminance. Build time only, loaded
// when a check runs. `culori/fn` and the fourteen modes are 27 kB minified, 9 kB gzipped; nothing here reaches a browser.
import {
  clampRgb,
  modeA98,
  modeHsl,
  modeHwb,
  modeLab,
  modeLch,
  modeLrgb,
  modeOklab,
  modeOklch,
  modeP3,
  modeProphoto,
  modeRec2020,
  modeRgb,
  modeXyz50,
  modeXyz65,
  parse,
  useMode,
  wcagLuminance,
} from "culori/fn";

for (const mode of [
  modeRgb,
  modeHsl,
  modeHwb,
  modeLab,
  modeLch,
  modeOklab,
  modeOklch,
  modeLrgb,
  modeP3,
  modeA98,
  modeProphoto,
  modeRec2020,
  modeXyz50,
  modeXyz65,
])
  useMode(mode);

// The relative luminance of a CSS colour, or why it has none. A colour outside sRGB is clipped to it.
export const luminance = (text: string) => {
  const c = parse(text);
  if (!c) return { why: "is not a colour the check can read" };
  if ((c.alpha ?? 1) < 1) return { why: "is translucent, and has no contrast without a backdrop" };
  return { lum: wcagLuminance(clampRgb(c)) };
};

export const ratio = (a: number, b: number): number =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// The floor at two places, so that 4.499 does not read as the 4.5 it misses.
export const shown = (r: number): string => (Math.floor(r * 100) / 100).toFixed(2);
