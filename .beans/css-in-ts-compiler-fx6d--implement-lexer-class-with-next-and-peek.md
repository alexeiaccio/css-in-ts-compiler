---
# css-in-ts-compiler-fx6d
title: Implement Lexer class with next() and peek()
status: in-progress
type: task
priority: normal
created_at: 2026-03-01T12:25:51Z
updated_at: 2026-03-01T13:17:50Z
---

- [x] Implement next() with context-sensitive tokenization
- [x] Implement peek() for lookahead
- [x] Implement skipWs() using unicode-rules.isWhitespace()
- [x] Implement scanIdent() for identifiers and keywords
- [x] Implement scanNumber() for numbers, dimensions, percentages
- [x] Implement scanStringToken() for string literals
- [x] Implement scanComment() for CSS comments
- [x] Implement scanMetaChar() for operators and delimiters
- [x] Add error handling with ParseError

## Summary of Changes
Implemented main Lexer class in src/lexer/lexer.ts:
- Character access methods: charCodeAt(), charCode(), nextCharCode()
- Position tracking: getPos(), get length()
- Main tokenization: next(ctx) with context support
- Lookahead: peek(ctx)
- Scanner methods: skipWs(), findWsEnd(), eat()
- Token scanners: scanIdent(), scanNumber(), scanStringToken(), scanComment(), scanMetaChar()
- Token classification: scanMetaChar() for operators

**Current Status**: 
- ✅ Lexer class implemented with all core methods
- ✅ Char table created with Uint8Array
- ⚠️ Unicode rules file has duplicate declarations (needs cleanup)
- ⚠️ errors.ts has import path issue (needs import fix)
- ⚠️ Token type import issues (type imports)

**Next Steps**:
1. Clean up unicode-rules.ts to remove duplicates
2. Fix errors.ts import path for Effect
3. Run typecheck to verify clean build

## File Structure Created
- src/lexer/
  - char-table.ts ✓
- unicode-rules.ts (needs cleanup)
- token.ts (needs type fix)
- contexts.ts ✓
- errors.ts (needs import fix)
- lexer.ts ✓
- [x] Implement next() with context-sensitive tokenization
- [x] Implement peek() for lookahead
- [x] Implement skipWs() using unicode-rules.isWhitespace()
- [x] Implement scanIdent() for identifiers and keywords
- [x] Implement scanNumber() for numbers, dimensions, percentages
- [x] Implement scanStringToken() for string literals
- [x] Implement scanComment() for CSS comments
- [x] Implement scanMetaChar() for operators and delimiters
- [x] Add error handling with ParseError

## Summary of Changes
Implemented main Lexer class in src/lexer/lexer.ts:
- Character access methods: charCodeAt(), charCode(), nextCharCode()
- Position tracking: getPos(), get length()
- Main tokenization: next(ctx) with context support
- Lookahead: peek(ctx)
- Scanner methods: skipWs(), findWsEnd(), eat()
- Token scanners: scanIdent(), scanNumber(), scanStringToken(), scanComment()
- Token classification: scanMetaChar() for operators

**Note**: Type errors remaining in errors.ts (effect import) and unicode-rules.ts (CHAR_TABLE references). Core lexer logic is implemented.

## Remaining work for Phase 1
- Fix type errors in errors.ts (effect import path)
- Clean up unicode-rules.ts CHAR_TABLE references
- Write comprehensive tests
- Run benchmarks
