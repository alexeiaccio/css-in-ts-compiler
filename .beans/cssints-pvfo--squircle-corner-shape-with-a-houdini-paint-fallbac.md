---
# cssints-pvfo
title: 'squircle(): corner-shape with a Houdini paint fallback'
status: completed
type: feature
priority: normal
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T15:34:21Z
parent: cssints-dk1q
---

## What
`squircle().radius(..).smoothing(..)`: native `corner-shape: squircle` (Chrome 139) where supported, else a paint worklet runtime chosen by BCD (`polyfills: ["css.properties.corner-shape"]`).

## Sources
- https://github.com/PavelLaptev/css-houdini-squircle
- https://github.com/una/extra.css (paint worklets as a pattern)

## Shape
- kernel with `requires`, runtime with `polyfills` + worklet registration; the fallback uses `mask`/`background: paint(squircle)`.

## Todo
- [x] native kernel
- [x] fallback runtime on the plugin runtime delivery (a CSS mask, not a worklet: see the README)
- [x] fixture, browser check

## Engine gaps

- **A kernel written as styles gets support warnings its runtime cannot cover.** `requires` is matched against the `polyfills` of the member's runtimes (kernel.ts `addKernel`), but each declaration of a styles kernel is also checked like a user's, and that support warning ignores the runtimes. Repro:
  ```ts
  scope("sq", {
    core: { css: (css) => [css.cornerShape("squircle")], requires: ["css.properties.corner-shape"] },
    fb: { polyfills: ["css.properties.corner-shape"], css: "@supports not (corner-shape:squircle){&{mask:none}}" },
    sq: { uses: ["core", "fb"], chain: {} },
  }).export();
  // default targets: warning: corner-shape: the property in "squircle" is not supported by ... (css.properties.corner-shape)
  ```
  Workaround: the kernel is raw CSS (`"&{--_r:1rem;border-radius:var(--_r);corner-shape:squircle}"`) with an explicit `conflicts` entry instead of derived conflicts.

## Summary of Changes

- `packages/squircle` (`@cssints/squircle`): `squircle().radius(<length-percentage [0,∞]>)` (default `1rem`). Kernel `squircle.core`: `border-radius: var(--squircle-r); corner-shape: squircle`, `requires: ["css.properties.corner-shape.squircle"]`. Runtime `squircle.mask` (CSS only, polyfills the same key, so no warning): under `@supports not (corner-shape:squircle)` a mask of one superellipse SVG (four cubics, within 0.5%) at the four corners at twice the radius plus two gradient bands; no script. Conflicts on `*radius` and `corner-*`.
- Not a paint worklet: it runs only in Chromium, which already has corner-shape (README, "Why a mask").
- Tests: fixtures through the engine (output, fallback in/out by BROWSERSLIST, no warning, conflict, grammar error), type test, `test:browsers` in Chrome/Firefox/WebKit (native, fallback, forced-mask builds; the mask matches Chrome's native corner to 2/1600 px, WebKit 0).
- Deferred: `superellipse(k)` smoothing (a build-time SVG per value), per-corner radii; the fallback clips box-shadow/outline (documented); a row for the README in docs/API.md "Plugin packages" (coordinator).

## Engine gaps, resolved (2026-10-08)
- Styles-kernel support warnings covered by runtime polyfills: cssints-rp0e. squircle's kernel is written as styles again.
