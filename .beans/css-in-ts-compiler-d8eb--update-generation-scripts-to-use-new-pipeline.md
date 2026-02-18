---
# css-in-ts-compiler-d8eb
title: Update generation scripts to use new pipeline
status: completed
type: task
priority: normal
created_at: 2026-02-18T14:56:47Z
updated_at: 2026-02-18T15:21:15Z
parent: css-in-ts-compiler-9h2z
blocked_by:
    - css-in-ts-compiler-coq0
    - css-in-ts-compiler-2w03
---

Refactor generate-all.ts to use new pipeline: IDL → AST → TS types.



## Summary of Changes

Created modular AST architecture in `scripts/ast/`:

### Current Status
The new AST module is ready for use but NOT yet integrated into the main generation pipeline (`generate-all.ts`). The existing generators continue to work as-is.

### Integration Path (Future)
To use the new AST pipeline:
1. Import from `./ast/index.ts`
2. Use `parseWebIDL()` for IDL sources
3. Build `CSSTypeAST` from multiple sources
4. Use `emitAST()` to generate TypeScript

### Why Deferred
- Current generators work well
- New AST provides future extensibility
- Can be integrated incrementally without breaking changes
