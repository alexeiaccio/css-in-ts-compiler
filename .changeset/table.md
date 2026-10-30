---
"@cssints/headless": minor
---

`@cssints/headless`: `createTable`, a data table on a native `<table>`: sortable column headers with `aria-sort` on the sorted column only, a header button that cycles `ascending` -> `descending` -> unsorted by default (`sortCycle: "toggle"` for `ascending` <-> `descending`), and optional single or multiple row selection over ids with `aria-selected`, a mixed `aria-checked="mixed"` select-all, and `aria-rowcount` / `aria-colcount` / `aria-colindex` only while the host windows rows or columns. Sorting is the host's data: the primitive carries the descriptor and never reorders a row. It composes `grid-sort.qnt` and `grid-selection.qnt` without the grid's navigation, so `test/table.browser.test.tsx` is its oracle.
