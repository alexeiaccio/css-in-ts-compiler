---
# cssints-eaob
title: Global rules, attr() and within()
status: completed
type: feature
priority: normal
created_at: 2026-10-03T10:34:14Z
updated_at: 2026-10-03T11:32:05Z
parent: cssints-co8y
blocked_by:
    - cssints-mbky
    - cssints-tuyw
---

## Question

Decided in cssints-635k:
- `css.global(selector, ...styles)`: the declarations typed as members take them (`css.global("body", m(0), fontFamily(t.font.body))`), emitted once in layer _.k (below every class layer, after kernels), the selector a string checked against the CSS selector grammar (mdn-data/webref has `<complex-selector-list>`; at least the twin at build time, the types if cheap), conditions allowed (`css.global(":root", media(dark)(colorScheme("dark")))`). Sky moves src/assets/base.css into it.
- `attr(name, value?)`: a condition wrapper like hover(): `attr("aria-current", "page")(color(t.color.accent))` gives `._x[aria-current=page]{…}`; counts as one condition for the layer; value quoting and the operators (=, ~=, ^= …) decided in the ticket.
- `within(condition)`: the state on a marked ancestor: `within(hover)(...)` gives `._g:hover ._x{…}` with a group marker class `_g` the author puts on the ancestor (`css.group` or a returned marker), like Tailwind's group-hover; decide the marker API and whether `:has()` is offered too.
Types, fixtures, API.md, bench within budget; sky uses attr() for the active nav item and within() where a card reacts to a hovered row.

## Summary of Changes

- **`css.global(selector, ...styles)`**: a rule with no class, recorded as an entry of the module's sheet (the `themed` map, key prefix `-:`), printed in layer `_.k` after the kernels and before the alias and theme rules, in source order. Declarations are merged like `cn()` (the later property wins) and checked like a class's (grammar, prose rules, support warnings); `media()`, `container()` and `supports()` wrap the rule, a state (`hover`, `attr`, `within`) or a plugin marker is an error at the call. The selector is checked at build time by `packages/css-grammar/src/selector.ts` (a recogniser over `<complex-selector-list>`), and in the types by `ValidSelector` (not empty, brackets and quotes pair up; about 180 instantiations a call).
- **`attr(name, value?, op?)`**: a condition like `hover`, `[name="value"]` (always quoted), the six operators, presence without a value; sorts after the pseudo-classes.
- **`group(name?)` and `within(state, name?)`**: `group()` is a style that adds the marker `_g` (`_g-name`), `within(hover)` is `:where(._g:hover) ._x`: one class of specificity, so the sheet's order decides; the ancestor's state sorts before the element's own. `:has()` is left out.
- `StateWrap` type for pseudo-class wrappers and `attr()`; `instrument.ts` treats `attr` and `within` bindings like `media` ones; class strings with a hyphenated marker reach the sheet.
- sky: `src/base.ts` (global rules) replaces `assets/base.css`; the nav item reads `aria-current=page` set by the router (no `useLinkState`, no `active` variant); the post's timestamp turns to full colour while the card is hovered (`group()` on the card, `within(hover)` on the time link). Chrome checks in `test/browser.mjs` (nav) and `test/posts-browser.mjs` (hover).
- Tests: `test/global.mjs` with fixtures, `test/types/state.ts`, `css-grammar/test/check-selector.ts`, `bench/state.ts` (budget entry), API.md section with checked blocks.
