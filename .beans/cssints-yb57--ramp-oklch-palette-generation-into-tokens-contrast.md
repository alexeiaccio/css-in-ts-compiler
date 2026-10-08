---
# cssints-yb57
title: 'ramp(): OKLCH palette generation into tokens, contrast-driven'
status: todo
type: feature
priority: low
created_at: 2026-10-08T08:55:58Z
updated_at: 2026-10-08T08:55:58Z
parent: cssints-dk1q
---

## What
A build-time helper `ramp(base, { steps, mode })` that generates an OKLCH ramp as a token group; a leonardo-style mode picks steps by target contrast ratio so the pairs pass check.contrast by construction.

## Sources
- https://github.com/meodai/cusphanger
- https://github.com/meodai/poline
- https://github.com/adobe/leonardo
- https://github.com/ardov/huetone
- https://github.com/tenphi/okhst (stable perceptual lightness)
- https://github.com/meodai/nutelch (chroma relative to the gamut cusp)

## Todo
- [ ] decide: scope member returning themes vs a createTokens helper
- [ ] ramp math on culori/texel
- [ ] fixture through check.contrast
