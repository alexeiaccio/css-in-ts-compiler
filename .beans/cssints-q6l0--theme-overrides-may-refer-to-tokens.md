---
# cssints-q6l0
title: Theme overrides may refer to tokens
status: completed
type: feature
priority: normal
created_at: 2026-10-02T14:44:23Z
updated_at: 2026-10-02T14:52:57Z
parent: cssints-co8y
---

## Question

A `createGlobalTheme` override takes plain values only: `"{radius.sm}"` fails as "is not a <length>" and `"oklch(0.7 0.1 {hue.accent})"` as "is not a <color>" (found in cssints-uifu, which worked around it with number tokens). Allow a whole-value reference and references inside a CSS value in overrides, as createTokens does since cssints-5y5a: the override declares `var(--target)` (live), dependents of the overridden token are re-declared as today, a reference to a token of another type or to no token is an error (types and build), cycles across the base set and the theme are errors. Types: the same Subst check as tokens. Fixture, type tests, API.md.

## Summary of Changes

- `createGlobalTheme` overrides take `{path}` references, as the whole value or inside a CSS value (theme.ts `walk`). The theme declares `var(--target)`; the grammar check reads the targets' literals. Tokens derived from an overridden token are declared again as before. Declaration order does not matter (one rule is one element, `var()` reads that element's own values).
- Build errors: reference to no token, whole-value reference to a token of another type, value not of the token's type after substitution, a circle through the base tokens and the theme.
- Types (theme-types.ts `CheckRefs`, `SubstIn`, `KindIn`): the same sentinel substitution as `Subst`; references are paths of the `tokens` argument (give the root, not a group).
- Tests: test/derived.mjs with fixtures theme-refs*.ts, type tests in test/types/themes.ts, API.md Themes bullet and example. docs/research/mu-design.md: the dim theme writes `oklch(.. {hue.accent})` instead of `accentTone` numbers.
- Cost: +819 instantiations in files that import the cssints types (0.1 to 1.7%), inside the 10% budget; budgets not changed.
