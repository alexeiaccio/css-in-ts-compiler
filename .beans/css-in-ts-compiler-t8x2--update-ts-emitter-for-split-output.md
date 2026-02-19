---
# css-in-ts-compiler-t8x2
title: Update TS Emitter for Split Output
status: todo
type: task
priority: normal
created_at: 2026-02-19T08:07:39Z
updated_at: 2026-02-19T08:08:07Z
parent: css-in-ts-compiler-290g
blocked_by:
    - css-in-ts-compiler-4z6b
---

Enhance scripts/ast/ts-emitter.ts for multiple output files

## New Functions
- emitIDLTypes(ast): string → types.gen.ts
- emitSyntaxTypes(ast): string → syntax.gen.ts  
- emitCompatData(ast): string → compat.gen.ts (JSDoc @browser tags)

## Output Files
- types.gen.ts - IDL interfaces (CSSStyleValue, CSSNumericValue, etc.)
- syntax.gen.ts - CSS syntax types (Length, Angle, Color, etc.)
- compat.gen.ts - Browser support in JSDoc

Keep emitAST() for backward compat.
