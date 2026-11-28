---
"@cssints/headless": minor
---

`createCardBoard`: a card board whose drops are declared states. `statesOf(card)` returns every reachable state — each
column `canDrop` allows, every insertion index in it, and the whole board after the move, with the card's own slot as the
no-move state — and `landing()` picks one from the frame, column and card boxes measured once per gesture: the column whose
x-range holds the pointer (else the nearest centre) and the number of that column's other cards whose centre is above it.
`commit()` hands that state to `onMove` and returns whether it moved; a release outside the frame, on a column the
declaration refuses, on `pointercancel` or a lost capture moves nothing, and the click after a drag is swallowed once. A
press under 4 px is still a click. The keyboard walks the same list (Space lifts, Left / Right the neighbouring column at
the same index, Up / Down an index in the column, Enter drops, Escape cancels) and a polite live region names the target.
While a state is held the declaration is on the DOM: `data-drop-column="source | target | blocked"` per column,
`data-drop-target="true"` on the dragged card and `data-drop-index` on the cards in the target column.
