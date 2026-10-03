---
# cssints-l54z
title: 'Line clamp: -webkit-line-clamp and the lineClamp warning'
status: completed
type: task
priority: normal
created_at: 2026-10-02T16:04:44Z
updated_at: 2026-10-03T10:48:56Z
parent: cssints-co8y
---

## Question

Found in cssints-n3xy: there is no `-webkit-line-clamp` member (it is the only way to clamp lines in every engine today, with `display: -webkit-box` and `-webkit-box-orient: vertical`), and `lineClamp` warns for every browser in the default targets. Decide: add `-webkit-line-clamp` (and `-webkit-box-orient`) to the built-in WebKit list (cssints-6fay) or a `lineClamp` that LightningCSS prefixes; check what LightningCSS does with `line-clamp` for the targets. Then fix, with a fixture, and use it in sky's link card.

## Summary of Changes

LightningCSS (checked with no targets, chrome 154, safari 14, firefox 140 and the default browserslist) passes `line-clamp: 3` through unchanged: no `-webkit-` form, no `display: -webkit-box`, no `-webkit-box-orient`. BCD has `line-clamp` only with the `-webkit-` prefix (or behind a flag), and Chrome 154 rejects the standard form in CSS.supports, so `lineClamp` cannot be made to work by prefixing and keeps its (true) warning.

Fix: the built-in WebKit list. `-webkit-line-clamp` was already a member (`WebkitLineClamp`, from mdn-data). Added `-webkit-box-orient` (grammar from mdn-data's `box-orient` without the CSS-wide `inherit`, in extract.mjs next to LIVE_NONSTANDARD) and `-webkit-box` and `-webkit-inline-box` in `<display-legacy>` so `display("-webkit-box")` passes. None of the three warns (BCD files them under prefixed standard names). Members and mdn.ts regenerated; webref-rule still confirms the overrides and leaves webref-properties.json unchanged. Tests: css-grammar cases and support checks, fixtures line-clamp.ts and line-clamp-std.ts with greps in the cssints test script, API.md bullet and block. Sky's link card description uses a two line clamp instead of maxHeight; DevPosts has an externalLong sample, and test:posts checks in Chrome that it is two lines against three or four unclamped.
