---
# css-in-ts-compiler-010c
title: Update IDL Parser for Full Coverage
status: todo
type: task
priority: high
created_at: 2026-02-19T08:03:47Z
updated_at: 2026-02-19T08:03:59Z
parent: css-in-ts-compiler-864t
blocked_by:
    - css-in-ts-compiler-w42i
---

Enhance scripts/ast/idl-parser.ts for complete CSS IDL support

## Changes Needed
- Add support for `callback` interfaces
- Add `partial interface` merging
- Extract extended attributes (e.g., [Exposed=Window])
- Handle CSS-specific type mappings (CSSStyleValue, etc.)
- Add better error handling and recovery

## Blocked By
- Task 1.2 (needs extracted CSS IDL types)
