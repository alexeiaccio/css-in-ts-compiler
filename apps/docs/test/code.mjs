// The docs' code colours (plugin/code.ts): every syntax colour holds its floor on the paper the code sits on, both
// highlighters paint the same palette, and a block comes out as the site's `--shiki-*` variables, escaped.
import assert from "node:assert/strict";

import { luminance, ratio } from "../../../packages/ramp/src/index.ts";
import { highlight, shikiThemes, themes } from "../plugin/code.ts";
import { CODE_PAPER } from "../src/code.ts";
import { DEFAULT_HUE, palettes } from "../src/palettes.ts";

const palette = palettes.cssints(DEFAULT_HUE);
const lum = (colour) => {
  const l = luminance(colour);
  assert.equal(typeof l, "number", `${colour} is a colour`);
  return l;
};
// the floors the palette was made at: small text on its paper (WCAG 1.4.3), darker in the dark mode so it stays readable
const FLOOR = { light: 4.5, dark: 6.5 };
for (const mode of ["light", "dark"]) {
  // the paper is fixed (src/code.ts says why); pin it to the palette's subtle paper so a palette change is noticed here
  assert.equal(
    CODE_PAPER[mode],
    palette[mode].bgSubtle,
    `${mode}: the paper is the default palette's bgSubtle`,
  );
  const syntax = themes[mode].style.syntax;
  for (const [kind, { color }] of Object.entries(syntax)) {
    const r = ratio(lum(color), lum(CODE_PAPER[mode]));
    assert.ok(r >= FLOOR[mode], `${mode} ${kind}: ${color} is ${r.toFixed(2)}:1 on the paper`);
  }
}
// Shiki's theme is the same table (the twoslash blocks and the rest of the page must not drift apart)
for (const mode of ["light", "dark"])
  for (const { scope, settings } of shikiThemes[mode].tokenColors) {
    const kind = Object.entries(themes[mode].style.syntax).find(
      ([, s]) => s.color === settings.foreground,
    );
    assert.ok(kind, `${mode}: ${scope[0]} has a colour of the palette`);
  }
assert.equal(
  shikiThemes.light.tokenColors.at(-1).settings.foreground,
  themes.light.style.syntax.punctuation.color,
);

const html = highlight("const s = `<b>`;", "tsx");
assert.match(html, /^<pre class="highlights" style="--shiki-dark:#\w+;--shiki-light:/);
assert.ok(html.includes("--shiki-dark:"), "both modes in every span");
assert.ok(html.includes("&lt;b&gt;"), "the markup is escaped");
assert.ok(!/<script/i.test(html), "no markup from the source");
assert.match(
  highlight("x = 1", "nonesuch"),
  /^<pre class="highlights"/,
  "an unknown language is plain text",
);
console.log("code: ok — the palette, its floors and the markup");
