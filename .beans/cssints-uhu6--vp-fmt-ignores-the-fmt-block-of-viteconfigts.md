---
# cssints-uhu6
title: vp fmt ignores the fmt block of vite.config.ts
status: completed
type: task
priority: low
tags:
    - wayfinder:task
created_at: 2026-09-30T08:50:32Z
updated_at: 2026-09-30T10:58:35Z
parent: cssints-vy0o
---

## Question

`vp fmt` formats with 2 spaces and about 100 columns, while the `fmt` block of the root `vite.config.ts` says tabs and 120 (cssints-gcho). Find why and make the config the source of truth. Prefer making the config match what runs today, so no mass reformat is needed; if tabs and 120 are wanted, reformat in a separate commit.

## Summary of Changes
Cause: vite-plus 1.0.0 does not read the `fmt` block of `vite.config.ts`. On a bare project `useTabs: true` there has no effect (in .ts and .mjs), while `.oxfmtrc.json` with the same key applies. The fmt block now states the oxfmt defaults that actually run (2 spaces, 100 columns, double quotes, semicolons, trailing commas, arrow parens), with a comment explaining why; `sortImports` was removed because it was never applied. No reformat. AGENTS.md formatting section rewritten to match.
