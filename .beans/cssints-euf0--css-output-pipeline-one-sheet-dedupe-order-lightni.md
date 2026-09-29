---
# cssints-euf0
title: 'CSS output pipeline: one sheet, dedupe, order, LightningCSS'
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T14:20:21Z
parent: cssints-vy0o
blocked_by:
    - cssints-wx85
    - cssints-kpq1
---

## Question

Today each module has a virtual `cssints.css?file=...` and the demo uses Vite's LightningCSS transformer. Decide how CSS is emitted in dev and build, how atomic rules are deduplicated and ordered (with conditions and layers), and where LightningCSS runs.

## Resolution
- **One sheet.** One global sorted virtual stylesheet replaces the per-module `cssints.css?file=` modules and `layers.css`. Sort order: layer, then condition (min-width ascending, then pseudo-class order), then shorthand before longhand, then class name. It stays a Vite CSS module, so HMR without reload and LightningCSS come from Vite.
- **Build fill.** A placeholder filled in `renderChunk` (as UnoCSS does). Target Vite 8 (Rolldown) only, with no fallback for older Vite; `buildStart` evaluation is only a fallback if the placeholder proves fragile on Vite 8.
- **One sheet per app** for 0.1, with no per-chunk CSS.
- **LightningCSS** runs through Vite's `css.transformer` and `build.cssMinify`. Its targets come from the same browserslist query as the support warnings, one source for both. The plugin does not call LightningCSS itself.
- **A longhand beats its shorthand** in the same layer, whatever the order of arguments to `cx`.
Research: docs/research/css-output.md.
