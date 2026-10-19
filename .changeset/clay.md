---
"cssints": minor
---

New subpath `cssints/clay`: styles for a [Clay](https://github.com/nicbarker/clay) layout, compiled to object literals shaped as `Clay_ElementDeclaration` and `Clay_TextElementConfig`, and `header()` to print a module of them as C initializers for a firmware that runs no JS. Pixels for lengths, `stretch` for Clay's GROW, colours by the web's `color` grammar; a property Clay cannot draw is no member. States (`hover`, `focus`, `active`) print as declarations of their own, colour tokens and named themes as a declaration per theme, and `fonts()` sets `fontId` from the app's font list.
