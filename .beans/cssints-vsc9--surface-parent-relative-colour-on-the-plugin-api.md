---
# cssints-vsc9
title: 'surface(): parent-relative colour on the plugin API'
status: in-progress
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-10-02T08:24:23Z
parent: cssints-9js6
blocked_by:
    - cssints-q2vh
---

## Question

`surface()` as the second context plugin, on the runtime `frame()` ships: the kernel of surfaces-frames.md §2.2, `color/lighten/darken/contrast/ink` with the `Omit` chain, a build error for surface() mixed with bg/backgroundColor in one cn(), docs saying "tonal steps, not contrast". Check first that the `<color>` grammar takes the relative colour the kernel emits (it is opaque after `from` since cssints-gcuz). Floor: Chrome 122, Firefox 128 with the runtime, Safari 18. A use in apps/demo.
