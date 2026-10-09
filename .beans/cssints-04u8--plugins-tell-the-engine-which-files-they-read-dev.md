---
# cssints-04u8
title: Plugins tell the engine which files they read (dev watch)
status: completed
type: feature
priority: normal
created_at: 2026-10-09T07:56:10Z
updated_at: 2026-10-09T12:09:06Z
---

Found by placeholder (cssints-cpca), same limit in icons and fonts: a member that reads a file at build time cannot register it, so an edited image, SVG or font is not picked up in dev until the importing module is touched or the server restarts.

## Todo
- [x] a `dependsOn(path)` (or similar) for build()/value/plain plugin code, wired to Vite's addWatchFile and the HMR of the importing modules
- [x] use it in placeholder, icons (fs) and fonts (fs)

## Summary of Changes

- `dependsOn(path)` in `cssints/plugin` (scope.ts front, scope-engine.ts engine): adds the path to `registry.files`, cleared by `evaluate.ts` when an evaluation starts.
- plugin.ts reads the files inside the evaluation lock and adds them to `depsOf` for the evaluated module before the transform returns (same point as the runner's imports); dev: `server.watcher.add`, the existing `hotUpdate` path invalidates and forgets the module; build: `ctx.addWatchFile`.
- Fix: `vite build --watch` hung on the second build (closed evaluation server kept); `closeBundle` now resets server and runner.
- runner.qnt: `asset` instance (a file no graph knows); invariants hold over 100k traces, and fail without `inflight`. mbt and race.mjs unchanged and green.
- placeholder, icons (fs), fonts (fs) call it; a dev test each; `test/depends-on.mjs` in cssints (dev + build --watch).
- Docs: API.md (Plugins, Icons), plugin skill, placeholder/fonts READMEs, wayfinder.
- Left: directories (a new file is not seen), `node_modules` files (not watched by Vite), a failed evaluation records nothing.
