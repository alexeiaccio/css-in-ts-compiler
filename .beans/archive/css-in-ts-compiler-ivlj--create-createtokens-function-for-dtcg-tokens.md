---
# css-in-ts-compiler-ivlj
title: Create createTokens function for DTCG tokens
status: completed
type: feature
priority: normal
created_at: 2026-02-19T09:18:41Z
updated_at: 2026-02-19T09:34:44Z
---

Implement createTokens that takes DTCG-compliant JSON and returns typed token objects. Include full type inference from JSON structure with $type support, options for prefix/separator, and CSS @property generation.



## Summary of Changes

### New Files
-  - Main createTokens function with DTCG format support
-  - DTCG specification type definitions
-  - DTCG to CSS type mappings
-  - Recursive token tree walker
-  - 20 comprehensive tests

### Features
- **DTCG format support**: $type, $value, $description, $extensions
- **Type inheritance**: $type cascades from parent groups to tokens
- **Runtime type detection**: Auto-detects types from values when $type not specified
- **Options**:
  - prefix: CSS variable prefix (e.g., 'app' → --app-colors-primary)
  - separator: Path separator (default: '-')
  - transform: Custom name mapping function
  - generateProperty: Generate @property rules (default: true)
  - inherits: Default inheritance for tokens (default: true)
- **Token objects**: String-like objects with metadata (, , , , etc.)
- **CSS generation**: generatePropertyCSS(), generateTokenCSS(), generateCSS()
- **Registry**: Global token registry with clearTokenRegistry(), getRegisteredTokens(), getToken()

### Type Inference
- Uses TypeScript 'as const' for full type inference from JSON structure
- Maps DTCG types (color, dimension, duration, etc.) to CSS types
- Template literal types preserve path structure

### Example Usage


All 20 tests passing.
