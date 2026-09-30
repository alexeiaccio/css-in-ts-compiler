---
# cssints-808j
title: 'Ship 0.1: dist with .d.ts, exports, npm pack, fresh-app smoke test'
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T08:13:20Z
updated_at: 2026-09-30T08:30:47Z
parent: cssints-vy0o
---

## Question

Make `cssints` and `@cssints/css-grammar` installable from a tarball into a new Vite 8 app.

- [x] `vp pack` output with `.d.ts` (or `.d.mts`) for everything users see: types.ts, members.ts, theme-types.ts and the css-grammar types they reach (css.ts, api-typed.ts, query.ts, token.ts, values.ts). Measure the gain for users with `skipLibCheck` (the unused-import and users.ts benches, against the .ts sources)
- [x] package.json: publish `exports` pointing at dist (types, browser runtime, default, ./vite), `files`, `sideEffects`, `peerDependencies` (vite 8), dependencies that are really needed at runtime vs build time; keep the workspace running from sources (a `development` condition or publishConfig), so repo tests stay unchanged
- [ ] Check the npm names `cssints` and `@cssints/css-grammar` are free (read-only `npm view`); report, do not publish
- [ ] `npm pack` both; a script (test/smoke/) that creates a fresh Vite 8 + React app in a temp dir, installs the tarballs, writes a component using css.*, a condition, a token and cv, runs `vite build` and a type-check with tsgo, and asserts the CSS and the absence of eval-time code in the bundle
- [ ] Versioning note (0.1.0, changesets or not) as a recommendation
