---
# cssints-p3d2
title: 'Engine entry points for the MCP: contrast, lowering, located warnings, targets per root, shipped docs'
status: completed
type: task
priority: low
created_at: 2026-10-09T09:15:41Z
updated_at: 2026-10-09T13:25:43Z
---

Found by @cssints/mcp (cssints-w57u, "## Engine gaps"); each is worked around inside packages/mcp.
- cssints does not export its contrast maths (src/color.ts): check_contrast repeats ~20 lines.
- loweredOf (what LightningCSS converts for older targets) is not exported, so check_support answers by raw BCD while a build drops some of those warnings.
- A support warning is said once per class per process, with no line/column; the MCP remembers warnings per class and calls the plugin's hotUpdate to repeat them.
- Browser targets are read once at process start from the cwd, not per project root.
- docs/API.md is not in the published cssints package, so search_docs in a user project reads only READMEs.

## Todo
- [x] export contrast and loweredOf from a public entry
- [x] warnings with a location, repeatable per build (an API, not hotUpdate)
- [x] targets per root
- [x] ship docs/API.md in the cssints package (or a docs subpath)

## Progress

- [x] contrast exported (cssints/check `contrast`); MCP check_contrast uses it

## Summary of Changes

- `cssints/check` (new Node-only subpath, Effects): `contrast(fg, bg)` (ratio and its text cut at two places, `ContrastError`) and `loweredOf(property, value, warning)` (what LightningCSS writes for the lacking targets). MCP `check_contrast` uses `contrast` (its culori copy and dependency are gone); `check_support` counts what is lowered as supported and lists it under `lowered`.
- Support warnings carry their site (`__site` keeps `registry.at`; Vite gets `loc` and a code frame) and are said once per file of the site, property and feature per build (registry.ts `warn`); in dev again when that file is edited (`hotUpdate` forgets that file only), not on an unrelated update; each `vite build --watch` build starts over. `api.forgetWarnings(files?)` replaces the MCP's hotUpdate call and per-class memo; `compile` warnings have line, column and location.
- Targets per root: the plugin reads the browserslist of `config.root` and sets it before each evaluation (css-grammar `useTargets`, `targets(query, path)`, `browsers(query, path)`; `supportOf` caches per target list). `check_support` takes `root`.
- docs/API.md ships in cssints (`prepack` copies it to docs/, `files` lists docs, scripts/pack.mjs runs it); `search_docs` reads node_modules/cssints/docs/API.md.
- Tests: cssints test/check.mjs, warnings.mjs, targets-root.mjs, pack-docs.mjs; mcp test/tools.mjs. Docs: API.md, README, MCP README, the cssints skills, wayfinder.
- Deferred: `targets`/`cssTarget` exports still read process.cwd(); dist/ of cssints and css-grammar to rebuild on master (the MCP runs on dist).
