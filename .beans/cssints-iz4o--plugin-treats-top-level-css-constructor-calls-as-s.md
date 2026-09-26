---
# cssints-iz4o
title: Plugin treats top-level CSS.* constructor calls as style sites
status: todo
type: bug
created_at: 2026-09-26T10:30:07Z
updated_at: 2026-09-26T10:30:07Z
parent: cssints-tmv8
blocked_by:
    - cssints-hdui
---

From cssints-bqy4. In a module that imports `CSS` from `cssints`, `const x = CSS.rem(1)` at top level fails with "site 0 ... did not produce a css.* or cv() value". `plugin.mjs` instrumentation wraps every call rooted in a `cssints` import. `CSS.*` inside a `css.*` call works, and so does `new CSSColorValue(...)`.

- [ ] Instrument only style members (`css.*`, property functions, `cv`), not value constructors (`CSS`, `CSSUnitValue`, `CSSColorValue`); extend the existing `RUNTIME_ONLY` idea rather than adding a second mechanism
- [ ] A fixture with a top-level `CSS.rem(1)` token used in a later `css.p(...)`
- [ ] Blocked by cssints-hdui only because both edit plugin.mjs

Related, lower priority: the type error for a bad typed part is reported on the first argument, not on the offending part.
