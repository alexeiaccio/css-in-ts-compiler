---
# cssints-izcy
title: A value member that returns a template literal is rejected by the property's grammar in the types
status: completed
type: bug
priority: normal
created_at: 2026-10-09T09:12:41Z
updated_at: 2026-10-09T12:38:36Z
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

## Summary of Changes

Root cause: fn() types the result as `R extends string | CSSStyleValue`, so TypeScript keeps the literal or template type of a string result; the grammar then checks that text. The table form already widened. Fix: `Opaque<R>` in `MemberOf` (scope.ts) maps each string part of the result to `string` for both forms; a Typed OM value keeps its type. Type tests in packages/cssints/test/types/scope.ts (template literal in color and width, literals, a Typed OM still rejected by width, a mixed result). Budgets: about +6 (tsc) / +10 (tsgo) on plugin benches, none updated. The ': string' workaround is removed from the cssints-plugin skill; docs/API.md 'Typed or opaque' names template literals; wayfinder entry added.
