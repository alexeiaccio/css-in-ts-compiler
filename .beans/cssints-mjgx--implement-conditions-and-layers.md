---
# cssints-mjgx
title: Implement conditions and layers
status: todo
type: task
tags:
    - wayfinder:task
created_at: 2026-09-29T14:17:14Z
updated_at: 2026-09-29T14:17:14Z
parent: cssints-vy0o
blocked_by:
    - cssints-euf0
---

## Question

Implement `docs/API.md` "Conditions and layers" (decided in cssints-kpq1). Blocked by the output pipeline decision, because the rule order inside a layer comes from the sorted sheet.

- [ ] `media` (string, several strings to a tuple, object to an object), `container`, `supports`, and pseudo-class wrappers from mdn-data `selectors.json`; wrappers nest
- [ ] Query strings checked by the twin against `<media-query-list>`, `<container-condition>` and `<supports-condition>` (extract those syntaxes); type-level check with the budget measured
- [ ] Layer = condition count, `_.a` to `_.e`; a fifth condition is a build error; class hash includes the condition chain
- [ ] Rules emitted under their conditions and layers; fixtures cover nesting, the layer cap, and a bad query
- [ ] The demo uses at least one media and one hover
