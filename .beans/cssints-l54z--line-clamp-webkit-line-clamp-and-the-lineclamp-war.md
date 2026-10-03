---
# cssints-l54z
title: 'Line clamp: -webkit-line-clamp and the lineClamp warning'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T16:04:44Z
updated_at: 2026-10-03T10:27:03Z
parent: cssints-co8y
---

## Question

Found in cssints-n3xy: there is no `-webkit-line-clamp` member (it is the only way to clamp lines in every engine today, with `display: -webkit-box` and `-webkit-box-orient: vertical`), and `lineClamp` warns for every browser in the default targets. Decide: add `-webkit-line-clamp` (and `-webkit-box-orient`) to the built-in WebKit list (cssints-6fay) or a `lineClamp` that LightningCSS prefixes; check what LightningCSS does with `line-clamp` for the targets. Then fix, with a fixture, and use it in sky's link card.
