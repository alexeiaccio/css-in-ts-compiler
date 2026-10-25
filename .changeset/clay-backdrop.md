---
"cssints": minor
---

`cssints/clay`: `backdrop({ blur })` is glass over our own content — a renderer effect beside the declaration, since Clay 1.0 has no such field: the literal carries it as a sibling `backdrop` key, `header()` prints nothing for it, and the desktop renderer draws everything before the element, blurs the element's box in its own buffer, then draws the element over the blurred pixels, so a translucent fill shows the page behind it and the element's own text and border stay crisp. It is the frame's content, not the window behind the window, and the element needs an `id`.
