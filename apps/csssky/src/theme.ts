import { check, createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

import { dark, dim, light } from "./modes.ts";
import tokens from "./tokens.json" with { type: "json" };

// light is tokens.json; the colour is the default of every token and the page follows the system (see "system" below).
// modes.ts holds the dim, dark and light overrides as plain data, so that a node test can read them too.
export const t = createTokens(tokens);

// useGutters: 12, 20 and 28 from 800 px
createGlobalTheme(t, media("(width >= 800px)"), {
  gutter: { compact: "12px", base: "20px", wide: "28px" },
});

// The mode is a class on <html>: none is "system", which follows prefers-color-scheme. A selector theme beats a
// condition theme on the same element, so a class always wins over the system.
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), dark);
createGlobalTheme(t, ".light", light);
createGlobalTheme(t, ".dim", dim);
createGlobalTheme(t, ".dark", dark);

// Witchsky's two square flags: classes on <html> that point the button and avatar radii at smaller ones. Everything that
// reads radius.button or radius.avatar follows, and a frame() inside it follows the frame.
createGlobalTheme(t, ".square-buttons", { radius: { button: "{radius.sm}" } });
createGlobalTheme(t, ".square-avatars", { radius: { avatar: "{radius.sm}", avatarSmall: "3px" } });

// Text on the backgrounds it sits on, at the default hue, in the default values and in every theme above.
// The hue slider is a runtime value that no theme holds: test/contrast.mjs measures the accent pairs over its whole range.
for (const bg of [t.color.bg, t.color.bgSubtle, t.color.bgMuted]) {
  check.contrast(t.color.text, bg, { min: 7 });
  check.contrast(t.color.textMedium, bg, { min: 4.5 });
}
check.contrast(t.color.textHigh, t.color.bgMuted, { min: 7 });
check.contrast(t.color.accentStrong, t.color.accentSoft, { min: 4.5 });
// Mu's pink on white is 3.8: enough for large text and icons, not for body text. Links are small text and use a darker step.
check.contrast(t.color.accent, t.color.bg, { min: 3 });
check.contrast(t.color.link, t.color.bg, { min: 4.5 });
// onAccent is a relative colour, which the check cannot read (a warning at every build): test/contrast.mjs holds it to 4.5.
