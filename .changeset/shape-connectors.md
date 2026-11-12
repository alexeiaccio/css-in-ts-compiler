---
"@cssints/css-grammar": minor
"cssints": minor
---

`shape()` and `border-shape` are in the grammar (webref's `border-shape`, and `shape()` in `<basic-shape>`, so
`clip-path`, `shape-outside` and `offset-path` take it too), with the commands checked by the build rather than the call
grammar, and a support warning for the two Chrome-only keys. `shapePath()` (`@cssints/css-grammar/shape`) turns the same
value into SVG path data, the fallback for the browsers without the property; the board's `line: "shape"` edge is one
string drawn both ways.
