---
# cssints-h9qq
title: 'Beyond grammar: browser support and prose rules'
status: draft
type: feature
created_at: 2026-09-26T08:26:25Z
updated_at: 2026-09-26T08:26:25Z
parent: cssints-tmv8
---

What `diff.ts` shows that no grammar can express. Chrome 154 rejects values that are valid by the grammar.

Browser support (the grammar is correct, the engine lacks the feature):
- `fit-content(10px)` on width and height
- `align-items: anchor-center`
- `text-align: match-parent`
- `text-transform: full-width | full-size-kana`
- `white-space-collapse: preserve-spaces`
- `display: run-in`, `inline-list-item`

Prose rules (in the spec text, not in the grammar):
- `transition`: `none` as the property is allowed only when the list has one item
- `font-family`: generic keywords such as `system-ui` cannot start an unquoted family name

Options: warnings from `@mdn/browser-compat-data` against a browserslist target, and a handful of hand-written post-checks for the prose rules. This needs a decision on whether cssints should warn at all.
