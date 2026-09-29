---
# cssints-5dbi
title: 'Public API shape for 0.1: imports, names, numbers, composites'
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:53:19Z
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

## Decided so far (grilling)
- Names: full camelCase for every mdn property plus a fixed short set (p/pt/pr/pb/pl, m/mt/mr/mb/ml, bg, items, justify); both named exports and `css.*`.
- Numbers: a bare number means 0.25rem steps, only in padding*, margin*, gap*, inset* (p(4) = 1rem). Elsewhere a number is CSS `<number>`. A configurable step is fog.
- Parts: variadic parts (`border("1px solid", accent)`); one string is the special case.
- Import: `with { type: "cssints" }` is THE marker of compile-time code, for cssints itself, plugin-icon and local helper modules alike. The plugin finds sites by the attribute, not by the package name. Runtime helpers (`cx`, `_cv`) are imported without it; using a compile-time member without the attribute is a build error with a clear message. Checked: tsc 5.9 and tsgo accept it with module preserve/esnext (nodenext only in ESM files), oxc-parser exposes `attributes`, the Module Runner fixture and the apps/demo build pass, and the attribute does not reach the bundle.
- Composites: chaining only on layout contexts. `flex()` and `grid()` set display and expose only their own container properties; plain styles do not chain and merge with `cn(...)`. Lists are short and hand-written, and a test compares them with mdn-data `appliesto`, since mdn misses align-items/justify-items/place-items (`allElements`) and adds overflow/dominant-baseline/reading-*. `justify-items` is on grid, not flex. Item properties (flexGrow, alignSelf, gridColumn, order) stay plain functions; an `item()` context is fog.
- Chain names drop only the context prefix: `flex().direction/wrap/flow`, `grid().templateColumns/templateRows/templateAreas/template/autoFlow/autoColumns/autoRows`; everything else keeps its full name (`alignItems`, not `align`, which could mean items or content).
- `items` and `justify` are removed from the top-level short set for the same reason.

## Resolution
The authoring surface is written up in `docs/API.md`, section "Authoring surface", and the examples there are updated:
- `with { type: "cssints" }` marks build-time code.
- Full camelCase names plus `p/m/bg` shorthands.
- A bare number is a 0.25rem step in spacing properties only.
- Values are variadic string or Typed OM parts.
- `flex()`/`grid()` are the only chainable contexts, and their method names drop only the prefix.
Implementation: cssints-7fdc.
