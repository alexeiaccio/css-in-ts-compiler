---
"cssints": minor
---

A declaration can be a list: `append(prop, value)` in `cssints/plugin` joins two declarations of one property in one `cn()` instead of the later replacing the earlier, and a list beside a plain value is a build error.
