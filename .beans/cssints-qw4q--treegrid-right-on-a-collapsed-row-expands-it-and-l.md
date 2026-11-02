---
# cssints-qw4q
title: 'treegrid: Right on a collapsed row expands it and lands in the first cell'
status: todo
type: bug
priority: normal
created_at: 2026-11-02T11:36:35Z
updated_at: 2026-11-02T11:36:35Z
---

APG treegrid: "Right Arrow: If the row is collapsed, expands the row. If the row is expanded, moves focus to the first cell." The primitive does both in one press.

`packages/headless/src/treegrid.ts` `right()` (lines 344-353): the first `if` toggles the expansion; the second `if` then re-reads `canExpand` on the now-expanded row, sees false and calls `setKind("cell")`. So an expanded row takes the cell path as intended, but a row that was collapsed on arrival expands *and* enters its first cell.

Why nothing catches it: every one of the 86 ported treegrid scenarios is skipped — their dynamic `tree` configs are outside the bridge — and the differential walk starts from the same constructor state, so the press is never compared. `apps/ui/src/registry/treegrid/treegrid.browser.test.tsx` asserts that Right expands, not where the focus lands.

Fix shape: after `toggleExpansion` return (or compute `canExpand` once before the toggle), and add a case to the kit/headless test for the collapsed → expanded focus. Found while documenting the primitive for `docs/API.md` (2026-11-02); the section states the current behaviour, so update it with the fix.
