---
"cssints": minor
---

`createTokens` takes a leaf as its value when the group's `$type` is in scope: `color: { $type: "color", bg: "#fff", link: "{color.accent}" }`, the form a theme's overrides already take. A string is a value of the group's type and a number one for `number` and `fontWeight`; a DTCG object value, or a token with its own `$type`, `$description` or `$extensions`, keeps `{ $value }`. A value with no `$type` in scope is an error in the types and at build time.
