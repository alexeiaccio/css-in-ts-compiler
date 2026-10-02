// What user code sees of createTokens, themes and the contrast check: `tsgo -p tsconfig.json` checks this file (`bun run typecheck`).
import { border, color, padding } from "@cssints/css-grammar/api-typed";
import type { Token } from "@cssints/css-grammar/token";
import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  color: {
    $type: "color",
    bg: { $value: "#ffffff" },
    accent: { $value: { colorSpace: "oklch", components: [0.62, 0.19, 259] } },
    link: { $value: "{color.accent}" },
    hover: { $value: "{color.link}" },
  },
  space: { $type: "dimension", md: { $value: "16px" }, sm: { $value: { value: 8, unit: "px" } } },
  motion: { fast: { $type: "duration", $value: { value: 150, unit: "ms" } } },
  weight: { $type: "fontWeight", bold: { $value: "bold" } },
  ratio: { $type: "number", golden: { $value: 1.618 } },
  own: {
    $type: "dimension",
    tone: { $type: "color", $value: "red", $description: "a leaf's own type wins" },
  },
});

// A leaf is a named token of the type its $type maps to, alias or not; $type comes from the group.
const bg: Token<"color", true> = t.color.bg;
const link: Token<"color", true> = t.color.link;
const hover: Token<"color", true> = t.color.hover;
const md: Token<"length", true> = t.space.md;
const fast: Token<"time", true> = t.motion.fast;
const bold: Token<"number", true> = t.weight.bold;
const own: Token<"color", true> = t.own.tone;
export const all = [bg, link, hover, md, fast, bold, own, t.ratio.golden, t.space.sm];

// They are Typed OM values of their type.
color(t.color.bg);
border("1px solid", t.color.accent);
padding(t.space.md, t.space.sm);
// @ts-expect-error a length is not a colour
color(t.space.md);
// @ts-expect-error a colour is not a length
padding(t.color.bg);
// @ts-expect-error there is no such token
void t.color.nope;
// @ts-expect-error $type is not a token
void t.color.$type;

// Named tokens can be set.
export const themed: Record<string, string> = css.style(css.token.set(t.color.bg, "red"));
// @ts-expect-error not a length
css.token.set(t.space.md, "red");

// A mapper names the variables.
css.createTokens({ size: { $type: "dimension", s: { $value: "1px" } } }, (path) => path.join("_"));
css.createTokens({ size: { $type: "dimension", s: { $value: "1px" } } }, (path) => ({
  var: path.join("-"),
  inherit: false,
}));

// A value is a CSS string of the type's grammar, or a DTCG value.
// @ts-expect-error not a colour
css.createTokens({ c: { $type: "color", x: { $value: "blu" } } });
// @ts-expect-error a dimension needs its unit
css.createTokens({ c: { $type: "dimension", x: { $value: "12" } } });
// @ts-expect-error DTCG dimensions have px and rem
css.createTokens({ c: { $type: "dimension", x: { $value: { value: 1, unit: "em" } } } });
css.createTokens({
  // @ts-expect-error a colour object has 3 components
  c: { $type: "color", x: { $value: { colorSpace: "srgb", components: [1, 0] } } },
});
// @ts-expect-error a duration is not a number
css.createTokens({ c: { $type: "duration", x: { $value: 3 } } });
// @ts-expect-error a keyword that is not a font weight
css.createTokens({ c: { $type: "fontWeight", x: { $value: "heavier" } } });

// A type is needed, and only types with a token type are supported.
// @ts-expect-error no $type
css.createTokens({ c: { x: { $value: "red" } } });
// @ts-expect-error a shadow has no @property syntax
css.createTokens({ c: { $type: "shadow", x: { $value: "0 1px black" } } });

// An alias names a token.
css.createTokens({
  // @ts-expect-error there is no color.nope
  color: { $type: "color", a: { $value: "red" }, b: { $value: "{color.nope}" } },
});

// Themes: a media or container condition, or a selector; the overrides have the shape of the tokens.
const dark = css.media("(prefers-color-scheme: dark)");
css.createGlobalTheme(t, dark, { color: { bg: "#0b0b0f", accent: "oklch(70% 0.15 259)" } });
css.createGlobalTheme(t, css.container("card (width < 30rem)"), { space: { md: "8px" } });
css.createGlobalTheme(t, ".light", {
  color: { bg: { colorSpace: "srgb", components: [1, 1, 1] } },
  space: { sm: { value: 1, unit: "rem" } },
  motion: { fast: "0.2s" },
  ratio: { golden: 2 },
});
css.createGlobalTheme(t.color, "[data-theme=hc]", { bg: "black" });
css.createGlobalTheme(t, ".weight", { weight: { bold: "extra-bold" } });
css.createGlobalTheme(t, ".alias", { color: { link: "red" } });

css.createGlobalTheme(t, ".x", {
  color: {
    // @ts-expect-error not a colour
    bg: "blu",
  },
});
css.createGlobalTheme(t, ".x", {
  space: {
    // @ts-expect-error a length needs its unit
    md: "8",
  },
});
css.createGlobalTheme(t, ".x", {
  color: {
    // @ts-expect-error a colour is not a length
    bg: { value: 1, unit: "px" },
  },
});
css.createGlobalTheme(t, ".x", {
  // @ts-expect-error there is no color.nope
  color: { nope: "red" },
});
css.createGlobalTheme(t, ".x", {
  // @ts-expect-error there is no such group
  nope: { bg: "red" },
});
// @ts-expect-error a pseudo-class wrapper is not a theme condition
css.createGlobalTheme(t, css.hover, { color: { bg: "red" } });
// @ts-expect-error nor is supports()
css.createGlobalTheme(t, css.supports("(display: grid)"), { color: { bg: "red" } });
// @ts-expect-error a condition or a selector, not a number
css.createGlobalTheme(t, 3, { color: { bg: "red" } });
// @ts-expect-error a group is not a value
css.createGlobalTheme(t, ".x", { color: "red" });

// An override may refer to tokens: the whole value, or inside a CSS value checked with each reference as its target's type.
css.createGlobalTheme(t, ".ref", { space: { md: "{space.sm}" }, color: { bg: "{color.accent}" } });
css.createGlobalTheme(t, ".ref", {
  color: { bg: "color-mix(in oklab, {color.accent}, black 15%)" },
  space: { md: "calc({space.sm} * 2)" },
  motion: { fast: "calc({motion.fast} * {ratio.golden})" },
});
css.createGlobalTheme(t, ".x", {
  // @ts-expect-error a reference to no token
  color: { bg: "{color.nope}" },
});
css.createGlobalTheme(t, ".x", {
  // @ts-expect-error a reference to a token of another type
  color: { bg: "{space.md}" },
});
css.createGlobalTheme(t, ".x", {
  // @ts-expect-error a reference inside a value to no token
  color: { bg: "color-mix(in oklab, {color.nope}, black 15%)" },
});
css.createGlobalTheme(t, ".x", {
  // @ts-expect-error a value that is no colour once the reference is in place
  color: { bg: "color-mix(in oklab, {color.accent}, nope)" },
});
css.createGlobalTheme(t, ".x", {
  // @ts-expect-error a length where a colour goes
  color: { bg: "calc({space.md} * 2)" },
});

// Contrast: two colour tokens and a minimum ratio.
css.check.contrast(t.color.accent, t.color.bg, { min: 4.5 });
css.check.contrast(t.color.link, css.token.color("#fff"), { min: 3 });
// @ts-expect-error a length is not a colour
css.check.contrast(t.space.md, t.color.bg, { min: 4.5 });
// @ts-expect-error the minimum ratio is needed
css.check.contrast(t.color.accent, t.color.bg, {});
// @ts-expect-error a token, not a colour string
css.check.contrast("#000", t.color.bg, { min: 4.5 });

// Derived tokens: a reference inside a CSS value is checked as a value of its target's type.
const d = css.createTokens({
  color: {
    $type: "color",
    accent: { $value: "#2563eb" },
    hover: { $value: "color-mix(in oklab, {color.accent}, black 15%)" },
  },
  space: { $type: "dimension", md: { $value: "16px" }, lg: { $value: "calc({space.md} * 2)" } },
});
css.bg(d.color.hover);
css.padding(d.space.lg);
css.createTokens({
  color: {
    $type: "color",
    a: { $value: "#fff" },
    // @ts-expect-error a derived colour that is no colour
    b: { $value: "color-mix(in oklab, {color.a}, nope)" },
  },
});
css.createTokens({
  color: {
    $type: "color",
    // @ts-expect-error a reference to no token
    b: { $value: "color-mix(in oklab, {color.zzz}, black 15%)" },
  },
});

// JSON: the tree is typed, the values are checked at build time.
declare const json: {
  color: {
    $type: string;
    bg: { $value: string };
    accent: { $value: { colorSpace: string; components: number[] } };
  };
};
const j = css.createTokens(json);
css.bg(j.color.bg);
// @ts-expect-error no token at this path
css.bg(j.color.nope);
