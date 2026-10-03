---
# cssints-fxzg
title: 'Support warnings: read the browserslist config, ask LightningCSS what it lowers'
status: in-progress
type: feature
created_at: 2026-10-03T11:05:54Z
updated_at: 2026-10-03T11:05:54Z
parent: cssints-co8y
---

## Question

Decided with the user (2026-10-03): fallbacks in the engine, sky stays on `defaults`.
1. The targets come only from `BROWSERSLIST` or `defaults` (css-grammar browsers.ts); the standard browserslist config (`package.json` "browserslist", `.browserslistrc`, env sections) is ignored. Read it from the Vite root (the plugin knows it; `targets`/`cssTarget` exported from cssints/vite are computed at import time: make them follow the same resolution, or document that the config is read from process.cwd()). `BROWSERSLIST` still overrides.
2. Support warnings lie for what LightningCSS lowers: a literal `oklch()`, `lab()`, `color-mix()`, `oklch(from red …)`, `light-dark()`, static `round()` in a property get a fallback from LightningCSS for the targets (measured 2026-10-03: `.a{color:oklch(…)}` → `color:#db4aa7;color:lab(…)`; `:root{--x:oklch(…)}` → hex plus `@supports (color: lab(0% 0 0))`; `@property initial-value` and `oklch(from var(--x) …)` are NOT lowered). When a value warns, transform `x{prop:value}` with the lacking targets through LightningCSS (cached per value and target set); if the output lowers it (the first declaration no longer needs the feature), drop the warning, or say "lowered by LightningCSS" at debug level. Same for token and theme values (token.ts, cssints-tuyw): a token value is a custom property, so test it as `:root{--x:value}`. Count the warnings before/after on the demo and sky.
