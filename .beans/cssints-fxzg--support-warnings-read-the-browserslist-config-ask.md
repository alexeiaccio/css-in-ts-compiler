---
# cssints-fxzg
title: 'Support warnings: read the browserslist config, ask LightningCSS what it lowers'
status: completed
type: feature
created_at: 2026-10-03T11:05:54Z
updated_at: 2026-10-03T11:05:54Z
parent: cssints-co8y
---

## Question

Decided with the user (2026-10-03): fallbacks in the engine, sky stays on `defaults`.
1. The targets come only from `BROWSERSLIST` or `defaults` (css-grammar browsers.ts); the standard browserslist config (`package.json` "browserslist", `.browserslistrc`, env sections) is ignored. Read it from the Vite root (the plugin knows it; `targets`/`cssTarget` exported from cssints/vite are computed at import time: make them follow the same resolution, or document that the config is read from process.cwd()). `BROWSERSLIST` still overrides.
2. Support warnings lie for what LightningCSS lowers: a literal `oklch()`, `lab()`, `color-mix()`, `oklch(from red …)`, `light-dark()`, static `round()` in a property get a fallback from LightningCSS for the targets (measured 2026-10-03: `.a{color:oklch(…)}` → `color:#db4aa7;color:lab(…)`; `:root{--x:oklch(…)}` → hex plus `@supports (color: lab(0% 0 0))`; `@property initial-value` and `oklch(from var(--x) …)` are NOT lowered). When a value warns, transform `x{prop:value}` with the lacking targets through LightningCSS (cached per value and target set); if the output lowers it (the first declaration no longer needs the feature), drop the warning, or say "lowered by LightningCSS" at debug level. Same for token and theme values (token.ts, cssints-tuyw): a token value is a custom property, so test it as `:root{--x:value}`. Count the warnings before/after on the demo and sky.

## Todo

- [x] Targets from the standard browserslist config (package.json, .browserslistrc, env sections), BROWSERSLIST overrides, defaults otherwise
- [x] Warnings ask LightningCSS what it lowers (property values, theme overrides), cached
- [x] Fixtures and tests (test/lowered.mjs, browserslist-config.mjs, token-support.mjs, fallback.mjs updated)
- [x] docs/API.md and README
- [x] Warnings before/after on apps/demo and apps/sky, build time

## Summary of Changes

**Config.** `browsers()` (css-grammar browsers.ts) passes no query to browserslist, which does its own lookup: `BROWSERSLIST`, else the config found upward from `process.cwd()` (`package.json` "browserslist", `.browserslistrc`; the section of `BROWSERSLIST_ENV`, `NODE_ENV`, else `production`), else `defaults`. Decision: process.cwd(), not the Vite root. `targets` and `cssTarget` of `cssints/vite` are computed when vite.config.ts is imported, before the root is known, and the warnings (support.ts) read the same place, so all three agree; the cost is that `vite <dir>` from another directory reads the config of the working directory (documented in the README and API.md). Test: test/browserslist-config.mjs (child processes in temp apps: field, `.browserslistrc`, env sections, BROWSERSLIST, defaults; checks `cssTarget` and the warning together).

**Lowering.** src/lowered.ts: `loweredOf(prop, value, warning)` transforms `x{prop:value}` (`:root{--x:value}` for a custom property) with `browserslistToTargets` of the lacking targets, and the warning is dropped if the feature of the warning is in the declaration and no longer in the first declaration of the output (a prefixed `-webkit-backdrop-filter` counts as lowering `backdrop-filter`; `oklch(from var(--x) l c h)` and `text-wrap` stay). Cached in `registry.lowered` per property, value, feature and targets: 0.03 ms per distinct value, and only values that already warn pay it. Applied in macro.ts `checkNow` (class rules and at-rule blocks; not the inline `style()`, which LightningCSS never sees) and in token.ts `checkSyntaxFx` for a theme override only (a custom property of the sheet; the @property initial value and `token.set()` keep their warning, since LightningCSS does not touch them). Tests: test/lowered.mjs + fixtures/lowered.ts, token-support.mjs (theme overrides lowered, `oklch(from {ref})` not), fallback.mjs (the fixtures use `color-mix()` with a token, which LightningCSS cannot lower; literal oklch() cases added as lowered).

**Measured** (BROWSERSLIST unset, default targets, chrome 109 and others): apps/demo 4 warnings before and after (cursor, color-mix + oklab with a var(), the surface kernel: none lowerable). apps/sky 32 before, 28 after: the four `color.shadow` theme overrides are lowered; the rest are @property initial values of createTokens (not lowered, cssints-33pa), aliases that carry a var(), the kernel and the cursor. Build time unchanged within noise (demo ~1.2 s, sky ~2.3 s, six runs each).
