---
# css-in-ts-compiler-am0h
title: Add Tests for Generation Pipeline
status: todo
type: task
priority: normal
created_at: 2026-02-19T08:09:09Z
updated_at: 2026-02-19T08:10:15Z
parent: css-in-ts-compiler-lf5k
blocked_by:
    - css-in-ts-compiler-fmnv
---

Create tests in scripts/__tests__/generate-pipeline.test.ts

## Test Coverage
- IDL parsing produces correct types
- Syntax parsing handles all MDN syntaxes
- Output files are valid TypeScript
- Browser compat data embedded in JSDoc correctly
- Split files generated independently

## Blocked By
- Task 4.1 (Main Generator)
