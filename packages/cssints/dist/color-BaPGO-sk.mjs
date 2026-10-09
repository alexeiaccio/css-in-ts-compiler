import { clampRgb, modeA98, modeHsl, modeHwb, modeLab, modeLch, modeLrgb, modeOklab, modeOklch, modeP3, modeProphoto, modeRec2020, modeRgb, modeXyz50, modeXyz65, parse, useMode, wcagLuminance } from "culori/fn";
//#region src/color.ts
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
	modeXyz65
]) useMode(mode);
const luminance = (text) => {
	const c = parse(text);
	if (!c) return { why: "is not a colour the check can read" };
	if ((c.alpha ?? 1) < 1) return { why: "is translucent, and has no contrast without a backdrop" };
	return { lum: wcagLuminance(clampRgb(c)) };
};
const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
const shown = (r) => (Math.floor(r * 100) / 100).toFixed(2);
//#endregion
export { ratio as n, shown as r, luminance as t };
