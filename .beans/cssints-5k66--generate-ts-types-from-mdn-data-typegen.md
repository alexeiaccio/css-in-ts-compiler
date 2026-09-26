---
# cssints-5k66
title: Generate TS types from mdn-data (typegen)
status: completed
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

Superseded by the type-level recognizer. Kept as a reference.

## Summary of Changes
- `spikes/typegen/gen.mjs`: mdn-data to argument-tuple types. 557 of 635 properties typed (87.7%), and `tsc --strict` passes.
- Found that TS `${number}rem` accepts `"1 rem"`.
- Rejected as inelegant: it silently drops grammar information (ranges, `||` uniqueness, `&&` order).
