---
# cssints-0gll
title: 'Token packages: open-props, easings, flexoki, reasonable-colors, windy-radix'
status: completed
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T10:01:39Z
parent: cssints-dk1q
---

## What
Data-only token sets as `{ tokens }` entries: `@cssints/open-props` (sizes, easings, shadows, gradients, colors), easings.net as `easing.*` tokens, flexoki and reasonable-colors palettes, Radix colors (windy-radix-palette's mapping) as themeable token sets with light/dark themes.

## Sources
- https://open-props.style/
- https://github.com/ai/easings.net
- https://github.com/kepano/flexoki
- https://github.com/matthewhowell/reasonable-colors
- https://github.com/brattonross/windy-radix-palette
- https://github.com/GoogleChromeLabs/postcss-jit-props (only used tokens are emitted: we already do this per site)

## Shape
- one package each or one `@cssints/tokens-*` family; generated from upstream JSON by a script, DTCG shape, `createTokens` under the hood.
- Radix: light/dark as `createGlobalTheme`, contrast pairs through check.contrast.

## Todo
- [x] generator script from upstream data
- [x] open-props first, then radix
- [x] fixture: only used tokens reach the sheet

## Engine gaps

Found while building @cssints/tokens; each is worked around in the package and listed in its README ("Limits").

1. **No token type for timing functions or shadows.** `createTokens` maps only `color`, `dimension`, `number`, `duration`, `fontWeight`; `cubicBezier` and the composite types (`shadow`) are errors. Workaround: easings and shadows ship as `as const` CSS strings, no variable, not themeable (open-props `shadowsDark` is a second record).
   ```ts
   createTokens({ ease: { $type: "cubicBezier", out: { $value: [0, 0, 0.3, 1] } } }); // error: $type "cubicBezier" has no token type
   ```
2. **rem in a dimension token is rejected** (an `@property` initial value must be computationally independent). Workaround: open-props rem radii converted at 16px (`radius-3: 16px`); rem/ch sizes, fluid sizes, font sizes and letter spacings left out. A `:root` declaration with the rem value and a px `initial-value` would keep user font scaling.
   ```ts
   createTokens({ r: { $type: "dimension", m: { $value: "1rem" } } }); // build error: depends on the font size
   ```
3. **The types reject `linear()` with more than 9 stops**; the build accepts it. Open Props' `easeSpring*` / `easeBounce*` are type errors (asserted with @ts-expect-error in test/types/tokens.ts, so a fix shows up there).
   ```ts
   transitionTimingFunction("linear(0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1)"); // TS2345; 9 stops pass
   ```
4. **Type budget: ~7k instantiations per colour leaf; one statement over ~5M is TS2589.** `createTokens(light)` with Radix solid+alpha in one object (766 leaves) fails. Workaround: Radix split into `light`/`lightAlpha` (and `dark`/`darkAlpha`).
   ```ts
   createTokens({ ...light, ...lightAlpha }); // TS2589: Type instantiation is excessively deep and possibly infinite
   ```
5. **A theme is not pruned to used tokens.** A module that imports the module calling `createGlobalTheme` gets the `@property` rule of every token the theme overrides (the theme module itself only holds the rule). Workaround (README): theme in its own module imported once by the entry, pass only the scales used. Repro: `test/fixtures/radix-tokens.ts` with `createGlobalTheme(t.radix, ".dark", dark)` added; the sheet of `radix.ts` then has all 372 `@property` rules instead of one.

## Open question

- **easings.net is GPL-3.0** (ai/easings.net LICENSE). `src/easings.ts` holds only its 24 `cubic-bezier()` values. Decide before publishing: keep, publish that subpath as a GPL-3.0 package, or drop it (Open Props already has MIT Penner curves: `easings.easeCubicOut` ...). Flagged in the README.

## Summary of Changes

- `packages/tokens` (@cssints/tokens): data-only DTCG sets, one subpath each: `/open-props` (colors, sizes, radii, borderSizes, fontWeights, lineHeights as token data; easings, shadows, shadowsDark as CSS strings), `/easings` (easings.net's 24 cubic-béziers), `/radix` (light, lightAlpha tokens; dark, darkAlpha overrides for createGlobalTheme), `/flexoki` (palette), `/reasonable-colors` (25 hues × 6). Data, not a createTokens call: the user picks the prefix (sets share names like `blue`) and the subset (type cost, theme size); justified in the README.
- `scripts/generate.ts` (`bun run generate`): npm devDependencies open-props 1.7.23, @radix-ui/colors 3.0.0, reasonable-colors 0.4.0; easings.net and Flexoki fetched at pinned commits; output formatted by vp fmt and committed.
- Tests: `test/tokens.mjs` runs a fixture per set through the engine (only the used tokens in a module's sheet, CSS strings in properties, the Radix dark theme), checks all 31 Radix scales with check.contrast (12 on 1/2 and 11 on 1/2, light and dark) and asserts a documented failing pair fails; `test/types/tokens.ts` via typecheck.
- Contrast: Radix step 11 on step 1/2 is below 4.5 in light for amber, green, jade, orange, teal, yellow (9 pairs, 4.24 to 4.49; table in the README); everything else passes 4.5.
- Type cost (tsgo, per createTokens): baseline 0.18M; Open Props all token groups 1.9M; Radix light 2.9M, + dark theme 5.4M; alpha + dark 5.8M; Radix blue+gray light+dark 0.5M; Flexoki 1.0M; Reasonable 1.3M.
- Deferred: Flexoki light/dark semantic themes (not in the pinned data file), Radix P3 scales, Open Props gradients/fonts/animations.

## Follow-up
The easings.net subpath (GPL-3.0 data) was removed; Open Props' easings carry the same Penner curves (easeCubicOut and the others, MIT).
