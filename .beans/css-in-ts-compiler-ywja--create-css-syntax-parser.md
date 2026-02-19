---
# css-in-ts-compiler-ywja
title: Create CSS Syntax Parser
status: todo
type: task
priority: normal
created_at: 2026-02-19T08:05:54Z
updated_at: 2026-02-19T08:06:10Z
parent: css-in-ts-compiler-i4k0
blocked_by:
    - css-in-ts-compiler-14n0
---

Create scripts/ast/syntax-parser.ts to parse CSS syntax strings into AST

## Examples
- `<length> | <percentage>` → CompositeType
- `none | hidden | dotted | dashed` → EnumType
- `<length-percentage>` → AliasType

## Output
```typescript
export function parseSyntax(syntax: string): CSSValueType
export function parseAllSyntaxes(definitions: SyntaxDefinition[]): Map<string, CSSValueType>
```

Handle all MDN syntax patterns: <type>, |, ||, &&, [], {}, ?.
