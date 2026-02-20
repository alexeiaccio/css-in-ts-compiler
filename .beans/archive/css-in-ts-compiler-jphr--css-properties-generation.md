---
# css-in-ts-compiler-jphr
title: CSS Properties Generation
status: completed
type: epic
priority: normal
created_at: 2026-02-18T10:13:51Z
updated_at: 2026-02-18T10:49:05Z
parent: css-in-ts-compiler-8gcl
---

Generate CSS property functions from @webref/css.

## Scope
- Create property generator script
- Add multi-param signature support
- Add number→rem scale conversion
- Generate generated-props.ts
- Add JSDoc with browser compat

## Property Signatures
- Single value: display('flex')
- Number scale: padding(4) → '1rem'
- Multi-param: padding(1, 2, 3, 4) → '0.25rem 0.5rem 0.75rem 1rem'
- Mixed: padding(1, '2rem') → '0.25rem 2rem'

## Reference
See packages/cssints/lib/typed.ts for filter/hueRotate pattern.
