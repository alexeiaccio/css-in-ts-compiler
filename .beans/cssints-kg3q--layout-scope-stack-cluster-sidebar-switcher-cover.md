---
# cssints-kg3q
title: 'layout scope: stack(), cluster(), sidebar(), switcher(), cover(), autoGrid()'
status: in-progress
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:03:02Z
parent: cssints-dk1q
---

## What
Every-Layout style primitives as chain members with one kernel each, custom properties for gap/min/threshold.

## Sources
- https://smolcss.dev/ (smol grid, stack, sidebar, cluster)
- https://github.com/christiankaindl/LYTS
- https://github.com/kettanaito/atomic-layout
- https://github.com/basarat/gls
- https://evanminto.com/blog/intrinsically-responsive-css-grid-minmax-min/ (`minmax(min(100%, N), 1fr)`)
- https://gomakethings.com/automatically-wrapping-css-grid/
- https://ishadeed.com/article/smart-layouts-talk-css-day/
- https://www.joshwcomeau.com/css/container-queries-unleashed/

## Shape
- scope `layout`; each member a chain: `stack().gap(2)`, `cluster().gap(2).justify("between")`, `sidebar().side("left").width("20rem").content("50%")`, `switcher().threshold("30rem").gap(2)`, `cover().minHeight("100vh")`, `autoGrid().min("16rem").gap(2)`.
- `spacing: true` on gap methods. Kernels written as styles so conflicts derive (display, gap, grid-template-*).
- Check what `flex()`/`grid()` already chain so the kernels do not duplicate engine contexts.

## Todo
- [ ] kernels for the six primitives
- [ ] chain members + conflicts
- [ ] fixtures, type test
- [ ] demo usage in apps/demo
