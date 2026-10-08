---
# cssints-51hb
title: 'trim(): cap-height trimming with native text-box-trim and a capsize fallback'
status: completed
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:25:20Z
parent: cssints-dk1q
blocked_by:
    - cssints-bvgz
---

## What
`trim()` chain (or part of the fonts scope) that trims the space above cap height and below baseline. Native `text-box: trim-both cap alphabetic` where supported (Chrome 133, Safari 18.2), else capsize's `::before/::after` negative-margin pseudo-elements computed from the font's metrics at build time.

## Sources
- https://github.com/seek-oss/capsize
- https://github.com/stormwarning/tailwindcss-capsize
- https://github.com/theMosaad/tailwindcss-capsize
- https://github.com/foliojs/fontkit

## Shape
- kernel with `requires: ["css.properties.text-box-trim"]`; fallback CSS chosen by BCD like frame()'s runtime but pure CSS (no script).
- needs the font metrics: depends on the fonts bean (fontkit) or takes `{ capHeight, ascent, descent, unitsPerEm }` explicitly.
- methods: `fontSize(<length>)`, `lineHeight(<length>|<number>)`.

## Todo
- [x] native path + capsize fallback
- [x] BCD switch
- [x] fixture, Chrome check against seek-oss/capsize output (numbers compared with @capsizecss/core in the node test)

## Summary of Changes

In `@cssints/fonts` (packages/fonts), a second member of the `fonts` scope that `font()` returns: `body.trim({ lineHeight? })`.

- Emits `line-height` (`normal`, or the number given), `--fonts-t` / `--fonts-b` (capsize's capHeightTrim and baselineTrim in em, from the font's metrics and the line height: unitless, so independent of the font size) and the marker `_fonts-native`.
- Kernel `#native`: `&{text-box:trim-both cap alphabetic}` with `requires: ["css.properties.text-box"]` (the shorthand's BCD key; same data as text-box-trim): a build warning for a target that lacks it.
- BCD switch: runtime entry `#capsize` (`polyfills: ["css.properties.text-box"]`, CSS only, no parentVars, so the virtual module is `export {};`): `@supports not (text-box:...) { &::before,&::after{content:"";display:table} &::before{margin-bottom:var(--_t)} &::after{margin-top:var(--_b)} }` is added to the sheet only when a target lacks text-box; `@supports not` keeps a browser that has it from trimming twice.
- `lineHeight` is `<number [0,∞]>` only (a length would need the font size); checked in the types and at build time.
- Tests: the trims equal `@capsizecss/core` `createStyleObject` (line-height normal and 1.5) on metrics from `@capsizecss/unpack`; the warning and the fallback with the default targets; a child process with `BROWSERSLIST="chrome 133, safari 18.2, firefox 154"`: no warning, no fallback. Type test: number or numeric string, no length.

Deferred: explicit metrics without a font file (`{ capHeight, ascent, descent, unitsPerEm }`), a length lineHeight, a browser check in Chrome (numbers are compared with capsize instead).

## Engine gaps

1. A runtime's fallback `css` is shipped only to targets that have `@property` (`needed()` in packages/cssints/src/delivery.ts), which is right for parent-vars but not for a CSS-only fallback. A target with neither text-box nor @property gets no trim. Repro: `BROWSERSLIST="firefox 120" node -e` a server over packages/fonts/test/fixtures/use.ts: the sheet has no `@supports not` rule; with `firefox 130` it has. Workaround: none in the package (documented in the README limits).
2. A private key and a public member of the same name collide in `uses`: `scope("x", { "#trim": { css: "&{}" }, "#fb": { polyfills: ["css.properties.text-box"], css: "&::before{}" }, trim: { args: [], uses: ["trim", "fb"] } })` resolves "trim" to the call member, and the error is the misleading `x: fb uses & but no kernel goes with it in uses` (`entry()` in scope-engine.ts prefers the public key). Workaround: the kernel is `#native`.
3. A kernel's `requires` warns even when the scope ships a runtime fallback for the same key, so the warning reads as if trim() were broken there. No way to say "covered by the runtime".
