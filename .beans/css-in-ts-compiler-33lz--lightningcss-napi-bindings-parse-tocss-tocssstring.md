---
# css-in-ts-compiler-33lz
title: lightningcss NAPI bindings (parse, toCss, toCssString)
status: completed
type: feature
priority: high
created_at: 2026-03-20T10:04:01Z
updated_at: 2026-03-20T10:37:47Z
---

Custom NAPI module exposing lightningcss parse/to_css/toCssString APIs to Node.js, with ast.json schema generation and TypeScript types.

## Summary of Changes

- Created `packages/lightningcss-napi/` — custom NAPI bindings for lightningcss
- Rust NAPI module with 6 functions: `parse`, `toCss`, `toCssString`, `toCssLength`, `toCssColor`, `toCssLengthPercentage`
- Uses serde_json for the JS↔Rust boundary (serde format matches existing ast.d.ts TypeScript types)
- `ast.d.ts` copied from lightningcss npm package (Phase 2 replaces with Effect Schema generation)
- Full TypeScript wrapper with type-safe exports
- 18 vitest tests all passing
- Integrated into monorepo (turbo.json)
