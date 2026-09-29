---
# cssints-unkt
title: 'Grammar coverage: all mdn properties through extract, twin and types'
status: todo
type: task
tags:
    - wayfinder:research
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:28:04Z
parent: cssints-vy0o
---

## Question

Today `mdn.ts` holds the 57 properties the runner uses. What happens with every non-obsolete mdn property (~600)?

- `scripts/extract.mjs` for all properties: how many grammars and syntaxes, and the file size.
- Twin `parse`: which grammars fail, and why.
- `test/diff.ts` and `test/diff-support.ts` over all properties: agreement with Chrome, and a list of new unexplained rows grouped by cause.
- Type level: the `bench/empty.ts` baseline and per-call cost when `Props` has ~600 entries. Does a big `properties` object cost anything when unused? Measure tsc and tsgo.

Answer with numbers and a recommendation: all properties at once, or a curated set with an opt-in for the rest.
