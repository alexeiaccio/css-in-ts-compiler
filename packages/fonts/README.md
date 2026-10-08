# @cssints/fonts

Web fonts for [cssints](../../README.md): `font()` reads the font files at build time and gives two members of a
`cssints/plugin` `scope()`. `family()` emits the `@font-face` rules, a fallback face whose metrics match the font, and
`font-family`. `trim()` removes the space above the cap height and below the baseline. The metrics come from the files
(fontkitten). No script ships.

```ts
// fonts.ts: a build-time module (it runs while the build runs, and never reaches the browser)
import { font } from "@cssints/fonts" with { type: "cssints" };

export const body = font("Atkinson Hyperlegible", { provider: "fontsource", weights: [400, 700] });
export const brand = font("Brand", {
  provider: "fs",
  files: ["src/fonts/brand.woff2"],
  fallback: "serif",
});
```

```ts
// a component imports them from there
import { cn } from "cssints" with { type: "cssints" };
import { body } from "./fonts.ts" with { type: "cssints" };

export const text = body.family();
export const heading = cn(body.family(), body.trim({ lineHeight: 1.2 }));
```

```css
@layer _.k {
  /* fontaine's formula (capsize's createFontStack): Arial scaled to the average width of the font, the vertical
     metrics of the font */
  @font-face {
    font-family: "Atkinson Hyperlegible Fallback";
    src: local("Arial"), local("Arimo"), local("Liberation Sans");
    size-adjust: 99.3717%;
    ascent-override: 95.6006%;
    descent-override: 29.1833%;
    line-gap-override: 0%;
  }
  /* one face per weight and subset of the package; Vite emits the files as assets */
  @font-face {
    font-family: "Atkinson Hyperlegible";
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url("/…/atkinson-hyperlegible-latin-400-normal.woff2") format("woff2");
    unicode-range: U+0000-00FF, …;
  }
  /* … latin-ext 400, latin 700, latin-ext 700 */
  ._fonts-native {
    text-box: trim-both cap alphabetic;
  }
  /* only when a target lacks text-box */
  @supports not (text-box: trim-both cap alphabetic) {
    ._fonts-native::before,
    ._fonts-native::after {
      content: "";
      display: table;
    }
    ._fonts-native::before {
      margin-bottom: var(--fonts-t);
    }
    ._fonts-native::after {
      margin-top: var(--fonts-b);
    }
  }
}
@layer _.a {
  ._a {
    font-family: "Atkinson Hyperlegible", "Atkinson Hyperlegible Fallback", sans-serif;
  }
  ._b {
    line-height: 1.2;
  }
  ._c {
    --fonts-t: -0.262em;
  }
  ._d {
    --fonts-b: -0.27em;
  }
}
```

## Rules

- **Providers.** `fontsource` reads the `@fontsource/<family>` package from the `node_modules` of the working directory
  (`"Atkinson Hyperlegible"` is `@fontsource/atkinson-hyperlegible`): its `.woff2` files, one face per weight, style
  and subset, each with the subset's `unicode-range`. `weights` and `styles` must be among those of the package (400 and
  `normal` by default). `fs` takes font files (`.woff2`, `.woff`, `.ttf`, `.otf`, relative to the working directory),
  one face each, with the weight and style read from the file.
- **URLs.** A face's `src` is the absolute path of the file. Vite's CSS pipeline turns it into an asset in a build
  (`/assets/…-[hash].woff2`) and into `/@fs/…` in dev.
- **Fallback face.** `fallback` is a generic family (`sans-serif`, `serif` or `monospace`; by default the category of
  the fontsource package, else `sans-serif`). Its local fonts are Arial, Times New Roman or Courier New, with their
  metric-compatible clones (Arimo, Tinos, Cousine, the Liberation fonts). The face scales them to the font's average
  latin width (`size-adjust`) and overrides `ascent`, `descent` and `line-gap` with the font's. This is fontaine's
  formula. The numbers are those of `@capsizecss/core` `createFontStack` (checked in the test). The metrics come from
  the 400 normal face (else the first) of the latin subset.
- **trim().** `trim()` sets `line-height` (`normal`, or the number given) and the class of the kernel
  `text-box: trim-both cap alphabetic` (Chrome 133, Safari 18.2, Firefox 154). When a target lacks `text-box`, the
  sheet gets capsize's fallback: `::before` and `::after` with negative margins, in `em`, from the metrics of the font
  and the line height (the numbers of `@capsizecss/core` `createStyleObject`, checked in the test). The fallback is
  plain CSS, so every target gets it (Firefox 120 too), and there is no build warning. It is inside `@supports not`,
  so a browser with `text-box` does not trim twice. When every target has `text-box`, the fallback is not in the sheet.
- **Errors**, at build time: a package that is not installed (the message names it), a weight or a style the
  package does not have, a file that cannot be read, a font collection, and a `lineHeight` that is not a number
  (also a type error).
- **Cache.** A file is parsed once per modification time in a process.

## Limits

- `lineHeight` is a number (a multiple of the font size). A length would make the trim depend on the font size.
- The trim is right for the web font. The fallback face matches ascent and descent, but not the cap height, so the
  trim is off by a little until the font loads.
- Not yet: variable fonts (`@fontsource-variable/*`), remote providers (unifont, Google Fonts), the subsets option,
  `font-display` other than `swap`, and watching the font files in dev (a changed file needs a restart).

```bash
cd packages/fonts && bun run test   # fixtures through the engine (output, errors, warnings, a build), and the type test via bun run typecheck
```
