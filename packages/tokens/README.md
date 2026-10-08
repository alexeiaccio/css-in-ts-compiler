# @cssints/tokens

Ready-made token sets for [cssints](../../README.md), one subpath export per set. Each set is plain DTCG data
(`as const`) that you pass to `createTokens` yourself, and dark values are override objects for `createGlobalTheme`.
The data is generated from upstream packages and files at a pinned version (`bun run generate`). The package has no
runtime and no `scope()`.

```ts
// tokens.ts
import { createTokens } from "cssints" with { type: "cssints" };
import { colors, radii, sizes } from "@cssints/tokens/open-props";
import { light } from "@cssints/tokens/radix";

export const op = createTokens({ ...colors, size: sizes, radius: radii });
export const rx = createTokens({ radix: { blue: light.blue, gray: light.gray } });
```

```ts
// theme.ts, imported once by the entry
import { createGlobalTheme, media } from "cssints" with { type: "cssints" };
import { dark } from "@cssints/tokens/radix";

import { rx } from "./tokens.ts";

createGlobalTheme(rx.radix, media("(prefers-color-scheme: dark)"), {
  blue: dark.blue,
  gray: dark.gray,
});
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
import { easings, shadows } from "@cssints/tokens/open-props";

import { op, rx } from "./tokens.ts";

export const card = cn(
  p(op.size._3),
  color(rx.radix.blue._11),
  boxShadow(shadows.shadow2),
  transitionTimingFunction(easings.easeOut3),
);
```

The sheet of `card.ts` holds the two tokens the module uses, of the 302 that `tokens.ts` makes. The sheet of `theme.ts`
holds the dark rule:

```css
@property --radix-blue-11 {
  syntax: "<color>";
  inherits: true;
  initial-value: #0d74ce;
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
  ._1jyizjh {
    transition-timing-function: cubic-bezier(0, 0, 0.3, 1);
  }
  ._1y5wvf0 {
    box-shadow:
      0 3px 5px -2px hsl(220 3% 15% / 4%),
      0 7px 14px -5px hsl(220 3% 15% / 6%);
  }
  ._jwbgq6 {
    color: var(--radix-blue-11);
  }
}
@layer _.k {
  @media (prefers-color-scheme: dark) {
    :root {
      --radix-blue-1: #0d1520; /* ... */
      --radix-gray-12: #eeeeee;
    }
  }
}
```

## The sets

| Import                              | Exports                                                                                                      | From                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------- |
| `@cssints/tokens/open-props`        | `colors`, `sizes`, `radii`, `borderSizes`, `fontWeights`, `lineHeights`; `easings`, `shadows`, `shadowsDark` | open-props 1.7.23       |
| `@cssints/tokens/easings`           | `easings` (the 24 cubic-béziers of easings.net, `easeInSine` to `easeInOutBack`)                             | ai/easings.net@d2563f0  |
| `@cssints/tokens/radix`             | `light`, `lightAlpha` (tokens); `dark`, `darkAlpha` (overrides)                                              | @radix-ui/colors 3.0.0  |
| `@cssints/tokens/flexoki`           | `flexoki` (`base`: `black`, `paper`, `50`..`950`; eight accents `50`..`950`)                                 | kepano/flexoki@8d723ba  |
| `@cssints/tokens/reasonable-colors` | `reasonableColors` (25 hues, shades `1`..`6`)                                                                | reasonable-colors 0.4.0 |

- **Data, not a `createTokens` call.** The variable name is the token path, so the group you put a set under is its
  prefix: `createTokens({ radix: light })` gives `--radix-blue-11`, `createTokens(light)` gives `--blue-11`. Open Props,
  Radix and Reasonable Colors all have a `blue`, so only you can say which one is `--blue-*`. Data also lets you pick
  scales: the type cost and the theme's size are per token you pass (see "Limits"). A plugin's `{ tokens }` entry
  takes the result of your `createTokens` call, so a plugin can still build on a set.
- **Keys.** Steps keep the upstream names. A key that starts with a digit is `_` and the key in code (`t.blue._7`,
  `t.size._000`), as cssints reads it; the variable keeps the key (`--blue-7`). Radix's alpha scales are `blueA`, so
  their variables are `--blue-a-3`.
- **Open Props.** `colors` are the 19 hues of `open-props/src/colors`, `0`..`12`. `sizes` are the px scale (`size-px-*`,
  `000`..`15`) and the named widths `xxs`..`xxl`. `radii` are `1`..`6` and `round`. `fontWeights` are `1`..`9`,
  `lineHeights` `00`..`5`. `easings`, `shadows` and `shadowsDark` are CSS strings (see "Limits"). The shadows are
  resolved: `--shadow-color` and `--shadow-strength` are written into each value, light and dark.
- **Radix.** `light` has the 31 solid scales, `lightAlpha` the 31 alpha scales and `blackA`, `whiteA`. `dark` and
  `darkAlpha` give the same paths, `{ blue: { _1: "#0d1520", ... } }`, for `createGlobalTheme`. To pick scales, pick
  them in both the tokens and the overrides. An override for a token you did not create is a type error.

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

## Limits

- **rem.** A token's `@property` initial value cannot depend on the font size, so cssints rejects `1rem`. The rem values
  of Open Props are converted at 16px to the rem (`radius-3` is `16px`). For this reason, the rem and `ch` sizes
  (`size-1` as `.25rem`, `size-fluid-*`, `size-content-*`), the font sizes and the letter spacings are not included.
- **Strings, not tokens.** cssints has no token type for a timing function or a shadow (`cubicBezier` and the composite
  DTCG types have no `@property` syntax). Because of this, the easings and shadows are CSS strings: they go into the
  property as they are, with no variable. A theme cannot change them: use `shadowsDark` under your dark condition.
- **`linear()` in the types.** cssints' types reject a `linear()` easing with more than 9 stops. The build accepts it.
  `transitionTimingFunction(easings.easeSpring3)` (Open Props' springs and bounces) is a type error. It builds
  correctly.
- **A theme takes the whole set.** Only the tokens a module uses go into its sheet. But a module that imports the
  module that calls `createGlobalTheme` gets the `@property` rules of every token the theme sets. Put the theme in its
  own module, import it once from the entry, and pass it only the scales you use.
- **Type cost** (tsgo, `createTokens` per set, about 7,000 instantiations per colour token):

  | Call                                         | Instantiations | Check time |
  | -------------------------------------------- | -------------- | ---------- |
  | `color("red")` (the baseline)                | 0.18 M         | 0.13 s     |
  | Open Props `colors` (247 tokens)             | 1.9 M          | 0.6 s      |
  | Open Props, all token groups (299)           | 1.9 M          | 0.6 s      |
  | Radix `light` (372)                          | 2.9 M          | 0.8 s      |
  | Radix `light` and the `dark` theme           | 5.4 M          | 1.4 s      |
  | Radix `lightAlpha` and the `darkAlpha` theme | 5.8 M          | 2.0 s      |
  | Radix `blue` and `gray`, light and dark      | 0.5 M          | 0.25 s     |
  | Flexoki (119)                                | 1.0 M          | 0.35 s     |
  | Reasonable Colors (150)                      | 1.3 M          | 0.45 s     |

  A single statement stops at TypeScript's limit (TS2589, "excessively deep"). `createTokens({ ...light, ...lightAlpha })`
  (766 tokens) is over that limit. This is why the solid and alpha scales of Radix are separate sets.

## Licenses

The code is MIT (`LICENSE`). The data keeps the license of its source:

- **Open Props**: MIT, Copyright (c) 2021 Adam Argyle.
- **Radix Colors**: MIT, Copyright (c) 2021 Radix.
- **Flexoki**: MIT, Copyright (c) 2023 Steph Ango.
- **Reasonable Colors**: MIT, Copyright (c) 2020 Matthew Howell.
- **easings.net**: the site and its repository (ai/easings.net) are GPL-3.0. `src/easings.ts` holds only the 24
  `cubic-bezier()` values from its `src/easings.yml`. Before you publish this subpath, decide if those values are
  covered by GPL-3.0. If they are, publish them as a separate GPL-3.0 package, or take the Penner curves from
  Open Props instead (`easings.easeCubicOut` and the others, MIT).

The MIT notice of each source, with its copyright line above:

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
