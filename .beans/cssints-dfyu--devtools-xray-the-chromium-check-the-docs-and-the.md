---
# cssints-dfyu
title: 'devtools xray: the Chromium check, the docs and the changeset'
status: completed
type: task
priority: high
created_at: 2026-11-11T14:27:45Z
updated_at: 2026-11-11T14:48:16Z
parent: cssints-4q3f
---

## What
`test/browsers.mjs` picks an element on the demo, presses `x`, and holds the layer and the panel section to the page:
the root box against `getBoundingClientRect`, padding and radius against the computed style, the child boxes in subtree
mode, many boxes in page mode, the 4px grid in the root's background. README and docs/API.md name the mode and its
key; a `@cssints/devtools` minor changeset; one wayfinder entry (what Gridray does, why no CDP, the implicit-track and
in-flow limits).

## Todo
- [x] The check in `test/browsers.mjs` (chrome; the file already runs firefox and webkit)
- [x] README: the key and the three scopes; docs/API.md: the overlay section
- [x] `.changeset/devtools-xray.md` (minor) and the wayfinder entry



## Summary of Changes

- `packages/devtools/test/browsers.mjs`: on the demo's frame, `x` shows the element scope and its size equals
  `getBoundingClientRect`, the root carries the 4 px grid and a `pad` line; the second press is the subtree (more than the
  root); the third is the page (more than 20 boxes, no grid); the fourth removes the layer. Chrome passed.
- `packages/devtools/README.md` and `docs/API.md` name the key, the three scopes and the numbers; `.changeset/devtools-xray.md`
  is a `@cssints/devtools` minor; `docs/wayfinder.md` has the entry (what Gridray does, why no CDP, the limits).
- The overlay chunk in the build check grew from 201,757 to 208,948 bytes (+7.2 kB, JS and sheet together).
