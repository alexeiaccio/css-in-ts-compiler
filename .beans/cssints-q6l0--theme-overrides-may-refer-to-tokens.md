---
# cssints-q6l0
title: Theme overrides may refer to tokens
status: todo
type: feature
created_at: 2026-10-02T14:44:23Z
updated_at: 2026-10-02T14:44:23Z
parent: cssints-co8y
---

## Question

A `createGlobalTheme` override takes plain values only: `"{radius.sm}"` fails as "is not a <length>" and `"oklch(0.7 0.1 {hue.accent})"` as "is not a <color>" (found in cssints-uifu, which worked around it with number tokens). Allow a whole-value reference and references inside a CSS value in overrides, as createTokens does since cssints-5y5a: the override declares `var(--target)` (live), dependents of the overridden token are re-declared as today, a reference to a token of another type or to no token is an error (types and build), cycles across the base set and the theme are errors. Types: the same Subst check as tokens. Fixture, type tests, API.md.
