---
# cssints-xifk
title: 'MCP: browser inspector'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-09T08:45:25Z
updated_at: 2026-10-09T12:00:54Z
parent: cssints-0phg
---

For an agent, what the devtools overlay shows a human: by selector on an open page, an element's cssints classes, the winner per property and its source. Reuse the overlay's Effect core (cssints-cncb) through Playwright.

## Todo
- [ ] open/attach a page (playwright-core), run the core's cascade on an element
- [ ] tools: inspect element, why does property X have value Y
- [ ] tests in Chrome on apps/demo
