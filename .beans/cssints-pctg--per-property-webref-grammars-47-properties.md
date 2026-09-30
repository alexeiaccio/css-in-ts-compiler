---
# cssints-pctg
title: Per-property webref grammars (47 properties)
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T09:01:24Z
updated_at: 2026-09-30T10:36:37Z
parent: cssints-vy0o
blocked_by:
    - cssints-xrzv
---

## Question

Implement cssints-h6qk's recommendation (docs/research/webref-grammars.md). Blocked by cssints-xrzv, which also edits the twin and css.ts.

- [ ] A committed list (for example packages/css-grammar/scripts/webref-properties.json) read by extract.mjs; the 47 properties that pass the rule, re-measured (45 with the CSS-wide exemption)
- [x] A dev script, backed by Chrome, that applies the rule and rewrites the list (scripts/webref-rule.mjs, `bun run webref`); documented for Chrome, webref and mdn-data bumps
- [x] Remove the KNOWN entries the switch makes obsolete: removed tab-size, transform-origin, position-try and position-try-fallbacks, column-rule-style, column-rule-width, column-rule, zoom, outline-color, outline, image-orientation (10 entries; KNOWN rows of twin-accepts-Chrome-rejects 588 -> 477). Hand overrides in extract.mjs (PROP), each confirmed by Chrome and re-checked by the rule script: image-orientation, column-rule-width, zoom, outline-color, and column-rule (added: its KNOWN entry was still 4 rows, the shorthand is a list of whole rules)
- [ ] diff and diff-support numbers before and after; budgets
