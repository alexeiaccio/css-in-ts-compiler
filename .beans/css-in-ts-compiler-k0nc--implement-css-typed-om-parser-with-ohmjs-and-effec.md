---
# css-in-ts-compiler-k0nc
title: Implement CSS Typed OM parser with Ohm.js and Effect-TS
status: in-progress
type: task
priority: normal
created_at: 2026-02-20T10:26:04Z
updated_at: 2026-02-20T10:26:26Z
---

Create a WebIDL parser using Ohm.js that parses css-typed-om.idl and generates Effect-TS TaggedClass/TaggedUnion schemas for CSS value types


## Todo

- [ ] Set up project structure for grammar/parser/generator
- [ ] Create WebIDL grammar (webidl.ohm) - CSS subset
- [ ] Implement WebIDL parser (parse IDL to AST)
- [ ] Implement Effect-TS code generator (TaggedClass + TaggedUnion)
- [ ] Generate css-typed-om.ts from css-typed-om.idl
- [ ] Add unit tests for parsing and generation
- [ ] Validate generated code compiles and works

## Scope

- WebIDL: CSS subset only (enough for css-typed-om.idl)
- Output: TypeScript types + Effect-TS TaggedClasses + TaggedUnions
- Validation: Full runtime validation via Effect-TS Schema
- IDL source: css-typed-om.idl from @webref/idl
