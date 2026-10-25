---
"cssints": minor
---

`sx()`: one style built by chaining properties, with no `cn()`. Every property is a method, `.flex()` and `.grid()` with no argument set `display`, and a chain sets each property once — a second `bg` is a type error (a shorthand and its longhand stay legal, as in `cn()`). `cn()` is still the tool for runtime values and `cv()` variants.
