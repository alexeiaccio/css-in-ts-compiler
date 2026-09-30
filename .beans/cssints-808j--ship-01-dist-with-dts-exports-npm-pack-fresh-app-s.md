---
# cssints-808j
title: 'Ship 0.1: dist with .d.ts, exports, npm pack, fresh-app smoke test'
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T08:13:20Z
updated_at: 2026-09-30T08:32:26Z
parent: cssints-vy0o
---

## Question

Make `cssints` and `@cssints/css-grammar` installable from a tarball into a new Vite 8 app.

- [x] `vp pack` output with `.d.ts` (or `.d.mts`) for everything users see: types.ts, members.ts, theme-types.ts and the css-grammar types they reach (css.ts, api-typed.ts, query.ts, token.ts, values.ts). Measure the gain for users with `skipLibCheck` (the unused-import and users.ts benches, against the .ts sources)
- [x] package.json: publish `exports` pointing at dist (types, browser runtime, default, ./vite), `files`, `sideEffects`, `peerDependencies` (vite 8), dependencies that are really needed at runtime vs build time; keep the workspace running from sources (a `development` condition or publishConfig), so repo tests stay unchanged
- [x] Check the npm names `cssints` and `@cssints/css-grammar` are free (read-only `npm view`); report, do not publish
- [x] `npm pack` both; a script (test/smoke/) that creates a fresh Vite 8 + React app in a temp dir, installs the tarballs, writes a component using css.*, a condition, a token and cv, runs `vite build` and a type-check with tsgo, and asserts the CSS and the absence of eval-time code in the bundle
- [x] Versioning note (0.1.0, changesets or not) as a recommendation

## Notes

npm names (read-only, 2026-09-30): `npm view cssints` and `npm view @cssints/css-grammar` both return E404, the registry API too. Not checkable read-only: that the `@cssints` scope (npm org) is owned by us; it has to be created before the first publish of @cssints/css-grammar.

## Summary of Changes

- cssints/vite.config.ts: third pack entry, types.d.mts (declarations only) for the "types" condition. css-grammar already built d.mts per module.
- Both package.json: version 0.1.0, description, engines node>=22, files [dist], and `publishConfig` holding the dist `exports` (cssints: types/browser/default, ./vite with types; css-grammar: ./* with types+default). Top-level exports stay on src/*.ts, so repo tests, demo and typechecks are unchanged. npm ignores publishConfig.exports, so scripts/pack.mjs (`bun run pack:tgz`) stages dist + the merged manifest (no private/scripts/devDependencies, workspace:* becomes ^0.1.0) in a temp dir and runs npm pack there. Never publishes. Publish the tarball, not the package dir.
- Runtime dependencies: all of the existing ones are needed at run time (effect, happy-dom, lightningcss, magic-string, mdn-data, oxc-parser, culori for cssints; effect, browserslist, @mdn/browser-compat-data for css-grammar). No dependency moved (css-grammar's mdn-data stays a devDependency: extract only). Peer: vite ^8.3.0.
- test/smoke/smoke.mjs + `bun run test:smoke` (not in `bun run test`).
- Result: cssints 31.7 kB (11 files), css-grammar 60.6 kB (30 files). Smoke passes. Type cost with skipLibCheck (net instantiations, sources -> dist): unused.ts 26790 -> 0 (tsc), 31707 -> 0 (tsgo); users.ts 723626 -> 701388 (-3.1%, tsc), 730182 -> 701501 (-3.9%, tsgo).
- npm names: both 404 (free). The @cssints scope itself is not checkable read-only.

## Versioning recommendation

Publish 0.1.0 of both, in lock-step (cssints depends on @cssints/css-grammar ^0.1.0, which in 0.x means 0.1.x: bump both together). No changesets yet: two packages and one author, so `npm version` in each plus a git tag is enough; adopt changesets when outside contributors appear or the packages start to version apart. Publish the tarballs from pack:tgz (`npm publish <tgz> --access public`, scope first needs the @cssints org). effect is pinned to a beta, which is why 0.x is honest.
