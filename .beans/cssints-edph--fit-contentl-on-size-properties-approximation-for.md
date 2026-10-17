---
# cssints-edph
title: 'fit-content(L) on size properties: approximation for browsers without it'
status: scrapped
type: task
priority: normal
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-10-17T10:24:17Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 5, class A (approximation). Firefox flag since 91, rest false. The fallback is not exact.

- [ ] decide whether an approximation is honest enough to ship (min(max-content, max(min-content, L)) in a width context)
- [ ] if yes: a lowering with a support warning; if no: record the decision here and close

## Reasons for Scrapping

Checked on 2026-10-17. The function is already in the grammar of width, height, min-*, max-* and flex-basis, and its support warning exists (BCD key css.properties.width.fit-content_function: Chrome false, Safari false, Firefox flag since 91; packages/css-grammar/test/check-support.ts). The approximation is not possible: in Chrome 155 `width: min(max-content, 200px)` and `min(max-content, max(min-content, 200px))` are rejected by CSS.supports (math functions take no intrinsic keywords). `calc-size(fit-content, min(size, 200px))` is accepted, but only Chromium and Safari have calc-size, so it is no fallback for the engines that lack fit-content(). The honest answer stays the warning. The keyword `fit-content` is supported everywhere.
