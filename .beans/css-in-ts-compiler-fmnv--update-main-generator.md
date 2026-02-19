---
# css-in-ts-compiler-fmnv
title: Update Main Generator
status: todo
type: task
priority: normal
created_at: 2026-02-19T08:08:36Z
updated_at: 2026-02-19T08:10:15Z
parent: css-in-ts-compiler-lf5k
blocked_by:
    - css-in-ts-compiler-t8x2
---

Update scripts/generate-all.ts to use new pipeline

## Changes
- Import and use generate-pipeline.ts
- Remove old direct generation code
- Support config for enabling/disabling sources

## Blocked By
- Task 3.2 (TS Emitter)
