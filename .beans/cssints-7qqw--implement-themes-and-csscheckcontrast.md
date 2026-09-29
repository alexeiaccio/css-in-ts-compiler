---
# cssints-7qqw
title: Implement themes and css.check.contrast
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:51:59Z
updated_at: 2026-09-29T17:17:10Z
parent: cssints-vy0o
blocked_by:
    - cssints-79xr
---

## Question

Implement `docs/API.md` "Themes" (decided in cssints-exof). Blocked by the base token implementation.

- [ ] `createTokens(obj, name?)` for inline DTCG-shaped data: `$type` inherited through groups; leaves become tokens (`token.<type>` from cssints-o00x) reached by property access; values checked by the grammar of their type; `{path}` aliases with a type match and cycle detection
- [x] Alias output: the flattened literal in `@property initial-value`, plus `var()` on `:root`
- [x] `createGlobalTheme(tokens, condition | selector, overrides)`: typed overrides; output under the condition on `:root`, or under the selector; dependents of overridden tokens re-declared
- [x] `css.check.contrast(fg, bg, { min })`: WCAG 2.x over the defaults and every theme; below `min` is a build error naming the theme and values; an unevaluable value is a warning; the colour library is build-only (pick the smallest correct one)
- [x] Fixtures; the demo gets a dark theme and one contrast check

## Summary of Changes

- **createTokens** (src/theme.ts): DTCG-shaped data to named tokens by property access; `$type` inherited through groups; DTCG `color, dimension, number, duration, fontWeight` map to `color, length, number, time, number` (table in css-grammar token.ts `DTCG_TYPES`), other types are an error; DTCG object values and CSS strings, both checked by the grammar; `{path}` aliases with a type match and cycle detection; a mapper as second argument. Aliases: flattened literal in `@property`, live `:root{--a:var(--b)}`.
- **createGlobalTheme**: typed overrides (unknown path and bad value are type errors, and build errors); media on `:root`, container on `:where(*)` (a container query never matches `:root`, checked in Chrome: the item said `:root`, which does nothing), selector as is; aliases that depend on an overridden token are declared again in the block. Rules go in layer `_.k` after the globals, in source order (aliases, conditions, selectors).
- **css.check.contrast**: WCAG 2.x, defaults and every theme that touches fg or bg (or what they alias); error names the theme and both resolved values; `color-mix()`, relative colour, `light-dark()`, `currentColor`, translucent values are a warning naming the token. culori (`culori/fn`, 14 modes, 27 kB min / 9 kB gz), loaded only when a check runs, not in the client bundle. Runs after the module, and again at build end over all themes.
- A module has the rules of the tokens it uses, from wherever they were made (the imports with the attribute are stripped from the client, so a helper module's themes would otherwise never reach the sheet); a module that loses its last site drops its rules.
- Font-relative initial values stay a build error for createTokens too (`{ value: 1, unit: "rem" }` is one); docs/API.md example fixed to `16px`. A rem-to-px flatten with the live `:root` declaration would lift that; not done.
- Types in src/theme-types.ts (one export line in types.ts), type tests in test/types/themes.ts, fixtures themes-*.ts, test/themes.mjs. Demo: dark theme and one contrast check (apps/demo/src/theme.ts), colours switch in Chrome under `emulateMedia({ colorScheme: "dark" })`.
- runner.qnt: no flow change (theme rules travel through `record` like classes); the model still passes.
