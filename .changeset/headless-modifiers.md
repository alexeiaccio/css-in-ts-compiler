---
"@cssints/headless": minor
---

`createModifiers`: table transformations reified as a persistent stack of units over columns (MuTable,
UIST '26), with the accessibility a pointer-only version would lose. One encoding has one owner — the
topmost unit covering the column — so the order means what it means; a unit's `parts` carry its coverage
by position, so a joined unit is a reusable sequence and retargeting it moves every step. `locked` says
which column is the input, as a table's sort is a descriptor the host computes with.

The rail is a `toolbar` of menu buttons: arrows move focus, `Alt`+arrow reorders (the drag's keyboard
route, where dragging is the pointer's), `Enter`/`Space`/`Shift+F10` opens the unit's menu (its span as
checkboxes, the lock as radios, join with above, split, remove), and `Delete` removes. A unit's
`aria-label` is its span and its lock; every structural change is announced through a `createStatus`
region, and only once the host's stack says it happened — a controlled host that refuses a request gets
no message. Encodings stay decoration: the values remain text, `mark` being a smaller rendering of them.
