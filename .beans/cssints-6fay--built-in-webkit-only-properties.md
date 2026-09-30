---
# cssints-6fay
title: Built-in WebKit-only properties
status: todo
type: task
tags:
    - wayfinder:task
created_at: 2026-09-30T08:13:20Z
updated_at: 2026-09-30T08:13:20Z
parent: cssints-vy0o
---

## Question

Decided in the plugin scope (cssints-rq2r): the ~5 live WebKit-only properties are a built-in list in 0.1, not a plugin. LightningCSS passes them through untouched.

- [ ] extract.mjs takes `-webkit-tap-highlight-color`, `-webkit-touch-callout`, `-webkit-box-reflect`, `-webkit-user-modify`, `-webkit-overflow-scrolling` from mdn-data verbatim, as an explicit list next to the standard selection (confirm each is still live in a current browser per BCD; drop any that is not)
- [ ] Members generated (`WebkitTapHighlightColor`, ...), checked by both twins; support warnings from BCD work for them (they warn for Firefox targets)
- [ ] cases.ts rows; diff.ts over them
