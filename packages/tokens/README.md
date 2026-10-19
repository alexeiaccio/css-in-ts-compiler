# @cssints/tokens

Ready-made token sets for [cssints](../../README.md), one subpath export per set. Each set is plain DTCG data
(`as const`) that you pass to `createTokens` yourself, and dark values are override objects for `createGlobalTheme`.
The data is generated from upstream packages and files at a pinned version (`bun run generate`). The package has no
runtime and no `scope()`.

```ts
// tokens.ts
import { createTokens } from "cssints" with { type: "cssints" };
import { colors, easings, radii, shadows, sizes } from "@cssints/tokens/open-props";
import { light } from "@cssints/tokens/radix";

export const op = createTokens({
  ...colors,
  size: sizes,
  radius: radii,
  ease: easings,
  shadow: shadows,
});
export const rx = createTokens({ radix: { blue: light.blue, gray: light.gray } });
```

```ts
// theme.ts, imported once by the entry
import { createGlobalTheme, media } from "cssints" with { type: "cssints" };
import { shadowsDark } from "@cssints/tokens/open-props";
import { dark } from "@cssints/tokens/radix";

import { op, rx } from "./tokens.ts";

const scheme = media("(prefers-color-scheme: dark)");
createGlobalTheme(rx.radix, scheme, { blue: dark.blue, gray: dark.gray });
createGlobalTheme(op.shadow, scheme, shadowsDark);
```

```ts
// card.ts
import {
  boxShadow,
  cn,
  color,
  p,
  transitionTimingFunction,
} from "cssints" with { type: "cssints" };

import { op, rx } from "./tokens.ts";

export const card = cn(
  p(op.size._3),
  color(rx.radix.blue._11),
  boxShadow(op.shadow.shadow2),
  transitionTimingFunction(op.ease.easeOut3),
);
```

The sheet of `card.ts` holds the four tokens the module uses, of the 384 that `tokens.ts` makes. Easings and shadows
have no `@property` syntax of their own, so their rule takes any value (`syntax: "*"`). The sheet of `theme.ts` holds
the dark rules:

```css
@property --ease-ease-out3 {
  syntax: "*";
  inherits: true;
  initial-value: cubic-bezier(0, 0, 0.3, 1);
}
@property --radix-blue-11 {
  syntax: "<color>";
  inherits: true;
  initial-value: #0d74ce;
}
@property --shadow-shadow2 {
  syntax: "*";
  inherits: true;
  initial-value:
    0 3px 5px -2px hsl(220 3% 15% / 4%),
    0 7px 14px -5px hsl(220 3% 15% / 6%);
}
@property --size-3 {
  syntax: "<length>";
  inherits: true;
  initial-value: 16px;
}
@layer _.a {
  ._16gq2dh {
    padding: var(--size-3);
  }
  ._6lyfev {
    transition-timing-function: var(--ease-ease-out3);
  }
  ._jwbgq6 {
    color: var(--radix-blue-11);
  }
  ._lwcu7u {
    box-shadow: var(--shadow-shadow2);
  }
}
@layer _.k {
  @media (prefers-color-scheme: dark) {
    :root {
      --radix-blue-1: #0d1520; /* ... */
      --radix-gray-12: #eeeeee;
    }
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --shadow-shadow1: 0 1px 2px -1px hsl(220 40% 2% / 34%); /* ... */
    }
  }
}
```

## The sets

| Import                              | Exports                                                                                                                                                                                                                                                                 | From                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `@cssints/tokens/open-props`        | `colors`, `sizes`, `remSizes`, `fluidSizes`, `contentSizes`, `headerSizes`, `relativeSizes`, `radii`, `borderSizes`, `fontSizes`, `fluidFontSizes`, `letterSpacings`, `fontWeights`, `lineHeights`, `easings`, `springs`, `shadows` (tokens); `shadowsDark` (overrides) | open-props 1.7.23              |
| `@cssints/tokens/radix`             | `light`, `lightAlpha` (tokens); `dark`, `darkAlpha` (overrides)                                                                                                                                                                                                         | @radix-ui/colors 3.0.0         |
| `@cssints/tokens/flexoki`           | `flexoki` (`base`: `black`, `paper`, `50`..`950`; eight accents `50`..`950`)                                                                                                                                                                                            | kepano/flexoki@8d723ba         |
| `@cssints/tokens/reasonable-colors` | `reasonableColors` (25 hues, shades `1`..`6`)                                                                                                                                                                                                                           | reasonable-colors 0.4.0        |
| `@cssints/tokens/madoromi`          | `madoromi` (eight flavours `haruHiru`..`fuyuYoru`: 12 neutrals, 14 inks, `roles`, `ansi`)                                                                                                                                                                               | the-moonwitch/madoromi@f8bcc5a |

- **Data, not a `createTokens` call.** The variable name is the token path, so the group you put a set under is its
  prefix: `createTokens({ radix: light })` gives `--radix-blue-11`, `createTokens(light)` gives `--blue-11`. Open Props,
  Radix and Reasonable Colors all have a `blue`, so only you can say which one is `--blue-*`. Data also lets you pick
  scales: the type cost and the theme's size are per token you pass (see "Limits"). A plugin's `{ tokens }` entry
  takes the result of your `createTokens` call, so a plugin can still build on a set.
- **Keys.** Steps keep the upstream names. A key that starts with a digit is `_` and the key in code (`t.blue._7`,
  `t.size._000`), as cssints reads it; the variable keeps the key (`--blue-7`). Radix's alpha scales are `blueA`, so
  their variables are `--blue-a-3`.
- **Open Props.** `colors` are the 19 hues of `open-props/src/colors`, `0`..`12`. `sizes` are the px scale (`size-px-*`,
  `000`..`15`) and the named widths `xxs`..`xxl`; `remSizes` the rem scale (`size-*`, `000`..`15`), `fluidSizes`
  `1`..`10` (`clamp()`), `contentSizes` and `headerSizes` `1`..`3` (`ch`), `relativeSizes` `000`..`15` (`ch`). `radii`
  are `1`..`6` and `round`, in rem as upstream. `fontSizes` are `00`..`8` (rem), `fluidFontSizes` `0`..`3`,
  `letterSpacings` `0`..`7` (em). `fontWeights` are `1`..`9`, `lineHeights` `00`..`5`. `easings` (`cubicBezier`) are the
  cubic-béziers and steps, with the Penner curves (`easeCubicOut`, `easeQuintInOut`, sine to circ); `springs` the
  springs and bounces, which are `linear()` (see "Limits"). `shadows` are tokens and `shadowsDark` their overrides for
  `createGlobalTheme`: `--shadow-color` and `--shadow-strength` are written into each value, light and dark.
- **rem, ch and em.** cssints gives a token in rem, ch or em an `@property` initial value in px (at 16px) and declares
  the value itself on `:root`, so the tokens follow the user's font size. On `:root` an `em` or `ch` is the root's.
  For the letter spacings, and the `ch` sizes if they should follow the element's font, make them not inherit: then
  each element computes its own (`:where(*){--tracking-1:.025em}`):

  ```ts
  createTokens({ tracking: letterSpacings }, (path) => ({ var: path.join("-"), inherit: false }));
  ```

- **Radix.** `light` has the 31 solid scales, `lightAlpha` the 31 alpha scales and `blackA`, `whiteA`. `dark` and
  `darkAlpha` give the same paths, `{ blue: { _1: "#0d1520", ... } }`, for `createGlobalTheme`. To pick scales, pick
  them in both the tokens and the overrides. An override for a token you did not create is a type error.
- **madoromi.** Eight flavours, a season (`haru` spring, `natsu` summer, `aki` autumn, `fuyu` winter) by day (`hiru`)
  or by night (`yoru`): `haruHiru` .. `fuyuYoru`. Each has the same keys, with the upstream names in ASCII
  (`hyoshi`, not `hyōshi`): the paper `kami`, `hyoshi`, `chitsu`, `nijimi0`..`2`, `kasure0`..`2`; the ink `usuzumi0`,
  `usuzumi1`, `sumi`; the 14 inks (`sakura`, `nadeshiko`, `botan`, `fuji`, `kikyo`, `beni`, `akane`, `kaki`,
  `yamabuki`, `wakaba`, `tokiwa`, `sora`, `ruri`, `ai`). `roles` are the style guide's uses (`text`, `keyword`,
  `link`, `error`, `success`, `added`, ...: 40) and `ansi` the 16 terminal colours by number (`ansi._0`..`ansi._15`,
  `--madoromi-ansi-0`..`15`; `"0"` or `_0` in an override). A role is the value of its colour, not an alias, so it is right in a theme of another
  flavour. Which colour is for what: upstream's [style guide](https://github.com/the-moonwitch/madoromi/blob/f8bcc5aa1ec3f731fcba9471be7caa5df1ab5695/palettes/style-guide.md).
  Every flavour has the same paths, so one flavour is the tokens and any other is a theme of them, as it is:

  ```ts
  import { createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };
  import { madoromi } from "@cssints/tokens/madoromi";

  export const m = createTokens({ madoromi: madoromi.akiHiru }); // --madoromi-kami, --madoromi-roles-text, ...
  createGlobalTheme(m.madoromi, media("(prefers-color-scheme: dark)"), madoromi.akiYoru); // day and night
  createGlobalTheme(m.madoromi, '[data-season="haru"]', madoromi.haruHiru); // another season
  ```

  A theme sets every token of the flavour (82). For night and a season at once, give each pair its own selector
  (`[data-season="haru"][data-mode="yoru"]`).

## Contrast

`check.contrast` reads the defaults and every theme. With the Radix sets, the text steps on the backgrounds give these
results (`test/fixtures/radix-theme.ts` checks all 31 scales, light and dark):

- Step 12 on step 1 or 2: 4.5 or more in all scales, light and dark.
- Step 11 on step 1 or 2: 4.5 or more in dark. In light, these pairs are below 4.5. Radix tunes step 11 for APCA, not
  WCAG 2. The ratios are as cssints cuts them:

  | Pair    | amber | green | jade | orange | teal | yellow |
  | ------- | ----- | ----- | ---- | ------ | ---- | ------ |
  | 11 on 1 |       |       |      | 4.41   | 4.49 | 4.48   |
  | 11 on 2 | 4.43  | 4.49  | 4.43 | 4.24   | 4.34 | 4.42   |

  `check.contrast(t.radix.orange._11, t.radix.orange._2, { min: 4.5 })` fails the build:
  `contrast 4.24 is below 4.5: radix.orange.11 #cc4e00 on radix.orange.2 #fff7ed, in the default values`.

With madoromi, `test/fixtures/madoromi-tokens.ts` checks all eight flavours: `sumi` on `kami` is 7 or more (7.17 to
11.48), `usuzumi0` on `kami` 4.5 or more (4.52 to 7.44), `kasure2` (subtle text, comments) on `kami` 3 or more (3.50
to 5.74). The day flavours are the low end of each range.

## Limits

- **A shadow costs in the types.** cssints checks each shadow value by the `<shadow>#` grammar: about 30,000
  instantiations a layer, so `shadows` (11 tokens of up to 7 layers) costs 1.2 M and `shadowsDark` as a theme 1.2 M more.
- **Type cost** (tsgo, one file per row; a hex colour costs about 80 instantiations):

  | Call                                                           | Instantiations | Check time |
  | -------------------------------------------------------------- | -------------- | ---------- |
  | `color("red")` (the baseline)                                  | 0.16 M         | 0.08 s     |
  | Open Props `colors` (247 tokens)                               | 0.18 M         | 0.09 s     |
  | Open Props, all token groups (453) and the `shadowsDark` theme | 2.7 M          | 1.8 s      |
  | Radix `light` (372)                                            | 0.19 M         | 0.10 s     |
  | Radix `light` and the `dark` theme                             | 0.27 M         | 0.12 s     |
  | Radix `lightAlpha` and the `darkAlpha` theme                   | 0.54 M         | 0.29 s     |
  | Radix `light` and `lightAlpha` in one call, with both themes   | 0.66 M         | 0.38 s     |
  | Flexoki (119)                                                  | 0.17 M         | 0.09 s     |
  | Reasonable Colors (150)                                        | 0.17 M         | 0.10 s     |
  | madoromi, one flavour (82) and another as a theme              | 0.20 M         | 0.13 s     |

  A single statement stops at TypeScript's limit (TS2589, "excessively deep") at about 5 M.

## Licenses

The code is MIT (`LICENSE`). The data keeps the license of its source:

- **Open Props**: MIT, Copyright (c) 2021 Adam Argyle.
- **Radix Colors**: MIT, Copyright (c) 2021 Radix.
- **Flexoki**: MIT, Copyright (c) 2023 Steph Ango.
- **Reasonable Colors**: MIT, Copyright (c) 2020 Matthew Howell.
- **madoromi**: MPL-2.0, Copyright the-moonwitch (samhain). The MPL applies per file: `src/madoromi.ts` and the
  `dist/madoromi.*` built from it are MPL-2.0 and carry its notice and the source URL at the commit; the rest of the
  package stays MIT. A change to those files is under the MPL; using them in your code is not
  ([MPL-2.0](https://mozilla.org/MPL/2.0/), section 3.3).

The MIT notice of each MIT source, with its copyright line above:

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
> documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
> rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
> persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
> Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
> WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
> COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
> OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

```bash
cd packages/tokens && bun run generate   # src/*.ts from the devDependencies and the pinned files, then vp fmt
cd packages/tokens && bun run test       # a fixture per set through the engine (sheets, Radix theme and contrast); bun run typecheck: the type test
```
