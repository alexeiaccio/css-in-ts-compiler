---
# cssints-qyre
title: 'headless: popover.ts and the menu family on the Popover API'
status: todo
type: task
priority: normal
created_at: 2026-11-14T10:42:10Z
updated_at: 2026-11-14T10:42:10Z
parent: cssints-oeb0
---

## What
`popover.ts` implements light dismiss, Esc, the top layer and focus return by hand; the platform has all four. Move it
to `popover` + `showPopover()` and `commandfor`/`command` (Baseline newly 2025-12-12), keep the props. Then the menu
family (`menu.ts`, `filterable-menu.ts`, `command-palette.ts`) keeps only keys, typeahead and checkable items, with
anchor positioning for placement (C125 / F147 / S26).

## Todo
- [ ] Port `popover.ts` to the Popover API behind the same props; the browser tests are the oracle
- [ ] Menu family: popover replaces the overlay half; anchor positioning with `@oddbird/css-anchor-positioning` where
      the native feature is missing
- [ ] Delete what the platform owns from the spec/model (the overlay stack, not the selection/keyboard contract)
