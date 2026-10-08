---
# cssints-kuki
title: 'runtime.script: a plugin runtime ships its own browser script through virtual:cssints/runtime'
status: in-progress
type: feature
priority: high
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T14:30:38Z
---

Found by three tier-2 plugins (cssints-dk1q). Repros in cssints-qhug, cssints-q6il and cssints-z1hd under "## Engine gaps".

`virtual:cssints/runtime/<scope>.<entry>` is `export {};` unless the runtime uses `parentVars` (or is the derived-token runtime). So reveal, balance and stuck ship their fallback scripts as a subpath the app must import by hand (`@cssints/reveal/runtime`, `@cssints/balance/runtime`, `@cssints/stuck/observer`), and a forgotten import gives no warning.

## Todo
- [x] `runtime: { polyfills, script }` (a module specifier or source) delivered in the runtime module when a target lacks a polyfilled key, as parentVars is
- [ ] move reveal, balance and stuck to it; drop their manual imports from the READMEs
- [x] a test: the module is empty for modern targets and imports the script otherwise
