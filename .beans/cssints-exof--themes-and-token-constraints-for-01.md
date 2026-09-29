---
# cssints-exof
title: Themes and token constraints for 0.1
status: todo
type: task
tags:
    - wayfinder:grilling
created_at: 2026-09-29T14:46:45Z
updated_at: 2026-09-29T14:46:45Z
parent: cssints-vy0o
---

## Question

Decide the themes API and whether 0.1 has build-time constraints. The research (cssints-kag5, docs/research/design-tokens.md) found no constraints or math in DTCG 2025.10. Ariakit gets contrast from a table computed at build time plus relative colours in CSS.

Options from the research:
1. Typed tokens and themes from DTCG-shaped inline `const` data (`createTokens`, `createGlobalTheme` for a media query or a class), with no checks.
2. Option 1 plus `css.check.contrast(fg, bg, { min: 4.5 })`, checked for every theme at build time; a build-only colour library; a warning when a value cannot be evaluated. (Recommended by the research, in two steps.)
3. Option 2 plus derived tokens (`contrastColor()` in CSS, `derive()` at build time).

Also decide:
- alias initial values: `@property` needs a computationally independent literal, so flatten it and keep a live `var()` declaration; re-declare dependents per theme when a theme is a wrapper class
- where DTCG data comes from (an inline const object, or JSON with codegen for literal types)
- fixing the Themes draft in docs/API.md (`@media { --x }` without `:root`; `initial-value: unset` is not a `<color>`)
