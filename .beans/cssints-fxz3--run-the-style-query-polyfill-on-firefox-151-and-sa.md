---
# cssints-fxz3
title: Run the style-query polyfill on Firefox < 151 and Safari < 18
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T14:01:06Z
parent: cssints-9js6
---

## Question

The runtime polyfill for `@container style()` matched exactly in Chrome 154, Firefox 155 and WebKit 26.6 (plugins.md §3.2), but never ran on a browser that actually lacks style queries on custom properties, the only place it is needed. Run docs/research/plugins-proto/test.mjs (and the frame fixture) on Firefox 128–150 and on a Safari/WebKit before 18 (older Playwright WebKit builds, a Firefox ESR from archive.mozilla.org, or BrowserStack if available). If a browser cannot be obtained, say which and why.

Answer: mismatches and timings per browser, and anything the runtime engine must change. Findings appended to plugins.md.

## Resolution

Ran the runtime polyfill (engine.js, unchanged) on browsers that really lack `@container style()` on custom properties: Firefox 128.0 and 150.0.2, and Playwright WebKit builds 17.4 (build 1944), 17.0 and 16.4. Details, timings and commands: plugins.md §3.6, plugins-proto/README.md "Old browsers", plugins-proto/results.txt.

- The feature is missing in all five (probe returns "", the style-query page computes 0px and transparent). Playwright WebKit 2003 (also labelled 17.4) already has it and was dropped.
- Equivalence against a same-engine reference (values the style-query page gave in Firefox 155 / WebKit 26.6): Firefox 128 and 150, WebKit 17.4: 0 mismatches in 1 392 values; the probe switched the runtime on. Against the Chrome 154 dump: 0 mismatches (colour tolerance 0.1).
- WebKit 17.0 and 16.4: 36 of 1 392 differ, one cause, in the browser and not the script: they do not clamp a registered oklch lightness above 1, so two colours further down a chain read 0.94/0.79 instead of 0.9/0.75 (arithmetic checked).
- The engine needs no change. `@property` (Firefox 128, Safari 16.4) is the floor, the engine uses no `CSS.registerProperty`, and `transitionrun` fired everywhere.
- Cost on a first pass is about 2 times that of the newer builds (Firefox 128: 190 ms for 5 461 elements against 90 ms; WebKit 16.4/17.0: about 510 ms against 283 ms).
- Bugs found were in the test scripts: the "no transition sentinel" control of controls.mjs had silently stopped disabling the listener (fixed); older Firefox applies Playwright's hover late and per page (test and controls now wait and read one page at a time).
- Not covered: real Safari releases (Playwright's WebKit is a trunk snapshot: its 16.4 build has relative colour, Safari has it from 18), Chrome below 111, anything below `@property` support.

## Summary of Changes

- plugins-proto/lib.mjs: `PW` env selects another playwright-core; test.mjs: `DUMP`/`REF`/`TOL`, per-page hover, colour normalisation; controls.mjs: fixed control, hover per page; results.txt and README extended.
- plugins.md: new §3.6, and §3.1, §3.2, §3.5, §8 and Reproduce updated.
