---
# cssints-wpuv
title: 'Tokens: rem values, timing-function and shadow types, TS2589 on large sets, theme @property leak'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-08T09:42:20Z
updated_at: 2026-10-08T10:18:11Z
---

Found by @cssints/tokens (cssints-0gll, repros under "## Engine gaps").

1. `rem` values are rejected in tokens: Open Props' rem radii were converted at 16px, rem/ch sizes, font sizes and letter spacings left out.
2. No token type for timing functions or shadows: easings and shadows ship as CSS strings and cannot be themed.
3. About 766 tokens in one createTokens call hits TS2589: Radix solid and alpha are separate sets. About 7k instantiations per colour token.
4. A module that imports the module calling createGlobalTheme gets the @property rule of every token the theme sets.

## Todo
- [x] rem in dimension tokens
- [ ] cubicBezier/transition and shadow token types (DTCG has both)
- [ ] cheaper token types for large sets
- [ ] themes register @property only for used tokens
