---
# cssints-cpca
title: 'placeholder(): image placeholders from dominant colours at build time'
status: completed
type: feature
priority: low
created_at: 2026-10-08T08:55:58Z
updated_at: 2026-10-09T07:42:18Z
parent: cssints-dk1q
---

## What
`placeholder("src/hero.jpg")` reads the image at build time and emits a CSS gradient (or thumbhash data URL) as a `<image>`, like icons' fs provider.

## Sources
- https://github.com/ascorbic/unpic-placeholder
- https://github.com/evanw/thumbhash
- https://github.com/Namide/extract-colors
- https://github.com/Vibrant-Colors/node-vibrant

## Todo
- [x] fs provider, sharp or jimp for pixels
- [x] gradient + thumbhash modes
- [x] fixture

## Engine gaps

- **A value member cannot name a file it read, so the file is not watched in dev.** `placeholder()` (and `icons({ provider: "fs" })`, `font(..., { provider: "fs" })`) read files with `readFileSync` while the site runs; the engine re-runs a module when its imports change, never when such a file does. Repro: `export const a = backgroundImage(placeholder("src/hero.png"))` in a dev server, edit `src/hero.png`: the sheet keeps the old gradient until the module is touched or the server restarts. A hook such as `dependsOn(path)` from `cssints/plugin` (calling Vite's `addWatchFile` for the site's module) would close it. Recorded as a limit in the README.

## Summary of Changes

- `packages/placeholder` (`@cssints/placeholder`): one value member `placeholder(path, { mode? })` on `scope("placeholder")`, written with `fn({ args: [arg<string>(), { "mode?": "gradient | thumbhash" }] })`, returning a `CSSImageValue`.
- `mode: "gradient"` (default): the image averaged to a 4 × 3 grid (3 × 4 portrait) in linear light, alpha-weighted; a `radial-gradient(at x y, c, transparent 50%)` per cell sorted by luminance (unpic-placeholder's layout) over a `linear-gradient()` of the average colour (~0.7 kB).
- `mode: "thumbhash"`: ThumbHash of a ≤100 px copy, rendered and averaged to 16 px, written as a deflated PNG data URL (~0.5 kB, against ~5 kB for thumbhash's own uncompressed URL).
- Decoding in plain JS: jpeg-js (JPEG) and pngjs (PNG); the format is sniffed from the first bytes; WebP, AVIF, GIF, SVG and broken files are located build errors naming the format. Results cached on globalThis by SHA-256 of the content + mode.
- Tests: unit checks of the extraction on synthetic pixels (linear-light average, alpha weighting, upsampling, quadrant layout, thumbhash size/determinism, format sniffing), fixtures through the engine on images the test writes (gitignored `test/fixtures/img/`), errors with location, type test `test/types/placeholder.ts`. README with example, emitted CSS, formats, rules, limits.
- Deferred: WebP/AVIF (needs a WASM decoder), configurable grid or thumbhash size, blurhash mode, dev watching of the image (engine gap above), a row for the package in docs/API.md "Plugin packages" (that file is off-limits here).
