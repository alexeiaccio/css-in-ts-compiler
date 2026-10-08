---
# cssints-11pj
title: 'motion(): animation presets as kernels over keyframes()'
status: completed
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:14:40Z
parent: cssints-dk1q
---

## What
`motion().preset("fade-in").duration("300ms").delay(..)` chain: a kernel per preset built on the existing `keyframes()`, custom properties for duration/delay/easing, `prefers-reduced-motion` handled in the kernel.

## Sources
- https://github.com/romboHQ/tailwindcss-motion (https://rombo.co/tailwind/ tab)
- https://github.com/jamiebuilds/tailwindcss-animate
- https://github.com/animate-css/animate.css
- https://github.com/formkit/auto-animate (for the runtime idea, out of scope)

## Shape
- scope `motion`; presets: fade/slide/scale/blur in and out, loop variants from tailwindcss-motion.
- conflicts: `animation*`.

## Todo
- [x] preset table -> keyframes kernels
- [x] chain member + reduced-motion rule
- [x] fixture

## Engine gaps

- **A kernel cannot carry a `keyframes()` name.** A kernel written as styles rejects a style that holds one, and a chain
  `emit` returns strings, so the at-rule's kernel is dropped. Repro (a fixture of any package):

  ```ts
  import { animationName, keyframes, opacity } from "cssints" with { type: "cssints" };
  import { scope } from "cssints/plugin";
  const fade = keyframes({ from: opacity(0) });
  export const { gap } = scope("gap", { core: { css: () => [animationName(fade)] }, gap: { uses: ["core"], chain: {} } }).export();
  export const a = gap(); // cssints: gap.core takes plain declarations: no marker class or kernel of a member
  ```

  Workaround in packages/motion/src/index.ts: the kernel is raw CSS, and the `@keyframes` rules are read from the names
  (`kernel.css`, `name`, untyped fields of the build-time value) and put in it. With the gap closed, the kernel can be
  written as styles (derived conflicts replace `noAnimation`) and the names go in `animationName()`.

## Summary of Changes

- New package `packages/motion` (`@cssints/motion`): `motion()` chain member with `preset(name)`, `duration(<time [0s,∞]>)`,
  `delay(<time>)`, `easing(<easing-function>)`, each a class that sets a `--motion-*` custom property.
- Presets (tailwindcss-motion / tailwindcss-animate composable model): fade, slide (up/down/left/right), scale and blur, in
  and out; all fade. `presets`, `PresetName`, `motionKeyframes` and `motionScope` exported for reveal().
- One kernel: four `keyframes()` (in/out and opacity-only reduced twins), defaults on the marker (no inheritance into a
  nested motion), `animation` from the custom properties, and under `prefers-reduced-motion: reduce` the opacity-only
  keyframes.
- Conflicts: `animation*` in the same `cn()` is a build error.
- Tests: test/motion.mjs (output, conflicts, grammar errors through the engine), test/types/motion.ts; README.
- Deferred: loop presets (pulse, spin, bounce), spring easings, per-preset sizes, stacking presets.
