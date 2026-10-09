---
# cssints-vxfr
title: Source map of the build sheet (per-module bytes in Sonda)
status: completed
type: feature
priority: normal
created_at: 2026-10-09T07:45:40Z
updated_at: 2026-10-09T08:50:06Z
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

## Summary of Changes

- Vite 8 writes no CSS map in a build (vite:css-post keeps strings; finalizeCss/emitFile carry no map), so nothing handed through its pipeline survives.
- plugin.ts: with build.sourcemap (true / hidden / inline) siteOf is recorded in the build too; a generateBundle hook (order post) maps each CSS asset as written with the shared sheetMap, now one segment per selector (unmapped for selectors and preludes without a class), modules taken by path for reproducible maps; emits <asset>.css.map and the comment. Off: nothing recorded, demo build byte-identical.
- test/sheet-map.mjs: build with true, hidden and off on apps/demo (plugin from src).
- Sonda 0.14.0: its Vite plugin never analyses CSS assets (upstream gap); its Report fed the asset splits the demo's 9 kB sheet into Showcase 3.4 kB, App 2.1 kB, Button 0.8 kB, Card 0.3 kB, 2.5 kB unassigned.
- Docs: API.md (debugging section), research/devtools.md section 4, wayfinder entry.

Deferred: report the Sonda gap upstream (filipsobol/sonda: Vite writeBundle passes undefined entrypoints for assets, so CSS is dropped).
