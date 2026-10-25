---
"cssints": minor
---

`cssints/clay`: `shadow({ x, y, blur, color })` is a shadow for an element — a renderer effect beside the declaration, since Clay 1.0 has no shadow field: the literal carries it as a sibling `shadow` key, `header()` prints nothing for it, and the desktop renderer draws it before the element's own command, keyed by Clay's element id. A state's overlay merges the fields it names, so `css.hover(css.shadow({ blur: 20 }))` keeps the base's offset and colour.
