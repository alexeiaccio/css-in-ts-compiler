---
# css-in-ts-compiler-4z6b
title: Create Generation Orchestrator
status: todo
type: task
priority: normal
created_at: 2026-02-19T08:06:51Z
updated_at: 2026-02-19T08:08:07Z
parent: css-in-ts-compiler-290g
blocked_by:
    - css-in-ts-compiler-010c
    - css-in-ts-compiler-ywja
---

Create scripts/generate-pipeline.ts to unify all data sources

## Input Sources
- @webref/idl → IDL types
- mdn-data/css/syntaxes.json → Syntax types  
- @mdn/browser-compat-data → Compat info
- @webref/css → Properties and functions

## Output
```typescript
interface GenerationConfig {
  sources: { idl, syntax, compat, properties, functions };
  output: { dir, types, syntax, compat, properties, functions };
}

export async function generateAll(config: GenerationConfig): Promise<CSSTypeAST>
```
