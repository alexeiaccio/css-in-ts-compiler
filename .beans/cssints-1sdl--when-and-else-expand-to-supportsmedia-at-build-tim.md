---
# cssints-1sdl
title: '@when and @else: expand to @supports/@media at build time'
status: scrapped
type: task
priority: normal
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-10-17T10:24:17Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 6, class A (partly). css-conditional-5.

- [ ] check which combinations expand cleanly (@when supports(...) and media(...) with @else)
- [ ] decide the surface and whether it overlaps the existing css.supports()/css.media()

## Reasons for Scrapping

Checked on 2026-10-17. `@when` and `@else` parse to 0 rules in Chrome 155 and have no BCD key. Their content is covered: conditions nest (media, container, supports; up to four, docs/API.md line 220 and 763), so `@when media(...) and supports(...)` is two nested conditions, and `@else` is the negated query as a string (`css.supports("not (display: grid)")`; `@supports not (...)` parses in Chrome 155). A plugin would add a spelling, not a capability.
