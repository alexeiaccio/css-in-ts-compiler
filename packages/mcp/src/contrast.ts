// check_contrast: the WCAG 2.x ratio as css.check.contrast computes it. cssints keeps that maths in src/color.ts, which
// its package does not export (an engine gap in cssints-w57u), so these lines are the same: culori/fn with the same
// modes, a colour outside sRGB clipped to it, a translucent one refused, the ratio cut (not rounded) at two places.
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
import { Effect } from "effect";

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

const luminance = (text: string) => {
  const c = parse(text);
  if (!c) return { why: "is not a colour the check can read" };
  if ((c.alpha ?? 1) < 1) return { why: "is translucent, and has no contrast without a backdrop" };
  return { lum: wcagLuminance(clampRgb(c)) };
};

const shown = (r: number) => (Math.floor(r * 100) / 100).toFixed(2);

export const checkContrast = Effect.fn("mcp.checkContrast")(function* (
  foreground: string,
  background: string,
  min: number | undefined,
) {
  const [f, b] = yield* Effect.sync(() => [luminance(foreground), luminance(background)]);
  if (f?.lum === undefined || b?.lum === undefined) {
    const [text, why] = f?.lum === undefined ? [foreground, f?.why] : [background, b?.why];
    return { ok: false, message: `contrast is not checked: "${text}" ${why}` };
  }
  const r = (Math.max(f.lum, b.lum) + 0.05) / (Math.min(f.lum, b.lum) + 0.05);
  const ratio = shown(r);
  if (min === undefined) return { ok: true, ratio };
  return r < min
    ? { ok: false, ratio, min, message: `contrast ${ratio} is below ${min}` }
    : { ok: true, ratio, min };
});
