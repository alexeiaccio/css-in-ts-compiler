import {
  border,
  cn,
  color,
  firstThatWorks,
  hover,
  minHeight,
  padding,
  token,
} from "cssints" with { type: "cssints" };

const brand = token.color("#0057b8", "brand");

// the wanted value first; the class holds the declarations in CSS order, the wanted one last
export const a = minHeight(firstThatWorks("100dvh", "100vh"));
// three values: the last one is printed first
export const b = minHeight(firstThatWorks("100svh", "100dvh", "100vh"));
// a token and var() are values
export const c = color(firstThatWorks("oklch(55% 0.18 250)", brand));
export const d = color(firstThatWorks("var(--x)", "red"));
// inside several parts: the whole declaration is repeated with each value
export const e = border("1px", firstThatWorks("solid", "dashed"), "red");
// under a condition, merged by cn(): still one class
export const f = cn(padding(firstThatWorks("1dvh", "1vh")), hover(padding(firstThatWorks("2dvh", "2vh"))));
// the same value twice gives the same class
export const g = minHeight(firstThatWorks("100dvh", "100vh"));
// the wanted value color-mix() is lacking in some targets of the test (LightningCSS cannot lower it with a var() inside, so
// the warning stands); its fallback is supported by all of them
export const h = color(firstThatWorks(`color-mix(in srgb, ${brand}, blue)`, "#0057b8"));
// ... by only some of them: the warning names the others
export const i = color(firstThatWorks(`color-mix(in srgb, ${brand}, blue)`, "lab(40% 20 -50)"));
// the plain value still warns for all of its targets
export const j = color(`color-mix(in srgb, ${brand}, blue)`);
// a literal oklch() is lowered by LightningCSS for the targets: no warning, with a fallback or without
export const k = color(firstThatWorks("oklch(55% 0.18 250)", "#0057b8"));
export const l = color("oklch(55% 0.18 250)");
