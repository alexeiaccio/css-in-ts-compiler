---
# cssints-kag5
title: 'Design-token constraints and math: DTCG 2025.10 and Ariakit Tailwind'
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-29T14:29:55Z
updated_at: 2026-09-29T14:46:01Z
parent: cssints-vy0o
---

## Question

Design tokens by the spec (DTCG Format and Resolver 2025.10) can express more than a value: references between tokens, constraints, and computed values. Ariakit's Tailwind plugin (`@ariakit/tailwind`) is an example of constraints, e.g. layers whose text colour is derived to keep contrast. What of this should cssints tokens and themes model, and how?

- DTCG 2025.10 (format.json, resolver.json and the spec text): references/aliases, composite types, modes/sets/resolvers, anything like constraints or math. What is normative and what is only proposed.
- Ariakit Tailwind: how layers, contrast and derived colours work; the CSS it emits (`color-mix`, relative colours, `contrast-color()`, `@property`, custom-property chains); the browser support it needs.
- Other prior art worth a line: Open Props, Radix Colors/Themes, Panda tokens (conditions and semantic tokens), StyleX `defineVars`/`createTheme`, vanilla-extract `createThemeContract`.
- How that maps onto our model (a token is a Typed OM value `var(--x)`; `@property`; checked by the mdn grammar; build-time evaluation): which constraints can be checked at build time (for example a contrast ratio between two token values for each theme), which must stay in CSS (`calc()`, `color-mix()`, relative colour syntax), and what a typed API could look like.

Answer: findings in docs/research/design-tokens.md, and 2-3 options for tokens and themes in 0.1 with a recommendation.

## Resolution

Findings: [docs/research/design-tokens.md](../docs/research/design-tokens.md).

- **DTCG 2025.10 has no constraints and no math.** It is a static format (types, aliases, groups, `$extensions`, and a resolver with sets and modifier contexts). Its only checks are type validity, alias type match and no cycles. Colour functions, arithmetic, contrast rules and conditional values are open issues (#88, #224, #268), not spec. Our own extras belong in `$extensions`.
- **Ariakit Tailwind does not use `contrast-color()`.** It builds layers from chains of relative colours (`oklch(from …)`) and `calc/clamp/round/mod/sign`, reads the parent layer with an odd/even custom-property pair, and gets text contrast from a 32-row WCAG table computed in JS at plugin build time and matched with `@container style()`. Its floor is about Chrome 138, Firefox 151, Safari 18. Only `ak-ink` claims AA.
- **Build time vs CSS.** The compiler can check types, alias graphs, theme completeness, and a contrast ratio for token pairs with static values in each theme. Derived colours, `calc`, and anything that depends on nesting or runtime overrides stay in CSS.
- **Hard limits found:** `@property` `initial-value` must be computationally independent (aliases need a flattened literal plus a live `var()` declaration, and theme blocks must re-declare dependents); our `<color>` grammar rejects relative colour, `contrast-color()` and `if()`; culori and Color.js parse literals but not `color-mix()` or relative colour strings; JSON imports lose literal types in TypeScript.
- **Recommendation: Option 2.** Typed tokens and themes from DTCG-shaped data, then one build-time check, `css.check.contrast`, per theme. Derived tokens and colour helper functions are out of 0.1; fix the grammar gap instead.
- Follow-ups: implement tokens/themes with alias flattening; extend the `<color>` grammar; fix the API.md Themes draft (invalid top-level `@media` declarations, `initial-value: unset`).
