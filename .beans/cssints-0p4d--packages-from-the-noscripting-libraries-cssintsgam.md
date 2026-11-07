---
# cssints-0p4d
title: 'Packages from the noscript.ing libraries: @cssints/gamut and @cssints/data'
status: completed
type: feature
priority: normal
created_at: 2026-11-07T06:40:34Z
updated_at: 2026-11-07T06:54:14Z
---

Two plugin packages out of the two repos in https://github.com/noscripting:
- **gamutant** (a CSS-only color polyfill: gamut fitting, readable text, palette tones, HDR spaces) → **@cssints/gamut**, a build-time value library like @cssints/ramp: `fit(color, { target: 'srgb' | 'display-p3', method })`, `readable(bg, { ratio, toward })`, `tones(color, count)`, all culori, all in gamut by construction.
- **dCSS** (data functions computed by layout: max, sum, mean, median, sort, rank, formats) → **@cssints/data**, a member that prints a global rig: a zero-height measuring list, an auto grid column (max) or a hug-width flex row (sum, count), and a query-container reader whose children get `--data-result: round(100cqw / 1px)` and whose `<output>` prints it with a counter.

Why the split: gamut's maths is build-time (the kit's grain, no runtime CSS); dCSS's is runtime-only (its whole point is values that change after the build), so the package emits CSS and documents a DOM contract, and it complements @cssints/reactive rather than duplicating it.

Each package: src/index.ts, README, a node test (plus a Chromium test for data), types, package.json in the fixed release group, a changeset, a docs/API.md section and the AGENTS.md layout line. Reference notes in docs/wayfinder.md (2026-11-06: 'Numbers from layout').


## Outcome (2026-11-07)

Both packages shipped and sit in the fixed group with a changeset each:
- @cssints/gamut (packages/gamut, 338e4c0f): fit / readable / tones at build time with culori; node test, type test, README, docs row.
- @cssints/data (packages/data, 22f845fe): data() prints the layout rig for max / sum / count; node test, Chromium test (40/82/3), README, docs row.
Root: fixed group, plainCode (both), docs/API.md rows, AGENTS.md layout and counts (32), RELEASING.md.

Not done here, by design: the first publish of each (release:check says "@cssints/data is not on npm: publish its first version by hand"), which is the release owner's step with npm trust, like @cssints/stories.
