---
# css-in-ts-compiler-lw5q
title: Implement CSS spec Unicode character rules
status: in-progress
type: task
priority: normal
created_at: 2026-03-01T12:25:49Z
updated_at: 2026-03-01T13:17:49Z
---

- [x] Implement isNameStartCodePoint
- [x] Implement isNameCodePoint
- [x] Implement isLetter with full Unicode support
- [x] Implement isNonAsciiDigit
- [x] Implement isDigit and isHexDigit helpers

## Summary of Changes
Implemented CSS spec Unicode character rules in src/lexer/unicode-rules.ts:
- Full support for name-start code points (ASCII + Unicode ranges)
- Name code points including digits and hyphens
- Letter detection for 50+ Unicode ranges (Latin, Greek, Cyrillic, Arabic, CJK, etc.)
- Non-ASCII digit support for 30+ scripts
- Helpers: isDigit(), isHexDigit()
- Fast path for ASCII (0-127), slow path for Unicode (128+)
