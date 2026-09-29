---
# cssints-7qqw
title: Implement themes and css.check.contrast
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:51:59Z
updated_at: 2026-09-29T17:00:43Z
parent: cssints-vy0o
blocked_by:
    - cssints-79xr
---

## Question

Implement `docs/API.md` "Themes" (decided in cssints-exof). Blocked by the base token implementation.

- [ ] `createTokens(obj, name?)` for inline DTCG-shaped data: `$type` inherited through groups; leaves become tokens (`token.<type>` from cssints-o00x) reached by property access; values checked by the grammar of their type; `{path}` aliases with a type match and cycle detection
- [x] Alias output: the flattened literal in `@property initial-value`, plus `var()` on `:root`
- [ ] `createGlobalTheme(tokens, condition | selector, overrides)`: typed overrides; output under the condition on `:root`, or under the selector; dependents of overridden tokens re-declared
- [ ] `css.check.contrast(fg, bg, { min })`: WCAG 2.x over the defaults and every theme; below `min` is a build error naming the theme and values; an unevaluable value is a warning; the colour library is build-only (pick the smallest correct one)
- [ ] Fixtures; the demo gets a dark theme and one contrast check
