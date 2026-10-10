---
# cssints-qnif
title: Build evaluation server ignores the app's resolve.alias
status: completed
type: bug
priority: normal
created_at: 2026-10-10T15:55:38Z
updated_at: 2026-10-10T17:08:43Z
parent: cssints-06ws
---

Found by cssints-m0yj (sky-tui on cssints/tui).

In a build, the plugin evaluates style modules on a server of its own (plugin.ts startServer: `createServer({ configFile: false, root, plugins: [cssints({ inner: true })] })`). That server does not get the user's `resolve.alias` (nor `resolve.conditions`, `define`, other plugins), so an import of a style module that resolves through an alias in the app fails at evaluation, while the app's own build resolves it.

Repro: apps/sky-tui with `resolve.alias: [{ find: /^@cssints\/tui$/, replacement: <packages/tui/src/index.ts> }]` and `import { onTheme } from "@cssints/tui"` in src/styles.ts (a module with `cssints/tui` sites). `vp build`:

```
[plugin cssints] apps/sky-tui/src/styles.ts
EvalError: Failed to resolve entry for package "@cssints/tui". The package may have incorrect main/module/exports specified in its package.json.
```

(@cssints/tui has no dist in the repository, so without the alias or the `development` condition it does not resolve.) In dev the evaluation runs in the dev server's own ssr environment, with the config, so dev and build differ.

Workaround in sky-tui: styles.ts imports only `cssints/tui`; the runtime calls (`onTheme`, `resolve`, `props`) moved to Post.tsx and App.tsx.

## Todo

- [x] pass the user's resolve options (alias, conditions) to the build's evaluation server, or document that a style module's imports resolve without them
- [x] a fixture with an aliased import in a style module, built

## Summary of Changes

plugin.ts keeps the app's resolve options in configResolved and starts the build's evaluation server with them: `resolve.alias` and the `conditions`/`externalConditions` of the app's `ssr` environment, the environment a dev server evaluates in. test/build-resolve.mjs (fixtures/alias: an alias and a package with a custom export condition) builds a style module that imports both and checks that dev and build make the same rules; before the fix the build failed with `Cannot find module '@space'`. Not passed: define, other plugins, dedupe, noExternal (an app's `ssr.noExternal: true` would inline everything into the runner). sky-tui: styles.ts lost its 'imports only cssints/tui' note; after cssints-5vnf it needs no runtime import. docs/API.md TUI 'Opt-in' says it.
