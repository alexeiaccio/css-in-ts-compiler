---
# cssints-lo9x
title: 'One runtime package: cx, _cv, cn and @cssints/variants'
status: completed
type: task
priority: normal
tags:
    - wayfinder:grilling
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T14:25:47Z
parent: cssints-vy0o
---

## Question

There are two runtimes: `packages/cssints/src/runtime.mjs` (`cx`, `_cv`) and `packages/variants` (`cx`, `cn`, `_cv`, `_scv`, types, a tsc build). API.md imports `cx` from `"css-variants"`.

- Which package ships to the browser, and under which name?
- Is `cn` compile-time only (merged by the plugin into one string) while `cx` is runtime?
- Does `_scv` (slot variants) stay, and does `cv` accept `css.*` values as well as CSS strings?

## Resolution
Written up in `docs/API.md`, section "Runtime".
- `cssints` is the only runtime package (`cx`, `_cv`, imported without the attribute). `@cssints/variants` is deleted.
- `cx` accepts strings, falsy values and nested arrays, but not clsx objects.
- `cn` is build-time only.
- `cv` takes `css.*` values; the CSS-string form is removed.
- `_scv` slot variants are fog.
