---
# cssints-bkdm
title: 'Diagram: focusable nodes and edges over createCanvas'
status: completed
type: feature
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-11-04T09:57:17Z
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


## Closed (2026-11-04)

Shipped as `createDiagramFocus` in 0.24.0 (PR #103) and adopted by apps/statechart (effects-of-atmosphere#5).

- Node roving tab stop over the real layout: arrows go to the nearest node in that direction by centre distance (wrap at the edge), Home/End to the ends, Enter/Space activates.
- Edges are reachable from the active node (`e`, arrows, Enter, Escape) instead of being `disabled` buttons.
- One polite live region announces the node and its transitions.
- `nodeProps(id)` carries an element id and every move calls `focus()`, so DOM focus and the tab stop never diverge.

Feedback for the next round: `status()` is a fixed sentence a host can only render, not replace (a translated app wants the parts); `edgeProps` assumes an HTML element, so an SVG edge needs an overlay.
