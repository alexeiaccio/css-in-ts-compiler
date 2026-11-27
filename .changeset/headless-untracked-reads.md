---
"@cssints/headless": patch
---

A deliberate one-time snapshot in `createDatePicker` says so: `cellProps(iso)` computed a cell's row and column through a
direct read of the shown month, which Solid's dev build reports as a read outside a tracking scope for every one of the 42
cells the grid draws. The read is a snapshot on purpose (a cell's coordinates belong to the month its row was built for,
and `monthDays()` rebuilds the rows when the month pages), so it is `untrack`ed instead of tracked: same values, and the
grid no longer trips `STRICT_READ_UNTRACKED`.

The same annotation in the other primitives whose handlers, refs and effect callbacks read their own state once:
`createMenu` (a ref's focus-group definition and shown state, and the controlled check a transition makes), `createRadioGroup`
(which provider a ref builds), `createAccordion` (a toggle, both setters and the initial normalize) and `createFeed` (its
API's paging, the load finish and fail, and the effect that settles an arriving batch). Reads that must follow stay tracked;
only the deliberate snapshots say so. The kit's dev page counts 27 warnings where it counted 39.

`createVirtualizer`'s `sync`, which a ref calls first and the scrollport's own listener calls after, reads the scrollport
through `untrack`: the element is the caller's, and the read is the signal's current value.
