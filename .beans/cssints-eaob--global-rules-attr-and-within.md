---
# cssints-eaob
title: Global rules, attr() and within()
status: todo
type: feature
priority: normal
created_at: 2026-10-03T10:34:14Z
updated_at: 2026-10-03T10:34:14Z
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
