---
# cssints-kag5
title: 'Design-token constraints and math: DTCG 2025.10 and Ariakit Tailwind'
status: todo
type: task
tags:
    - wayfinder:research
created_at: 2026-09-29T14:29:55Z
updated_at: 2026-09-29T14:29:55Z
parent: cssints-vy0o
---

## Question

Design tokens by the spec (DTCG Format and Resolver 2025.10) can express more than a value: references between tokens, constraints, and computed values. Ariakit's Tailwind plugin (`@ariakit/tailwind`) is an example of constraints, e.g. layers whose text colour is derived to keep contrast. What of this should cssints tokens and themes model, and how?

- DTCG 2025.10 (format.json, resolver.json and the spec text): references/aliases, composite types, modes/sets/resolvers, anything like constraints or math. What is normative and what is only proposed.
- Ariakit Tailwind: how layers, contrast and derived colours work; the CSS it emits (`color-mix`, relative colours, `contrast-color()`, `@property`, custom-property chains); the browser support it needs.
- Other prior art worth a line: Open Props, Radix Colors/Themes, Panda tokens (conditions and semantic tokens), StyleX `defineVars`/`createTheme`, vanilla-extract `createThemeContract`.
- How that maps onto our model (a token is a Typed OM value `var(--x)`; `@property`; checked by the mdn grammar; build-time evaluation): which constraints can be checked at build time (for example a contrast ratio between two token values for each theme), which must stay in CSS (`calc()`, `color-mix()`, relative colour syntax), and what a typed API could look like.

Answer: findings in docs/research/design-tokens.md, and 2-3 options for tokens and themes in 0.1 with a recommendation.
