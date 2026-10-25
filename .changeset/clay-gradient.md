---
"cssints": minor
---

`cssints/clay`: `backgroundImage("linear-gradient(...)")` fills an element's box with a linear gradient — CSS's own grammar as one string: an optional direction (`<number>deg`, or `to top | to right | to bottom | to left`, 180deg by default) and two or more colour stops with an optional `<number>%`. A renderer effect beside the declaration, since Clay 1.0 has no gradient field: the literal carries it as a sibling `backgroundImage` key (`{ kind: "linear", angle, stops: [{ offset, color }] }`), `header()` prints nothing for it, the C targets keep their solid fill, and the desktop renderer fills the element's box instead of `backgroundColor`. A state may override the whole gradient, so `css.hover(css.backgroundImage(...))` lightens a card. Only linear gradients are drawn; radial, conic, repeating and `url()` are build errors.
