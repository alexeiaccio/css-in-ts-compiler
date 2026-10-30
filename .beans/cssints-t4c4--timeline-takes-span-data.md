---
# cssints-t4c4
title: Timeline takes span data
status: completed
type: feature
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T18:08:53Z
parent: cssints-65eb
---

createTimeline's five-span tree is a demo fixture; the o11y waterfall needs real rows.

- [x] rows: start/end (or offset+duration), depth, label, status, optional children
- [x] a depth ruler and indentation that survives narrow widths
- [x] selection + keyboard navigation of rows

## Summary of Changes

Shipped on branch `ui/timeline`:

- `createTimeline({ rows, axis, selected, onSelect })` rows mode: `extent()`, `rowProps`, `barProps` (left/width % and `--depth`), `labelProps`, `depthOf`, `rulerProps.ticks`, `select`, `selectedId`.
- Roles: `role=list` / `listitem`, `aria-level = depth + 1`, `aria-current="true"` for selection (no APG waterfall pattern; `aria-selected` is invalid on listitem).
- Geometry: percentages of the rows' extent; every bar has a 0.5% width floor (2 px on a 400 px track) so a zero-length span stays visible; an empty extent puts bars at left 0% instead of dividing by zero.
- Ruler ticks at 1/2/5 x 10^n, about five across the extent, labelled in `axis.unit` (default ms).
- Click selects and moves the roving tab stop; ArrowUp/Down/Home/End move it; Enter/Space select the focused row. `selected` + `onSelect` are the controlled pair.
- Demo five-span tree and its API unchanged; the existing differential walk stays green.
- Tests: `test/timeline-rows.browser.test.tsx` (9 tests), existing `timeline.browser.test.tsx` (12), full headless suite green apart from the known menu-button flake (passes alone). Docs: package README + docs/API.md; changeset minor.
- Adoption in the o11y dashboard moved to cssints-3h4g (separate repo and checkout).
