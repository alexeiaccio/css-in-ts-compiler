---
# cssints-7fdc
title: Implement the 0.1 authoring surface in the engine
status: todo
type: task
tags:
    - wayfinder:task
created_at: 2026-09-29T13:53:19Z
updated_at: 2026-09-29T13:53:19Z
parent: cssints-vy0o
---

## Question

Make the engine match `docs/API.md` "Authoring surface" (decided in cssints-5dbi). The public types are the separate prototype ticket.

- [ ] plugin.mjs: find sites by `with { type: "cssints" }` on any import (cssints, other packages, local helper modules), not by the package name. A build error for a build-time member of cssints imported without the attribute; `cx`/`_cv` stay runtime.
- [ ] lib.mjs: names generated from the grammar property list (camelCase of every property in mdn.ts) plus the short set p/pt/pr/pb/pl, m/mt/mr/mb/ml, bg. Remove `items`, `justify` and the hand-written PROPS table.
- [ ] Spacing: a bare number is 0.25rem only in padding*, margin*, gap*, inset*. Elsewhere it is `String(n)`, checked by the twin.
- [ ] `flex()` / `grid()`: display plus chain methods from short hand-written lists (prefix dropped only for flex-*/grid-*), with a test against mdn-data `appliesto` that fails on drift. Remove nested-children composites and bare-member chains (`css.flex.items`); plain styles do not chain.
- [ ] Migrate the fixtures and apps/demo to the new surface; `bun run test` and the demo build pass.
