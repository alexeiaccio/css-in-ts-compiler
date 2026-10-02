---
# cssints-lirm
title: 'keyframes() and positionTry(): local at-rules on the kernel seam'
status: in-progress
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-01T07:23:13Z
updated_at: 2026-10-02T07:52:36Z
parent: cssints-9js6
blocked_by:
    - cssints-su6o
---

## Question

`css.keyframes({ from: {...}, to: {...} })` and `css.positionTry({...})` in a build-time or client module return a typed name (a Token-like value usable in `animation`/`animationName` and `positionTryFallbacks`), and emit the at-rule as a kernel by key (hash of the content) into `_.k` of the modules that use it, so it is tree-shaken by construction. Steps inside keyframes are checked by the same grammar as members; a bad step is a build error at the call site. Decide the name (hash) and the dedupe of identical blocks. Fixture, type tests, bench, API.md, a use in the demo.
