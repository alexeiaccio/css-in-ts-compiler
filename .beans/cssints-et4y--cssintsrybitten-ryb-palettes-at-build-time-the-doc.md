---
# cssints-et4y
title: '@cssints/rybitten: RYB palettes at build time; the docs site on it, palettes in the settings'
status: completed
type: feature
priority: normal
created_at: 2026-10-10T16:41:29Z
updated_at: 2026-10-10T19:00:33Z
---

Asked by the user (2026-10-10): a plugin package on RYBitten (https://rybitten.space/, npm rybitten 1.3.0, MIT, Elio Meodai: RGB<->RYB with historical gamut cubes), move the docs site's palette onto it, and let the settings switch themes from different palettes.
- [x] packages/rybitten (@cssints/rybitten), laid out like ramp/tokens (README, src/index.ts, test/rybitten.mjs, fixtures, types): build-time functions that return DTCG data for createTokens / overrides for createGlobalTheme (e.g. a hue wheel or harmony in RYB space, steps of lightness, a choice of cube/gamut), using rybitten as a dependency (pin, license notice). No runtime unless a live hue slider needs one (say).
- [x] apps/docs: the palette (accent family and neutrals) from @cssints/rybitten; check.contrast and test/contrast.mjs still hold (over the hue range).
- [x] Settings: a palette picker that switches whole themes: RYBitten cubes (a few named gamuts) and the sets of @cssints/tokens (Open Props, Radix, Flexoki, Reasonable Colors) mapped onto the site's semantic tokens; persisted and applied before paint like the other settings; contrast checked per palette and mode (a palette that fails is fixed or left out, say which).
- [x] Attribution of RYBitten in the package README/LICENSE and on the site (credits).
- [x] Tests: package tests, docs build/contrast/settings/browser tests; budgets if types grow.

## Engine gaps

- **`createGlobalTheme` in nested loops keeps only the last pass.** Found by `apps/docs/src/theme.ts` (a theme per palette and per hue). `__at` (macro.ts) resets the theme counter `registry.tokens` whenever the running site changes, so a loop that alternates between two call sites gives them the same key `file#site.n` and the later registration replaces the earlier one. Repro: `for (const id of ["x","y","z"]) { createGlobalTheme(t, `[data-p="${id}"]`, {...}); for (const h of [1,2]) createGlobalTheme(t, `[data-p="${id}"][data-h="${h}"]`, {...}); }` prints only the rules of `z`. Workaround here: two loops one after the other (each site runs on its own). A fix would number themes with a counter per module evaluation, not per site run.
- **A theme redeclares the aliases of the tokens it sets, so it wins over a mode by order.** The palette themes set `pal.*` and the colours are aliases of them (`--color-bg: var(--pal-light-bg)`), so each palette rule carries those aliases and, being later in `_.k`, beat `.dark` and `.dim`. Workaround: the selector is `:where([data-palette="x"])`, with no specificity, so every mode rule wins.
- **The build's private server has no config file.** `cssints({ inner })` starts `createServer({ configFile: false })` in a build, so the `resolve.alias` and `ssr` options of the user's vite.config.ts do not reach the module runner that evaluates theme.ts, and a bare import of a package without a dist (`@cssints/ramp`, rybitten, tokens are not built in the repository) fails there with "Failed to resolve entry for package". Workaround: palettes.ts imports the three packages by relative path.

## Summary of Changes

- **@cssints/rybitten** (packages/rybitten): `color(hue, { cube, saturation, lightness })`, `wheel(steps, options)`, `shades(hue, lightness, options)` and `overrides(group)`, on `rybitten` 1.3.0 (pinned: cube numbers may change in a minor release). DTCG colour groups for `createTokens`, hex in sRGB, build time only, no runtime. README, LICENSE with RYBitten's MIT notice, tests (colours pinned, errors, a module through the engine with `check.contrast`), a type test; 2.8 kB built (1.3 kB gzip). In the playground's plugin table (`rybitten` and `rybitten/cubes` are bundled with the worker; 225 cases, 0 differ).
- **apps/docs palette** (src/palettes.ts): three RYBitten cubes (Itten, Munsell, Albers) take paper, borders and hues from the cube, and @cssints/ramp finds the text and accent steps for the ratios the site needs; four @cssints/tokens sets (Radix, Flexoki, Open Props, Reasonable Colors) are mapped by hand. The colours of tokens.json and the three modes point at a token group `pal` (`light`, `dark`, `dim`); a palette is a theme of `pal` on `:where([data-palette])`, a cube also one theme per step of a twelve-step wheel (`data-hue`). Hue is no longer a continuous slider: 12 steps, 30 degrees of RYB each, default 270 (Itten's indigo).
- **Settings**: a palette picker (7 palettes), the hue slider is off for the sets (one accent), both persisted and applied before paint (index.html), RYBitten credited in the panel and in the package. Contrast: 1680 pairs (7 palettes x hues x light, dim, dark) in test/contrast.mjs and the same in Chrome on the built themes (test/browser.mjs); every one holds its floor. Fixed in the mapping: Radix's step 9 is under 3:1 on the dim and dark papers, so the dark accent is step 11; Flexoki's light textLow is step 700 and its dim textLow step 400. Left out: nothing. Reasonable Colors has six steps a scale, so its dark and dim papers are flat (bgSubtle and bgMuted are one colour).
- The sheet grew to 67.1 kB (10.8 kB gzip), of which the palette themes are 31.8 kB (3.4 kB gzip).
- Engine gaps are above: nested `createGlobalTheme` loops, the alias redeclaration beating modes, the private build server without a config file. None is fixed here.
