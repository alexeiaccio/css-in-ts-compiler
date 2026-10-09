---
# cssints-vitu
title: 'MCP: the live app (dev server)'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T08:45:25Z
updated_at: 2026-10-09T12:10:26Z
parent: cssints-0phg
---

Tools that talk to a running dev server: what a class is (decls, conditions, layer, scope, sites), the styles of a file, current build errors and warnings. Reuse the devtools overlay's class table and transport (cssints-cncb).

## Todo
- [x] find the dev server (port / url option), read the class table
- [x] tools: explain class, styles of a module, current errors/warnings
- [x] tests against apps/demo's dev server

## Summary of Changes

- `packages/mcp/src/live.ts`: the `Live` service, one Vite HMR websocket per url (protocol `vite-hmr`, Node's
  WebSocket, no origin so no token), `cssints:devtools:get` → the table decoded by `@cssints/devtools/model`
  (`toModel`), cached until `cssints:devtools:stale`. The first call fetches every module the page reaches (scripts of
  the HTML, then static and dynamic imports), again after an `update` of a module or a `full-reload`, so no browser
  has to be open and an edit is seen.
- Tools `explain_class` (classes → decls, conditions, layer, plugin/kernel, tokens with path and value, sites
  file:line:col), `module_styles` (file → its calls, their classes and CSS), `dev_errors` (Vite's `error` payloads
  collected while the modules are fetched again; warnings and runtime errors are not sent, `notAvailable` says so).
- `@cssints/devtools/model`: a DOM-free subpath (table, sheet parser, event names).
- `test/live.mjs`: apps/demo's dev server, a fixture app (a lazy module with a bad value, an edit) and a server
  without the devtools.
