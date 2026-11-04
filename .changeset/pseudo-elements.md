---
"cssints": minor
---

Pseudo-elements are wrappers: `css.before(...)`, `css.after(...)`, `css.placeholder(...)`, `css.selection(...)`, `css.markerElement(...)` and the rest of the standard set without arguments, from mdn-data. They join the element itself, so they are the innermost condition — `hover(before(...))` is `.k:hover::before`, and the other order is a build error at its call. `::marker` is also the `marker` property, so its wrapper is `markerElement`, as a function named like a pseudo-class takes `Fn`. A pseudo-element that paints still needs its `content`, as in CSS.
