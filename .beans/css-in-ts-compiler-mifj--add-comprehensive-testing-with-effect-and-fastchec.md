---
# css-in-ts-compiler-mifj
title: Add comprehensive testing with Effect and FastCheck
status: todo
type: feature
priority: high
created_at: 2026-03-02T08:40:02Z
updated_at: 2026-03-02T08:40:02Z
---

Add comprehensive test coverage for css-syntax package using Vitest, Effect testing utilities, and FastCheck for property-based testing.

## Checklist
- [ ] Install fastcheck and @effect/vitest dependencies
- [ ] Create test utils for Effect-based parsing (Effect.runSync, Effect.either)
- [ ] Add property-based tests for lexer (round-trip tokenization)
- [ ] Add property-based tests for CSS value parser (parse + generate = identity)
- [ ] Add property-based tests for selector parser (parse + generate = identity)
- [ ] Add property-based tests for stylesheet parser
- [ ] Add edge case tests for error handling
- [ ] Add fuzz tests for Unicode support
- [ ] Update test configs for FastCheck
- [ ] Benchmark performance before/after changes
- [ ] Run full test suite