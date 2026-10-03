---
# cssints-635k
title: Global rules and attribute or parent-state selectors
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-10-02T15:34:14Z
updated_at: 2026-10-03T10:34:14Z
parent: cssints-co8y
---

## Question

Found building sky (cssints-dqw8): (1) there is no API for global rules (`body` margin, `*` box-sizing, `:root { color-scheme }` per theme); sky keeps them in plain CSS. `addGlobal` exists internally (layer _.k). (2) no attribute or parent-state selectors: an active nav item needs `useLinkState` plus a `cv()` variant instead of `[aria-current=page]`, and a card cannot react to a hovered parent. Decide with the user: a public `css.global(selector, style)` (typed selectors? which layer?), attribute and ancestor conditions as wrappers next to the pseudo-classes (`attr('aria-current', 'page')`, `within(hover)` / `:has()`), or neither. Then an implementation ticket.

## Resolution (with the user, 2026-10-03)

- `css.global(selector, style)`: typed declarations as members take them, the rule in layer _.k (below every class), the selector a string checked by the selector grammar; sky moves base.css there.
- `attr(name, value?)` and `within(condition)` as condition wrappers next to the pseudo-classes: `attr("aria-current", "page")(...)` gives `[aria-current=page]` on the element; `within(hover)(...)` gives the state on a marked ancestor (a group marker class, like Tailwind's group-hover).
Implementation: "Global rules, attr() and within()".
