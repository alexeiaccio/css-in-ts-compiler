---
# cssints-wpuv
title: 'Tokens: rem values, timing-function and shadow types, TS2589 on large sets, theme @property leak'
status: completed
type: feature
priority: normal
created_at: 2026-10-08T09:42:20Z
updated_at: 2026-10-08T12:32:34Z
---

Found by @cssints/tokens (cssints-0gll, repros under "## Engine gaps").

1. `rem` values are rejected in tokens: Open Props' rem radii were converted at 16px, rem/ch sizes, font sizes and letter spacings left out.
2. No token type for timing functions or shadows: easings and shadows ship as CSS strings and cannot be themed.
3. About 766 tokens in one createTokens call hits TS2589: Radix solid and alpha are separate sets. About 7k instantiations per colour token.
4. A module that imports the module calling createGlobalTheme gets the @property rule of every token the theme sets.

## Todo
- [x] rem in dimension tokens
- [x] cubicBezier/transition and shadow token types (DTCG has both)
- [x] cheaper token types for large sets
- [x] themes register @property only for used tokens

## Summary of Changes
- rem/em/ch/ex/lh/cap/ic token values: `@property` initial value in px at 16px, the value itself on `:root` (`:where(*)` when not inherited).
- New token types `easingFunction` (DTCG cubicBezier) and `shadow` (DTCG shadow, `<shadow>#`), `syntax: "*"`.
- Themes register `@property` only for the tokens a module uses.
- Hex colour tokens skip the colour grammar walk in the types: Radix light 2.8M -> 31k instantiations (bench/palette.ts).
- @cssints/tokens regenerated: Open Props rem/ch/em sizes, font sizes, letter spacings; easings, springs and shadows as typed tokens.
- The agent was cancelled before its last cleanup; an uncommitted lint-only refactor of `inPx` (which broke rem) was discarded, the wayfinder entry and this summary added by the coordinator.
