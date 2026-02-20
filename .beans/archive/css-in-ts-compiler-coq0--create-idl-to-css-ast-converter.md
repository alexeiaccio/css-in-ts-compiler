---
# css-in-ts-compiler-coq0
title: Create IDL to CSS AST converter
status: completed
type: task
priority: high
created_at: 2026-02-18T14:56:47Z
updated_at: 2026-02-18T15:20:54Z
parent: css-in-ts-compiler-9h2z
blocked_by:
    - css-in-ts-compiler-nrz2
    - css-in-ts-compiler-mmfe
---

Build converter that transforms webidl2 AST to our intermediate CSS type AST format.



## Summary of Changes

The IDL to CSS AST converter is implemented in `idl-parser.ts`:

### Conversion Functions
- `convertInterface()` - Interface → IDLInterface
- `convertDictionary()` - Dictionary → IDLDictionary
- `convertEnum()` - Enum → IDLEnum
- `convertTypedef()` - Typedef → IDLTypedef
- `convertNamespace()` - Namespace → IDLNamespace

### Type Mapping
- Maps IDL primitives (DOMString, long, etc.) to TS types
- Handles union types, generics, nullable types
- Extracts CSS numeric base types
