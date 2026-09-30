---
# cssints-pctg
title: Per-property webref grammars (47 properties)
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T09:01:24Z
updated_at: 2026-09-30T10:42:24Z
parent: cssints-vy0o
blocked_by:
    - cssints-xrzv
---

## Question

Implement cssints-h6qk's recommendation (docs/research/webref-grammars.md). Blocked by cssints-xrzv, which also edits the twin and css.ts.

- [ ] A committed list (for example packages/css-grammar/scripts/webref-properties.json) read by extract.mjs; the 47 properties that pass the rule, re-measured (45 with the CSS-wide exemption)
- [x] A dev script, backed by Chrome, that applies the rule and rewrites the list (scripts/webref-rule.mjs, `bun run webref`); documented for Chrome, webref and mdn-data bumps
- [x] Remove the KNOWN entries the switch makes obsolete: removed tab-size, transform-origin, position-try and position-try-fallbacks, column-rule-style, column-rule-width, column-rule, zoom, outline-color, outline, image-orientation (10 entries; KNOWN rows of twin-accepts-Chrome-rejects 588 -> 477). Hand overrides in extract.mjs (PROP), each confirmed by Chrome and re-checked by the rule script: image-orientation, column-rule-width, zoom, outline-color, and column-rule (added: its KNOWN entry was still 4 rows, the shorthand is a list of whole rules)
- [x] diff and diff-support numbers before and after; budgets

## Summary of Changes

- `packages/css-grammar/scripts/webref-properties.json`: 45 properties, read by `extract.mjs` by default (`WEBREF=none` = old mdn.ts byte for byte, `all`, `@file` kept). Against the research's 47: out `all`, `z-index` (CSS-wide exemption), `flex` (no value differs any more); in `pointer-events`.
- `scripts/webref-rule.mjs` (`bun run webref`): the rule with Chrome, closure judged per property, var()/env()/if()/paint()/CSS-wide values left out of D, fixed point, then checks the hand overrides. ~1 minute.
- `extract.mjs` `PROP`: hand overrides image-orientation, column-rule-width, column-rule, zoom, outline-color (Chrome-confirmed on every run).
- diff-support: 10 obsolete KNOWN entries removed. twin-core exports `isNative`; members.ts regenerated (hovers strip `~w`); budgets wide.ts and users.ts updated (+0.42%, +0.01%).
- diff.ts 16857/18441 -> 17026/18460 agree (91.4% -> 92.2%); diff-support rows 1317 -> 1155, unexplained 39 -> 33, KNOWN rows 588 -> 477. Demo build byte-identical.
