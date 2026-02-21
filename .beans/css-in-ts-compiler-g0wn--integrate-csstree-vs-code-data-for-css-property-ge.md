---
# css-in-ts-compiler-g0wn
title: Integrate csstree + VS Code data for CSS property generation
status: in-progress
type: feature
priority: normal
created_at: 2026-02-21T12:15:56Z
updated_at: 2026-02-21T12:16:22Z
---

Merge csstree data.js with @vscode/web-custom-data to generate unified CSS data, then generate TypeScript types and functions. Architecture: unified data → generated types → Style TaggedClass → compile-time CSS generation via csstree AST.



## Tasks

- [ ] Create unified data generation script (merge csstree + VS Code)
- [ ] Generate unified-css-data.json
- [ ] Create core modules (branded.ts, style-class.ts, factory.ts, ast.ts)
- [ ] Generate types.gen.ts (branded value types)
- [ ] Generate css-map.gen.ts (property registry)
- [ ] Generate functions.gen.ts (property functions with JSDoc)
- [ ] Generate composables from VS Code data (flex, grid, etc.)
- [ ] Update compiler to use csstree AST
- [ ] Update registry to store AST instead of CSSProperties
- [ ] Test end-to-end: color('red') → Style → CSS output
