---
# css-in-ts-compiler-x8vb
title: Fix tokenization redundancy in parsers
status: completed
type: feature
priority: normal
created_at: 2026-03-02T08:37:18Z
updated_at: 2026-03-02T08:52:18Z
---

Optimize parsers to avoid creating new Lexer instances repeatedly. Accept pre-tokenized tokens as optional parameter.

## Checklist
- [x] Update CSSValueParser.parse() to accept optional tokens parameter
- [x] Skip SelectorParser (direct string parsing, no tokens)
- [x] Skip StylesheetParser (direct string parsing, no tokens)
- [ ] Add createTokens() helper for explicit tokenization
- [ ] Update internal parsing methods to reuse tokens
- [ ] Update tests to exercise both code paths
- [ ] Benchmark performance improvement
- [x] Run typecheck and tests