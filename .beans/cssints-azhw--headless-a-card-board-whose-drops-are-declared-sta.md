---
# cssints-azhw
title: 'headless: a card board whose drops are declared states'
status: completed
type: task
priority: normal
tags:
    - layout
    - drag
created_at: 2026-11-28T17:05:30Z
updated_at: 2026-11-28T17:30:23Z
---

The case the Dragology note (`cssints-2cxd`) said a predicate is not enough for: a card dragged between columns. Instead of "is this pair allowed", the primitive declares the reachable **model states** — every (column, index) a card can land at, with the whole column model after the move — and derives the landing, the preview and the keyboard walk from that list.

- [x] `createCardBoard`: `statesOf(card)` returns the declared states; `landing()` is the state the pointer and the measured geometry pick; `commit()` calls the host's `onMove` with that state
- [x] the pointer path measured once per gesture (like `reorder`'s FLIP), so the host owns the look and the primitive owns the prediction
- [x] the keyboard path walks the same declared list (columns left/right, index up/down, Enter commits, Escape cancels) and the live region names the target
- [x] a registry starter in `apps/ui` (three columns, cards from the kit) with its own Chrome test and catalog entry
- [x] measured: the declared states versus a hit-test-per-card baseline, and the drag's cost over a board of 40 cards

## Summary of Changes

`packages/headless/src/cardboard.ts` adds `createCardBoard`, exported from `src/index.ts`: `statesOf(card)` declares every
reachable state (each column `canDrop` allows, every insertion index, the whole columns array after the move, and the card's
own slot as the no-move state), `landing()` picks one from the frame, column and card boxes measured once per gesture, and
`commit()` hands it to `onMove`. The pointer path is the 4 px threshold, the capture in a `try`, the swallowed click after a
drag, and cancellation on `pointercancel`, a lost capture, a blocked column or a release outside the frame. The keyboard
walks the same list (Space lifts, left/right the neighbouring column at the same index clamped, up/down an index in the
column, Enter drops, Escape cancels), a polite live region names the target, and `data-drop-column`, `data-drop-target` and
`data-drop-index` carry the held state so a skin draws it without a second rule.

`packages/headless/test/cardboard.browser.test.tsx` has the twelve tests (declaration and `canDrop`, the landing from real
rects, the commit, the pointer rules, the keyboard, the attributes) and the benchmark: six cards in three columns declare 8
states a card and 48 in all; forty declare 42 a card and 1 680 in all; `statesOf` over all forty costs 593 µs, a landing 4.6
µs, a per-card distance hit test over the same forty 22.2 µs, and one gesture's measurement 65 µs over 44 rects.

`apps/ui/src/registry/kanban/` is the starter: Todo / Doing / Done with six kit cards, the primitive owning the model, a
Reset button and two stories, with five Chromium tests (three columns and six cards, a drag across columns at the measured
index, a reorder inside a column, the keyboard walk and the announcement, Escape and Reset), its registry item, the
regenerated `r/` index and `catalog.json`, and the README's Card board section and the wayfinder entry. Changeset:
`@cssints/headless` minor. Verified: `packages/headless` 1 525 tests (12 new), `apps/ui` 1 053 passed / 717 skipped, the site
test green with 121 untracked reads at its 121 budget, `skin:check` and `theme:check` green.
