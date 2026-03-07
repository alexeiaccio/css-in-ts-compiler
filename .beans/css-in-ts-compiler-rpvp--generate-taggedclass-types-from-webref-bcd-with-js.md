---
# css-in-ts-compiler-rpvp
title: Generate TaggedClass types from WebRef + BCD with JSDoc status tags
status: completed
type: feature
created_at: 2026-03-04T10:26:17Z
updated_at: 2026-03-04T10:26:17Z
---

Create data-driven generator for atomic CSS unit types as Effect Schema TaggedClass classes with @deprecated and @experimental tags from BCD status flags.

## Checklist

- [x] Update generate-unified-data.ts to load BCD and merge status flags
- [x] Create generate-tagged-classes.ts script
- [x] Update generate-functions.ts to add @deprecated/@experimental to JSDoc
- [x] Update generate-all.ts to include new generator
- [x] Test generation and compilation
- [x] Verify status tags appear in generated JSDoc
