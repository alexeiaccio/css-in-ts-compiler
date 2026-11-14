---
"@cssints/reveal": minor
"@cssints/headless": minor
---

`progress()` in `@cssints/reveal`: a bar whose fill is the scroll's position — the element's own `scale`, scrubbed by
`animation-timeline: scroll()` over `animation-range`, with `.axis("x" | "y")`, `.timeline(...)` and `.range(...)`. No
CSS fallback for a scrub, so a browser without scroll-driven animations draws no bar.

`createScrollProgress` in `@cssints/headless`: the container's scroll as 0..1 with `progressbar` props (`aria-valuenow`),
one passive `scroll` listener and one `ResizeObserver`; 1 when there is nothing to scroll. It is the JS half of
`progress()` — one element takes both, since a running animation beats an inline style.
