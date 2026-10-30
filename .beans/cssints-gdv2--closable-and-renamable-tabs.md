---
# cssints-gdv2
title: Closable and renamable tabs
status: completed
type: feature
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T18:12:57Z
parent: cssints-65eb
---

docs playground needs add, close and rename on tabs; createTabs has only selection.

- [x] close button per tab (not in the tab order of the tablist; Delete key when the tab is focused)
- [x] rename: an input inside the tab, Enter commits, Escape reverts
- [x] adding a tab focuses the new one (the host appends, then focusTab + begin; documented)
- [x] keep the plain tabs primitive unchanged (an extension, not a flag soup)

## Summary of Changes

`createTabs` grew an extension (plain behaviour and tests untouched): `closable`, `renamable`, `label(index)`, and the requests `onClose(index)` / `onRename(index, label)`, plus `closeProps`, `renameProps`, `editing()` and `focusAfterClose(index)`. The primitive owns no list: the host removes or renames. Close buttons are `tabindex=-1` and Delete closes the focused tab; focus goes to the tab that slid into the closed one's place, or the previous one when the last closed, and the last remaining tab is refused. Rename is an inline input: Enter commits, Escape reverts, blur commits, empty cancels, and the arrows stay with the input. `items` / `label` are read lazily so a shrinking host list keeps the bounds in step. `test/tabs-close.browser.test.tsx` (10 tests) is the oracle; `packages/headless/README.md`, `docs/API.md`, `docs/wayfinder.md` and `.changeset/tabs-close.md` document it. Add-a-tab stays the host's: append, then `focusTab(index)` and `begin(index)`.
