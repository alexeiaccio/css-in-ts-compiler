---
# cssints-tn5i
title: Plugin modules cannot import Typed OM classes from cssints; no <image> value or CSSStyleValue export
status: in-progress
type: bug
priority: high
created_at: 2026-10-08T09:42:19Z
updated_at: 2026-10-08T10:37:40Z
---

Found by the tier-1 plugins (cssints-dk1q). Repros in cssints-ni5c and cssints-yb1w under "## Engine gaps".

- A plugin module outside node_modules that imports `CSSColorValue` (or any Typed OM class) from "cssints" is rejected by the import check. So the `tint` example in docs/API.md "Functions" fails as written (docs.mjs only type-checks it).
- cssints exports no `CSSStyleValue` base and no `<image>` value. fluid and gradient import `CSSStyleValue` from `@cssints/css-grammar/values` and subclass it.

## Todo
- [x] allow Typed OM imports from cssints in plugin modules (they are build-time values)
- [x] export CSSStyleValue (and an image value) from cssints
- [x] run the tint example through the engine in docs.mjs, not only tsgo
- [x] drop the @cssints/css-grammar dependency from fluid and gradient
