---
"@cssints/headless": patch
---

`createModifiers`' two props objects name their parts (`data-part="toolbar"` and `data-part="item"`), like every other primitive since 0.41.0 — the primitive landed after that pass and the source-shape guard in `test/parts.test.ts` caught it, which is what the guard is for.
