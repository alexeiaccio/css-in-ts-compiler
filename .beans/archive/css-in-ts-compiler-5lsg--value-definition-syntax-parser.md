---
# css-in-ts-compiler-5lsg
title: Value Definition Syntax Parser
status: completed
type: epic
priority: normal
created_at: 2026-02-18T07:38:03Z
updated_at: 2026-02-18T08:07:58Z
parent: css-in-ts-compiler-hztx
---

Parse MDN value definition syntax into TypeScript types.

## Scope
- Parse syntax like <length>, <color>, <percentage>, <angle>
- Handle combinators (|, ||, &&, [])
- Handle multipliers (*, +, ?, {n,m})
- Map to existing typed.ts types (Length, Angle, Color, etc.)

## Output
- Type mapping from CSS syntax to TypeScript
