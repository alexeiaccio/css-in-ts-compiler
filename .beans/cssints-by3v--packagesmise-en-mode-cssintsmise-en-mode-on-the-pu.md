---
# cssints-by3v
title: 'packages/mise-en-mode: @cssints/mise-en-mode on the public plugin API'
status: completed
type: feature
priority: normal
created_at: 2026-10-05T09:25:14Z
updated_at: 2026-10-05T09:59:50Z
parent: cssints-easl
blocked_by:
    - cssints-0v30
---

Step 2 of docs/research/plugin-api.md "Decision".
- [x] New workspace package packages/mise-en-mode (@cssints/mise-en-mode, cssints peerDependency, exports like @cssints/icons, MIT), imports only cssints/plugin (and types from cssints).
- [x] look(tokens, expression, source, overrides, { scope? }): looks are themes (Built.themes from step 1) in the declared layers app < author < viewer; aspects = top-level token groups (color, typography) as data-mode fragments [data-mode~="e/aspect"]; overrides checked against the token set in types and at build time; @scope containment; check.contrast sees looks.
- [x] Remove src/mise-en-mode.ts, the ./mise-en-mode export and pack entry, its test and fixture from packages/cssints; move/rewrite the tests (the Mode Contract cases of test/mise-en-mode.mjs) into the package; README for the package; API.md section moves.
- [x] Packaging check: an app that depends on @cssints/mise-en-mode (packagesOnCssints) builds; bun run test runs the package tests.

## Summary of Changes

- **packages/mise-en-mode** (`@cssints/mise-en-mode`, private workspace package like icons: cssints peerDependency, `exports` to src, `publishConfig` to dist, MIT, README): `look(tokens, expression, source, overrides, { scope? })` on `cssints/plugin` only. A look is a plain function that closes over the token set and the overrides and calls `style()` with `themes` (one per aspect = top-level token group) in the declared layers `app < author < viewer`; the selector is `:where([data-mode="e"], [data-mode~="e/aspect"])`; `scope` is `@scope`. Types come from `createGlobalTheme`'s own parameters (`src/types.ts`), so overrides are checked as a theme's are, in types and at build time; `check.contrast` reads looks (viewer look with poor contrast on the app look's background fails the build).
- **Out of the core**: src/mise-en-mode.ts, the `./mise-en-mode` export (dev and publishConfig), the pack entry, test/mise-en-mode.mjs and its fixture, the test script entry. plugin-seams.mjs uses its own fixture member (seam-look.ts) for the globals HMR case. API.md points to the package README.
- Wiring: bun workspace (bun.lock), `bun run test`, `bun run typecheck`, lint (plainCode, fixtures as inputs), `.prettierignore`, diff-check excludes, AGENTS.md, README.
- Packaging: apps/demo depends on the package and has a look (build checks contrast over it; sheet.mjs expects its layers); `bun run test:smoke` packs and installs the tarball in a fresh app and builds with a look.
- Breaking against the old look(): token set first, overrides by token path instead of raw custom-property declarations, aspects from the token groups, looks are themes not globals.
