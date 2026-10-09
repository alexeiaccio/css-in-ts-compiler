import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

import { dark, dim, light } from "./modes.ts";
import tokens from "./tokens.json" with { type: "json" };

// tokens.json is the light theme and the default of every token; the page follows the system (see "system" below).
export const t = createTokens(tokens);

// The mode is classes on <html>: none is "system", which follows prefers-color-scheme. A selector theme beats a condition
// theme on the same element, so a class always wins over the system; `.dim` comes after `.dark`, which it is laid over.
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), dark);
createGlobalTheme(t, ".light", light);
createGlobalTheme(t, ".dark", dark);
createGlobalTheme(t, ".dim", dim);

// Text size, density and corners are attributes on <html> (settings.ts): each value that is not "normal" sets one scale
// of tokens.json, and fontSize, space and radius follow it.
createGlobalTheme(t, '[data-text="small"]', { scale: { font: "0.875" } });
createGlobalTheme(t, '[data-text="large"]', { scale: { font: "1.125" } });
createGlobalTheme(t, '[data-density="compact"]', { scale: { space: "0.75" } });
createGlobalTheme(t, '[data-density="comfortable"]', { scale: { space: "1.25" } });
createGlobalTheme(t, '[data-radius="sharp"]', { scale: { radius: "0" } });
createGlobalTheme(t, '[data-radius="round"]', { scale: { radius: "2" } });

// Text on the backgrounds it sits on, at the default hue, in the default values and in every theme above.
// The hue is a runtime value that no theme holds: test/contrast.mjs measures the accent pairs over its whole range.
for (const bg of [t.color.bg, t.color.bgSubtle, t.color.bgMuted]) {
  check.contrast(t.color.text, bg, { min: 7 });
  check.contrast(t.color.textMedium, bg, { min: 4.5 });
}
for (const bg of [t.color.bg, t.color.bgSubtle]) check.contrast(t.color.textLow, bg, { min: 4.5 });
check.contrast(t.color.link, t.color.bg, { min: 4.5 });
check.contrast(t.color.link, t.color.bgSubtle, { min: 4.5 });
check.contrast(t.color.accentStrong, t.color.accentSoft, { min: 4.5 });
// accent is a fill, a border and the focus ring: 3 is the floor for graphics (WCAG 1.4.11)
check.contrast(t.color.accent, t.color.bg, { min: 3 });
// onAccent is a relative colour, which the check cannot read (a warning at every build): test/contrast.mjs holds it to 4.5.
