---
"@cssints/headless": patch
---

A deliberate one-time snapshot in `createDatePicker` says so: `cellProps(iso)` computed a cell's row and column through a
direct read of the shown month, which Solid's dev build reports as a read outside a tracking scope for every one of the 42
cells the grid draws. The read is a snapshot on purpose (a cell's coordinates belong to the month its row was built for,
and `monthDays()` rebuilds the rows when the month pages), so it is `untrack`ed instead of tracked: same values, and the
grid no longer trips `STRICT_READ_UNTRACKED`.
