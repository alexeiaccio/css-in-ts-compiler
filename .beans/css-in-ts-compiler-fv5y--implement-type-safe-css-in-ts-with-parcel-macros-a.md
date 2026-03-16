---
# css-in-ts-compiler-fv5y
title: Implement type-safe CSS-in-TS with Parcel macros and LightningCSS
status: todo
type: epic
priority: normal
created_at: 2026-03-16T10:16:59Z
updated_at: 2026-03-16T10:19:22Z
---

## Overview

Epic to track implementation of type-safe CSS-in-TS compiler using Parcel macros for compile-time expansion and LightningCSS visitors for post-processing.

## Architecture

- **Phase 1 (Parcel Macros)**: `cssints` package generates placeholder CSS with `@atomic`, `@calc`, `@property` at-rules
- **Phase 2 (LightningCSS)**: Post-processor transforms placeholders to final CSS with hashed classes, layers, and @property rules

## Key Features

- Full LightningCSS AST type re-exports
- Branded template literal types for compile-time validation
- Explicit calc operators: `calc('100vw', '-', '16px')`
- Dual token/property API for @property generation

## Tasks

### Type System Foundation
- [ ] **css-in-ts-compiler-klp8**: Setup macro package structure
- [ ] **css-in-ts-compiler-xqpt**: Re-export LightningCSS AST types  
- [ ] **css-in-ts-compiler-1olb**: Implement branded TypeScript types

### Core Macro Functions
- [ ] **css-in-ts-compiler-oe0n**: Implement calc with explicit operators
- [ ] **css-in-ts-compiler-1r9b**: Implement token.color with LightningCSS types
- [ ] **css-in-ts-compiler-ei80**: Implement direct css.property() API

### Post-Processor
- [ ] **css-in-ts-compiler-g2cz**: Setup postprocessor package
- [ ] **css-in-ts-compiler-31jq**: Implement calc visitor for LightningCSS
- [ ] **css-in-ts-compiler-g5hj**: Implement atomic CSS visitor
- [ ] **css-in-ts-compiler-64o9**: Implement layer visitor for specificity

### Integration
- [ ] **css-in-ts-compiler-gfxm**: Update main exports and integration

## Dependencies

None - this is a fresh implementation.

## API Examples

```typescript
import * as css from "cssints" with { type: "cssints" };
import type { Length, CssColor } from "cssints/ast";

// Type-safe length values
css.p(4)                    // ✓ number → 1rem
css.p('16px')              // ✓ `${number}px`
css.p('100dvw')            // ✓ `${number}dvw`
css.p('16foo')             // ✗ Type error

// Explicit calc operators
css.calc('100vw', '-', '16px')
css.calc('(', '100%', '-', '2rem', ')', '/', 2)

// Token-based @property
const primary = css.token.color('#3b82f6', { 
  var: 'color-primary', 
  inherit: true 
});

// Direct @property
css.property({
  name: '--accent',
  syntax: '<color>',
  inherits: true,
  initialValue: '#ff0000'
});
```
