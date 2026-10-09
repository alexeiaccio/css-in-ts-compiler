---
# cssints-vxfr
title: Source map of the build sheet (per-module bytes in Sonda)
status: in-progress
type: feature
priority: normal
created_at: 2026-10-09T07:45:40Z
updated_at: 2026-10-09T08:46:28Z
parent: cssints-dk1q
---

From cssints-0a3p (docs/research/devtools.md). The dev sheet maps each class rule to its first css.* call (plugin.ts sheetMap); the build sheet goes through renderChunk with no map, so Sonda lists virtual:cssints.css at 0 bytes and cannot attribute the CSS asset. Record siteOf in build too and hand the map to vite:css / vite:css-post when build.sourcemap is set; check that minify keeps it.

## Todo

- [x] Find out whether Vite chains a map through its CSS plugins in build (no: vite:css-post keeps strings, finalizeCss and emitFile write no map)
- [x] One map function for dev and build (sheetMap, per selector)
- [x] Emit the map after Vite's CSS processing, only with build.sourcemap (true / hidden / inline)
- [x] Test: build map, hidden, off (sheet-map.mjs)
- [x] Demo build byte-identical without sourcemaps
- [x] Sonda on apps/demo
- [x] Docs: API.md, research/devtools.md, wayfinder.md
