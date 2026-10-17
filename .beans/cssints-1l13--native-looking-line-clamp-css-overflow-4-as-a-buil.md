---
# cssints-1l13
title: Native-looking line-clamp (css-overflow-4) as a build-time -webkit-box clamp
status: scrapped
type: feature
priority: normal
created_at: 2026-10-17T10:21:19Z
updated_at: 2026-10-17T10:21:46Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 1, class A. BCD: prefix in every engine, so the standard property ships nowhere, but the -webkit-box form works in all four today.

- [ ] decide the shape: a plugin member `lineClamp(3)` or support for the standard `line-clamp` declaration lowered by the engine (like the lowered fallbacks in lowered.ts)
- [ ] emit `display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:N; overflow:hidden` and the standard property beside it
- [ ] check the existing support warning path: line-clamp is flagged as prefix-only in BCD
- [ ] tests (output, no clash with a user's display), README or docs/API.md, changeset

## Reasons for Scrapping

Already done in cssints-l54z (2026-10-08): `display("-webkit-box")`, `WebkitBoxOrient("vertical")`, `WebkitLineClamp(N)` and `overflow("hidden")` are members, none warns, and docs/API.md shows the clamp (csssky's link card uses it). The standard `lineClamp(N)` is a member too and warns honestly: no engine ships it unprefixed and LightningCSS does not prefix it. The research agent (cssints-sh52) only checked the @cssints/* packages for overlap, not the engine, and ranked it first by mistake. Left over, only if wanted: a one-line sugar `clamp(n)` for the four declarations; not worth a bean now.
