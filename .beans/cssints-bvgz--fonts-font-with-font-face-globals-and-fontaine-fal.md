---
# cssints-bvgz
title: 'fonts: font() with @font-face globals and fontaine fallback metrics'
status: completed
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:23:26Z
parent: cssints-dk1q
---

## What
A call member `font(family, { source, weights?, fallback? })` that emits `@font-face` globals at build time and a metric-matched fallback face (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) so there is no layout shift. Metrics read with fontkit from a local file, fontsource package or unifont provider.

## Sources
- https://github.com/unjs/fontaine
- https://github.com/unjs/unifont
- https://github.com/pixel-point/fontpie
- https://github.com/fontsource/fontsource
- https://github.com/foliojs/fontkit
- https://modernfontstacks.com/ (system stacks as the fallback families)
- https://github.com/Wakamai-Fondue/wakamai-fondue-cli (font -> CSS)

## Shape
- scope `fonts`, `{ args: [...], uses: ["layers"] }`, build returns `globals` (the `@font-face` rules) + `decls` (`font-family`).
- Providers like icons: `fs` (a .woff2 path), `fontsource` (package name), later `unifont`.
- Metrics cached per file hash; same global from two sites is one (globals are content-keyed).

## Todo
- [x] fontkit metrics + fallback face math (fontaine's formula)
- [x] fs and fontsource providers
- [x] fixtures with a small test font
- [x] docs

## Summary of Changes

New package `packages/fonts` (`@cssints/fonts`). `font(family, { provider, weights?, styles?, files?, fallback? })` is a plain build-time function (like `icons()`): it reads the files when the module runs and returns the members of one scope `fonts`, the font in the closure of `build`.

- `body.family()`: `font-family: "X", "X Fallback", <generic>` plus globals: one `@font-face` per weight, style and subset (`unicode-range` from fontsource's unicode.json, `font-display: swap`) and the fallback face (`local()` of Arial/Times New Roman/Courier New and their metric-compatible clones; `size-adjust`, `ascent-/descent-/line-gap-override` by fontaine's formula).
- Metrics with fontkitten (fontkit's sync, light fork that capsize and fontaine use); `xWidthAvg` with capsize's latin weighting; cached per file and mtime on globalThis.
- Providers: `fontsource` (`@fontsource/<slug of family>` from the cwd's node_modules, metadata.json validates weights and styles) and `fs` (paths; weight and style read from each file; woff2/woff/ttf/otf).
- `src: url(<absolute path>)`: Vite's CSS pipeline makes it `/@fs/...` in dev and a hashed asset in a build (tested).
- Tests: test/fonts.mjs (output, numbers equal to @capsizecss/core createFontStack on metrics from @capsizecss/unpack, errors, a vite build with the assets), test/types/font.ts. Test font: @fontsource/atkinson-hyperlegible (OFL, devDependency).

Deferred: variable fonts, unifont/remote providers, a subsets option, font-display other than swap, watching font files in dev.
