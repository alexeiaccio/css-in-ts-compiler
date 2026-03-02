---
# css-in-ts-compiler-t85m
title: Migrate cssints to use @cssints/css-syntax
status: completed
type: task
priority: normal
created_at: 2026-03-01T12:25:55Z
updated_at: 2026-03-02T07:42:03Z
---

Replace css-tree dependency with @cssints/css-syntax in cssints package.

## Files to update:
- packages/cssints/src/core/ast.ts
- packages/cssints/src/core/style.ts

## Changes needed:
- Replace css-tree imports with @cssints/css-syntax
- Update parseValue to use new CSS value parser
- Update generateCSS to use new CSS generator
- Update Style class to use new AST schemas

## Dependencies:
- Requires css-syntax package to have complete API parity with css-tree
