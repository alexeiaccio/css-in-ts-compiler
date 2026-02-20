---
# css-in-ts-compiler-8gcl
title: 'CSS-in-TS v2: Full Property & Utility Generation'
status: completed
type: milestone
priority: normal
created_at: 2026-02-18T10:13:34Z
updated_at: 2026-02-18T10:49:05Z
---

Extend packages/cssints to generate all CSS types, properties, and add composable utilities.

## Goal
Generate a complete CSS-in-TS library with typed functions for all CSS properties.

## Reference
- packages/cssints/lib/typed.ts - Type safety pattern
- docs/API.md - Target API

## Output Files
- lib/generated-types.ts - CSS value types
- lib/generated-props.ts - CSS property functions  
- lib/composables.ts - Curated utilities (flex, grid, etc.)

## Key Features
- Multi-param signatures: padding(1, 2, 3, 4)
- Number→rem scale: 4 → '1rem'
- Composable: css.flex(css.items('center'), css.justify('center'))
