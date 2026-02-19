---
# css-in-ts-compiler-vmi4
title: Create IDL Collector
status: todo
type: task
priority: high
created_at: 2026-02-19T08:01:00Z
updated_at: 2026-02-19T08:01:00Z
parent: css-in-ts-compiler-864t
---

Create scripts/collect-idl.ts to load and cache IDL from @webref/idl package

## Acceptance Criteria
- Export getIDLData() function with { force?: boolean } option
- Cache to node_modules/.cache/cssints/idl-cache.json
- Return IDLCollection with version, timestamp, files Map

## Output
```typescript
interface IDLCollection {
  version: string;
  timestamp: string;
  files: Map<string, string>; // filename -> IDL text
}
```
