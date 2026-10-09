---
# cssints-yb57
title: 'ramp(): OKLCH palette generation into tokens, contrast-driven'
status: in-progress
type: feature
priority: low
created_at: 2026-10-08T08:55:58Z
updated_at: 2026-10-09T07:37:24Z
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
- [x] decide: scope member returning themes vs a createTokens helper

  Decided: a plain build-time function returning DTCG data, like the sets of @cssints/tokens. A ramp is token data: createTokens
  already gives each step its @property rule, its type, the theme overrides and check.contrast, so a member would only wrap that.
  Data composes (any group name, several ramps in one call, light and dark ramps as a token set and its createGlobalTheme
  overrides) and needs no plugin machinery. A scope() member returns CSS values or themes at a site, not token sets, so it
  would buy nothing the data does not. `overrides(ramp)` turns a ramp into the `{ _1: hex }` object a theme takes.
- [x] ramp math on culori/texel
- [x] fixture through check.contrast
