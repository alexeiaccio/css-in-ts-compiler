---
# cssints-yi5e
title: Kernels of different scopes may share a custom property one of them owns
status: completed
type: bug
created_at: 2026-10-29T11:07:12Z
updated_at: 2026-10-29T11:07:12Z
---

Kernels of two scopes could not declare one custom property: `@cssints/motion`'s kernel and `@cssints/reveal`'s both set `--motion-*`, so `motion()` and `reveal()` in one app was a build error (`cssints: kernels motion.core and reveal.core both declare --motion-o: a plugin picks its own short custom-property names`). Found while adding `appear()` to @cssints/reveal (cssints-wyoy), whose kernel first carried its own copy of motion's keyframes and properties to dodge it.

The rule in `addKernel` (kernel.ts) is now:
- two kernels of **one scope** may not declare one of that scope's own names (`--reveal-k`): the two are alternatives, and a shared short name is an authoring mistake;
- two kernels of **different scopes** may not declare a custom property **neither of them owns** (`--bx-w`): two plugins picking the same free name would interfere silently;
- a scope **may** declare a name another scope owns (`reveal()`'s kernel sets motion's `--motion-*`): that is reuse, and a page can hold both.

Enabled by it: `appear()` no longer copies motion's keyframes and values — it names `motionKeyframes.in`/`reducedIn` and sets `--motion-*` like `reveal()` (one keyframes pair in the sheet, the preset classes shared), with its own short names only for its own properties (`--reveal-enter-*`).

## Summary of Changes

- `packages/cssints/src/kernel.ts`: the collision check is by ownership (`scopeOf`, `owns`); two messages: same scope ("two kernels of one scope may not share one of its custom-property names") and the existing one for the unowned name.
- `packages/cssints/test/seams.mjs` + fixtures: `seam-clash-own.ts` (two kernels of one scope on `--twin-w`, error), `seam-share-var.ts` (a second scope declaring `--tenant-w`, which tenant owns: allowed), `seam-use.ts` unchanged; the kit gains `tenant`, `guest` and `twin`.
- `packages/reveal/src/index.ts`: `appear()`'s `#enter` kernel runs motion's keyframes and sets `--motion-*`; `emitPreset` is one function again. `test/fixtures/motion.ts` + `test/reveal.mjs`: `motion()`, `reveal()` and `appear()` in one module, four keyframes rules (motion's) and both kernel classes.
- Docs: `docs/API.md` (the kernel build-error paragraph and the reuse sentence), the reveal README (the reuse section, the CSS of `appear()`, the limits), `docs/wayfinder.md` (the appear entry and this one), a `cssints` minor changeset.
- Verified: `packages/cssints` `bun run test` (seams, scope, all), `packages/reveal` `node test/reveal.mjs` (four target modes), typecheck, lint and fmt; on master the same plus the browser runs of the appear branch.
