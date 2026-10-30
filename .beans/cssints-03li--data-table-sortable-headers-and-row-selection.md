---
# cssints-03li
title: 'Data table: sortable headers and row selection'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T16:35:20Z
parent: cssints-65eb
---

createGrid is keyboard cell navigation and createTreegrid is fixed at three columns; o11y, statechart and issues render div rows.

- [x] table semantics (thead/tbody/th scope), caption, aria-sort on the sorted column
- [x] sort: a button inside th, cycle ascending/descending/none
- [x] optional row selection with aria-selected and a select-all with indeterminate
- [ ] adopt: o11y Logs and Traces attribute table, statechart variable table, issues state log

## Summary of Changes

`createTable` in `packages/headless/src/table.ts` (+ `test/table.browser.test.tsx`, README, docs/API.md, changeset minor). Native table: no role, no aria-rowindex; `aria-sort` on the sorted column only; tri-state header button cycle by default (`sortCycle: "toggle"` for ascending<->descending); selection over row ids (none/single/multiple) with `aria-selected`, a `role=checkbox aria-checked=mixed` select-all only for multiple, and `aria-rowcount`/`aria-colcount`/`aria-colindex` only while the host windows rows or columns. Sorting is the host's data: the descriptor is carried, rows are never reordered. Composes grid-sort + grid-selection without navigation; the browser test is the oracle (15 tests, real Chromium).

Open in this bean: the adopt step (o11y Logs/Traces attribute table, statechart variable table, issues state log). Follow-up candidates: `isRowHeader` (a first-column `th[scope=row]`) and a column offset for a horizontally windowed table.
