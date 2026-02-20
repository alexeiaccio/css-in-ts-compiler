---
# css-in-ts-compiler-wg7z
title: Add multi-param signature support
status: completed
type: task
priority: normal
created_at: 2026-02-18T10:17:53Z
updated_at: 2026-02-18T10:33:12Z
parent: css-in-ts-compiler-jphr
---

- [x] Support padding(a, b, c, d) with auto-join
- [x] Support margin(a, b, c, d) with auto-join
- [x] Support borderRadius(a, b, c, d) with auto-join
- [x] Handle 1-4 param variations
- [x] Type: (v1, v2?, v3?, v4?) => string



## Summary

Implemented in lib/scale.ts via scaleShorthand() and in composables.ts via m() and p() utilities.
