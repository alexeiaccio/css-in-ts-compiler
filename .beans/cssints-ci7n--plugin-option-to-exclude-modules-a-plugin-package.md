---
# cssints-ci7n
title: 'Plugin option to exclude modules: a plugin package cannot be bundled into another Vite project'
status: todo
type: feature
created_at: 2026-10-10T14:39:03Z
updated_at: 2026-10-10T14:39:03Z
---

Found by cssints-avlz (2026-10-10). `isSite` in packages/cssints/src/plugin.ts (around line 56) treats any module outside node_modules whose code mentions "cssints" as a site module (`code.includes(RUNTIME) && (!id.includes("node_modules") || ATTRIBUTE.test(code))`). So a workspace plugin package (or the engine's own sources) that a Vite project bundles as code (apps/docs bundling packages/*/src for the playground) is transformed by that project's cssints plugin and fails with ImportError; the playground worked around it by loading the packages as raw text.
- [ ] Decide the rule: an `exclude` (and maybe `include`) option of cssints() in Vite's filter style (string | RegExp | array, createFilter semantics), and/or the attribute as the only marker outside node_modules too (a module with no `with { type: "cssints" }` import is not a site module); say which and why, including what it changes for apps that rely on today's rule.
- [ ] Implement in plugin.ts (the transform filter and the dev drop path of cssints-fjho), docs/API.md (plugin options), a test (a fixture project that bundles a module mentioning cssints without being a site, built with and without the option).
- [ ] Optionally drop the raw-text workaround in apps/docs/plugin/playground.ts if bundling the packages becomes possible (only if it is simpler; parity test stays green).
