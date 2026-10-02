---
# cssints-5y5a
title: Derived tokens and JSON token input
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-10-02T09:06:46Z
updated_at: 2026-10-02T12:03:20Z
parent: cssints-9js6
---

## Question

From the 0.1 fog (cssints-exof) and what surface() showed: (1) derived tokens: a token defined from another (`derive(t.color.brand, (c) => ...)` computed at build time with culori, or emitted as CSS `color-mix()`/relative colour/`contrast-color()` so a theme change propagates); which, how typed, how themes interact (a derived token must follow its source when a theme overrides the source). (2) JSON token input: read DTCG 2025.10 JSON (`createTokens(json)` or an import of a .tokens.json) with generated or inferred types. Decide the shape with the user, then an implementation ticket.

## Summary of Changes

Done by the coordinator (subagents were down). Decided with the user: derived tokens are references inside a CSS value, and createTokens takes an imported DTCG JSON.

- **Derived:** a `$value` like `"color-mix(in oklab, {color.accent}, black 15%)"` or `"calc({space.md} * 2)"` (theme.ts). The `@property` initial value takes the targets' flattened literals (an initial value cannot hold var(); `color-mix(in oklab, #2563eb, black 15%)` is computationally independent); the `:root` rule keeps var(); TokenSet.aliases generalised to `{ name, targets, css }`, so a theme of any target re-declares every derived token through chains (`ring` from `hover` from `accent`). Needs a `$type`. Missing reference and cycles are build errors.
- **Types (theme-types.ts):** each `{path}` is replaced by the sentinel of the target's type (`⟨color⟩`) and the string is checked by the type's grammar; a missing path is a type error. tsgo and tsc 5.9.
- **JSON:** a JSON import widens `$type` to `string`; then the tree is typed (a wrong path is a type error) and the values are checked at build time only. No runtime change was needed: createTokens already took any DTCG-shaped object.
- **check.contrast:** a derived colour is a value it cannot read (color-mix, relative colour), so it warns; not extended (culori does not parse color-mix).
- **Tests:** test/derived.mjs (initial values, live values, chains, theme re-declaration, missing reference, JSON with DTCG object forms) and test/types/themes.ts. The engine's existing rules caught two fixture mistakes on the way (two modules declaring one variable differently; `rem` in an initial value). API.md Tokens/Themes updated.
