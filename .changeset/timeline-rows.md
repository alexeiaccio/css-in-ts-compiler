---
"@cssints/headless": minor
---

`createTimeline` takes real span data: `createTimeline({ rows, axis, selected, onSelect })` lays a trace waterfall out over the rows' own extent (`extent`, `barProps` with `left`/`width` percentages and a `--depth` custom property, `labelProps`, `depthOf`, derived ruler `ticks`), with click, Enter and Space selection and a roving tab stop. The rows are `role="list"` / `role="listitem"` with `aria-level` and `aria-current` (no APG pattern exists for a waterfall), and a zero-length span keeps a 0.5% width floor so it stays visible. `createTimeline()` with no `rows` keeps the demo tree and its API.
