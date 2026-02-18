---
# css-in-ts-compiler-hztx
title: 'RFC: Auto-Typed CSS Functions from WebRef'
status: completed
type: milestone
priority: normal
created_at: 2026-02-18T07:37:44Z
updated_at: 2026-02-18T08:07:58Z
---

Implement automated generation of fully-typed CSS functions from W3C specifications via @webref/css, filtered to modern baseline features with proper parameter types.

## Goal
Replace manual CSS function type definitions with auto-generated types from official W3C specs.

## Key Deliverables
- WebRef data collection and caching system
- Modern baseline filtering (browserslist integration)
- MDN value definition syntax parser
- TypeScript type generator
- CSS function generators using createTyped pattern

## Dependencies Already Available
- @webref/css
- @webref/idl  
- @mdn/browser-compat-data
- mdn-data
- bcd-idl-mapper

## Reference
- docs/rfc-auto-typed-functions.md
- packages/cssints/lib/typed.ts (existing typed system)
- packages/cssints/scripts/types.ts (preliminary work)
