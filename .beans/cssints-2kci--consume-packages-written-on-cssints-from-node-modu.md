---
# cssints-2kci
title: Consume packages written on cssints from node_modules
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T07:52:36Z
updated_at: 2026-10-02T08:11:42Z
parent: cssints-9js6
---

## Question

Implement the decision of "Published packages written on cssints" (cssints-0l3f): the transform and `runnerDeps` in plugin.ts stop skipping node_modules for files that carry the marker (same cheap string check as app code; files without it stay skipped), the engine excludes such packages from `optimizeDeps` (found by scanning the app's dependencies' entry files for the marker, or by `ssr.noExternal`/`optimizeDeps.exclude` from a cheap check; pick the simplest that works in dev and build), HMR does not watch node_modules. Prove it with a fixture package built by tsdown (attributes kept, `.d.ts` emitted) installed into a small app, in dev and build: classes replaced, one sheet, a token of the package used by the app and themed by the app. Extend the smoke test with a library tarball. Docs in API.md ("Publishing a library").

## Todo

- [x] transform stops skipping node_modules files that carry `with { type: "cssints" }` (stricter check than app code, so cssints' own dist is never parsed); files without it stay skipped
- [x] `optimizeDeps.exclude` + `ssr.noExternal` for direct dependencies that list cssints, from `config()`
- [x] HMR: package modules are cleared like app modules, never watched
- [x] fixture library built by tsdown (pkg/ui), app proof in dev (HTTP) and build (test/packages.mjs, in `bun run test`)
- [x] smoke test installs the library from its own tarball
- [x] docs/API.md "Publishing a library"

## Summary of Changes

- plugin.ts: `marked(code, id)`: app files keep the `"cssints"` string check; a file in node_modules also needs `type: "cssints"` in it. The dev `?v=<hash>` that Vite appends to a dependency's URL is stripped, so the engine knows the file by its path. `config()` reads the app's package.json and each direct dependency's, and adds those that list cssints (dependencies or peerDependencies) to `optimizeDeps.exclude` and `ssr.noExternal` (both needed: without the first esbuild strips the attributes, without the second the runner loads the package as native Node and fails on the attribute). The build's private evaluation server now uses the resolved config root instead of `process.cwd()`.
- instrument.ts: tsdown/rolldown merges `import { _cv } from "cssints"` into the attributed import of the same module; `cx` and `_cv` are now runtime wherever they are imported from (split off into an import of their own, in the evaluation and in the client).
- HMR: package modules are treated as app modules by `clearApp` (not in the library's import closure, so cleared on every evaluation); keeping them would break `readsOwnSites` (negative control in engine-cost.md). They are not in `runnerDeps`/`depsOf`: Vite does not watch node_modules, so they never change in dev. runner.qnt unchanged; `test:mbt` passes.
- Tests: test/packages.mjs (fixture pkg/ui built with `vp pack --no-config`), smoke extended (tsdown build, npm pack, install, build, theme, types across the boundary), lint ignores test/pkg.
