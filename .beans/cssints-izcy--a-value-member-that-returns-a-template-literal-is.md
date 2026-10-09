---
# cssints-izcy
title: A value member that returns a template literal is rejected by the property's grammar in the types
status: in-progress
type: bug
priority: normal
created_at: 2026-10-09T09:12:41Z
updated_at: 2026-10-09T12:29:58Z
---

Found by cssints-zayr. docs/API.md says a string that `value` returns is opaque to the types, but a template literal is inferred as its template type, which the grammar of the property rejects in the user's code, although the build accepts it:

```ts
shade: fn({
  args: ["<color>", { "by?": "<percentage>", "dark?": arg<boolean>() }],
  value: ([c, { by = "10%", dark }]) => `color-mix(in oklab, ${c}, ${dark ? "black" : "white"} ${by})`,
}),
// user code: color(shade("red", { dark: true }))  -> TS2345: color: unexpected "color-mix(in" ...
```

Annotating the result (`([c, ...]): string => ...`) works. Fix: widen a string result to `string` in the member's type, or say so in docs/API.md ("Typed or opaque").
