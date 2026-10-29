---
"cssints": minor
---

Kernels: a scope may declare a custom property another scope owns (motion's `--motion-*` in reveal's kernel), so `motion()` and `reveal()` can sit in one app; two kernels of one scope still may not share one of its names, nor may two scopes share a name neither of them owns
