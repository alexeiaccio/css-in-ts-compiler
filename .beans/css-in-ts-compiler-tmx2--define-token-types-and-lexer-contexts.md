---
# css-in-ts-compiler-tmx2
title: Define token types and lexer contexts
status: in-progress
type: task
priority: normal
created_at: 2026-03-01T12:25:50Z
updated_at: 2026-03-01T13:17:49Z
---

- [x] Create Token enum with 35+ token types
- [x] Define TokenValue interface
- [x] Create LexContext enum with 8 contexts
- [x] Create ParseError class using Effect TaggedError

## Summary of Changes
Implemented token types and lexer contexts in src/lexer/:
- token.ts: Token enum (35 types) + TokenValue interface
- contexts.ts: LexContext enum (Normal, ValueDef, Declaration, Selector, MediaQuery, Function, Url, TestMode)
- errors.ts: ParseError class using Effect TaggedError for type-safe error handling
