---
# cssints-ci7n
title: 'Plugin option to exclude modules: a plugin package cannot be bundled into another Vite project'
status: completed
type: feature
priority: normal
created_at: 2026-10-10T14:39:03Z
updated_at: 2026-10-10T17:56:21Z
---

Found by cssints-avlz (2026-10-10). `isSite` in packages/cssints/src/plugin.ts (around line 56) treats any module outside node_modules whose code mentions "cssints" as a site module (`code.includes(RUNTIME) && (!id.includes("node_modules") || ATTRIBUTE.test(code))`). So a workspace plugin package (or the engine's own sources) that a Vite project bundles as code (apps/docs bundling packages/*/src for the playground) is transformed by that project's cssints plugin and fails with ImportError; the playground worked around it by loading the packages as raw text.
- [x] Decide the rule: an `exclude` (and maybe `include`) option of cssints() in Vite's filter style (string | RegExp | array, createFilter semantics), and/or the attribute as the only marker outside node_modules too (a module with no `with { type: "cssints" }` import is not a site module); say which and why, including what it changes for apps that rely on today's rule.
- [x] Implement in plugin.ts (the transform filter and the dev drop path of cssints-fjho), docs/API.md (plugin options), a test (a fixture project that bundles a module mentioning cssints without being a site, built with and without the option).
- [x] Optionally drop the raw-text workaround in apps/docs/plugin/playground.ts if bundling the packages becomes possible (only if it is simpler; parity test stays green).

## Summary of Changes

Rule: an `exclude` option of `cssints()`, Vite's filter style (`string | RegExp | ReadonlyArray<string | RegExp>`, `createFilter`: a picomatch glob or a RegExp, a relative glob from the working directory). No `include`, and the attribute is not made the only marker. Today's rule stays: a file outside node_modules that mentions "cssints" is a site module. The attribute as the only marker would make a module with a forgotten attribute (`import { p } from "cssints"`, the `_cv` error) silent: `css` would be `undefined` in the browser instead of a build error with the file and the line. `exclude` says what the author means, file by file. `include` would only repeat the rule of the attribute.

- plugin.ts: `excluded(id)` is made once when the plugin is made (`() => false` without the option, an empty list too) and is the first test of `transform`, so an excluded file is not instrumented, evaluated, dropped or made inert in any environment; the private server of a build gets the option (`cssints({ inner: true, exclude })`). The dev drop path of cssints-fjho is untouched: a site module still drops its rules.
- docs/API.md: "Leaving files alone: `exclude`".
- test/exclude.mjs (in `test`): a project with a site that imports a file mentioning "cssints" without the attribute; the build and the dev server fail without the option (and with `[]`), and with a glob, a RegExp or an array the file is bundled as written; the site beside it keeps its rules, and a dev edit that drops its import drops them.
- Apps: nothing changes without the option (demo, sky, sky-tui, docs, the plugin packages' own tests do not set it). Perf: one call of `() => false` per module; A/B of perf.mjs seq and build on 300 modules showed no difference beyond the noise of a busy machine (load 80-95).
- The raw-text loading in apps/docs/plugin/playground.ts stays: it is not only a workaround. The packages are not code of the docs site, they are files of the playground's project that the engine in the worker instruments and evaluates, so the worker needs their text; bundling them would give code, not text. `exclude` is for a site that does bundle such a package.
- dist rebuilt and committed.
