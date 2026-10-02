---
# cssints-s12e
title: Leaf counts for the sheet from Chrome's expansion of each shorthand
status: completed
type: bug
priority: high
created_at: 2026-10-02T10:10:19Z
updated_at: 2026-10-02T11:50:52Z
parent: cssints-9js6
---

## Problem

The sheet sorts shorthand before longhand by leaf count taken from mdn-data `computed`, which is wrong for `all` (width 1, so it beats every shorthand), for `border-inline`/`border-block` (they list the physical shorthands, so a `-start` side looks bigger), and for `font-variant`/`font-variant-caps` and a few others (no leaves, so they tie and the class hash decides). 79 of 823 containment pairs are wrong and 454 depend on the hash (cssints-z03v). Build the counts from Chrome's own expansion in `bun run webref` (with `all` counting every longhand except `direction` and `unicode-bidi`), regenerate, and add the 12 failing cases from docs/research/sublayers-proto as a test. Also correct docs/API.md: 'a longhand wins whatever the order' holds for containment only.

## Summary of Changes

Done by the coordinator (subagents were down). `packages/css-grammar/scripts/longhands.mjs` (`bun run longhands`) asks Chrome for the longhands of every property (set it to `initial` on an element and read its style; `all` is every computed longhand but direction and unicode-bidi) and writes `src/longhands.ts` (95 shorthands, `all` 476), with mdn-data `computed` only for properties Chrome lacks. The sheet sorts by these counts (`packages/cssints/src/leaves.ts`), so `all`, the logical border sides and `font-variant` now come before their longhands. `test/cascade.mjs` checks the 10 cases from docs/research/sublayers.md in the sheet order (a negative control with the old mdn counts fails on the first); `test/sheet.mjs` expected `all` last, now first. Demo CSS byte-identical.
