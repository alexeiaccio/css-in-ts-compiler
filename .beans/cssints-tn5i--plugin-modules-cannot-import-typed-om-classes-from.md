---
# cssints-tn5i
title: Plugin modules cannot import Typed OM classes from cssints; no <image> value or CSSStyleValue export
status: completed
type: bug
priority: high
created_at: 2026-10-08T09:42:19Z
updated_at: 2026-10-08T10:58:29Z
---

Found by the tier-1 plugins (cssints-dk1q). Repros in cssints-ni5c and cssints-yb1w under "## Engine gaps".

- A plugin module outside node_modules that imports `CSSColorValue` (or any Typed OM class) from "cssints" is rejected by the import check. So the `tint` example in docs/API.md "Functions" fails as written (docs.mjs only type-checks it).
- cssints exports no `CSSStyleValue` base and no `<image>` value. fluid and gradient import `CSSStyleValue` from `@cssints/css-grammar/values` and subclass it.

## Todo
- [x] allow Typed OM imports from cssints in plugin modules (they are build-time values)
- [x] export CSSStyleValue (and an image value) from cssints
- [x] run the tint example through the engine in docs.mjs, not only tsgo
- [x] drop the @cssints/css-grammar dependency from fluid and gradient

## Summary of Changes

- Root cause: the import check in `instrument.ts` ran the same way in the ssr transform (the Module Runner, build time) as in the client one, so a plugin module, which only the runner loads, could not import a Typed OM class from "cssints" without the attribute. `instrument(code, id, client)`: in ssr, `CSS`, `CSSStyleValue`, `CSSUnitValue`, `CSSColorValue` and `CSSImageValue` (real exports of the eval-time library) pass plainly; the client check is unchanged (runtime.ts has none of them; with the attribute a constructor is a site).
- `cssints` exports `CSSStyleValue` and `CSSImageValue` (new in css-grammar values.ts, an `<image>` text) from `types` and `default`, and on `css.*`.
- plug-kit.ts imports `CSSColorValue` from "cssints"; plugins.mjs checks that the same module is still rejected in the client. docs.mjs runs the `tint`/`step` block of API.md through the engine.
- fluid and gradient import from `cssints` and drop `@cssints/css-grammar`; dist rebuilt; API.md Functions bullet, wayfinder entry.
- perf: instrument() per module unchanged within noise (A/B on 200 modules).
