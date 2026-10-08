---
# cssints-kuki
title: 'runtime.script: a plugin runtime ships its own browser script through virtual:cssints/runtime'
status: completed
type: feature
priority: high
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T14:45:35Z
---

Found by three tier-2 plugins (cssints-dk1q). Repros in cssints-qhug, cssints-q6il and cssints-z1hd under "## Engine gaps".

`virtual:cssints/runtime/<scope>.<entry>` is `export {};` unless the runtime uses `parentVars` (or is the derived-token runtime). So reveal, balance and stuck ship their fallback scripts as a subpath the app must import by hand (`@cssints/reveal/runtime`, `@cssints/balance/runtime`, `@cssints/stuck/observer`), and a forgotten import gives no warning.

## Todo
- [x] `runtime: { polyfills, script }` (a module specifier or source) delivered in the runtime module when a target lacks a polyfilled key, as parentVars is
- [x] move reveal, balance and stuck to it; drop their manual imports from the READMEs
- [x] a test: the module is empty for modern targets and imports the script otherwise

## Summary of Changes

- `runtime.script`: a module specifier (a subpath of the plugin's package, e.g. `"@cssints/balance/runtime"`), written as `import "<spec>";` into `virtual:cssints/runtime/<scope>.<entry>` when a target lacks a polyfilled key; `export {};` otherwise. Never evaluated at build time; Vite resolves it from the app root (as `cssints/parent-vars`), the package's exports pick src (development) or dist. Not gated on @property: a script reaches every target (`unreached()`), so it also covers its kernel's `requires` everywhere. Dedup is the browser's (one module however many entries import it). delivery.ts, scope-engine.ts carry, types in author-types.ts and scope.ts; test in packages/cssints/test/plugins.mjs (fixtures plug-script*.ts).
- reveal, balance, stuck name their scripts in `script`; manual imports gone from READMEs, test pages and stuck's main.js; package tests check the module per targets (modern-only: `export {};`), browser tests check the script ships once. reveal's browser test waits a frame before its first native read (a pre-existing WebKit flake).
- docs/API.md (runtime entry, `script` bullet, plugin table), docs/wayfinder.md entry.
- Deferred: resolving the specifier from the scope's module (a scope embedded by another package under pnpm's strict layout). The packages' tests need cssints' dist rebuilt (they import cssints/vite from dist).
