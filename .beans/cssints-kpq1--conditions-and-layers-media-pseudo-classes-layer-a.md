---
# cssints-kpq1
title: 'Conditions and layers: media(), pseudo-classes, @layer _.a.._.e'
status: todo
type: task
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:28:04Z
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
