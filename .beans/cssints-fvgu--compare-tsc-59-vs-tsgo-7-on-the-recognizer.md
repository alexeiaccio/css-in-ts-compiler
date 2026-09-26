---
# cssints-fvgu
title: Compare tsc 5.9 vs tsgo 7 on the recognizer
status: completed
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

## Summary of Changes
- Identical results and error text. Instantiation counts match. tsgo is 3-4x faster.
- tsgo needs `--ignoreConfig` when files are passed next to a `tsconfig.json`.
- Decision: tsgo is the primary target, and tsc stays green.
