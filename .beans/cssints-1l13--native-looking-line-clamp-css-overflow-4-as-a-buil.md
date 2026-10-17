---
# cssints-1l13
title: Native-looking line-clamp (css-overflow-4) as a build-time -webkit-box clamp
status: todo
type: feature
created_at: 2026-10-17T10:21:19Z
updated_at: 2026-10-17T10:21:19Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 1, class A. BCD: prefix in every engine, so the standard property ships nowhere, but the -webkit-box form works in all four today.

- [ ] decide the shape: a plugin member `lineClamp(3)` or support for the standard `line-clamp` declaration lowered by the engine (like the lowered fallbacks in lowered.ts)
- [ ] emit `display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:N; overflow:hidden` and the standard property beside it
- [ ] check the existing support warning path: line-clamp is flagged as prefix-only in BCD
- [ ] tests (output, no clash with a user's display), README or docs/API.md, changeset
