---
"cssints": minor
"@cssints/devtools": minor
"@cssints/placeholder": minor
---

`cx` is gone: `cn(...)` takes runtime values (`cn(base, on && p(4), props.class)`); the styles in them are class strings made at build time, and a style replaces the classes it overrides while it is active. Importing `cx` is a build error.
