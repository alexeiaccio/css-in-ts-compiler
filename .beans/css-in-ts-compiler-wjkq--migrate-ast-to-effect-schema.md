---
# css-in-ts-compiler-wjkq
title: Migrate AST to Effect Schema
status: completed
type: task
priority: normal
created_at: 2026-03-01T18:12:33Z
updated_at: 2026-03-02T00:04:27Z
parent: css-in-ts-compiler-tyre
---

Use Effect TS 4 Schema for AST definitions.

## Tasks
- [ ] Define CSS node types using Schema.Class
- [ ] Implement Schema.Union for discriminated unions
- [ ] Add custom schemas for CSS-specific types (colors, units, selectors)
- [ ] Leverage Schema.Annotations for validation rules
- [ ] Use effect/match for type-safe pattern matching
- [ ] Consider experimental tagged union augmentation from effect-smol

## Schema Benefits
- Compile-time guarantees for AST structure
- Runtime validation from unknown input
- Automatic exhaustiveness checking
- Single source of truth for CSS syntax

## Dependencies
- Phase 1: Effect TS 4 Foundation
