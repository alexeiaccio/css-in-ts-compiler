---
# cssints-vsc9
title: 'surface(): parent-relative colour on the plugin API'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-10-02T08:46:51Z
parent: cssints-9js6
blocked_by:
    - cssints-q2vh
---

## Question

`surface()` as the second context plugin, on the runtime `frame()` ships: the kernel of surfaces-frames.md §2.2, `color/lighten/darken/contrast/ink` with the `Omit` chain, a build error for surface() mixed with bg/backgroundColor in one cn(), docs saying "tonal steps, not contrast". Check first that the `<color>` grammar takes the relative colour the kernel emits (it is opaque after `from` since cssints-gcuz). Floor: Chrome 122, Firefox 128 with the runtime, Safari 18. A use in apps/demo.

## Todo

- [x] Check the `<color>` grammar and twin take the relative colour (base, and `ink()` emitted as `color`) and a token base
- [x] Kernel `surface@1` (`--sf-*`, registered, `requires` `css.at-rules.property` + `css.types.color.oklch.relative_syntax`), runtime on the shared parent-vars engine with frame
- [x] Methods `color`, `lighten`, `darken`, `contrast` (mutually exclusive), `ink`; `method()` gained `excludes` and an empty grammar
- [x] Conflicts with `background`, `background-color`, `bg`
- [x] Docs: API.md section, "tonal steps, not contrast", `css.check.contrast` for a ratio
- [x] Tests: test/surface.mjs, fixtures/surface-use.ts, types/surface.ts, bench/surface.ts, smoke app
- [x] Browsers (test/browsers.mjs, was frame-browsers.mjs): surface three-deep tree, frame + surface nested, one observer, blinded controls
- [x] apps/demo: surface on the framed card, lightened on hover

## Summary of Changes

`cssints/surface` exports `surface()`, written only on `cssints/plugin`. Kernel `surface@1` (about 1 kB minified with fallback): two `@container style(--sf-p: …)` rules alternating registered `<color>` properties `--sf-e`/`--sf-o`; `--sf-d` (the step) stays unregistered because it holds `l`. Methods `color(<color>|token)`, `lighten`, `darken`, `contrast` (`<number [0,1]>`, mutually exclusive), `ink()` (black/white at OKLCH L 0.5636). A `cn()` with `surface()` and `background`/`background-color`/`bg` is a build error. The runtime reuses frame's `parent-vars` (one observer); the fallback adds a `._s._f` rule so an element that is both keeps both transition sentinels (a negative control showed hover on a frame-only change is lost without it).

Engine change on the public helpers: `method()` takes `excludes` (the chain drops those methods; runtime error `cannot go with .x()`) and `grammar: ""` (no value, for `ink()`). frame and plugins benches moved +0.09% and +0.3%.

Tests: `test/browsers.mjs` replaces frame-browsers.mjs and runs frame, surface and both nested, three builds each plus a blinded control, in Chrome 154, Firefox 155, WebKit 26.6 (also Firefox 128 and a WebKit 17.4 snapshot, where the probe switched the runtime on). Bench row `surface.ts`: 328 290 (tsc) / 336 383 (tsgo). Demo: the framed card is a surface, lightened on hover.

Findings: BCD marks Chrome 119–121 and Safari 16.4–17.6 relative colour as partial (other channel scales), and the support warning counts partial as support, so it stays quiet there; keyword colours in the grammar are case-sensitive (`Canvas` passes, `canvas` and `RED` do not).
