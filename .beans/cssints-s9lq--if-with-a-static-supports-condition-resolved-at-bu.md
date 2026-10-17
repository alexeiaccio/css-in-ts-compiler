---
# cssints-s9lq
title: if() with a static supports() condition resolved at build time
status: scrapped
type: feature
priority: normal
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-10-17T10:24:17Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 4, class A (partly). Chrome and Edge 137 ship if(); Firefox and Safari do not.

- [ ] scope: only conditions the build knows (supports(), the targets of the browserslist); style(), media() and attr() tests stay runtime and the plugin then does nothing
- [ ] decide the surface: a value fn() `when(supports(...), a, b)` or a lowering of a real if() in a declaration
- [ ] tests against Chrome (native if) and the build output for old targets, docs, changeset

## Reasons for Scrapping

Checked on 2026-10-17. A choice that depends on `supports()` is already made by `css.supports("(display: grid)")(...)` (an @supports block, which the browser evaluates) and by `firstThatWorks(wanted, ...fallbacks)` for one value (docs/API.md, 'Fallbacks'). A raw `if()` in a string part is accepted and its condition shape is checked (docs/API.md, line 294). Resolving `if(supports(...))` at build time would only restate what the browserslist targets say, and the browser still has to evaluate the `@supports` it replaces. Chrome 155 takes `if()` natively (checked); the `style()`, `media()` and `attr()` tests are runtime and stay so. Nothing left for a plugin.
