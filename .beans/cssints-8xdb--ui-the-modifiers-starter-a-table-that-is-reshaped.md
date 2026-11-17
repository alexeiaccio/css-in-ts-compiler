---
# cssints-8xdb
title: 'ui: the modifiers starter — a table that is reshaped in place'
status: completed
type: feature
priority: normal
tags:
    - ui
    - a11y
created_at: 2026-11-17T14:10:52Z
updated_at: 2026-11-17T14:10:56Z
---

## Why

The mechanic landed headless (`cssints-d53p`); a starter is where a reader can see it and where the kit's charts bar applies.

## What

`apps/ui/src/registry/modifiers/` — a table under a rail of transformations: `Color` (a tint at the bars' 22 % strength), `Size` (a bar under the number), `Sort` (the row order). Each unit opens an inline panel: the span as checkboxes, the input column as radios, and join/split/move/remove. The table reads `createModifiers`' `encoded()`/`steps()`; values never leave the cells.

Seven browser checks (DOM, computed paint, keyboard). `node scripts/registry-json.ts` regenerated `public/r/modifiers.json`, `public/r/registry.json` and `public/llms.txt`.

The primitive lost `aria-haspopup="menu"` from `itemProps`: what activation opens is the host's — a menu says `aria-haspopup`, a disclosure says `aria-expanded` + `aria-controls`.

Skipped: aggregation/binning (the paper's computation half), pointer drag (the panel's Move up/down and `Alt`+arrow cover it).


## Summary of Changes

- `apps/ui/src/registry/modifiers/modifiers.tsx`: the starter — a table under a rail of `Color`/`Size`/`Sort` units, the unit's panel (span checkboxes, input radios, join/split/move/remove), the announcement line; the values stay cells of text.
- `modifiers.stories.tsx` (nine films, a one-column story), `modifiers.browser.test.tsx` (7).
- `scripts/registry-json.ts` + regenerated `public/r/modifiers.json`, `public/r/registry.json`, `public/llms.txt`.
- `packages/headless`: `itemProps` no longer claims `aria-haspopup="menu"` (the host says what activation opens), README and changeset follow.
