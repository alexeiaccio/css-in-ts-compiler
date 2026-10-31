---
# cssints-bkdm
title: 'Diagram: focusable nodes and edges over createCanvas'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-31T10:25:46Z
parent: cssints-65eb
---

statechart positions node divs absolutely with no roles, and edges are buttons disabled unless active; createCanvas fits the geometry but not the reading.

- [x] node roving focus (arrows follow the layout, Tab leaves the diagram)
- [x] edge activation by keyboard from the active node (a list of outgoing edges, Enter fires)
- [x] announce the active node and its transitions
- [ ] adopt: apps/statechart

## Progress

`createDiagramFocus` in `packages/headless/src/diagram.ts`, exported from `@cssints/headless`; oracle `packages/headless/test/diagram.browser.test.tsx` (15 tests). README `## Diagram`, docs/API.md, minor changeset. Still open: adopt in apps/statechart.

PR: https://github.com/alexeiaccio/css-in-ts-compiler/pull/103
