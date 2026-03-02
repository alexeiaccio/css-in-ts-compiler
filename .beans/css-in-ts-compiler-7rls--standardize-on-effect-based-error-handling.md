---
# css-in-ts-compiler-7rls
title: Standardize on Effect-based error handling
status: completed
type: feature
priority: high
created_at: 2026-03-02T08:37:02Z
updated_at: 2026-03-02T09:11:22Z
---

Replace throwing errors with Effect-based errors throughout css-syntax package for consistency with Effect TS patterns.

## Checklist
- [x] Update lexer.ts to return Effect instead of throwing
- [x] Create Effect-based parser wrappers (parser-effect.ts)
- [x] Update parsers to use Effect-based parsing
- [x] Remove error throwing from parse methods
- [x] Create unified ParseError type using Effect Schema
- [x] Update public API to return Effect types
- [x] Update tests to handle Effect errors
- [ ] Update README examples
- [x] Run typecheck and tests