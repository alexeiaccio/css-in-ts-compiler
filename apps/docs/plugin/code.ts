// The code of the docs: @pierre/highlights for the blocks Shiki need not type-check (the files of an example's panel, the
// README's skipped blocks, the landing page's samples), Shiki only for the ts blocks where twoslash adds the type hovers.
//
// One palette for both: the syntax colours are taken from the default palette (src/palettes.ts) at the accent's hue, each
// at a contrast floor on the code's paper (src/code.ts), so the code reads in the site's own colour and every pair is
// measured by test/code.mjs. The themes are written once and read twice: Pierre takes the Zed shape, Shiki a TextMate one;
// both emit `--shiki-light-*`/`--shiki-dark-*` (the prefix is Pierre's option too), which is the switch src/prose.ts
// already made for Shiki.
import { codeToHtml, isSupportedLanguage, type Theme } from "@pierre/highlights";
import type { ThemeRegistration } from "shiki";

import { color } from "../../../packages/rybitten/src/index.ts";
import { ramp } from "../../../packages/ramp/src/index.ts";
import { CODE_PAPER, type CodeMode } from "../src/code.ts";
import { DEFAULT_HUE, HUES as HUE_STEPS, palettes } from "../src/palettes.ts";

type Hex = string;

// The kinds a capture or a TextMate scope settles on, and the code the query's `variable`/`punctuation`/`comment` slots hold.
const KINDS = [
  "keyword",
  "type",
  "function",
  "constructor",
  "property",
  "string",
  "number",
  "constant",
  "operator",
  "tag",
  "attribute",
] as const;
type Kind = (typeof KINDS)[number];

// Degrees of RYBitten's wheel from the accent's hue: violet for keywords, magenta for types, blue for functions, a red for
// tags, the greens for strings. Rotation keeps the code in the palette's own family whichever hue the site starts on.
const HUES: Record<Kind, number> = {
  keyword: 0,
  type: 30,
  function: -30,
  constructor: 60,
  property: -60,
  string: -90,
  number: 180,
  constant: 150,
  operator: 120,
  tag: 90,
  attribute: 210,
};

const palette = palettes.cssints(DEFAULT_HUE);
// the wheel's step, in degrees (src/palettes.ts turns a hue of 0..11 into the cube's angle the same way)
const STEP = 360 / HUE_STEPS;
const hex = (step: unknown) => (step as { $value: Hex }).$value;
// The default palette's own ramp: a colour at the hue, at the floor against the paper.
const at = (hue: number, paper: Hex, min: number): Hex =>
  hex(
    ramp(color((hue + 360) % 360, { cube: "itten" }), {
      mode: "contrast",
      ratios: [min],
      background: paper,
    })["1"],
  );

// One mode's syntax: the kinds at their floor (4.6:1 light, 7:1 dark), the neutrals from the palette's own text tokens.
const syntax = (mode: CodeMode) => {
  const min = mode === "light" ? 4.6 : 7;
  const ink = (k: "text" | "textMedium" | "textLow") => palette[mode][k];
  return {
    ...(Object.fromEntries(
      KINDS.map((kind) => [
        kind,
        { color: at(DEFAULT_HUE * STEP + HUES[kind], CODE_PAPER[mode], min) },
      ]),
    ) as Record<Kind, { color: Hex }>),
    comment: { color: ink("textLow"), font_style: "italic" },
    punctuation: { color: ink("textMedium") },
    variable: { color: ink("text") },
    embedded: { color: ink("text") },
  };
};

const SYNTAX = { light: syntax("light"), dark: syntax("dark") };
/** The text colour of a mode: the palette's own. */
const FOREGROUND = { light: palette.light.text as Hex, dark: palette.dark.text as Hex };

/** Pierre's themes, as its Zed shape reads them. */
export const themes: Record<CodeMode, Theme> = {
  light: {
    name: "cssints-light",
    appearance: "light",
    style: { background: CODE_PAPER.light, foreground: FOREGROUND.light, syntax: SYNTAX.light },
  },
  dark: {
    name: "cssints-dark",
    appearance: "dark",
    style: { background: CODE_PAPER.dark, foreground: FOREGROUND.dark, syntax: SYNTAX.dark },
  },
};

// TextMate's scopes, in the order they apply: a later rule wins, so `keyword.operator` takes its colour from `keyword`,
// and `variable.other.property` from `variable`.
const SCOPES: [string[], keyof typeof SYNTAX.dark][] = [
  [["comment"], "comment"],
  [["string"], "string"],
  [["constant.numeric"], "number"],
  [["constant"], "constant"],
  [["keyword"], "keyword"],
  [["storage"], "keyword"],
  [["keyword.operator"], "operator"],
  [["entity.name.function", "support.function"], "function"],
  [["entity.name.type", "entity.name.class", "support.type", "support.class"], "type"],
  [["entity.name.tag"], "tag"],
  [["entity.other.attribute-name"], "attribute"],
  [["variable"], "variable"],
  [["variable.parameter"], "variable"],
  [["variable.other.constant"], "constant"],
  [
    ["variable.other.property", "variable.object.property", "variable.other.object.property"],
    "property",
  ],
  [["punctuation"], "punctuation"],
];

const shikiTheme = (mode: CodeMode): ThemeRegistration => ({
  name: `cssints-${mode}`,
  type: mode,
  colors: { "editor.background": CODE_PAPER[mode], "editor.foreground": FOREGROUND[mode] },
  tokenColors: SCOPES.map(([scope, kind]) => ({
    scope,
    settings: {
      foreground: SYNTAX[mode][kind].color,
      // the comments' italic, the one setting that is not a colour
      ...("font_style" in SYNTAX[mode][kind] ? { fontStyle: "italic" as const } : {}),
    },
  })),
});
/** The same palette as a Shiki theme, for the blocks twoslash type-checks. */
export const shikiThemes = { light: shikiTheme("light"), dark: shikiTheme("dark") };
export const shikiThemeNames = { light: themes.light.name, dark: themes.dark.name };

const decoder = new TextDecoder();
// A block as HTML, the way the site's stylesheet reads it: the mode picks `--shiki-light-*` or `--shiki-dark-*`.
export const highlight = (text: string, lang: string): string =>
  decoder.decode(
    codeToHtml(text, {
      lang: isSupportedLanguage(lang) ? lang : "text",
      themes,
      defaultColor: false,
      cssVariablePrefix: "--shiki-",
    }),
  );
