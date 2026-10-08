---
# cssints-yb1w
title: 'gradient(): eased gradient stops computed at build time'
status: in-progress
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:03:02Z
parent: cssints-dk1q
---

## What
Value member `gradient(kind, direction, from, to, { easing?, steps? })` that expands an easing curve into N colour stops (in oklab) and returns a `<image>` value.

## Sources
- https://github.com/larsenwork/postcss-easing-gradients
- https://github.com/argyleink/gradient-style (CSS4/5 gradient syntax, interpolation spaces)
- https://gradient.style/ (tab)

## Shape
- `{ args: [...], value }`; easing is a cubic-bezier or a named one from the easings tokens; stops sampled at build time via culori or texel/color (both starred: https://github.com/Evercoder/culori, https://github.com/texel-org/color).

## Todo
- [ ] stop sampling + oklab interpolation
- [ ] value member, Typed OM image result
- [ ] fixture
