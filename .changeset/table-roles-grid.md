---
"@cssints/headless": minor
---

A table states its roles, and a column may name its track.

`createTable` used to add no `role`, because a native `<table>` said it itself. A skin that lays the
rows out as a CSS grid cannot: `display: contents` on `<thead>`/`<tbody>`/`<tr>` leaves those
elements without a box, and an element without a box keeps its place in the accessibility tree only
when it carries its own role. Every part now states one (`table`, `rowgroup`, `row`,
`columnheader`, `cell`), a grid skin can be built without losing the semantics, and
`TableColumn.width` carries the CSS track a `grid-template-columns` needs.

The body row's `aria-rowindex` stays the skin's job: under a window only the host knows a row's
place in the whole set (the primitive is given the window), so `renderRow(row, index)` is where it
goes.
