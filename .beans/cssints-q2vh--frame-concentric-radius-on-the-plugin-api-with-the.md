---
# cssints-q2vh
title: 'frame(): concentric radius on the plugin API, with the parent-vars runtime'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-10-02T08:15:22Z
parent: cssints-9js6
blocked_by:
    - cssints-su6o
    - cssints-fxz3
---

## Question

`frame()` as the first context plugin: the kernel of surfaces-frames.md §2.1 in `_.k`, `radius/padding/border/margin` methods typed from tokens and spacing steps, build errors for frame() mixed with padding/margin/borderRadius/border* in one cn(), the shared parent-vars runtime (`cssints/parent-vars`, one MutationObserver) included only when a target lacks style queries, a three-deep `getComputedStyle` fixture in Chrome/Firefox/WebKit, and a use in apps/demo. Docs in API.md. Decide in the ticket what the research left open: whether to ship the 40-line registered kernel or the 24-line px/rem one.

From cssints-fxz3: the runtime must stay off below @property support (Firefox 128, Safari 16.4), so list `css.at-rules.property` in the kernel's `requires` and gate the runtime on it. Playwright WebKit builds are trunk snapshots; do a hand check in a real Safari 17 if one is available, otherwise say so.

## Todo

- [x] Decide the kernel: the registered 40-line one (`@property` is the runtime's floor anyway, exact `em`/`calc()`/tokens, +0.2 kB)
- [x] `cssints/frame`: package.json exports, tsdown entry, smoke test; `radius`, `padding`, `border`, `margin` typed from grammars, tokens and spacing steps; `Omit` chain
- [x] Conflicts with padding*/margin*/border-radius*/border (colours excepted) in one `cn()`; `requires` has `css.at-rules.property`; runtime with `parentVars`, fallback CSS
- [x] Stand-in frame replaced in the plug fixtures; fixture test with outputs and errors (test/frame.mjs); type tests; bench row (bench/frame.ts)
- [x] `getComputedStyle` test on a three-deep tree in Chrome, Firefox and WebKit: style-query kernel, probe, and runtime forced on in the built app (test/frame-browsers.mjs); Firefox 128 and WebKit 17.4 builds without style queries too
- [x] Use in apps/demo (a card with a concentric field), demo CSS otherwise unchanged
- [x] docs/API.md: frame section

## Summary of Changes

`cssints/frame` exports `frame()`, a context on the public `cssints/plugin` helpers: kernel `frame@1` (registered `@property` kernel, custom properties `--fr-*`, marker `_f`), methods `radius`, `padding` (spacing scale), `border`, `margin` (spacing scale, may be negative), a conflict with padding*/margin*/border-radius*/border* except colours, `requires` `css.at-rules.property` and `css.types.max`, and a runtime (`polyfills` style queries, `parentVars` with a sentinel, fallback CSS). Tests: test/frame.mjs (outputs, token, errors, conflicts, warning below @property), test/types/frame.ts, test/frame-browsers.mjs (`bun run test:browsers`), the smoke app, bench/frame.ts. The demo's Showcase has a card with a concentric field (24px and 7px in Chrome, Firefox and WebKit). Real Safari 17 was not available: WebKit builds stand in (Playwright 26.6 and the 17.4-labelled snapshot, a trunk build, not a Safari release). Wayfinder text is in the final answer of the agent.
