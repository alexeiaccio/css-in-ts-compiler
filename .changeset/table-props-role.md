---
"@cssints/headless": patch
---

`TableProps` declares the `role: "table"` it has always returned.

The object `tableProps` has carried the role since 0.30.0 — that is what makes a `display: contents`
skin keep the table's place in the accessibility tree — but the interface left it out, so a skin
written in TypeScript could spread it and still not read it. No behaviour changes.
