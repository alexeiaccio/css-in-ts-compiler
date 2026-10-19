---
# cssints-iwey
title: 'cssints/clay: styles compiled to Clay declarations and a C header'
status: completed
type: feature
priority: normal
created_at: 2026-10-19T12:46:41Z
updated_at: 2026-10-19T12:47:28Z
---


A Clay target for cssints, for the clay-test firmware of ~/github/esp32 (its bean esp32-8j6y: no JS on the chip, emit C at build time).

## Summary of Changes

- `cssints/clay` (src/clay.ts, src/clay-types.ts): members build `{ __clay }`, `registry.clay` (macro.ts) replaces a site by a literal shaped as `Clay_ElementDeclaration` (+ `text`: `Clay_TextElementConfig`); `header()` prints C.
- test/clay.mjs (fixture, header, five build errors), test/types/clay.ts; docs/API.md section, wayfinder entry, changeset.
- Checked by hand against esp32's clay.h: the header compiles (-std=c99), and the generated Units pill gives render commands byte-identical to ui.c's.

## Left

- Flash and look on the board (off USB and network on 2026-10-19).
- States, tokens/themes, min/max sizes, floating, fontSize -> fontId, a generator the esp32 build calls.
