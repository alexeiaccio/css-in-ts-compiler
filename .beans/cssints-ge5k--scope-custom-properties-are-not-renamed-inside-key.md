---
# cssints-ge5k
title: Scope custom properties are not renamed inside keyframes() made in a kernel
status: completed
type: bug
priority: normal
created_at: 2026-10-09T07:56:37Z
updated_at: 2026-10-09T08:40:21Z
---

Found by skeleton (cssints-0k8h, repro under "## Engine gaps"): `keyframes({ from: css.vars({ "--_p": "0%" }) })` inside a kernel prints `--_p`, while the kernel itself uses `--<scope>-p`, so the two name different properties.

## Todo
- [x] namespace `--_x` in keyframes() created in a scope's kernel styles
- [x] skeleton's clock keyframes written through keyframes() instead of raw CSS

## Summary of Changes

Root cause: scope-engine.ts kernel() renamed `--_x` (own()) in the kernel's css only; the at-rule kernels from kernelOf (built.kernels) went into atRules as made. Now each that holds `--_x` is renamed and its name gets the scope's after the hash (`kf-1c9bee79-skeleton`), so two scopes with equal steps do not register one key with two bodies. Test in packages/cssints/test/scope.mjs (sc-around-a/b). skeleton's clock keyframes are keyframes() with `--_p`. Docs: API.md Plugins, wayfinder.
