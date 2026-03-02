---
# css-in-ts-compiler-d8uu
title: 'Phase 1: Effect TS 4 Foundation'
status: completed
type: task
priority: normal
created_at: 2026-03-01T18:11:52Z
updated_at: 2026-03-01T20:54:27Z
parent: css-in-ts-compiler-tyre
---

Foundation work for Effect TS 4 migration.

## Tasks
- [x] Implement comprehensive error types: CssSyntaxError, ParseError, LexError (errors-effect.ts)
- [x] Convert existing Lexer class to Effect-based functions (lexer-effect.ts)
- [ ] Update from Effect beta to stable 4.x APIs
- [ ] Replace deprecated APIs (Option.fromNullable → Option.fromNullishOr)
- [ ] Add resource management with Effect.using

## Dependencies
- None (foundation work)
