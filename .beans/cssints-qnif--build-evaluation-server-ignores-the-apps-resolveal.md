---
# cssints-qnif
title: Build evaluation server ignores the app's resolve.alias
status: todo
type: bug
created_at: 2026-10-10T15:55:38Z
updated_at: 2026-10-10T15:55:38Z
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

- [ ] pass the user's resolve options (alias, conditions) to the build's evaluation server, or document that a style module's imports resolve without them
- [ ] a fixture with an aliased import in a style module, built
