---
# cssints-kpq1
title: 'Conditions and layers: media(), pseudo-classes, @layer _.a.._.e'
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T14:17:14Z
parent: cssints-vy0o
blocked_by:
    - cssints-5dbi
---

## Question

Nothing is implemented: every rule goes to `@layer _.a`.

- API: `media(query)` returning a wrapper (`md(css.pl("8ch"))`), several queries at once, pseudo-classes (`hover(...)`), nesting (`md(hover(...))`).
- Layer rule: which condition depth maps to which layer, and what happens past `_.e`.
- Is the media query string checked by the same recognizer (mdn has at-rule grammars)?
- The class name must include the condition in its hash.

## Resolution
Written up in `docs/API.md`, section "Conditions and layers".
- **Form:** wrapper functions that nest. `media(q)`, `media(q1, q2)` returning a tuple, or `media({ md: q1, lg: q2 })` returning an object. Also `container(q)`, `supports(q)`, and pseudo-class wrappers named after the selector (`hover`, `focusVisible`), with the list from mdn-data `selectors.json`.
- **Queries** are checked against the mdn grammars `<media-query-list>`, `<container-condition>` and `<supports-condition>`, in types and at build time.
- **Layer = number of conditions** (`_.a` to `_.e`); a fifth is a build error. Every condition kind counts as one. Order inside a layer comes from the sorted sheet. Class hashes include the condition chain.
- **In 0.1:** media, pseudo-classes, container and supports. Pseudo-elements and parent states are fog.
