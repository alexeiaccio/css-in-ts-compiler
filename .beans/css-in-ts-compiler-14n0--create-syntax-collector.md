---
# css-in-ts-compiler-14n0
title: Create Syntax Collector
status: todo
type: task
priority: normal
created_at: 2026-02-19T08:05:14Z
updated_at: 2026-02-19T08:05:14Z
parent: css-in-ts-compiler-i4k0
---

Create scripts/collect-syntax.ts to load CSS syntax definitions from mdn-data

## Input
- mdn-data/css/syntaxes.json

## Output
```typescript
interface SyntaxDefinition {
  name: string;
  syntax: string;
  prose?: string;
}
```

Export getSyntaxData() function with caching support.
