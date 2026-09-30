---
# cssints-fxz3
title: Run the style-query polyfill on Firefox < 151 and Safari < 18
status: todo
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T11:57:41Z
parent: cssints-9js6
---

## Question

The runtime polyfill for `@container style()` matched exactly in Chrome 154, Firefox 155 and WebKit 26.6 (plugins.md §3.2), but never ran on a browser that actually lacks style queries on custom properties, the only place it is needed. Run docs/research/plugins-proto/test.mjs (and the frame fixture) on Firefox 128–150 and on a Safari/WebKit before 18 (older Playwright WebKit builds, a Firefox ESR from archive.mozilla.org, or BrowserStack if available). If a browser cannot be obtained, say which and why.

Answer: mismatches and timings per browser, and anything the runtime engine must change. Findings appended to plugins.md.
