---
# css-in-ts-compiler-tyre
title: Rewrite css-syntax package with Effect TS 4
status: completed
type: epic
priority: normal
created_at: 2026-03-01T18:11:20Z
updated_at: 2026-03-02T00:09:09Z
---

Complete rewrite of @cssints/css-syntax package with Effect TS 4 for proper error handling, parallelism, and full CSS Syntax spec compliance.

## Current State
- Package has solid performance foundation (Uint8Array O(1) character classification)
- Missing CSS Syntax Level 3 spec compliance
- Basic error handling (throws errors)

## Goals
1. Implement Effect TS 4 error handling with proper error types
2. Add parallelism for independent parsing tasks
3. Complete CSS Syntax spec compliance
4. Use Schema for AST definitions

## Key Areas
- packages/css-syntax/ rewrite
