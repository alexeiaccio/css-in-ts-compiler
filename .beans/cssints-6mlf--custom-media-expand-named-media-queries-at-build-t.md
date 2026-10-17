---
# cssints-6mlf
title: '@custom-media: expand named media queries at build time'
status: scrapped
type: feature
priority: normal
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-10-17T10:24:17Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 2, class A. Firefox has it behind a flag, no other engine.

- [ ] syntax and where the name is declared (a plugin or a cssints option; css.media(...) with a name)
- [ ] expand the name in every @media at build time, in dev and build, with HMR of the declaring module
- [ ] errors: unknown name, cycle, a name used before it is declared
- [ ] tests, docs/API.md, changeset

## Reasons for Scrapping

Checked against the engine on 2026-10-17. cssints has no CSS authoring: every style is TypeScript, and `css.media({ sm: "(width >= 30rem)", lg: "(width >= 60rem)" })` (docs/API.md, line 121) already names a query once and reuses it in any module by import, checked against `<media-query-list>`. That is what `@custom-media` is for. Chrome 155 parses `@custom-media` to 0 rules (checked), Firefox has it behind a flag (BCD), so nothing would use an expanded name that JS does not already give.
