---
# cssints-649r
title: 'dist/tui.mjs drops culori''s colour modes: every terminal colour fails in a build'
status: todo
type: bug
created_at: 2026-10-10T16:00:21Z
updated_at: 2026-10-10T16:00:21Z
parent: cssints-06ws
---

Found by cssints-m0yj (sky-tui on cssints/tui).

packages/cssints/src/tui.ts imports `./color.ts` for its side effect (culori's colour modes, `useMode`), but packages/cssints/package.json says `"sideEffects": false`, so the tsdown build drops it: dist/tui.mjs imports `parse` from `culori/fn` with no mode registered. `parse()` then returns undefined for every colour, and a build of an app that consumes the dist (any app; packages/tui's tests run the source through `--conditions=development`, so they do not see it) fails on the first colour:

```
[plugin cssints] apps/sky-tui/src/styles.ts:34:22
MacroError: cssints: "var(--color-bg)" is "#101316" here, not a colour a terminal can show
```

Check: `head dist/tui.mjs` has no import of a color-*.mjs chunk (the source has `import "./color.ts"`).

Fix: list the side-effect module in `sideEffects` (e.g. `["./src/color.ts", "./dist/color-*.mjs"]`) or make tui.ts use an export of color.ts; rebuild dist on master; a test that builds a cssints/tui site against dist (node without --conditions=development).

Workaround in sky-tui: `import "culori" with { type: "cssints" };` in src/styles.ts (build time only), culori as a devDependency.

## Todo

- [ ] keep the colour modes in dist/tui.mjs
- [ ] a test of cssints/tui against the dist
