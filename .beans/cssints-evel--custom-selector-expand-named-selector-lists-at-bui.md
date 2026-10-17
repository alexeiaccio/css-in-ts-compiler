---
# cssints-evel
title: '@custom-selector: expand named selector lists at build time'
status: scrapped
type: task
priority: normal
created_at: 2026-10-17T10:21:20Z
updated_at: 2026-10-17T10:24:17Z
---

Research: docs/research/unshipped-specs.md (2026-10-17, cssints-sh52). Ranked 8, class A. No BCD key.

- [ ] check overlap with the :is()/:where() and nest() members; decide the surface or close as not needed

## Reasons for Scrapping

Checked on 2026-10-17. `@custom-selector` parses to 0 rules in Chrome 155 and has no BCD key. A selector in cssints is a string checked at build time against `<complex-selector-list>` (docs/API.md line 221), so a named list is a TypeScript constant, imported where it is needed: `const headings = "h1, h2, h3"`. An expansion step would replace a `const`.
