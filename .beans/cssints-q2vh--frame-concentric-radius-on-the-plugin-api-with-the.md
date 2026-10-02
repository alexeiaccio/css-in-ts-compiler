---
# cssints-q2vh
title: 'frame(): concentric radius on the plugin API, with the parent-vars runtime'
status: in-progress
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-10-02T07:52:36Z
parent: cssints-9js6
blocked_by:
    - cssints-su6o
    - cssints-fxz3
---

## Question

`frame()` as the first context plugin: the kernel of surfaces-frames.md §2.1 in `_.k`, `radius/padding/border/margin` methods typed from tokens and spacing steps, build errors for frame() mixed with padding/margin/borderRadius/border* in one cn(), the shared parent-vars runtime (`cssints/parent-vars`, one MutationObserver) included only when a target lacks style queries, a three-deep `getComputedStyle` fixture in Chrome/Firefox/WebKit, and a use in apps/demo. Docs in API.md. Decide in the ticket what the research left open: whether to ship the 40-line registered kernel or the 24-line px/rem one.

From cssints-fxz3: the runtime must stay off below @property support (Firefox 128, Safari 16.4), so list `css.at-rules.property` in the kernel's `requires` and gate the runtime on it. Playwright WebKit builds are trunk snapshots; do a hand check in a real Safari 17 if one is available, otherwise say so.
