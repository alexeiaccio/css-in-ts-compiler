---
# css-in-ts-compiler-f87l
title: Update Package Exports
status: todo
type: task
priority: normal
created_at: 2026-02-19T08:10:00Z
updated_at: 2026-02-19T08:10:15Z
parent: css-in-ts-compiler-lf5k
blocked_by:
    - css-in-ts-compiler-am0h
---

Update package.json exports for new split files

## Changes to package.json
```json
{
  "exports": {
    ".": "./lib/index.ts",
    "./types": "./lib/types.gen.ts",
    "./syntax": "./lib/syntax.gen.ts",
    "./compat": "./lib/compat.gen.ts",
    "./properties": "./lib/properties.gen.ts",
    "./functions": "./lib/functions.gen.ts"
  }
}
```

Remove old generated-types.ts and update all imports.

## Blocked By
- Task 4.2 (Tests)
