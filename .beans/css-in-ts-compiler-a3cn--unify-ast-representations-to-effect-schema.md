---
# css-in-ts-compiler-a3cn
title: Unify AST representations to Effect Schema
status: completed
type: feature
priority: high
created_at: 2026-03-02T08:37:02Z
updated_at: 2026-03-02T08:48:51Z
---

Remove duplicate AST definitions (plain TS + Effect Schema) in css-syntax package. Use only Effect Schema with discriminated unions for type safety.

## Checklist
- [x] Remove plain TS AST files (selector-ast.ts, stylesheet-ast.ts)
- [x] Update parser imports to use Effect Schema versions
- [x] Update generator imports to use Effect Schema versions
- [x] Update walker imports to use Effect Schema versions
- [x] Update test imports to use Effect Schema versions
- [x] Remove plain type exports from parser/index.ts
- [x] Run typecheck and tests
- [ ] Update README if needed