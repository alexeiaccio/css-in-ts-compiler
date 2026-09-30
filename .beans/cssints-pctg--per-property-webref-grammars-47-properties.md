---
# cssints-pctg
title: Per-property webref grammars (47 properties)
status: in-progress
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T09:01:24Z
updated_at: 2026-09-30T10:32:20Z
parent: cssints-vy0o
blocked_by:
    - cssints-xrzv
---

## Question

Implement cssints-h6qk's recommendation (docs/research/webref-grammars.md). Blocked by cssints-xrzv, which also edits the twin and css.ts.

- [ ] A committed list (for example packages/css-grammar/scripts/webref-properties.json) read by extract.mjs; the 47 properties that pass the rule, re-measured (45 with the CSS-wide exemption)
- [x] A dev script, backed by Chrome, that applies the rule and rewrites the list (scripts/webref-rule.mjs, `bun run webref`); documented for Chrome, webref and mdn-data bumps
- [ ] Remove the KNOWN entries the switch makes obsolete (tab-size, transform-origin, position-area, column-rule-style and so on); small hand overrides for the mixed properties where Chrome confirms (image-orientation none, column-rule-width lists, zoom, outline-color), documented in extract.mjs like the others
- [ ] diff and diff-support numbers before and after; budgets
