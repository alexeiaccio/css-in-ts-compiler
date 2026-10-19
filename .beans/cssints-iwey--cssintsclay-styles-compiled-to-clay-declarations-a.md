---
# cssints-iwey
title: 'cssints/clay: styles compiled to Clay declarations and a C header'
status: completed
type: feature
priority: normal
created_at: 2026-10-19T12:46:41Z
updated_at: 2026-10-19T18:00:00Z
---


A Clay target for cssints, for the clay-test firmware of ~/github/esp32 (its bean esp32-8j6y: no JS on the chip, emit C at build time).

## Summary of Changes

- `cssints/clay` (src/clay.ts, src/clay-types.ts): members build `{ __clay }`, `registry.clay` (macro.ts) replaces a site by a literal shaped as `Clay_ElementDeclaration` (+ `text`: `Clay_TextElementConfig`); `header()` prints C.
- test/clay.mjs (fixture, header, five build errors), test/types/clay.ts; docs/API.md section, wayfinder entry, changeset.
- Checked by hand against esp32's clay.h: the header compiles (-std=c99), and the generated Units pill gives render commands byte-identical to ui.c's.

- On the board (2026-10-19): a copy of clay-test with the Units pill from a generated styles.h, flashed; boot log `clay errors 0`, layout 3.3 ms, raster 17.8 ms; the Sensors page works by eye.

- States (`hover`/`focus`/`active`: an overlay in the literal, `<name>_active` in C), tokens and themes (`createTokens`, `createGlobalTheme(tokens, name, overrides)` on `registry.clayTokens`; `<name>_<theme>` in C), `fonts()` (fontId, an enum in C). test/clay.mjs and test/types/clay.ts extended; used by cssints-native's Sensors page (THEME=light frame).

- Floating elements (`css.float({ attach, parent, root, offset, expand, zIndex, capture, clip })`): `Clay_FloatingElementConfig` field for field in the literal (`floating`), printed by `header()` only for the fields set; `parent` is the string of a `CLAY_ID()`, printed as its hash (a static initializer cannot call it). test/clay.mjs, test/fixtures/clay-float.ts, test/types/clay.ts; the generated header compiled and run against esp32's clay.h (render commands identical to hand-written floats, Clay errors 0, pointer passthrough seen).
## Left

- Min/max sizes, derived colour tokens, a generator the esp32 build calls; of floating: auto-flip and side placement (Clay has none), `CLAY_IDI`/local ids as a parent.
