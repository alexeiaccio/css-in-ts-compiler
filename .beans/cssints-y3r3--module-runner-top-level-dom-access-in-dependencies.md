---
# cssints-y3r3
title: 'Module Runner: top-level DOM access in dependencies fails (no shaker)'
status: completed
type: bug
priority: normal
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:21:59Z
parent: cssints-tmv8
---

`spikes/runner/fixtures/risk6.ts` fails with `document is not defined`: the whole module executes in the runner, with no shaker and no DOM stub. `apps/demo` does not hit this, because `main.tsx` does not import cssints.

- [x] Try `happy-dom` globals in the runner environment (wyw does the same)
- [x] `fixtures/risk6.ts` passes
Shaker: not needed for this bug. See the note at the end of Summary of Changes.

## Summary of Changes

- `spikes/runner/plugin.mjs`: new `DomEvaluator` (a subclass of Vite's `ESModulesEvaluator`). It creates one happy-dom `Window`. Each window property that Node's `globalThis` does not have (`document`, `window`, `HTMLElement`, `localStorage`, ...) becomes a closure parameter around the module body. The plugin evaluates with a private `createServerModuleRunner(ssrEnv, { evaluator })`, not with `server.environments.ssr.runner`.
- Why this is safe: `globalThis` never gets DOM globals (checked: `typeof document` is still `undefined` after risk6). So Vite, externalized `node_modules` and the app's own dev SSR runner cannot detect a browser. A module-level `const document = ...` still works, because the module body is an inner function that shadows the parameters. The line padding is the same as upstream (3 lines), so stack trace mapping does not change.
- Rejected options: (a) Put globals on `globalThis` only during `runner.import`. Concurrent dev requests and deps with import-time feature detection (react-dom `canUseDOM`) would see the DOM and keep it. (b) Prepend bindings in the ssr transform. This changes every module in the shared ssr env, including real SSR. It also fails when a module declares its own `window`/`document`.
- Added dev dependency: `happy-dom`.
- Verified: risk6 passes. The 7 baseline fixtures give byte-identical output. `invalid.ts` fails with the same padding message. The `border "1px solud"` message still comes when the padding site is removed, as before, because evaluation stops at the first error. The `app-react` build exits 0, and `dist` has no happy-dom. `hmr.mjs` passes in both orders.

Shaker (the open item "Only then consider a shaker"): not needed for this bug. Known limit: externalized `node_modules` load through native `import()`, so they do not get the DOM bindings. A package that touches the DOM at top level still fails. The workaround is `ssr.noExternal` for that package. Consider a shaker only if that case happens in practice, or if evaluation cost or side effects become a problem.
