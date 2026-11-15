---
"@cssints/reveal": minor
---

`pointer()` in `@cssints/reveal`: the element's own `scale`, scrubbed by the pointer's position across (or down) it —
`axis("x" | "y")`. No engine ships `pointer-timeline` (a draft with no BCD key), so the runtime is the feature and it is
delivered to every target; it measures the layout box, so the scrub survives its own shrink.
