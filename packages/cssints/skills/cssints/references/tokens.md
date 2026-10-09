# Tokens, themes and contrast

## Single tokens

```ts
import * as css from "cssints" with { type: "cssints" };

const accent = css.token.color("#2563eb", "accent"); // --accent, can be set
const gap = css.token.length("16px", { var: "gap", inherit: false });
const muted = css.token.color("#6b7280"); // --_<hash>, private: token.set() rejects it

export const a = css.cn(css.color(accent), css.gap(gap));
export const b = css.style(css.token.set(accent, "red")); // { "--accent": "red" } for a style prop
```

Types: `color`, `length`, `percentage`, `lengthPercentage`, `number`, `integer`, `angle`, `time`, `customIdent`,
`resolution`, `url`, `image`, `transformList`, `easingFunction`, `shadow`. Each gives one `@property` rule. A value in
`rem`/`em`/`ch` gets a px initial value and the real value on `:root`, so it follows the user's font size.

## Token sets (DTCG)

```ts
export const t = css.createTokens({
  color: {
    $type: "color",
    accent: { $value: "#2563eb" },
    hover: { $value: "color-mix(in oklab, {color.accent}, black 15%)" }, // derived: follows accent in themes
    link: { $value: "{color.accent}" }, // alias
  },
  space: {
    $type: "dimension",
    "2xs": { $value: "2px" },
    md: { $value: { value: 1, unit: "rem" } },
  },
});
// t.color.accent, t.space._2xs (a key that starts with a digit gets "_"), variable --space-2xs
```

- `$type` is inherited through groups and required: `color`, `dimension`, `number`, `duration`, `fontWeight`,
  `cubicBezier`, `shadow`. `fontFamily`, `string`, `boolean` and the other composite types are errors.
- Names are the kebab-case path (`--color-accent`). The second argument maps a path to a name or `{ var, inherit }`.
- JSON works: `import tokens from "./tokens.json" with { type: "json" }; createTokens(tokens)`. The editor then knows
  the paths but not the types; the build checks the values.
- Figma's own export (one DTCG file per mode) and TokensBrücke ("Split modes into separate files"): the default mode
  is `createTokens(json)`, another mode is `createGlobalTheme(t, dark, darkJson)` as it is. Tokens Studio's format goes
  through Style Dictionary with `@tokens-studio/sd-transforms` first (recipe in docs/API.md, "JSON from Figma").
- Ready-made sets: `@cssints/tokens/open-props`, `/radix`, `/flexoki`, `/reasonable-colors` (data: put a set under a
  group, `createTokens({ radix: light })` gives `--radix-blue-11`). Palettes: `@cssints/ramp`.

## Themes

```ts
const dark = css.media("(prefers-color-scheme: dark)");
css.createGlobalTheme(t, dark, { color: { accent: "#60a5fa" } }); // :root under the media query
css.createGlobalTheme(t, ".brand", { color: { accent: "#db2777" } }); // a selector; hover and link follow
css.createGlobalTheme(t.color, css.container("(width < 30rem)"), { accent: "#000" }); // a group, a container query
css.createGlobalTheme(t, ".soft", {
  color: { link: "color-mix(in oklab, {color.accent}, white 20%)" },
}); // live
```

- The condition is a `media()`, a `container()` or a selector. Not `hover` or `supports()`.
- Options: `{ layer: "app" }` (a layer declared with `layers()`), `{ scope: "article.post" }` (an `@scope` around a
  selector theme).
- A theme re-declares the aliases and derived tokens that depend on what it overrides.
- Put themes in a module of their own and import it once from the entry (`import "./theme.ts"`); a module that uses a
  token gets the theme rules for that token.
- Sheet order: tokens and themes are in `_.k`, below every class; a selector theme beats a condition theme.

## Contrast

```ts
css.check.contrast(t.color.fg, t.color.bg, { min: 4.5 }); // WCAG 2.x, 1 to 21
```

- Checks the defaults and every theme that sets either token (themes of one selector are read together in cascade
  order). A ratio below `min` is a build error with both colours and the theme.
- A value it cannot evaluate (`color-mix()` over another token, `currentColor`, `light-dark()`, a translucent colour)
  is a warning, not a pass.
- A value set at runtime (a slider on `<html>`) is checked at its default only.
- `surface().ink()` picks black or white by lightness and is not a contrast guarantee: check the pair with tokens.

## Top-level layers

```ts
css.layers("app", "author", "viewer"); // after the engine's layers: they beat the engine's :root fallbacks
css.layers("reset", "base", { before: true }); // before the engine's: every cssints style beats them
```

The same names in another order, or a layer on both sides, is a build error. `@cssints/reset` uses `reset` before the
engine's layers; `@cssints/mise-en-mode` uses `app < author < viewer`.
