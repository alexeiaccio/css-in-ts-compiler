---
# cssints-h6qk
title: Prefer webref property grammars where mdn-data is stale
status: todo
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-29T16:34:08Z
updated_at: 2026-09-30T08:13:21Z
parent: cssints-vy0o
---

## Question

After cssints-lmru, KNOWN holds 324 rows where mdn-data is stale or wider than the spec, and the reverse direction (Chrome accepts, twin rejects) is mostly stale mdn-data grammars (`image-orientation: none`, `tab-size: 3.5`). Should extract.mjs take the webref grammar of a property when it differs from mdn-data in a way Chrome confirms? Measure what changes in diff-support (KNOWN rows, reverse rows) and in the budget.
