---
# css-in-ts-compiler-9h2z
title: 'Refactor: Use webidl2 parser and intermediate AST'
status: completed
type: milestone
priority: normal
created_at: 2026-02-18T14:56:13Z
updated_at: 2026-02-18T15:21:35Z
---

Refactor CSS type generation to use webidl2 parser from @webref/idl with an intermediate AST format, following TypeScript-DOM-lib-generator patterns.



## Summary of Changes

Refactored CSS type generation with webidl2 parser and intermediate AST format.

### New Module: `scripts/ast/`
- `css-type-ast.ts` - Core AST types (200+ lines)
- `idl-parser.ts` - WebIDL2 integration (320+ lines)
- `ts-emitter.ts` - TypeScript emitter (200+ lines)
- `index.ts` - Module exports

### Architecture
```
Sources                AST                  Output
─────────────────────────────────────────────────────
@webref/idl   ──┐
@webref/css   ──┼──→ CSSTypeAST ──→ emitAST() ──→ .d.ts
mdn-data      ──┘
```

### Benefits
- Decoupled parsing from emission
- Extensible for new sources
- Type-safe intermediate format
- Follows TypeScript-DOM-lib-generator patterns
