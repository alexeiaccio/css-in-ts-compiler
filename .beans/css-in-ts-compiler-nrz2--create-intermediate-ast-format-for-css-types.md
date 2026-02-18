---
# css-in-ts-compiler-nrz2
title: Create intermediate AST format for CSS types
status: completed
type: task
priority: high
created_at: 2026-02-18T14:56:47Z
updated_at: 2026-02-18T15:17:08Z
parent: css-in-ts-compiler-9h2z
---

Define a unified CSS type AST format that decouples parsing from emission. Include types for primitives, composites, functions, and properties.



## Summary of Changes

Created intermediate AST format for CSS types in `scripts/ast/`:

### Files Created
- `css-type-ast.ts` - Core AST types (PrimitiveType, CompositeType, EnumType, CSSProperty, CSSFunction, IDLType)
- `idl-parser.ts` - WebIDL2 parser integration
- `ts-emitter.ts` - TypeScript type emitter from AST
- `index.ts` - Module exports

### Key Types
```typescript
interface CSSValueType = PrimitiveType | CompositeType | EnumType | AliasType
interface CSSProperty { type, name, syntax, valueType, ... }
interface CSSFunction { type, name, syntax, parameters, returnType, ... }
interface IDLType = IDLInterface | IDLDictionary | IDLEnum | ...
```

### Pipeline
IDL/CSS → AST → TypeScript
