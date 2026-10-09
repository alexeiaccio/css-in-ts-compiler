---
# cssints-yb57
title: 'ramp(): OKLCH palette generation into tokens, contrast-driven'
status: completed
type: feature
priority: low
created_at: 2026-10-08T08:55:58Z
updated_at: 2026-10-09T07:39:08Z
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

## Engine gaps

None found: a ramp call inside createTokens evaluates in the Module Runner, its `#${string}` values type-check cheaply, and
check.contrast reads two createGlobalTheme calls under one condition together.

## Summary of Changes

- packages/ramp (@cssints/ramp): `ramp(base, { mode: "lightness", steps, lightness? })` and
  `ramp(base, { mode: "contrast", ratios, background })` return a DTCG colour group (steps "1".."N", hex in sRGB,
  typed `#${string}`, step keys typed from `steps` / the ratios tuple); `overrides(ramp)` gives the `{ _1: hex }`
  object of createGlobalTheme; `luminance` and `ratio` are check.contrast's maths (culori wcagLuminance, clipped to sRGB).
- Chroma relative to the sRGB gamut at each lightness (nutelch), so steps follow the cusp and stay in gamut. The contrast
  mode bisects lightness on the output hex and keeps only passing colours: each step is at or above its ratio, under
  ratio * 1.02 in the tests.
- Tests: ramp maths (monotone lightness, hue, neutral greys, determinism, errors, contrast targets on 8 bases x 4
  backgrounds), a fixture through the engine (check.contrast passes at 1.2/1.5/3/4.5/7 in light and dark; min 4.6 on step 4
  fails in both), a type test.
- Deferred: a P3 variant (check.contrast clips to sRGB; color() walks the grammar in the types); APCA targets; the
  docs/API.md "Plugin packages" row (not edited here).
