---
# css-in-ts-compiler-mmfe
title: Integrate webidl2 parser for @webref/idl
status: completed
type: task
priority: high
created_at: 2026-02-18T14:56:47Z
updated_at: 2026-02-18T15:18:19Z
parent: css-in-ts-compiler-9h2z
---

Use webidl2 package to parse IDL files from @webref/idl. Extract CSS-related interfaces and types.



## Summary of Changes

Integrated webidl2 parser for @webref/idl processing:

### Implementation
- Uses `webidl2.parse()` to parse IDL text into AST
- Converts IDL nodes to our internal AST format
- Handles: interfaces, dictionaries, enums, typedefs, namespaces
- Extracts CSS-specific types like `CSSNumericBaseType` enum

### Key Functions
- `parseWebIDL(idlText, sourceName)` - Main entry point
- `convertIDLNode()` - Node type dispatcher
- `convertType()` - IDL type to TypeScript type mapping
- `extractCSSTypesFromIDL()` - CSS type extraction
