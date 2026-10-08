---
# cssints-bvgz
title: 'fonts: font() with @font-face globals and fontaine fallback metrics'
status: in-progress
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:03:02Z
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
- [ ] fontkit metrics + fallback face math (fontaine's formula)
- [ ] fs and fontsource providers
- [ ] fixtures with a small test font
- [ ] docs
