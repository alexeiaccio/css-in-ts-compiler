---
# css-in-ts-compiler-k8hb
title: CSS Types Generation
status: completed
type: epic
priority: normal
created_at: 2026-02-18T10:13:47Z
updated_at: 2026-02-18T10:49:05Z
parent: css-in-ts-compiler-8gcl
---

Generate all CSS value types from mdn-data.

## Scope
- Extend value-types.ts with all MDN syntaxes
- Generate generated-types.ts
- Add unit type helpers (px, rem, deg, etc.)

## Reference Pattern
See packages/cssints/lib/typed.ts for type safety pattern.

## Types to Generate
- Length, Angle, Time, Frequency
- Color, Image, Position
- Percentage, LengthPercentage
- Transform, Filter, etc.
