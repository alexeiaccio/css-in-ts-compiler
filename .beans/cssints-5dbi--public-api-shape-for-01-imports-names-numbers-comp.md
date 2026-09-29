---
# cssints-5dbi
title: 'Public API shape for 0.1: imports, names, numbers, composites'
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:40:09Z
parent: cssints-vy0o
---

## Question

Pin down the authoring surface before types are generated for it.

- Import: plain `import { p } from "cssints"` (works today) or `with { type: "cssints" }` from API.md? Should the plugin require the attribute to find sites?
- Names: full camelCase for every property (`paddingLeft`), plus which shorthands (`p`, `pl`, `bg`, `items`, `justify`)? Is there a namespace (`css.p`), named exports, or both?
- Numbers: `p(4)` is 1rem in the engine, but API.md shows 0.5rem for `p(4)` and for `p(2)`. Which spacing scale applies, to which properties, and can it be configured?
- Parts: variadic parts (`border("1px solid", accent)`), a single string, or both? This ties to the typed-parts decision (`cssints-bqy4`).
- Composites: `css.flex(...children)` sets `display:flex` plus its children. Are there other composites, and are they worth it?

Output: a short API spec section in `docs/API.md` that replaces the outdated parts.
