---
# css-in-ts-compiler-2w03
title: Create TypeScript emitter from AST
status: completed
type: task
priority: normal
created_at: 2026-02-18T14:56:47Z
updated_at: 2026-02-18T15:20:54Z
parent: css-in-ts-compiler-9h2z
blocked_by:
    - css-in-ts-compiler-nrz2
---

Build emitter that generates TypeScript type definitions from intermediate CSS type AST.



## Summary of Changes

Created TypeScript emitter in `ts-emitter.ts`:

### Emitter Functions
- `emitType()` - Emit CSSValueType → TS type
- `emitProperty()` - Emit CSSProperty → TS const
- `emitCSSFunction()` - Emit CSSFunction → TS const
- `emitIDLType()` - Emit IDLType → TS interface/enum
- `emitAST()` - Full AST → TS file

### Configuration
```typescript
interface EmitterConfig {
  header?: string;      // File header comment
  jsdoc?: boolean;      // Include JSDoc
  deprecated?: boolean; // Include @deprecated
}
```
