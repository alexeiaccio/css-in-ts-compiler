---
# css-in-ts-compiler-v8rd
title: Build type inference engine
status: completed
type: task
priority: normal
created_at: 2026-02-18T07:38:48Z
updated_at: 2026-02-18T08:00:42Z
parent: css-in-ts-compiler-5lsg
blocked_by:
    - css-in-ts-compiler-scbn
---

Convert parsed syntax to TypeScript type expressions.

- [x] Create infer-types.ts
- [x] Generate union types from | combinator
- [x] Generate intersection for && combinator
- [x] Handle optional (?) and arrays (+, *)
- [x] Output TypeScript type strings
